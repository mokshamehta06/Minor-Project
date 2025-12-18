// server/config/gemini.js
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";


const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });


export const getGeminiModel = (modelName = "gemini-2.5-flash") => {
  return {
    generateContent: async (prompt) => {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      return response; // response object
    },
  };
};
