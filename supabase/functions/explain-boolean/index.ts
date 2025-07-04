import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booleanString, requirements } = await req.json();

    if (!booleanString) {
      throw new Error('Boolean string is required');
    }

    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY') || Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Google AI API key not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a Boolean search expert who explains complex search strings in simple, visual terms. Your goal is to help users understand EXACTLY what their search will find.

INPUTS PROVIDED:
- User's original request: ${requirements || 'Not specified'}
- Context source: search
- Generated Boolean string: ${booleanString}

TASK: Create a structured explanation of the Boolean search string that can be rendered with visual hierarchy.

OUTPUT FORMAT (JSON):
{
  "summary": "One-sentence plain English explanation of what this search finds",
  "structure": {
    "primaryTarget": "The main thing we're searching for",
    "breakdown": [
      {
        "component": "Boolean segment",
        "operator": "AND|OR|NOT",
        "meaning": "What this part does",
        "examples": ["Example matches"],
        "visual": "primary|secondary|exclude"
      }
    ]
  },
  "locationLogic": {
    "areas": ["List of locations"],
    "explanation": "Why these locations"
  },
  "exclusions": {
    "terms": ["What we're filtering out"],
    "reason": "Why we exclude these"
  },
  "tips": [
    "Practical tip about the results"
  ]
}

VISUAL HIERARCHY RULES:
- AND components = "primary" (these narrow the search)
- OR components = "secondary" (these expand options)
- NOT components = "exclude" (these filter out)
- Quoted phrases = exact matches (highlight differently)
- Parentheses = grouped concepts (show as containers)

EXPLANATION STYLE:
- Use plain English, no jargon
- Focus on WHAT the search finds, not HOW Boolean works
- Give concrete examples when possible
- Keep each explanation under 15 words
- Make it actionable and practical

Output ONLY the JSON structure. No markdown, no code blocks.`;

    console.log('Generating explanation for:', booleanString.substring(0, 100));
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini response length:', text.length);
    console.log('Response preview:', text.substring(0, 200));
    
    // Extract JSON from the response
    let explanation;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        explanation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      // Fallback to a basic structure matching our interface
      explanation = {
        summary: text.substring(0, 200) || "This search finds candidates based on your criteria",
        structure: {
          primaryTarget: "Candidates matching your requirements",
          breakdown: [{
            component: booleanString.substring(0, 100),
            operator: "AND",
            meaning: "Complete search criteria",
            examples: ["Matching candidates"],
            visual: "primary"
          }]
        },
        locationLogic: {
          areas: [],
          explanation: "No specific location targeting"
        },
        exclusions: {
          terms: [],
          reason: "No specific exclusions applied"
        },
        tips: ["Review and adjust the search as needed", "Try the explanation again for more details"]
      };
    }

    return new Response(JSON.stringify(explanation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error explaining boolean:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});