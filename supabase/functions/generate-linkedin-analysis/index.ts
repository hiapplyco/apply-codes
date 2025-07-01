
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
    
    if (!content) {
      throw new Error('Content is required');
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });

    const prompt = `Act as 5 experts + Devil's Advocate analyzing "${content}":

1. [MoE Phase]
- Technical Architect: "Core components/implementation challenges..."
- Industry Analyst: "Adoption trends/success-failure case studies..."
- Ethics Specialist: "Regulatory risks/ethical failure points..."
- Solutions Engineer: "Technical specifications/architecture..."
- UX Strategist: "User adoption barriers/engagement strategies..."

2. [Devil's Advocate Phase]
- Critic: "Fundamental flaws in these approaches... Overlooked threats..."

3. [CoT Resolution]
- Lead Architect: "Address criticisms through:\n- Flaw mitigation 1...\n- Threat workaround 2..."
- Final hybrid solution balancing innovation/safety

4. [Voice Synthesis]
- Tone Engineer: "Natural communication using:\n- Relatable analogies\n- Personal anecdotes\n- 'You've probably noticed...' phrasing\n- Humble expertise presentation"`;

    const result = await model.generateContent(prompt);
    const analysis = result.response.text();
    
    return new Response(JSON.stringify({ analysis }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in generate-linkedin-analysis:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});
