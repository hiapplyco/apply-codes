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
    console.log('Content generation request received');
    
    const requestBody = await req.json();
    console.log('Request body received:', { 
      contentType: requestBody?.contentType,
      userInputLength: requestBody?.userInput?.length,
      systemPromptLength: requestBody?.systemPrompt?.length
    });
    
    const { contentType, userInput, systemPrompt } = requestBody;
    
    if (!contentType || !userInput?.trim() || !systemPrompt) {
      const missingFields = [];
      if (!contentType) missingFields.push('contentType');
      if (!userInput?.trim()) missingFields.push('userInput');
      if (!systemPrompt) missingFields.push('systemPrompt');
      
      const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Get API key from environment variables
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not configured');
      throw new Error('GEMINI_API_KEY is not configured');
    }
    
    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });
    
    console.log(`Starting content generation for: ${contentType}`);
    
    // Combine system prompt with user input
    const fullPrompt = `${systemPrompt}\n\nUser Input:\n${userInput}\n\nIMPORTANT: Format your response in Markdown with proper headings, lists, and formatting. Make it visually appealing and well-structured.`;
    
    console.log(`Prompt prepared, length: ${fullPrompt.length}`);
    
    const result = await model.generateContent([
      {
        text: fullPrompt,
      }
    ]);
    
    console.log('Gemini API call completed');
    
    const generatedContent = result.response.text();
    console.log(`Raw content generated, length: ${generatedContent.length}`);
    
    // Clean up the response - remove any system-like prefixes
    const cleanedContent = generatedContent
      .replace(/^(Sure|Here's|I'll|Let me|Certainly|Of course)[^]*?(?=\n|$)/i, '')
      .trim();
    
    console.log(`Content cleaned, final length: ${cleanedContent.length}`);
    console.log(`Content generated successfully for ${contentType}`);
    
    const response = { 
      content: cleanedContent,
      markdown: cleanedContent,
      contentType: contentType,
      success: true
    };
    
    console.log('Sending response:', { 
      contentLength: response.content.length,
      contentType: response.contentType,
      success: response.success
    });
    
    return new Response(
      JSON.stringify(response), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in content generator:', error);
    console.error('Error stack:', error.stack);
    
    const errorResponse = { 
      error: error.message,
      success: false,
      timestamp: new Date().toISOString()
    };
    
    return new Response(
      JSON.stringify(errorResponse), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});