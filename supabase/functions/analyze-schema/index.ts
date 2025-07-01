
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { schema } = await req.json();
    console.log("Analyzing job posting:", schema?.substring(0, 50));

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    // Use gemini-2.5-flash instead of the deprecated model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You're an AI assistant specialized in recruiting. I want you to analyze the job description below and extract key information in a structured JSON format:

    Job Description: ${schema}

    Extract and provide the following information in a structured JSON format:
    {
      "job_title": "The main title of the position",
      "company": "The company or organization offering the position",
      "location": "Location of the job (including remote options)",
      "salary_range": "Any salary information mentioned",
      "experience_level": "Required experience level",
      "employment_type": "Full-time, part-time, contract, etc.",
      "skills": ["List of required technical skills"],
      "qualifications": ["List of required qualifications like degrees or certifications"],
      "responsibilities": ["Key responsibilities of the role"],
      "benefits": ["List of benefits offered"]
    }

    If any field is not found in the job description, use null for that field. Make sure all text is properly escaped for JSON.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Clean up the response - sometimes the API returns text around the JSON
    let cleanedResponse = response;
    try {
      // Extract JSON if it's wrapped in text or code blocks
      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                         response.match(/\{[\s\S]*?\}/);
      
      if (jsonMatch && jsonMatch[1]) {
        cleanedResponse = jsonMatch[1];
      } else if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }
      
      // Parse to validate and then stringify for consistent formatting
      const parsed = JSON.parse(cleanedResponse);
      cleanedResponse = JSON.stringify(parsed);
    } catch (parseError) {
      console.error("Error parsing JSON from model response:", parseError);
      // If parsing fails, return the original response
    }

    console.log("Analysis completed successfully");
    
    return new Response(cleanedResponse, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error in analyze-schema function:", error);
    
    return new Response(JSON.stringify({ 
      error: "Failed to analyze job schema", 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
