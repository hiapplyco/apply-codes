import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booleanString, requirements } = await req.json();

    if (!booleanString) {
      throw new Error('Boolean string is required');
    }

    const genAI = new GoogleGenerativeAI(Deno.env.get('GOOGLE_AI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an expert recruiter explaining a boolean search string to a user. Analyze this boolean search string and provide a structured explanation.

Boolean String: "${booleanString}"
${requirements ? `Original Requirements: "${requirements}"` : ''}

Provide a response in the following JSON format:
{
  "overview": "Brief 1-2 sentence overview of what this search will find",
  "components": [
    {
      "part": "The specific part of the boolean string",
      "purpose": "What this part searches for",
      "example": "Example of what this would match"
    }
  ],
  "inclusions": [
    "What types of candidates WILL be found"
  ],
  "exclusions": [
    "What types of candidates will be EXCLUDED"
  ],
  "tips": [
    "Helpful tips for using or modifying this search"
  ]
}

Focus on clarity and helping the user understand exactly what their search will return.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    let explanation;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        explanation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      // Fallback to a basic structure
      explanation = {
        overview: text.substring(0, 200),
        components: [],
        inclusions: ["Candidates matching the search criteria"],
        exclusions: ["Candidates not matching the criteria"],
        tips: ["Review and adjust the search as needed"]
      };
    }

    return new Response(JSON.stringify({ explanation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error explaining boolean:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});