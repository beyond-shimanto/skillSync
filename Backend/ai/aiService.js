import { GoogleGenAI } from "@google/genai";

export const generateAIResponse = async (messages) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Convert messages to the format expected by the API
    const contents = messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    // For non-streaming response
    const text = response.text;

    return {
      success: true,
      message: text,
    };
  } catch (error) {
    console.error("Error generating AI response:", error);
    return {
      success: false,
      error: "Failed to generate response from AI: " + error.message,
    };
  }
};

// Generating a structured learning roadmap
export const generateRoadmap = async (targetRole, skills) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const skillsList = skills.length > 0
      ? `The user already knows: ${skills.join(", ")}.`
      : "The user has no specific skills listed yet.";

    const prompt = `You are a learning roadmap generator for a mentorship platform called SkillSync.

A student wants to become a ${targetRole}.
${skillsList}

Generate a structured learning roadmap for them. Format your response as a JSON object with this exact structure:
{
  "title": "Roadmap to become a ${targetRole}",
  "estimatedTime": "X months",
  "phases": [
    {
      "phase": 1,
      "title": "Phase title",
      "duration": "X weeks",
      "topics": ["topic1", "topic2", "topic3"],
      "resources": ["resource1", "resource2"],
      "milestone": "What the student can do after this phase"
    }
  ]
}

Rules:
- Generate 4 to 5 phases
- Each phase should have 4 to 6 topics
- Each phase should have 2 to 3 resources (free ones like YouTube, freeCodeCamp, MDN, etc.)
- Keep topics concise (3 to 5 words each)
- Make the roadmap practical and beginner friendly
- If the user already knows some skills, skip or reduce those topics
- Return ONLY the JSON object, no markdown, no backticks, no explanation`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = response.text.trim();
    const parsed = JSON.parse(text);

    return {
      success: true,
      roadmap: parsed,
    };
  } catch (error) {
    console.error("Error generating roadmap:", error);
    return {
      success: false,
      error: "Failed to generate roadmap: " + error.message,
    };
  }
};