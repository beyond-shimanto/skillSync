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