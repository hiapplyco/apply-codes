
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

async function generateWithRetry(model: any, prompt: string, retryCount = 0): Promise<string> {
  try {
    console.log(`Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error(`Error on attempt ${retryCount + 1}:`, error);
    
    // Check if error is due to service overload
    if (error.message?.includes('503 Service Unavailable') && retryCount < MAX_RETRIES - 1) {
      const delayTime = INITIAL_RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
      console.log(`Retrying in ${delayTime}ms...`);
      await delay(delayTime);
      return generateWithRetry(model, prompt, retryCount + 1);
    }
    
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();
    console.log('Enhancing job description:', content?.substring(0, 100) + '...');

    if (!content) {
      throw new Error('No content provided');
    }

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `As an experienced Talent Acquisition specialist, enhance this job description using clear headers and emphasis on key points that will attract top talent. Create a comprehensive, well-structured description that highlights:

🏢 Company Impact & Culture
- Mission & Vision
- Company Culture
- Growth Trajectory
- Innovation Focus

💫 Role Overview & Impact
- Position Impact
- Key Objectives
- Team Context
- Strategic Value

📋 Essential Qualifications
- Technical Expertise
- Experience Level
- Industry Knowledge
- Core Competencies
- Soft Skills

🌟 Preferred Qualifications
- Advanced Skills
- Additional Experience
- Industry Insights
- Leadership Abilities
- Certifications

📈 Growth & Development
- Career Progression
- Professional Development
- Mentorship
- Training Programs
- Innovation Opportunities

🎯 Success Metrics & Expectations
- First 90 Days
- Key Responsibilities
- Performance Indicators
- Team Collaboration
- Strategic Goals

🤝 Work Environment & Culture
- Team Structure
- Collaboration Style
- Work Arrangement
- Company Values
- Innovation Culture

📊 Impact & Outcomes
- Business Impact
- Team Influence
- Growth Potential
- Innovation Scope
- Success Metrics

🌈 Diversity & Inclusion
- Inclusive Culture
- Equal Opportunity
- Support Systems
- Accessibility

🎁 Benefits & Perks Highlights
- Health & Wellness
- Work-Life Balance
- Professional Growth
- Additional Perks

🚀 Next Steps & Application
- Application Process
- Timeline
- Contact Details
- Required Materials

Format the content to be:
- Engaging and scannable
- Clear and concise
- Action-oriented
- Value-focused
- Achievement-centered

Use:
- Bold for emphasis on key terms
- Bullet points for easy scanning
- Emojis for visual engagement
- Active voice and strong verbs

Highlight:
- Unique opportunities
- Growth potential
- Company culture
- Innovation focus
- Impact potential

Original job description: ${content}`;

    console.log('Using prompt for job description enhancement');
    
    const enhancedDescription = await generateWithRetry(model, prompt);
    console.log('Enhanced description generated successfully');
    
    return new Response(
      JSON.stringify({ enhancedDescription }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Error in enhance-job-description:', error);
    
    // Create a user-friendly error message
    const userMessage = error.message?.includes('503 Service Unavailable')
      ? "The AI service is temporarily unavailable. We tried multiple times but couldn't get a response. Please try again in a few minutes."
      : "There was an error enhancing the job description. Please try again.";
    
    return new Response(
      JSON.stringify({ 
        error: userMessage,
        details: error.stack 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
