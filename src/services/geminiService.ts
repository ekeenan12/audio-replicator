import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, Recipe } from "../types";

export async function explainResults(analysis: AnalysisResult, recipes: Recipe[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Prepare a summary of the data to avoid token limits if necessary
  const summary = {
    bpm: analysis.bpm,
    key: analysis.keyCandidates[0],
    segments: analysis.segments.map(s => s.label),
    recipes: recipes.map(r => ({
        archetype: r.archetype,
        reason: r.reason
    }))
  };

  const prompt = `
    Analyze this music track data and explain the results to a music producer.
    
    Data:
    ${JSON.stringify(summary, null, 2)}
    
    Please provide:
    1. A brief summary of the track's structure and vibe.
    2. Why specific sound design recipes were suggested.
    3. One creative tip for remixing this track.
    
    Keep it concise and encouraging.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text;
}
