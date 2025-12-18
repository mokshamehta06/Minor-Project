import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI(process.env.GOOGLE_API_KEY);

export async function generateText(prompt) {
  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  return result?.text || "";
}

export async function classifyData(title, description) {
  const prompt = `Classify: Title: ${title}, Description: ${description}
  Return JSON: {"category": "...", "confidence": 0.0-1.0}`;
  
  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  
  let text = (result?.text || "").trim();
  text = text.replace(/```[a-zA-Z]*|```/g, "").trim();
  return JSON.parse(text);
}