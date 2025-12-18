// server/utils/geminiService.js
import { getGeminiModel } from '../config/gemini.js';

class GeminiService {
  constructor() {
    this.model = getGeminiModel(); // should return a generative model instance
  }

  getSystemPrompt(language, userType) {
    const prompts = {
      hi: {
        citizen: `आप Civic-MITRA का आधिकारिक AI सहायक हैं... केवल हिंदी में जवाब दें।`,
        officer: `आप Civic-MITRA प्लेटफॉर्म के विभागीय अधिकारियों के लिए AI सहायक हैं... केवल हिंदी में जवाब दें।`,
        fieldstaff: `आप Civic-MITRA के field staff (मित्र) के लिए AI सहायक हैं... केवल हिंदी में जवाब दें।`,
        admin: `आप Civic-MITRA के Super Admin के लिए AI सहायक हैं... केवल हिंदी में जवाब दें।`
      },
      en: {
        citizen: `You are the official AI assistant for Civic-MITRA... Respond only in English.`,
        officer: `You are the AI assistant for departmental officers... Respond only in English.`,
        fieldstaff: `You are the AI assistant for field staff (Mitra)... Respond only in English.`,
        admin: `You are the AI assistant for Super Admin... Respond only in English.`
      }
    };

    return (
      prompts[language]?.[userType] ||
      prompts[language]?.citizen ||
      prompts.hi.citizen
    );
  }

  // Quick responses for common queries (fast path)
  getQuickResponse(message, language) {
    const quickResponses = {
      hi: {
        complaint_status:
          "आप अपनी शिकायत का status Dashboard में जाकर 'मेरी शिकायतें' section में देख सकते हैं...",
        new_complaint:
          "नई शिकायत दर्ज करने के लिए: 1) Dashboard पर जाएं 2) 'नई शिकायत'...",
        departments:
          "i-MITRA में ये departments उपलब्ध हैं: सफाई विभाग, जल आपूर्ति, सड़क निर्माण...",
        contact:
          "Help के लिए संपर्क करें: Email: help@imitra-indore.gov.in, Phone: 0731-XXXXXXX..."
      },
      en: {
        complaint_status:
          "Check Dashboard > 'My Complaints' to see your complaint ID, status, and assignee.",
        new_complaint:
          "To file: Dashboard → 'New Complaint' → select category → add location...",
        departments:
          "Available departments: Sanitation, Water, Roads, Electricity, Health, Parks & Gardens...",
        contact:
          "Help: help@imitra-indore.gov.in, Phone: 0731-XXXXXXX, or ask here in chat."
      }
    };

    const text = message.toLowerCase().trim();
    if (text.includes('status') || text.includes('स्थिति')) return quickResponses[language].complaint_status;
    if (text.includes('complaint') || text.includes('शिकायत')) return quickResponses[language].new_complaint;
    if (text.includes('department') || text.includes('विभाग')) return quickResponses[language].departments;
    if (text.includes('contact') || text.includes('संपर्क')) return quickResponses[language].contact;
    return null;
  }

  async generateResponse(message, language = 'hi', context = '', userType = 'citizen') {
    try {
      const systemPrompt = this.getSystemPrompt(language, userType);

      const fullPrompt = [
        systemPrompt,
        context ? `\n\nConversation Context:\n${context}` : '',
        `\n\nUser Message:\n${message}\n\nAssistant:`
      ].join('');

      const result = await this.model.generateContent(fullPrompt);
      // Extract text from GoogleGenAI response structure
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return text;
    } catch (err) {
      console.error('Gemini API Error:', err);
      throw new Error('Failed to generate AI response');
    }
  }

  async getContextualResponse(message, userType, language = 'hi', context = '') {
    const quick = this.getQuickResponse(message, language);
    if (quick) return quick;
    return this.generateResponse(message, language, context, userType);
  }
}

const geminiService = new GeminiService();
export default geminiService;