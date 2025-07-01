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
    console.log('Received content:', content?.substring(0, 100) + '...');

    if (!content || content.trim().length === 0) {
      console.log('Empty content received, returning empty arrays');
      return new Response(
        JSON.stringify({ 
          skills: [], 
          titles: [], 
          keywords: [] 
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Extract and categorize key terms from this job description into specific categories. Format your response EXACTLY as a JSON object with these arrays:

{
  "skills": ["skill1", "skill2"],
  "titles": ["title1", "title2"],
  "keywords": ["keyword1", "keyword2"]
}

Guidelines for skills extraction:
- Include ONLY concrete, specific technical skills, tools, and technologies
- Exclude generic terms like "experience", "knowledge", "critical thinking", or "decision making"
- Keep each skill concise (1-3 words maximum)
- Include 3-7 most relevant skills
- Format consistently (e.g., "Medical Billing" not "medical billing")
- DO NOT include soft skills or generic competencies

Guidelines for titles:
- Include 2-5 relevant job titles
- Format consistently with proper capitalization
- Include variations and similar roles

Guidelines for keywords:
- Include 3-7 specific industry terms or certifications
- Exclude generic terms
- Focus on concrete, measurable terms

Return ONLY the JSON object, no other text.

Text to analyze: ${content}`;

    console.log('Using prompt for NLP terms extraction:', prompt);
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    console.log('Raw Gemini response:', response);
    
    try {
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const parsedResponse = JSON.parse(cleanedResponse);
      
      // Validate response structure
      if (!Array.isArray(parsedResponse.skills) || 
          !Array.isArray(parsedResponse.titles) || 
          !Array.isArray(parsedResponse.keywords)) {
        throw new Error('Invalid response structure');
      }

      // Clean and validate skills
      parsedResponse.skills = parsedResponse.skills
        .filter(skill => 
          typeof skill === 'string' && 
          skill.trim().length > 0 &&
          skill.split(' ').length <= 3 &&
          !skill.toLowerCase().includes('experience') &&
          !skill.toLowerCase().includes('knowledge') &&
          !skill.toLowerCase().includes('critical thinking') &&
          !skill.toLowerCase().includes('decision making')
        )
        .map(skill => skill.trim());

      console.log('Successfully parsed and validated response:', parsedResponse);
      return new Response(
        JSON.stringify({
          terms: parsedResponse
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Raw response that failed parsing:', response);
      
      return new Response(
        JSON.stringify({
          terms: {
            skills: [],
            titles: [],
            keywords: []
          },
          error: 'Failed to parse terms'
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

  } catch (error) {
    console.error('Error in extract-nlp-terms:', error);
    return new Response(
      JSON.stringify({
        terms: {
          skills: [],
          titles: [],
          keywords: []
        },
        error: error.message
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});