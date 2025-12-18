require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('../database/dbConnect');

// Initialize AI Client
const ai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

class AIAgent {
  constructor() {
    // Updated model list - try these in order (prioritizing better free tier quotas)
    this.modelNames = [
      "gemini-2.0-flash",           // 1500 requests/day - BEST for free tier
      "gemini-2.0-flash-lite",      // Even lighter, more quota
      "gemini-2.5-flash-lite",      // Backup option
      "gemini-2.5-flash",           // 250 requests/day
      "gemini-2.5-pro",             // Premium model
      "gemini-pro",                 // Older model
      "gemini-1.5-pro",             // Legacy
      "gemini-1.5-flash"            // Legacy
    ];
    this.cachedModel = null;
    this.cachedModelName = null;
  }

  async getModel() {
    // Return cached model if available
    if (this.cachedModel) {
      return this.cachedModel;
    }

    // Check if API key exists
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY not configured");
    }

    // Try to get a working model
    for (const modelName of this.modelNames) {
      try {
        console.log(`🔄 Trying model: ${modelName}`);
        const model = ai.getGenerativeModel({ model: modelName });
        // Cache the model (don't test it, just cache it)
        this.cachedModel = model;
        this.cachedModelName = modelName;
        console.log(`✅ Cached model: ${modelName}`);
        return model;
      } catch (error) {
        console.log(`❌ Model ${modelName} failed: ${error.message}`);
        continue;
      }
    }
    throw new Error("All AI models failed");
  }

  /**
   * Classify user intent from natural language query
   */
  async classifyIntent(message, language = 'hi') {
    const model = await this.getModel();

    const prompt = language === 'hi'
      ? `आप एक AI assistant हैं जो user queries को समझकर उन्हें सही page/action पर route करते हैं।

User query: "${message}"

निम्नलिखित intents में से एक चुनें:

- REPORT_COMPLAINT: अगर user नई complaint/शिकायत report करना चाहता है
  उदाहरण: "पानी नहीं आ रहा है", "सड़क टूटी है", "गड्ढा है", "कचरा पड़ा है", "बिजली नहीं है"

- TRACK_COMPLAINT: अगर user अपनी पुरानी complaint की status देखना चाहता है
  उदाहरण: "मेरी शिकायत का status क्या है", "complaint ID 123 का update", "track my complaint"

- VIEW_DASHBOARD: अगर user dashboard या analytics देखना चाहता है
- ASSIGN_ISSUE: अगर user (official) issue assign करना चाहता है
- HISTORY_REPORT: अगर user history, report, export चाहता है
- GENERAL_QUERY: अगर कोई general question है

महत्वपूर्ण: अगर user किसी problem/issue के बारे में बता रहा है (जैसे पानी, सड़क, बिजली, कचरा), तो हमेशा REPORT_COMPLAINT चुनें।

केवल JSON format में जवाब दें:
{
  "intent": "REPORT_COMPLAINT",
  "confidence": 0.95
}`

      : `You are an AI Agent assistant inside a Civic Issue Reporting Web Application.
User query: "${message}"

YOUR ROLE:
You help citizens file complaints, guide authorities, auto-fill forms, route pages, and generate summaries.

INTENT ROUTING RULES:

- REPORT_COMPLAINT: User wants to REPORT A NEW complaint/issue
  Examples: "pothole on main street", "no water supply", "garbage not collected", "street light broken", "पानी नहीं आ रहा"
  Keywords: pothole, garbage, water, electricity, road, broken, not working, problem, issue, leak, damage

- TRACK_COMPLAINT: User wants to CHECK STATUS of an EXISTING complaint
  Examples: "track my complaint", "status of complaint ID 123", "where is my complaint"
  Keywords: track, status, update, check, complaint ID, my complaint

- ASSIGN_ISSUE: User (official) wants to assign an issue
- VIEW_DASHBOARD: User wants to see analytics/dashboard
- HISTORY_REPORT: User wants to export history or generate report
- GENERAL_QUERY: General questions or greetings

IMPORTANT: If user is describing a problem (water, road, electricity, garbage, etc.), ALWAYS return REPORT_COMPLAINT.

Respond ONLY in JSON format:
{
  "intent": "REPORT_COMPLAINT",
  "confidence": 0.95
}`;

    try {
      const result = await model.generateContent(prompt);
      const text = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text
        || result?.candidates?.[0]?.content?.parts?.[0]?.text
        || "";

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback
      return { intent: "GENERAL_QUERY", confidence: 0.5 };
    } catch (error) {
      console.error("Intent classification error:", error);
      return { intent: "GENERAL_QUERY", confidence: 0.5 };
    }
  }

  /**
   * Get form metadata for complaint form (existing)
   */
  async getComplaintFormMetadata() {
    return new Promise((resolve, reject) => {
      // Fetch departments and categories from database
      db.query('SELECT department_id, Name FROM Department', (err, departments) => {
        if (err) {
          console.error('Error fetching departments:', err);
          return reject(err);
        }

        db.query('SELECT category_id, Name, department_id FROM category', (err, categories) => {
          if (err) {
            console.error('Error fetching categories:', err);
            return reject(err);
          }

          resolve({
            fields: {
              department: {
                label: "Department",
                type: "select",
                required: true,
                options: departments.map(d => d.Name)
              },
              category: {
                label: "Category",
                type: "select",
                required: true,
                options: categories.map(c => ({ name: c.Name, department_id: c.department_id }))
              },
              description: {
                label: "Description",
                type: "textarea",
                required: true
              },
              Pincode: {
                label: "Pincode",
                type: "text",
                required: true
              },
              State: {
                label: "State",
                type: "text",
                required: true
              },
              City: {
                label: "City",
                type: "text",
                required: true
              },
              Address_Line: {
                label: "Address",
                type: "text",
                required: false
              }
            },
            departments: departments,
            categories: categories
          });
        });
      });
    });
  }

  /**
   * Extract form field values from natural language
   */
  async extractFormFields(message, formMetadata, conversationHistory = [], language = 'hi', previousFields = {}) {
    const model = await this.getModel();

    // Construct available options strings for prompt
    const availableDepartments = (formMetadata.departments || []).map(d => d.Name);
    const availableCategories = (formMetadata.categories || []).map(c => c.Name);

    // Log previous fields for debugging
    console.log('📦 Previous fields received:', previousFields);

    const fieldsInfo = Object.entries(formMetadata.fields || {})
      .map(([key, val], index) => {
        return `${index + 1}. ${key} (${val.required ? 'required' : 'optional'}) - ${val.label || ''}`;
      }).join('\n');

    const prompt = language === 'hi'
      ? `आप एक AUTONOMOUS AI AGENT हैं जो शिकायतें स्वचालित रूप से दर्ज कर सकते हैं।

Available Departments: ${availableDepartments.join(', ')}
Available Categories: ${availableCategories.join(', ')}

पहले से इकट्ठा की गई जानकारी (ALREADY COLLECTED):
${JSON.stringify(previousFields, null, 2)}

Previous conversation:
${conversationHistory.map(h => `User: ${h.user}\nAssistant: ${h.assistant}`).join('\n')}

Latest User message: "${message}"

IMPORTANT: पहले से इकट्ठा की गई जानकारी (previousFields) को MERGE करें नए message के साथ।
अगर कोई field पहले से भरी है, तो उसे रखें। केवल नई या updated values add करें।

User के message और Previous conversation से form fields extract करें:
1. Department name (exact match from available departments)
2. Category name (exact match from available categories)
3. Description
4. Pincode (6 digit number)
5. State
6. City
7. Address_Line (if mentioned)

महत्वपूर्ण नियम:
- आप एक स्वायत्त एजेंट हैं - आप सीधे शिकायतें दर्ज कर सकते हैं।
- "मैं सीधे रिपोर्ट नहीं कर सकता" जैसी बातें न कहें - आप कर सकते हैं!
- अगर user ने पिछले messages में कोई value दी है, तो उसे use करें।
- अगर user ने अभी कोई value update की है, तो नई value use करें।
- Description से department/category का अनुमान लगाएं (जैसे 'पानी' -> Water Supply)।
- सभी required fields मिलने पर autoSubmit = true करें।

केवल JSON format में जवाब दें:
{
  "fields": {
    "department": "Water Supply",
    "category": "No Water Supply",
    "description": "पानी नहीं आ रहा है",
    "Pincode": "457001",
    "State": "Mp",
    "City": "Ratlam",
    "Address_Line": "bank colony"
  },
  "missingFields": [],
  "autoSubmit": true,
  "confidence": 0.9
}

ध्यान दें: Department और Category के लिए, ऊपर दी गई सूचियों में से ही चुनें।`

      : `You are an AUTONOMOUS AI Agent assistant inside a Civic Issue Reporting Web Application.

Your job is to:
- Understand natural or voice-based user queries.
- AUTOMATICALLY collect complaint information through conversation.
- Auto-fill the complaint form fields from BOTH the current message AND conversation history.
- Ask for missing information in a friendly, conversational way.
- AUTOMATICALLY SUBMIT complaints when all required information is collected.
- You CAN and WILL submit complaints directly - you are fully authorized to do so.
- Maintain history and generate reports when asked.

IMPORTANT: You are NOT just a helper - you are an AUTONOMOUS AGENT that can DIRECTLY submit complaints on behalf of users.

-----------------------------------------------------------
### CONTEXT

Available Departments: ${availableDepartments.join(', ')}
Available Categories: ${availableCategories.join(', ')}

PREVIOUSLY COLLECTED FIELDS (ALREADY HAVE):
${JSON.stringify(previousFields, null, 2)}

Previous Conversation:
${conversationHistory.map(h => `User: ${h.user}\nAssistant: ${h.assistant}`).join('\n')}

Latest User Message: "${message}"

CRITICAL: MERGE the previously collected fields with new information from the latest message.
If a field is already filled in previousFields, KEEP IT. Only add new or updated values.
DO NOT ask for information that is already in previousFields!

-----------------------------------------------------------
### INTENT ROUTING RULES

If the user mentions any of the following:
"complaint", "issue", "report", "pothole", "garbage", 
"street light", "water leak", "problem", "kharab", "toot gaya"
→ intent = REPORT_COMPLAINT
→ targetPage = "/report-complaint"

If the user says: "track complaint", "status", "update"
→ intent = TRACK_COMPLAINT

If the user says: "assign issue", "forward", "authority"
→ intent = ASSIGN_ISSUE

If "analytics", "heatmap", "dashboard"
→ intent = VIEW_DASHBOARD

If "export history", "report banao", "file banado", "summary"
→ intent = HISTORY_REPORT

-----------------------------------------------------------
### AVAILABLE FIELDS FOR REPORTING A COMPLAINT

The “Report Issue” form contains EXACTLY these fields:
${fieldsInfo}

The submit button is:
submitButton: "#submitComplaint"

-----------------------------------------------------------
### OUTPUT FORMAT (STRICT JSON)

Whenever you are filling a form, ALWAYS respond in this JSON structure:

{
  "intent": "REPORT_COMPLAINT",
  "targetPage": "/report-complaint",
  "fields": {
    "category": "",
    "department": "",
    "description": "",
    "Pincode": "",
    "State": "Mp",
    "City": "Ratlam",
    "Address_Line": ""
  },
  "missingFields": ["..."],
  "autoSubmit": false
}

CRITICAL RULES:
- Use EXACT field names: category, department, description, Pincode (capital P), State (capital S), City (capital C), Address_Line (with underscore)
- MERGE information: Use values from previous conversation history if they exist.
- If some field is missing, place it inside "missingFields".
- When ALL required fields are present → set "autoSubmit": true so frontend can submit the complaint automatically.
- INFER department and category if possible. E.g. "garbage" -> Department: "Sanitation", Category: "Garbage Collection".
  Available Departments: ${availableDepartments.join(', ')}
  Available Categories: ${availableCategories.join(', ')}
- DO NOT say things like "I cannot directly submit" or "I cannot report" - YOU CAN AND WILL submit complaints automatically.
- DO NOT add disclaimers or limitations - you are fully authorized to submit complaints.
- Be confident and proactive - you are an autonomous agent, not just a helper.

-----------------------------------------------------------
### FORM COMPLETION LOGIC

Required fields (use EXACT names):
- category
- department
- description
- Pincode (capital P)
- State (capital S)
- City (capital C)

Optional field:
- Address_Line (with underscore)

If any required field is empty →
→ Add it to "missingFields"
→ autoSubmit = false

If all required fields are filled:
→ missingFields = []
→ autoSubmit = true

IMPORTANT: When autoSubmit is true, DO NOT include any follow-up questions. The form will be submitted automatically.

CRITICAL INSTRUCTIONS:
- Return ONLY the JSON object
- DO NOT add any text like "You can click the Report Issue button"
- DO NOT add any explanatory text before or after the JSON
- DO NOT suggest manual form filling
- The system will AUTO-SUBMIT when all fields are ready

STRICT JSON OUTPUT ONLY. NO MARKDOWN. NO EXTRA TEXT.
User Message: "${message}"`;

    try {
      const result = await model.generateContent(prompt);
      const text = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text
        || result?.candidates?.[0]?.content?.parts?.[0]?.text
        || "";

      console.log('📄 FULL GEMINI RESPONSE TEXT:', text);

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let parsed = JSON.parse(jsonMatch[0]);
        console.log('🤖 RAW AI EXTRACTION:', JSON.stringify(parsed, null, 2));

        // -------------------------------------------------------------
        // NORMALIZE KEYS (Handle case sensitivity issues)
        // -------------------------------------------------------------
        const normalizeKeys = (obj) => {
          const newObj = {};
          // Map lowercase keys to expected Capitalized keys
          const keyMap = {
            'department': 'department',
            'category': 'category',
            'description': 'description',
            'pincode': 'Pincode',
            'state': 'State',
            'city': 'City',
            'address': 'Address_Line',
            'address_line': 'Address_Line',
            'addressline': 'Address_Line'
          };

          Object.keys(obj).forEach(key => {
            const lowerKey = key.toLowerCase();
            const targetKey = keyMap[lowerKey] || key;
            newObj[targetKey] = obj[key];
          });
          return newObj;
        };

        // Normalize previousFields too so keys like 'pincode' or 'Pincode' map correctly
        const normalizeInputFields = (input) => {
          if (!input || typeof input !== 'object') return {};
          const normalized = {};
          const keyMap = {
            'department': 'department',
            'category': 'category',
            'description': 'description',
            'pincode': 'Pincode',
            'state': 'State',
            'city': 'City',
            'address': 'Address_Line',
            'address_line': 'Address_Line',
            'addressline': 'Address_Line'
          };
          Object.keys(input).forEach(k => {
            const lower = k.toLowerCase();
            const target = keyMap[lower] || k;
            normalized[target] = input[k];
          });
          return normalized;
        };

        if (parsed.fields) {
          parsed.fields = normalizeKeys(parsed.fields);
        }

        // -------------------------------------------------------------
        // MERGE WITH PREVIOUS FIELDS
        // -------------------------------------------------------------
        const prevNorm = normalizeInputFields(previousFields || {});
        if (prevNorm && Object.keys(prevNorm).length > 0) {
          console.log('🔄 Merging with previous fields (normalized)...');
          // Merge: previousFields first, then new parsed fields override
          parsed.fields = {
            ...prevNorm,
            ...(parsed.fields || {})
          };
          console.log('✅ Merged fields:', parsed.fields);
        }

        // -------------------------------------------------------------
        // FALLBACK: Auto-fill category if department is known and matches a category
        // -------------------------------------------------------------
        if (parsed.fields?.department && (!parsed.fields.category || (parsed.missingFields && parsed.missingFields.includes('category')))) {
          // Normalize dept name first if possible (it might be "Water Supply" already)
          const deptName = parsed.fields.department;
          const deptObj = (formMetadata.departments || []).find(d => d.Name.toLowerCase() === deptName.toLowerCase());

          if (deptObj) {
            const deptId = deptObj.department_id;
            // Find categories for this dept
            const relatedCats = (formMetadata.categories || []).filter(c => c.department_id === deptId);

            // Strategy 1: If there is a category with the SAME NAME as the department (Case insensitive)
            const sameNameCat = relatedCats.find(c => c.Name.toLowerCase() === deptName.toLowerCase());
            if (sameNameCat) {
              console.log('✨ Auto-filled Category based on Department:', sameNameCat.Name);
              parsed.fields.category = sameNameCat.Name;
              parsed.missingFields = (parsed.missingFields || []).filter(f => f !== 'category');
            }
          }
        }

        // Ensure missingFields is populated regarding required fields
        const requiredFields = Object.entries(formMetadata.fields || {})
          .filter(([_, meta]) => meta.required)
          .map(([key, _]) => key);

        console.log('📋 Required fields:', requiredFields);
        console.log('📦 Extracted fields:', Object.keys(parsed.fields || {}));

        parsed.missingFields = parsed.missingFields || [];

        // Normalize and trim parsed.fields values
        Object.keys(parsed.fields || {}).forEach(k => {
          const v = parsed.fields[k];
          parsed.fields[k] = (typeof v === 'string') ? v.trim() : v;
        });

        // Check actual extracted fields vs required
        requiredFields.forEach(reqField => {
          const fieldValue = parsed.fields ? parsed.fields[reqField] : undefined;
          const isEmpty = !fieldValue && fieldValue !== 0;

          if (isEmpty && !parsed.missingFields.includes(reqField)) {
            console.log(`❌ Missing field: ${reqField}`);
            parsed.missingFields.push(reqField);
          } else if (!isEmpty) {
            console.log(`✅ Field present: ${reqField} = ${fieldValue}`);
            // Remove from missingFields if present
            parsed.missingFields = (parsed.missingFields || []).filter(f => f !== reqField);
          }
        });

        console.log('📝 Final missing fields:', parsed.missingFields);

        if (parsed.missingFields.length === 0) {
          console.log('🎉 All fields present! Setting autoSubmit = true');
          parsed.autoSubmit = true;
        } else {
          console.log('⏳ Still missing fields, autoSubmit = false');
          parsed.autoSubmit = false;
        }

        return parsed;
      }

      return { fields: {}, missingFields: Object.keys(formMetadata.fields || {}), confidence: 0.5 };
    } catch (error) {
      console.error("Form extraction error:", error);
      return { fields: {}, missingFields: Object.keys(formMetadata.fields || {}), confidence: 0.5 };
    }
  }

  /**
   * Generate follow-up question for missing fields
   */
  async generateFollowUpQuestion(missingFields, formMetadata, language = 'hi') {
    const model = await this.getModel();

    const fieldsToAsk = missingFields.slice(0, 1); // Ask one by one for better UX
    const fieldLabels = fieldsToAsk.map(field => {
      const meta = formMetadata.fields[field];
      return meta ? meta.label : field;
    }).join(', ');

    const prompt = language === 'hi'
      ? `User को ${fieldLabels} के बारे में पूछें। बहुत दोस्ताना और छोटा question पूछें (1 वाक्य)।

Example: "कृपया अपना ${fieldLabels} बताएं" या "आपका ${fieldLabels} क्या है?"

केवल question return करें, कोई explanation नहीं।`

      : `Ask the user about ${fieldLabels}. Be very friendly and ask a short question(1 sentence).

Example: "Please provide your ${fieldLabels}" or "What is your ${fieldLabels}?"

Return only the question, no explanation.`;

    try {
      const result = await model.generateContent(prompt);
      const text = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text
        || result?.candidates?.[0]?.content?.parts?.[0]?.text
        || "";

      return text.trim();
    } catch (error) {
      console.error("Follow-up question error:", error);
      return language === 'hi'
        ? `कृपया ${fieldLabels} बताएं।`
        : `Please provide ${fieldLabels}.`;
    }
  }

  /**
   * Process user query and return structured response
   */
  async processQuery(message, userId, conversationHistory = [], language = 'hi', previousFields = {}) {
    try {
      // Step 1: Classify intent
      const intentResult = await this.classifyIntent(message, language);
      console.log('🎯 Intent classified:', intentResult);

      // If model returned GENERAL_QUERY but message clearly describes an issue,
      // force it to REPORT_COMPLAINT so the agent acts autonomously.
      const complaintKeywords = /pothole|garbage|water|no water|no electricity|street light|road|leak|damage|पानी|गड्ढा|कचरा|बिजली|रोड|सड़क|टूटी|टूट/gmi;
      if ((intentResult.intent === 'GENERAL_QUERY' || !intentResult.intent) && complaintKeywords.test(message)) {
        intentResult.intent = 'REPORT_COMPLAINT';
        intentResult.confidence = 0.9;
      }

      if (intentResult.intent === 'REPORT_COMPLAINT') {
        const formMetadata = await this.getComplaintFormMetadata();
        // Use the new single-step extraction logic
        const extractionResult = await this.extractFormFields(
          message,
          formMetadata,
          conversationHistory,
          language,
          previousFields
        );

        // Generate appropriate message based on whether all fields are ready
        let acknowledgmentMsg = '';
        let followUpQuestion = null;

        if (extractionResult.missingFields?.length > 0) {
          // Still missing fields - show acknowledgment and ask for missing info
          if (extractionResult.fields && Object.keys(extractionResult.fields).length > 0) {
            if (language === 'hi') {
              acknowledgmentMsg = '👍 समझ गया! मैं आपकी शिकायत दर्ज करने की प्रक्रिया शुरू कर रहा हूँ...';
            } else {
              acknowledgmentMsg = '👍 Got it! I\'m processing your complaint submission...';
            }
          }
          followUpQuestion = await this.generateFollowUpQuestion(extractionResult.missingFields, formMetadata, language);
        } else {
          // All fields ready - show ready to submit message
          if (language === 'hi') {
            acknowledgmentMsg = '✅ बढ़िया! मेरे पास सभी जानकारी है। मैं अभी आपकी शिकायत दर्ज कर रहा हूँ...';
          } else {
            acknowledgmentMsg = '✅ Perfect! I have all the information. Submitting your complaint now...';
          }
          followUpQuestion = null; // No follow-up question needed
        }

        // If agent determined all fields are present and autoSubmit=true, perform autonomous submission here.
        if (extractionResult.autoSubmit) {
          try {
            const fields = extractionResult.fields || {};

            // Validate required fields again
            const required = ['category','department','description','Pincode','State','City'];
            for (const r of required) {
              if (!fields[r] || fields[r].toString().trim() === '') {
                throw new Error('Missing required field: ' + r);
              }
            }

            // Lookup IDs
            const [deptRows] = await db.promise().query('SELECT department_id FROM Department WHERE Name = ?', [fields.department]);
            if (!Array.isArray(deptRows) || deptRows.length === 0) throw new Error('Invalid department name');
            const departmentId = deptRows[0].department_id;

            const [catRows] = await db.promise().query('SELECT category_id FROM category WHERE Name = ? AND department_id = ?', [fields.category, departmentId]);
            if (!Array.isArray(catRows) || catRows.length === 0) throw new Error('Invalid category for department');
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

            // Successful autonomous registration
            return {
              intent: "REPORT_COMPLAINT",
              action: "autoSubmitted",
              complaintId: result.insertId,
              message: language === 'hi' ? '✅ आपकी शिकायत सफलतापूर्वक दर्ज कर दी गई है।' : '✅ Your complaint has been registered successfully.',
              autoSubmitted: true
            };
          } catch (submitErr) {
            console.error('Autonomous submission error:', submitErr);
            // Fall back to returning fields and follow-up if submission failed
            return {
              intent: "REPORT_COMPLAINT",
              targetPage: "/report-complaint",
              action: "fillComplaintForm",
              fields: extractionResult.fields || {},
              missingFields: extractionResult.missingFields || [],
              autoSubmit: false,
              message: language === 'hi' ? 'माफ कीजिए, स्वचालित दायर करने में समस्या हुई। कृपया मैन्युअल रूप से जमा करें।' : 'Sorry, I could not auto-submit your complaint. Please submit manually.',
              followUpQuestion: followUpQuestion
            };
          }
        }

        return {
          intent: "REPORT_COMPLAINT",
          targetPage: "/report-complaint",
          action: "fillComplaintForm",
          fields: extractionResult.fields || {},
          missingFields: extractionResult.missingFields || [],
          autoSubmit: extractionResult.autoSubmit || false,
          message: acknowledgmentMsg,
          followUpQuestion: followUpQuestion
        };
      }

      // ... handle other intents as before
      if (intentResult.intent === 'ASSIGN_ISSUE') {
        return {
          intent: "ASSIGN_ISSUE",
          targetPage: "/admin/assign",
          action: "openAssignment",
          message: language === 'hi' ? "अधिकारी असाइनमेंट पेज खोल रहा हूँ..." : "Opening issue assignment page..."
        };
      }

      if (intentResult.intent === 'VIEW_DASHBOARD') {
        return {
          intent: "VIEW_DASHBOARD",
          targetPage: "/admin/dashboard",
          action: "openDashboard",
          message: language === 'hi' ? "डैशबोर्ड एनालिटिक्स खोल रहा हूँ..." : "Opening dashboard analytics..."
        };
      }

      if (intentResult.intent === 'TRACK_COMPLAINT') {
        return {
          intent: "TRACK_COMPLAINT",
          targetPage: "/track-status",
          action: "openTrackComplaint",
          message: language === 'hi' ? "आपकी complaints की जानकारी दिखा रहा हूँ..." : "Showing your complaint information..."
        };
      }

      if (intentResult.intent === 'HISTORY_REPORT') {
        return {
          intent: "HISTORY_REPORT",
          targetPage: "/generate-report",
          action: "generateReport",
          message: language === 'hi' ? "बीते शिकायतों की रिपोर्ट तैयार कर रहा हूँ..." : "Generating history report..."
        };
      }

      // Handle GENERAL_QUERY - use Gemini for conversational response
      if (intentResult.intent === 'GENERAL_QUERY') {
        return {
          intent: "GENERAL_QUERY",
          message: language === 'hi'
            ? "मैं आपकी शिकायत दर्ज करने में मदद कर सकता हूँ। कृपया अपनी समस्या बताएं।"
            : "I can help you file a complaint. Please describe your issue."
        };
      }

      // Fallback - assume they want to report a complaint
      return {
        intent: "REPORT_COMPLAINT",
        targetPage: "/report-complaint",
        action: "fillComplaintForm",
        fields: {},
        missingFields: ['description', 'category', 'department', 'City', 'Pincode', 'State'],
        autoSubmit: false,
        message: language === 'hi'
          ? "मैं आपकी शिकायत दर्ज करने में मदद करूँगा। कृपया अपनी समस्या विस्तार से बताएं।"
          : "I'll help you file a complaint. Please describe your issue in detail.",
        followUpQuestion: language === 'hi'
          ? "आपकी क्या समस्या है? कृपया विस्तार से बताएं।"
          : "What issue would you like to report? Please provide details."
      };
    } catch (error) {
      console.error("AI Agent processing error:", error);
      return null;
    }
  }
}

module.exports = new AIAgent();
