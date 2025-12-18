const express = require('express');
const router = express.Router();
const geminiService = require('../utils/geminiServiceWrapper');
const aiAgent = require('../utils/aiAgent');
const conversationManager = require('../utils/conversationManager');
const { isAuthenticated } = require('../middlewares/user.auth');
const db = require('../database/dbConnect');
const { generateReport } = require('../controllers/chat.controllers/chat.generateReport.controller');

// AI Agent endpoint - processes queries and returns structured form data
router.post('/agent', isAuthenticated, async (req, res) => {
    try {
        console.log(' AI Agent query received:', req.body);
        const { message, language = 'hi' } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({
                error: 'Message is required',
                errorHi: 'संदेश आवश्यक है'
            });
        }

        const userId = req.user.user_id;

        // Get or create conversation session (optional)
        let session = null;
        let conversationHistory = [];

        try {
            session = await conversationManager.getOrCreateSession(userId);
            conversationHistory = session.history.map(h => ({
                user: h.user,
                assistant: h.assistant
            }));
        } catch (sessionError) {
            // If session table doesn't exist, continue without session
            if (sessionError.code === 'ER_NO_SUCH_TABLE') {
                console.log('⚠️ Conversation_Sessions table does not exist. Using frontend context.');
            } else {
                console.log('⚠️ Failed to get session, continuing without session:', sessionError.message);
            }

            // FALLBACK: Parse context from request body if DB session is missing
            if (req.body.context && typeof req.body.context === 'string') {
                try {
                    // Context format from frontend: "User: msg\nAssistant: msg\n\nUser: msg..."
                    const exchanges = req.body.context.split('\n\n');
                    conversationHistory = exchanges.map(ex => {
                        const lines = ex.split('\n');
                        const userLine = lines.find(l => l.startsWith('User: '));
                        const assistantLine = lines.find(l => l.startsWith('Assistant: '));
                        if (userLine && assistantLine) {
                            return {
                                user: userLine.replace('User: ', ''),
                                assistant: assistantLine.replace('Assistant: ', '')
                            };
                        }
                        return null;
                    }).filter(h => h !== null);
                    console.log('📥 Restored history from frontend context:', conversationHistory.length, 'messages');
                } catch (parseErr) {
                    console.error('Failed to parse frontend context:', parseErr);
                }
            }
        }

        // Process query with AI agent
        const agentResponse = await aiAgent.processQuery(
            message,
            userId,
            conversationHistory,
            language
        );

        if (agentResponse) {
            // Save to conversation history (optional)
            const assistantMessage = agentResponse.followUpQuestion
                || agentResponse.message
                || (language === 'hi' ? 'मैं आपकी मदद कर रहा हूँ...' : 'I am helping you...');

            if (session) {
                try {
                    await conversationManager.addMessage(
                        session.sessionId,
                        message,
                        assistantMessage,
                        agentResponse.fields || null
                    );
                } catch (saveError) {
                    console.log('⚠️ Failed to save to session:', saveError.message);
                }
            }

            console.log('✅ AI Agent response:', agentResponse);

            res.json({
                success: true,
                agentResponse: agentResponse,
                timestamp: new Date().toISOString()
            });
        } else {
            // Fallback to regular chat
            const response = await geminiService.getContextualResponse(
                message,
                'citizen',
                language,
                conversationHistory.map(h => `User: ${h.user}\nAssistant: ${h.assistant}`).join('\n\n')
            );

            if (session) {
                try {
                    await conversationManager.addMessage(
                        session.sessionId,
                        message,
                        response
                    );
                } catch (saveError) {
                    console.log('⚠️ Failed to save to session:', saveError.message);
                }
            }

            res.json({
                success: true,
                response: response,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('❌ AI Agent Error:', error);
        res.status(500).json({
            error: 'Failed to process query',
            errorHi: 'क्वेरी प्रोसेस करने में विफल',
            details: error.message
        });
    }
});

const fs = require('fs'); // Add at top usually, but ok here for debug

// ... inside the route ...
// Chat endpoint for voice assistant (enhanced with agent support)
router.post('/message', isAuthenticated, async (req, res) => {
    try {
        console.log('📨 Chat message received:', req.body);



        console.log('🔧 Server version: Updated with gemini-2.5-flash support');

        // 1. Data Validation Check - Validate req.body exists
        if (!req.body || typeof req.body !== 'object') {
            console.error('❌ Invalid request body');
            return res.status(400).json({
                error: 'Invalid request body',
                errorHi: 'अमान्य अनुरोध',
                success: false
            });
        }

        // 2. Extract and validate message
        const { message, language = 'hi', context = '', useAgent = true } = req.body;

        // Validate message exists and is a string
        if (!message) {
            console.log('⚠️ Message is missing');
            return res.status(400).json({
                error: 'Message is required',
                errorHi: 'संदेश आवश्यक है',
                success: false
            });
        }

        if (typeof message !== 'string') {
            console.log('⚠️ Message is not a string:', typeof message);
            return res.status(400).json({
                error: 'Message must be a string',
                errorHi: 'संदेश एक स्ट्रिंग होना चाहिए',
                success: false
            });
        }

        if (!message.trim()) {
            console.log('⚠️ Empty message received');
            return res.status(400).json({
                error: 'Message cannot be empty',
                errorHi: 'संदेश खाली नहीं हो सकता',
                success: false
            });
        }

        // 3. Validate user is authenticated (should be handled by middleware, but double-check)
        if (!req.user) {
            console.error('❌ User not authenticated - middleware should have caught this');
            return res.status(401).json({
                error: 'User not authenticated',
                errorHi: 'उपयोगकर्ता प्रमाणित नहीं है',
                success: false
            });
        }

        if (!req.user.user_id) {
            console.error('❌ User ID missing from req.user');
            return res.status(401).json({
                error: 'User ID not found',
                errorHi: 'उपयोगकर्ता ID नहीं मिला',
                success: false
            });
        }

        const userId = req.user.user_id;

        // Try AI agent first if enabled (but make it optional)
        if (useAgent) {
            try {
                let session = null;
                let conversationHistory = [];

                try {
                    session = await conversationManager.getOrCreateSession(userId);
                    conversationHistory = session.history.map(h => ({
                        user: h.user,
                        assistant: h.assistant
                    }));
                } catch (sessionError) {
                    // If session table doesn't exist, continue without session
                    if (sessionError.code === 'ER_NO_SUCH_TABLE') {
                        console.log('⚠️ Conversation_Sessions table does not exist. Using frontend context.');
                    } else {
                        console.log('⚠️ Failed to get session, continuing without session:', sessionError.message);
                    }

                    // FALLBACK: Parse context from request body if DB session is missing
                    if (req.body.context && typeof req.body.context === 'string') {
                        try {
                            const exchanges = req.body.context.split('\n\n');
                            conversationHistory = exchanges.map(ex => {
                                const lines = ex.split('\n');
                                const userLine = lines.find(l => l.startsWith('User: '));
                                const assistantLine = lines.find(l => l.startsWith('Assistant: '));
                                if (userLine && assistantLine) {
                                    return {
                                        user: userLine.replace('User: ', ''),
                                        assistant: assistantLine.replace('Assistant: ', '')
                                    };
                                }
                                return null;
                            }).filter(h => h !== null);
                            console.log('📥 Restored history from frontend context:', conversationHistory.length, 'messages');
                        } catch (parseErr) {
                            console.error('Failed to parse frontend context:', parseErr);
                        }
                    }
                }

                // Check if API key exists before trying agent
                if (!process.env.GOOGLE_API_KEY) {
                    console.log('⚠️ GOOGLE_API_KEY not configured, skipping agent');
                    throw new Error('API key not configured');
                }

                const agentResponse = await aiAgent.processQuery(
                    message,
                    userId,
                    conversationHistory,
                    language
                );

                if (agentResponse && agentResponse.intent !== 'GENERAL_QUERY') {
                    // Log the full response to file for debugging
                    const fs = require('fs');
                    fs.appendFileSync('debug_chat.log', `\n--- [${new Date().toISOString()}] ---\n`);
                    fs.appendFileSync('debug_chat.log', JSON.stringify(agentResponse, null, 2));

                    let assistantMessage = agentResponse.followUpQuestion
                        || agentResponse.message
                        || (language === 'hi' ? 'मैं आपकी मदद कर रहा हूँ...' : 'I am helping you...');

                    // AUTO-SAVE LOGIC FOR COMPLAINTS
                    if (agentResponse.intent === 'REPORT_COMPLAINT' &&
                        agentResponse.missingFields &&
                        agentResponse.missingFields.length === 0) {

                        try {
                            const fields = agentResponse.fields;
                            fs.appendFileSync('debug_chat.log', '\n[Auto-Save] Attempting to save...');
                            console.log('📝 Auto-saving complaint:', fields);

                            // 1. Get Department ID (Use LIKE for better matching)
                            const [deptRows] = await db.promise().query(
                                'SELECT department_id FROM Department WHERE Name LIKE ?',
                                [`%${fields.department}%`]
                            );

                            // 2. Get Category ID (Use LIKE for better matching)
                            const [catRows] = await db.promise().query(
                                'SELECT category_id FROM Category WHERE Name LIKE ?',
                                [`%${fields.category}%`]
                            );

                            if (deptRows.length > 0 && catRows.length > 0) {
                                const deptId = deptRows[0].department_id;
                                const catId = catRows[0].category_id;

                                // 3. Insert Complaint
                                const insertQuery = `
                                    INSERT INTO Complaint (
                                        user_id, department_id, category_id, description, 
                                        Pincode, State, City, Address_Line, status, created_at
                                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'reported', NOW())
                                `;

                                const [result] = await db.promise().query(insertQuery, [
                                    userId,
                                    deptId,
                                    catId,
                                    fields.description,
                                    fields.Pincode,
                                    fields.State,
                                    fields.City,
                                    fields.Address_Line || ''
                                ]);

                                fs.appendFileSync('debug_chat.log', `\n[Auto-Save] SUCCESS ID: ${result.insertId}`);
                                console.log('✅ Complaint auto-saved with ID:', result.insertId);
                                const successMsg = language === 'hi'
                                    ? `\n\n✅ शिकायत सफलतापूर्वक दर्ज की गई! (ID: ${result.insertId})`
                                    : `\n\n✅ Complaint submitted successfully! (ID: ${result.insertId})`;

                                assistantMessage += successMsg;
                                agentResponse.message = assistantMessage; // Update response for frontend
                            } else {
                                const errMsg = `\n[Auto-Save] FAIL Dept/Cat not found. Dept: ${fields.department} -> ${deptRows.length}, Cat: ${fields.category} -> ${catRows.length}`;
                                fs.appendFileSync('debug_chat.log', errMsg);
                                console.error('❌ Could not resolve Department/Category IDs for auto-save');
                                console.error(`   Input Dept: "${fields.department}", Found: ${deptRows.length}`);
                                console.error(`   Input Cat: "${fields.category}", Found: ${catRows.length}`);
                            }
                        } catch (dbError) {
                            fs.appendFileSync('debug_chat.log', `\n[Auto-Save] ERROR: ${dbError.message}`);
                            console.error('❌ Failed to auto-save complaint:', dbError);
                        }
                    } else {
                        fs.appendFileSync('debug_chat.log', `\n[Auto-Save] Skipped. Intent: ${agentResponse.intent}, Missing: ${agentResponse.missingFields?.length}`);
                    }

                    // Try to save to session, but don't fail if it doesn't work
                    if (session) {
                        try {
                            await conversationManager.addMessage(
                                session.sessionId,
                                message,
                                assistantMessage,
                                agentResponse.fields || null
                            );
                        } catch (saveError) {
                            console.log('⚠️ Failed to save to session:', saveError.message);
                        }
                    }

                    return res.json({
                        success: true,
                        agentResponse: agentResponse,
                        response: assistantMessage,
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (agentError) {
                console.error('⚠️ AI Agent failed, falling back to regular chat:', agentError.message);
                console.error('Agent error details:', agentError.stack);
                // Fall through to regular chat - don't fail the request
            }
        }

        // Get user type from authenticated user
        const userType = req.user?.role || 'citizen';

        // Validate language and context are strings
        const validLanguage = (typeof language === 'string' && language.trim()) ? language.trim() : 'hi';
        const validContext = (typeof context === 'string') ? context : '';

        console.log('👤 User type:', userType, 'Language:', validLanguage);

        // Check if API key exists
        if (!process.env.GOOGLE_API_KEY) {
            console.error('❌ GOOGLE_API_KEY not configured');
            return res.status(500).json({
                error: 'AI service not configured. Please contact administrator.',
                errorHi: 'AI सेवा कॉन्फ़िगर नहीं है। कृपया व्यवस्थापक से संपर्क करें।',
                success: false
            });
        }

        // Generate response using Gemini
        console.log('🤖 Generating AI response...');
        let response;
        try {
            response = await geminiService.getContextualResponse(
                message,
                userType,
                validLanguage,
                validContext
            );
            console.log('✅ AI response generated successfully');
        } catch (geminiError) {
            // -------------------------------------------------------------
            // 🛑 GEMINI API ERROR - Log full details
            // -------------------------------------------------------------
            console.error('\n--- 🛑 GEMINI API ERROR IN /api/chat/message 🛑 ---');
            console.error('--- 🛑 GEMINI API ERROR IN /api/chat/message 🛑 ---');
            console.error('--- 🛑 GEMINI API ERROR IN /api/chat/message 🛑 ---\n');

            // Log the full stack trace - THIS IS THE INFORMATION YOU NEED
            console.error('❌ ========== GEMINI API ERROR DETAILS ==========');
            console.error('❌ Error Type:', geminiError.constructor.name);
            console.error('❌ Error Name:', geminiError.name);
            console.error('❌ Error Message:', geminiError.message);
            console.error('\n❌ FULL STACK TRACE:');
            console.error(geminiError.stack || geminiError.toString());
            console.error('\n❌ Request Context:');
            console.error('   - Message:', message);
            console.error('   - Language:', validLanguage);
            console.error('   - User Type:', userType);
            console.error('   - Context:', validContext);
            console.error('❌ ================================================\n');

            console.error('---------------------------------------------------------');
            console.error('--- END OF GEMINI ERROR LOG ---');
            console.error('---------------------------------------------------------\n');

            // Return user-friendly error
            let errorMessage = 'Failed to generate response';
            let errorMessageHi = 'प्रतिक्रिया उत्पन्न करने में विफल';

            if (geminiError.message.includes('API key') || geminiError.message.includes('API_KEY_INVALID') || geminiError.message.includes('not valid') || geminiError.message.includes('401') || geminiError.message.includes('Unauthorized')) {
                errorMessage = 'Invalid API key. Please get a new key from https://aistudio.google.com/app/apikey';
                errorMessageHi = 'अमान्य API key। कृपया https://aistudio.google.com/app/apikey से नया key प्राप्त करें।';
            } else if (geminiError.message.includes('quota') || geminiError.message.includes('429')) {
                errorMessage = 'API quota exceeded. Please try again later.';
                errorMessageHi = 'API कोटा समाप्त हो गया। कृपया बाद में पुनः प्रयास करें।';
            } else if (geminiError.message.includes('404') || geminiError.message.includes('not found') || geminiError.message.includes('not supported')) {
                errorMessage = 'AI model not available. Please contact administrator.';
                errorMessageHi = 'AI मॉडल उपलब्ध नहीं है। कृपया व्यवस्थापक से संपर्क करें।';
            } else if (geminiError.message.includes('403') || geminiError.message.includes('Forbidden')) {
                errorMessage = 'API access denied. Please check API restrictions in Google Cloud Console.';
                errorMessageHi = 'API एक्सेस अस्वीकृत। कृपया Google Cloud Console में API प्रतिबंध जांचें।';
            } else if (geminiError.message.includes('400')) {
                errorMessage = 'Invalid request. Please check API key and configuration.';
                errorMessageHi = 'अमान्य अनुरोध। कृपया API key और कॉन्फ़िगरेशन जांचें।';
            }

            return res.status(500).json({
                error: errorMessage,
                errorHi: errorMessageHi,
                success: false,
                details: geminiError.message
            });
        }

        // Save chat history to database (if table exists)
        const saveQuery = `
            INSERT INTO Chat_History (user_id, user_message, ai_response, language, created_at)
            VALUES (?, ?, ?, ?, NOW())
        `;

        db.query(saveQuery, [userId, message, response, language], (err, result) => {
            if (err) {
                // Check if error is because table doesn't exist
                if (err.code === 'ER_NO_SUCH_TABLE') {
                    console.log('⚠️ Chat_History table does not exist. Run: node create_chat_table.js');
                } else {
                    console.error('⚠️ Failed to save chat history:', err);
                }
                // Don't fail the request, just log the error
            } else {
                console.log('💾 Chat history saved with ID:', result.insertId);
            }
        });

        // Also save to conversation session (optional, don't fail if it doesn't work)
        try {
            const session = await conversationManager.getOrCreateSession(userId);
            await conversationManager.addMessage(
                session.sessionId,
                message,
                response
            );
        } catch (sessionError) {
            // Don't fail the request if session saving fails
            if (sessionError.code === 'ER_NO_SUCH_TABLE') {
                console.log('⚠️ Conversation_Sessions table does not exist. Run: node create_conversation_sessions_table.js');
            } else {
                console.log('⚠️ Failed to save to conversation session:', sessionError.message);
            }
        }

        res.json({
            success: true,
            response: response,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        // -------------------------------------------------------------
        // 🛑 CRITICAL ERROR HANDLING - Prevents server crash
        // -------------------------------------------------------------
        console.error('\n--- 🛑 SERVER CRASH DETECTED IN /api/chat/message 🛑 ---');
        console.error('--- 🛑 SERVER CRASH DETECTED IN /api/chat/message 🛑 ---');
        console.error('--- 🛑 SERVER CRASH DETECTED IN /api/chat/message 🛑 ---\n');

        // Log the full stack trace - THIS IS THE INFORMATION YOU NEED
        console.error('❌ ========== FULL ERROR DETAILS ==========');
        console.error('❌ Error Type:', error.constructor.name);
        console.error('❌ Error Name:', error.name);
        console.error('❌ Error Message:', error.message);
        console.error('\n❌ FULL STACK TRACE:');
        console.error(error.stack || error.toString());
        console.error('\n❌ Request Details:');
        console.error('   - URL:', req.url);
        console.error('   - Method:', req.method);
        console.error('   - Body:', JSON.stringify(req.body, null, 2));
        console.error('   - User ID:', req.user?.user_id);
        console.error('   - User:', req.user ? 'Authenticated' : 'Not authenticated');
        console.error('❌ =========================================\n');

        console.error('---------------------------------------------------------');
        console.error('--- END OF ERROR LOG ---');
        console.error('---------------------------------------------------------\n');

        // Check if it's an API key issue
        let errorMessage = 'Failed to generate response';
        let errorMessageHi = 'प्रतिक्रिया उत्पन्न करने में विफल';

        if (error.message.includes('API key') || error.message.includes('not configured') || error.message.includes('not initialized')) {
            errorMessage = 'AI service not configured. Please contact administrator.';
            errorMessageHi = 'AI सेवा कॉन्फ़िगर नहीं है। कृपया व्यवस्थापक से संपर्क करें।';
        } else if (error.message.includes('leaked') || error.message.includes('403')) {
            errorMessage = 'AI service temporarily unavailable. Please contact administrator.';
            errorMessageHi = 'AI सेवा अस्थायी रूप से अनुपलब्ध है। कृपया व्यवस्थापक से संपर्क करें।';
        } else if (error.message.includes('quota')) {
            errorMessage = 'AI service quota exceeded. Please try again later.';
            errorMessageHi = 'AI सेवा कोटा समाप्त हो गया। कृपया बाद में पुनः प्रयास करें।';
        } else if (error.message.includes('Cannot read') || error.message.includes('undefined') || error.message.includes('null')) {
            errorMessage = 'Internal server error. Please check server logs.';
            errorMessageHi = 'आंतरिक सर्वर त्रुटि। कृपया सर्वर लॉग जांचें।';
        }

        res.status(500).json({
            error: errorMessage,
            errorHi: errorMessageHi,
            success: false,
            details: error.message,
            errorType: error.constructor.name
        });
    }
});

// Report generation endpoint
router.get('/report', isAuthenticated, generateReport);

// DEBUG ENDPOINT - REMOVE LATER
router.get('/test-insert', async (req, res) => {
    try {
        console.log('🧪 Test Insert Triggered');
        const [deptRows] = await db.promise().query('SELECT department_id FROM Department WHERE Name LIKE ?', ['%Water%']);
        const [catRows] = await db.promise().query('SELECT category_id FROM Category WHERE Name LIKE ?', ['%Water%']);

        if (deptRows.length > 0 && catRows.length > 0) {
            const insertQuery = `
                INSERT INTO Complaint (
                    user_id, department_id, category_id, description, 
                    Pincode, State, City, Address_Line, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'reported', NOW())
            `;
            // Using user_id 8 hardcoded for testing
            const [result] = await db.promise().query(insertQuery, [8, deptRows[0].department_id, catRows[0].category_id, 'Test Complaint Direct', '123456', 'TestState', 'TestCity', 'TestAddr']);
            res.json({ success: true, id: result.insertId });
        } else {
            res.status(400).json({ error: 'Dep/Cat not found' });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// Submit complaint from AI chatbot
router.post('/submit-complaint', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { department, category, description, Pincode, State, City, Address_Line } = req.body;

        console.log('📝 Submitting complaint from AI chatbot:', req.body);

        // Get Department ID
        const [deptRows] = await db.promise().query(
            'SELECT department_id FROM Department WHERE Name LIKE ?',
            [`%${department}%`]
        );

        // Get Category ID
        const [catRows] = await db.promise().query(
            'SELECT category_id FROM category WHERE Name LIKE ?',
            [`%${category}%`]
        );

        if (deptRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Department not found',
                messageHi: 'विभाग नहीं मिला'
            });
        }

        if (catRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Category not found',
                messageHi: 'श्रेणी नहीं मिली'
            });
        }

        const deptId = deptRows[0].department_id;
        const catId = catRows[0].category_id;

        // Insert Complaint
        const insertQuery = `
            INSERT INTO Complaint (
                user_id, department_id, category_id, description,
                Pincode, State, City, Address_Line, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'reported', NOW())
        `;

        const [result] = await db.promise().query(insertQuery, [
            userId,
            deptId,
            catId,
            description,
            Pincode,
            State,
            City,
            Address_Line || ''
        ]);

        console.log('✅ Complaint submitted successfully! ID:', result.insertId);

        res.json({
            success: true,
            complaintId: result.insertId,
            message: 'Complaint submitted successfully',
            messageHi: 'शिकायत सफलतापूर्वक दर्ज की गई'
        });

    } catch (error) {
        console.error('❌ Error submitting complaint:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit complaint',
            messageHi: 'शिकायत दर्ज करने में विफल',
            error: error.message
        });
    }
});

module.exports = router;

