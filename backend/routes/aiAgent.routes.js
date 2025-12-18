const express = require('express');
const router = express.Router();
const aiAgent = require('../utils/aiAgent');
const db = require('../database/dbConnect');

/**
 * POST /ai/process-message
 * Process user message and return intent, routing, and form data
 */
router.post('/process-message', async (req, res) => {
    try {
        const { message, userId, conversationHistory = [], language = 'hi', previousFields = {} } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log('📨 AI Agent received message:', message);
        console.log('🌐 Language:', language);
        console.log('📜 Conversation history length:', conversationHistory.length);
        console.log('📝 Previous fields:', previousFields);

        // Process the message
        const result = await aiAgent.processQuery(
            message,
            userId,
            conversationHistory,
            language,
            previousFields
        );

        console.log('✅ AI Agent result:', JSON.stringify(result, null, 2));

        if (!result) {
            console.log('⚠️ AI Agent returned null result');
            return res.status(400).json({
                error: 'Unable to process message',
                message: language === 'hi'
                    ? 'कृपया फिर से कोशिश करें।'
                    : 'Please try again.'
            });
        }

        return res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('❌ AI Agent error:', error);
        return res.status(500).json({
            error: error.message || 'AI Agent error',
            message: req.body.language === 'hi'
                ? 'कुछ गलत हुआ। कृपया फिर से कोशिश करें।'
                : 'Something went wrong. Please try again.'
        });
    }
});

/**
 * POST /ai/extract-fields
 * Extract form fields from natural language
 */
router.post('/extract-fields', async (req, res) => {
    try {
        const { message, conversationHistory = [], language = 'hi' } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get form metadata
        const formMetadata = await aiAgent.getComplaintFormMetadata();

        // Extract fields
        const extraction = await aiAgent.extractFormFields(
            message,
            formMetadata,
            conversationHistory,
            language
        );

        return res.json({
            success: true,
            ...extraction
        });
    } catch (error) {
        console.error('❌ Field extraction error:', error);
        return res.status(500).json({ error: error.message });
    }
});

/**
 * POST /ai/classify-intent
 * Classify user intent
 */
router.post('/classify-intent', async (req, res) => {
    try {
        const { message, language = 'hi' } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const intent = await aiAgent.classifyIntent(message, language);

        return res.json({
            success: true,
            ...intent
        });
    } catch (error) {
        console.error('❌ Intent classification error:', error);
        return res.status(500).json({ error: error.message });
    }
});

/**
 * POST /ai/follow-up-question
 * Generate follow-up question for missing fields
 */
router.post('/follow-up-question', async (req, res) => {
    try {
        const { missingFields, language = 'hi' } = req.body;

        if (!missingFields || missingFields.length === 0) {
            return res.status(400).json({ error: 'Missing fields are required' });
        }

        // Get form metadata
        const formMetadata = await aiAgent.getComplaintFormMetadata();

        const question = await aiAgent.generateFollowUpQuestion(
            missingFields,
            formMetadata,
            language
        );

        return res.json({
            success: true,
            question
        });
    } catch (error) {
        console.error('❌ Follow-up question error:', error);
        return res.status(500).json({ error: error.message });
    }
});

/**
 * POST /ai/submit-complaint
 * Use AI-extracted fields to auto-submit a complaint when possible.
 */
router.post('/submit-complaint', async (req, res) => {
    try {
        const { message, userId, conversationHistory = [], language = 'hi', previousFields = {} } = req.body;

        if (!message) return res.status(400).json({ error: 'Message is required' });

        // Ask AI to process the query and extract fields
        const aiResult = await aiAgent.processQuery(message, userId, conversationHistory, language, previousFields);
        if (!aiResult) return res.status(500).json({ error: 'AI processing failed' });

        // Only handle report intents here
        if (aiResult.intent !== 'REPORT_COMPLAINT') {
            return res.status(400).json({ error: 'Intent is not REPORT_COMPLAINT', intent: aiResult.intent });
        }

        const fields = aiResult.fields || {};

        // If not ready to auto-submit, return missing fields and follow-up question
        if (!aiResult.autoSubmit) {
            return res.json({ success: true, autoSubmit: false, missingFields: aiResult.missingFields || [], followUpQuestion: aiResult.followUpQuestion || null, fields });
        }

        // Validate required fields presence
        const required = ['category','department','description','Pincode','State','City'];
        for (const r of required) {
            if (!fields[r] || fields[r].toString().trim() === '') {
                return res.status(400).json({ error: 'Missing required field', field: r });
            }
        }

        // Lookup department_id
        const [deptRows] = await db.promise().query('SELECT department_id FROM Department WHERE Name = ?', [fields.department]);
        if (!Array.isArray(deptRows) || deptRows.length === 0) return res.status(400).json({ error: 'Invalid department name' });
        const departmentId = deptRows[0].department_id;

        // Lookup category_id
        const [catRows] = await db.promise().query('SELECT category_id FROM category WHERE Name = ? AND department_id = ?', [fields.category, departmentId]);
        if (!Array.isArray(catRows) || catRows.length === 0) return res.status(400).json({ error: 'Invalid category for department' });
        const categoryId = catRows[0].category_id;

        // Reverse geocode if lat/lng provided
        let detectedCity = null, detectedState = null, detectedAddress = null;
        const latitude = fields.latitude || fields.lat || null;
        const longitude = fields.longitude || fields.lng || null;
        if (latitude && longitude) {
            try {
                const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
                const geoRes = await fetch(url, { headers: { 'User-Agent': 'MinorProjectApps/1.0' } });
                if (geoRes.ok) {
                    const geoData = await geoRes.json();
                    detectedAddress = geoData.display_name;
                    if (geoData.address) {
                        detectedCity = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.hamlet;
                        detectedState = geoData.address.state;
                    }
                }
            } catch (e) {
                console.warn('Reverse geocode failed', e.message || e);
            }
        }

        // Prepare insert
        const insertCols = ['user_id','category_id','department_id','description','status','imageUrl','Pincode','State','City','Address_Line','latitude','longitude','detected_city','detected_state','detected_address'];
        const insertPlaceholders = insertCols.map(() => '?');
        const insertValues = [userId || null, categoryId, departmentId, fields.description, 'reported', null, fields.Pincode, fields.State, fields.City, fields.Address_Line || null, latitude || null, longitude || null, detectedCity, detectedState, detectedAddress];

        // Check hasFace column
        let includeHasFace = false;
        try {
            const [colRows] = await db.promise().query(
                "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Complaint' AND COLUMN_NAME = 'hasFace'"
            );
            includeHasFace = Array.isArray(colRows) && colRows.length > 0;
        } catch (colErr) {
            includeHasFace = false;
        }
        if (includeHasFace) {
            insertCols.push('hasFace');
            insertPlaceholders.push('?');
            const hasFaceFlag = (fields.hasFace === true || fields.hasFace === 'true' || fields.hasFace === '1' || fields.hasFace === 1) ? 1 : 0;
            insertValues.push(hasFaceFlag);
        }

        const insertQuery = `INSERT INTO Complaint (${insertCols.join(',')}) VALUES (${insertPlaceholders.join(',')})`;
        const [result] = await db.promise().query(insertQuery, insertValues);

        return res.status(201).json({ success: true, message: 'Complaint auto-registered', complaintId: result.insertId, autoSubmitted: true });

    } catch (error) {
        console.error('❌ /ai/submit-complaint error:', error);
        return res.status(500).json({ error: error.message || 'Submission failed' });
    }
});

module.exports = router;

