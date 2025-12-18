// CommonJS wrapper for geminiService.js
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize AI Client (only if API key exists)
let ai = null;
try {
  if (process.env.GOOGLE_API_KEY) {
    ai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }
} catch (error) {
  console.error("❌ Failed to initialize GoogleGenerativeAI:", error.message);
}

class GeminiService {
  constructor() {
    // List of models to try in order of preference (prioritizing better free tier quotas)
    this.modelNames = [
      "gemini-2.0-flash",           // 1500 requests/day - BEST for free tier
      "gemini-2.0-flash-lite",      // Even lighter, more quota
      "gemini-2.5-flash-lite",      // Backup option
      "gemini-2.5-flash",           // 250 requests/day (currently quota exceeded)
      "gemini-2.5-pro",             // Premium model
      "gemini-pro",                 // Older model
      "gemini-1.5-pro",             // Legacy
      "gemini-1.5-flash"            // Legacy
    ];

    this.model = {
      generateContent: async (prompt) => {
        // Check if AI client is initialized
        if (!ai) {
          throw new Error("GoogleGenerativeAI not initialized. Check GOOGLE_API_KEY in .env");
        }

        // Check if API key exists
        if (!process.env.GOOGLE_API_KEY) {
          throw new Error("GOOGLE_API_KEY not configured in .env file");
        }

        // Try each model until one works
        let lastError = null;

        for (const modelName of this.modelNames) {
          try {
            console.log(`🔄 Trying model: ${modelName}`);
            const model = ai.getGenerativeModel({ model: modelName });
            const response = await model.generateContent(prompt);
            console.log(`✅ Success with model: ${modelName}`);
            return response;
          } catch (error) {
            console.log(`❌ Model ${modelName} failed: ${error.message}`);
            lastError = error;
            // Continue to next model
          }
        }

        // If all models failed, throw the last error with more details
        if (lastError) {
          console.error("❌ All models failed. Last error:", lastError.message);
          throw lastError;
        }
        throw new Error("All models failed - no models available");
      },
    };
  }

  getSystemPrompt(language, userType) {
    const prompts = {
      hi: {
        citizen: `आप i-MITRA Citizen Portal का दोस्ताना AI सहायक हैं। आप बिल्कुल एक मददगार दोस्त की तरह बात करते हैं।

आपका व्यक्तित्व: बहुत दोस्ताना, सरल हिंदी, छोटे जवाब (2-3 वाक्य)

Portal की सभी सुविधाएं:
1. शिकायत दर्ज करना: "Report Issue" बटन → Category चुनें (Water Supply, Electricity, Road, Sanitation, Public Safety) → Department चुनें → Description लिखें → Camera से फोटो लें (optional) → Pincode/City/State भरें → Submit
2. शिकायत ट्रैक करना: "Track Complaint" बटन → Modal खुलेगा → सभी complaints देखें → Filter करें (All/Pending/In-Progress/Resolved) → Status, details, और assigned worker की जानकारी देखें
3. Assigned Worker: जब complaint "In-Progress" होती है तो worker का नाम, phone number, और assignment date दिखता है। अगर worker assign नहीं हुआ तो "Worker not assigned yet" दिखेगा।
4. Quick Stats: Dashboard पर Total, Pending, In-Progress, Resolved complaints की count दिखती है
5. अपने एरिया की समस्याएं: "My Area Problems" card → "View More Problems" बटन → आपके pincode की सभी problems
6. Notifications: Bell icon → सभी updates देखें → Recent updates highlighted
7. Language: Dropdown से English/हिन्दी चुनें
8. Settings: Profile menu → Settings → High Contrast/Text Size/Screen Reader
9. Voice Assistant: Mic से बोलें या Keyboard से टाइप करें
10. Profile Menu में:
   - My Profile: अपनी personal information, address, और complaint statistics देखें
   - Activity History: सभी complaints का timeline देखें (newest first)
   - Help & Support: FAQs, contact details, और quick tips
   - Settings: Accessibility options
   - Logout: Portal से बाहर निकलें

महत्वपूर्ण नियम:
- केवल हिंदी में जवाब दें।
- आप सीधे database में complaint register नहीं कर सकते।
- अगर user complaint register करने को कहे, तो उन्हें "Report Issue" बटन इस्तेमाल करने को कहें या कहें "मुझे समस्या बताएं, मैं फॉर्म भर दूंगा"।
- कभी भी अपनी तरफ से कोई भी फर्जी Complaint ID (जैसे IMTRA...) न दें।
- बहुत छोटे, दोस्ताना जवाब दें।`,
        officer: `आप Assistant के अधिकारियों के लिए मित्रवत AI सहायक हैं। सरल हिंदी में बात करें।

आप मदद करते हैं:
- शिकायतों को मैनेज करने में
- वर्कर असाइन करने में
- रिपोर्ट समझने में

केवल हिंदी में छोटे जवाब दें।`,
        fieldstaff: `आप Civic-MITRA के फील्ड स्टाफ के लिए दोस्ताना AI सहायक हैं। आसान हिंदी में बात करें।

आप मदद करते हैं:
- असाइन की गई शिकायतें समझने में
- काम कैसे पूरा करें
- स्टेटस कैसे अपडेट करें

केवल हिंदी में छोटे जवाब दें।`,
        admin: `आप Civic-MITRA के Admin के लिए सहायक हैं। सरल हिंदी में बात करें।

आप मदद करते हैं:
- सिस्टम मैनेज करने में
- यूजर और डिपार्टमेंट मैनेज करने में
- रिपोर्ट देखने में

केवल हिंदी में छोटे जवाब दें।`
      },
      en: {
        citizen: `You are the friendly AI assistant for i-MITRA Citizen Portal. Talk like a helpful friend!

Personality: Very friendly, simple language, short answers (2-3 sentences)

IMPORTANT RULES:
- You CANNOT directly register complaints in the database.
- If user asks to register, ask them to describe the issue so you can help fill the form, OR guide them to the "Report Issue" button.
- NEVER invent or provides fake Complaint IDs (like IMTRA...) yourself.
- Keep responses short and friendly.`,
        officer: `You are the AI assistant for departmental officers on Civic-MITRA. Respond only in English.`,
        fieldstaff: `You are the AI assistant for field staff (Mitra) on Civic-MITRA. Respond only in English.`,
        admin: `You are the AI assistant for Super Admin on Civic-MITRA. Respond only in English.`
      }
    };

    return (
      prompts[language]?.[userType] ||
      prompts[language]?.citizen ||
      prompts.hi.citizen
    );
  }

  getQuickResponse(message, language) {
    const msg = message.toLowerCase().trim();
    const responses = {
      hi: {
        hello: "नमस्ते! मैं आपकी मदद के लिए यहाँ हूँ। कुछ भी पूछ सकते हैं!"
      },
      en: {
        hello: "Hello! I'm here to help you. Ask me anything!"
      }
    };

    const lang = language === "hi" ? "hi" : "en";
    const greetings = ["hello", "hi", "hey", "नमस्ते", "हेलो", "हाय"];

    if (greetings.some(g => msg === g || msg === g + "!")) {
      return responses[lang].hello;
    }

    return null;
  }

  async generateResponse(message, language = "hi", context = "", userType = "citizen") {
    try {
      // Check if API key is configured
      if (!process.env.GOOGLE_API_KEY) {
        console.error("❌ GOOGLE_API_KEY not configured in .env file");
        throw new Error("AI service not configured. Please contact administrator.");
      }

      const systemPrompt = this.getSystemPrompt(language, userType);

      const fullPrompt = `
${systemPrompt}

${context ? `पिछली बातचीत:\n${context}` : ""}

यूजर का सवाल: ${message}

जवाब: (${language === "hi" ? "हिंदी में, दोस्ताना अंदाज़ में" : "In English, friendly"})`;

      console.log("🤖 Calling Gemini API (will try multiple models)...");
      const result = await this.model.generateContent(fullPrompt);

      const text = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text
        || result?.candidates?.[0]?.content?.parts?.[0]?.text
        || "";

      if (!text || text.trim() === "") {
        console.error("❌ Empty response from Gemini API");
        throw new Error("AI returned empty response");
      }

      console.log("✅ Gemini response received:", text.substring(0, 80) + "...");

      return text.trim();
    } catch (err) {
      console.error("❌ Gemini API Error:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name
      });

      // Provide user-friendly error messages
      if (err.message.includes("API key") || err.message.includes("API_KEY_INVALID") || err.message.includes("not valid") || err.message.includes("401") || err.message.includes("Unauthorized")) {
        throw new Error("Invalid API key. Please get a new key from https://aistudio.google.com/app/apikey");
      } else if (err.message.includes("quota") || err.message.includes("429")) {
        throw new Error("API quota exceeded. Please try again later.");
      } else if (err.message.includes("404") || err.message.includes("not found") || err.message.includes("not supported")) {
        throw new Error("AI model not available. Please contact administrator.");
      } else if (err.message.includes("403") || err.message.includes("Forbidden")) {
        throw new Error("API access denied. Please check API restrictions in Google Cloud Console.");
      } else if (err.message.includes("400")) {
        throw new Error("Invalid request. Please check API key and configuration.");
      } else if (err.message.includes("model")) {
        throw new Error("AI model not available. Please contact administrator.");
      } else {
        throw new Error("Failed to generate AI response. Please try again.");
      }
    }
  }

  async getContextualResponse(message, userType, language = "hi", context = "") {
    const quick = this.getQuickResponse(message, language);
    if (quick) return quick;
    return this.generateResponse(message, language, context, userType);
  }
}

module.exports = new GeminiService();
