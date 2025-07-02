
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { promptManager } from "../_shared/prompts/promptManager.ts";
import { clarvidaPrompt } from "../_shared/prompts/clarvida.prompt.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Creates and returns a Gemini model instance using 2.5 Flash
 */
function getGeminiModel() {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-2.5-flash model
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

/**
 * Generates content using the Gemini 2.5 Flash API
 */
async function generateContent(promptText: string) {
  console.log("Sending prompt to Gemini 2.5 Flash API");
  const model = getGeminiModel();
  const result = await model.generateContent(promptText);
  const responseText = result.response.text();
  console.log("Received response from Gemini 2.5 Flash API");
  return responseText;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();
    
    console.log(`Generating Clarvida report for content length: ${content.length}`);
    
    // Render the prompt using the enhanced prompt manager
    const promptText = promptManager.render(clarvidaPrompt, { content });
    
    // Generate content using Gemini 2.5 Flash
    const responseText = await generateContent(promptText);
    
    console.log("Text content received, length:", responseText.length);
    
    // Try to parse JSON from the response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      let parsedData;
      
      if (jsonMatch) {
        console.log("JSON match found, attempting to parse");
        parsedData = JSON.parse(jsonMatch[0]);
        console.log("Successfully parsed JSON data");
      } else {
        throw new Error("No valid JSON found in response");
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          data: parsedData
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to parse JSON response: ${parseError.message}`,
          rawResponse: responseText
        }),
        {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error("Error generating Clarvida report:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
