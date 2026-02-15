'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function translateText(segments, targetLanguage) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ 
     model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `Translate these subtitles to ${targetLanguage}: ${JSON.stringify(segments)}. Return a JSON array of strings only.`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Return success object
    return { success: true, data: JSON.parse(text) };

  } catch (error) {
    console.error("Gemini Error:", error);
    // Return error object instead of throwing
    return { 
      success: false, 
      error: error.message || "Failed to connect to AI service" 
    };
  }
}