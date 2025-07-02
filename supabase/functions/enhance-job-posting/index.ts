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
    const { content, jobId } = await req.json();
    console.log("Enhancing job posting for job ID:", jobId);

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert recruiter and copywriter. Take the following job information and create a comprehensive, professional job posting that will attract top talent.

Input: ${content}

Create a complete job posting with the following sections:
1. Job Title (clear and searchable)
2. Company Overview (brief, compelling description)
3. Role Summary (2-3 sentences explaining the position)
4. Key Responsibilities (5-8 bullet points)
5. Required Qualifications (education, experience, skills)
6. Preferred Qualifications (nice-to-haves)
7. What We Offer (benefits, perks, growth opportunities)
8. How to Apply (clear next steps)

Format the output as HTML with proper headings (h2, h3), paragraphs, and lists (ul, li). Make it engaging, clear, and professional. Include relevant keywords for SEO.`;

    const result = await model.generateContent(prompt);
    const enhancedContent = result.response.text();
    
    console.log("Job posting enhanced successfully");
    
    return new Response(JSON.stringify({ 
      success: true,
      content: enhancedContent,
      jobId: jobId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error in enhance-job-posting function:", error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: "Failed to enhance job posting", 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});