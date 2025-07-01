
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildAnalysisPrompt(input: string, hasUrl: boolean) {
  const baseExperts = [
    '- Technical Architect: "Core components/implementation challenges..."',
    '- Industry Analyst: "Adoption trends/success-failure case studies..."',
    '- Ethics Specialist: "Regulatory risks/ethical failure points..."',
    '- Solutions Engineer: "Technical specifications/architecture..."',
    '- UX Strategist: "User adoption barriers/engagement strategies..."'
  ];

  // Add Website LinkedIn Agent if URL is provided
  if (hasUrl) {
    baseExperts.unshift('- Website LinkedIn Agent: "Analyzing website content alignment with LinkedIn audience expectations, identifying key themes and messaging opportunities, suggesting content optimization strategies for maximum LinkedIn engagement..."');
  }

  return `Act as ${hasUrl ? '6' : '5'} experts + Devil's Advocate analyzing "${input}":
1. [MoE Phase]
${baseExperts.join('\n')}
2. [Devil's Advocate Phase]
- Critic: "Fundamental flaws in these approaches... Overlooked threats..."
3. [CoT Resolution]
- Lead Architect: "Address criticisms through:\\n- Flaw mitigation 1...\\n- Threat workaround 2..."
- Final hybrid solution balancing innovation/safety
4. [Voice Synthesis]
- Tone Engineer: "Natural communication using:\\n- Relatable analogies\\n- Personal anecdotes\\n- 'You've probably noticed...' phrasing\\n- Humble expertise presentation"`;
}

function buildPostPrompt(analysis: string) {
  return `Generate final LinkedIn post FROM THIS CONTEXT:\n${analysis}\n
  STRICT REQUIREMENTS:
  - Natural voice matching James's style
  - No markdown/formatting
  - Preserve ending hashtags
  - Max 5 sentences/paragraph
  - Include:\n   * Personal anecdote\n   * Devil's Advocate thought\n   * Actionable tip\n   * Humble conclusion`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { content, link } = await req.json();
    
    if (!content?.trim()) {
      throw new Error('Content is required');
    }

    // Get API key from environment variables
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    
    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    });
    
    console.log('Generating expert analysis...');
    
    // Step 1: Generate expert analysis with dynamic prompt based on URL presence
    const analysisPrompt = buildAnalysisPrompt(content, Boolean(link));
    const analysisResult = await model.generateContent([
      {
        text: analysisPrompt,
      }
    ]);
    
    const analysis = analysisResult.response.text();
    console.log('Analysis generated successfully');
    
    // Step 2: Generate LinkedIn post
    console.log('Generating final LinkedIn post...');
    const postPrompt = buildPostPrompt(analysis);
    let finalPrompt = postPrompt;
    
    // Add link if provided
    if (link) {
      finalPrompt += `\nInclude this link: ${link}`;
    }
    
    const postResult = await model.generateContent([
      {
        text: finalPrompt,
      }
    ]);
    
    // Process response - remove prefixes like "Sure", "Here's", etc.
    const post = postResult.response.text()
      .replace(/^(Sure|Here's|I'll|Let me|Certainly|Of course)[^]*?(?=\n|$)/i, '')
      .trim();
    
    console.log('LinkedIn post generated successfully');
    
    return new Response(JSON.stringify({ post, analysis }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in LinkedIn post generator:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});
