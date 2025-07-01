
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();
    
    if (!content?.trim()) {
      return new Response(
        JSON.stringify({ 
          error: 'Content is required',
          details: 'Please provide some content to analyze'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Given this job description, create:
1. A concise, professional title (maximum 6 words) that summarizes the role
2. A brief summary (2-3 sentences) highlighting the key aspects of the position

Return ONLY a valid JSON object with 'title' and 'summary' fields, nothing else. Example:
{
  "title": "Senior Software Engineer",
  "summary": "Leadership role in software development."
}

Here's the job description:

${content}`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Try to extract JSON from the response if it's wrapped in markdown or other text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const jsonStr = jsonMatch[0];
      const response = JSON.parse(jsonStr);

      // Validate the response has the required fields
      if (!response.title || !response.summary) {
        throw new Error('Response missing required fields');
      }
      
      return new Response(
        JSON.stringify(response),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('Gemini API Error:', error);
      
      // Check if it's a rate limit error
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Please try again later.',
            shouldRetry: true,
            retryAfter: 60
          }),
          { 
            status: 429,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Retry-After': '60'
            }
          }
        );
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate title and summary',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
