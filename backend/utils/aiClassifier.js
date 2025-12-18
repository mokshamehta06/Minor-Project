import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || "");

const ALLOWED_DEPARTMENTS = [
  "Water Supply Department",
  "Public Health Department",
  "Electrical Department",
  "Solid Waste Management",
  "Public Works Department",
  "Education Department",
  "Other",
];

function normalizeDepartment(value) {
  if (!value) return "Other";
  const match = ALLOWED_DEPARTMENTS.find(
    (dept) =>
      dept.toLowerCase().includes(value.toLowerCase()) ||
      value.toLowerCase().includes(dept.toLowerCase())
  );
  return match || "Other";
}

export async function getDeptAndCatJSON({ title, description }) {
  const systemInstruction = `
You are a municipal complaint classifier for Indian city services.
Analyze the complaint and return ONLY valid JSON:

{
  "department": "<one of: Water Supply Department, Public Health Department, Electrical Department, Solid Waste Management, Public Works Department, Education Department, Other>",
  "category": "<short descriptive label>",
  "confidence": <0.0-1.0>
}

Examples:
- "paani nahi aa raha" → {"department": "Water Supply Department", "category": "No Water Supply", "confidence": 0.95}
- "streetlight nahi jal rahi" → {"department": "Electrical Department", "category": "Street Light Not Working", "confidence": 0.90}
- "safai nahi hui" → {"department": "Solid Waste Management", "category": "Garbage Collection", "confidence": 0.85}

Return only JSON, no other text.
  `.trim();

  try {
    const prompt = `${systemInstruction}\n\nTitle: ${
      title || ""
    }\nDescription: ${description || ""}`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let text = (result?.text || "").trim();
    // Clean up any markdown formatting
    text = text.replace(/```[a-zA-Z]*|```/g, "").trim();

    const parsed = JSON.parse(text);

    return {
      department: normalizeDepartment(parsed.department),
      category: parsed.category || "General Issue",
      confidence: parsed.confidence || 0.5,
    };
  } catch (error) {
    console.error("AI classification error:", error);
    return {
      department: "Other",
      category: "General Issue",
      confidence: 0.0,
    };
  }
}
