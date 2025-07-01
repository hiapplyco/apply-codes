
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
    const { content } = await req.json();
    console.log('Summarizing job content:', content?.substring(0, 100) + '...');

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `As a senior Talent Acquisition professional, create a compelling and comprehensive summary of this job description using clear markdown formatting. Focus on the key aspects that would most interest potential candidates:

# 📝 Comprehensive Job Summary

## 🎯 Position Overview
- **Role:** *[Specific job title and level]*
- **Industry:** *[Business sector/domain]*
- **Location:** *[Work arrangement - remote/hybrid/onsite]*
- **Company Type:** *[Size, stage, market position]*

## 💫 Key Responsibilities & Impact
- **Primary Focus:** *[Main objective and purpose]*
- **Core Duties:** *[3-4 key responsibilities]*
- **Strategic Impact:** *[How role affects business]*
- **Team Context:** *[Reporting structure & collaboration]*

## 🎓 Required Qualifications
- **Technical Skills:** *[Critical technical requirements]*
- **Experience Level:** *[Years and type of experience]*
- **Education:** *[Required degrees/certifications]*
- **Industry Knowledge:** *[Sector expertise needed]*

## 🌟 Key Competencies
- **Technical Expertise:** *[Specific tools/technologies]*
- **Soft Skills:** *[Critical interpersonal abilities]*
- **Leadership:** *[Management/mentoring requirements]*
- **Communication:** *[Important communication skills]*

## 📈 Growth & Opportunity
- **Career Path:** *[Progression opportunities]*
- **Learning:** *[Development resources]*
- **Impact:** *[Ability to influence outcomes]*
- **Innovation:** *[Opportunity to drive change]*

## 🎁 Package Highlights
- **Compensation:** *[Salary range if provided]*
- **Benefits:** *[Key benefits overview]*
- **Perks:** *[Notable additional benefits]*
- **Work Style:** *[Flexibility/arrangements]*

Format the content to be engaging and concise, using:
- Bold for categories and key terms
- Italic for supporting details
- Bullet points for clear organization
- Emojis for visual engagement

Focus on what would most interest potential candidates, including:
- Role impact and growth potential
- Key responsibilities and expectations
- Required skills and experience
- Company culture and benefits
- Career development opportunities

Job description: ${content}`;

    console.log('Using prompt for job summary:', prompt);
    const result = await model.generateContent(prompt);
    const summary = result.response.text();
    console.log('Job summary generated successfully');
    
    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in summarize-job:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
