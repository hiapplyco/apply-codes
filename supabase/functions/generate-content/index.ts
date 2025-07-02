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
    const { contentType, userInput, systemPrompt } = await req.json();
    
    if (!contentType || !userInput?.trim() || !systemPrompt) {
      throw new Error('Content type, user input, and system prompt are required');
    }

    // Get API key from environment variables
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    
    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });
    
    console.log(`Generating content for: ${contentType}`);
    
    // Combine system prompt with user input
    const fullPrompt = `${systemPrompt}\n\nUser Input:\n${userInput}\n\nIMPORTANT: Format your response in Markdown with proper headings, lists, and formatting. Make it visually appealing and well-structured.`;
    
    const result = await model.generateContent([
      {
        text: fullPrompt,
      }
    ]);
    
    const generatedContent = result.response.text();
    
    // Clean up the response - remove any system-like prefixes
    const cleanedContent = generatedContent
      .replace(/^(Sure|Here's|I'll|Let me|Certainly|Of course)[^]*?(?=\n|$)/i, '')
      .trim();
    
    console.log(`Content generated successfully for ${contentType}`);
    
    return new Response(
      JSON.stringify({ 
        content: cleanedContent,
        markdown: cleanedContent,
        contentType: contentType 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in content generator:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});