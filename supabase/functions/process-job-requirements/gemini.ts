
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

/**
 * Creates and returns a Gemini model instance
 * @returns The Gemini model instance
 */
export function getGeminiModel() {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-2.5-flash as the model name
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

/**
 * Generates content using the Gemini API
 * @param promptText The prompt text to send to Gemini
 * @returns The generated content
 */
export async function generateContent(promptText: string) {
  console.log("Sending prompt to Gemini 2.0 Flash API");
  const model = getGeminiModel();
  
  // Add timeout to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  
  try {
    const result = await model.generateContent(promptText);
    clearTimeout(timeoutId);
    const responseText = result.response.text();
    console.log("Received response from Gemini 2.0 Flash API:", responseText);
    return responseText;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error("Gemini API request timed out after 15 seconds");
      throw new Error("AI request timed out. Please try again.");
    }
    throw error;
  }
}
