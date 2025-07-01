

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const interviewFrameworks: Record<string, {name: string, tooltip: string}> = {
  'star': {
    name: 'STAR Method',
    tooltip:
      'Situation, Task, Action, Result. Used to assess past behavior and predict future performance by asking candidates to describe specific examples of their experiences.',
  },
  'behavioral': {
    name: 'Behavioral',
    tooltip:
      'Focuses on past behaviors to predict future performance. Questions often start with "Tell me about a time when..."',
  },
  'technical': {
    name: 'Technical',
    tooltip:
      'Evaluates a candidate\'s technical skills and knowledge. Can include coding challenges, system design questions, or theoretical concepts.',
  },
  'case-study': {
    name: 'Case Study',
    tooltip:
      'Presents business problems or analytical challenges to assess problem-solving skills, analytical thinking, and business acumen.',
  },
  'cultural-fit': {
    name: 'Cultural Fit',
    tooltip:
      'Assesses alignment with company values, team dynamics, and organizational culture to ensure a good match.',
  },
  'panel': {
    name: 'Panel Interview',
    tooltip:
      'Multiple interviewers assess the candidate simultaneously, providing diverse perspectives and comprehensive evaluation.',
  },
  'screening': {
    name: 'Phone/Video Screening',
    tooltip:
      'Initial assessment to evaluate basic qualifications, communication skills, and interest in the position.',
  },
  'executive': {
    name: 'Executive Interview',
    tooltip:
      'Focuses on leadership capabilities, strategic thinking, vision, and ability to drive organizational success.',
  },
  'competency': {
    name: 'Competency-Based',
    tooltip:
      'Evaluates specific skills and competencies required for the role through structured questions and scenarios.',
  },
  'stress': {
    name: 'Stress Interview',
    tooltip:
      'Tests how candidates handle pressure, challenging situations, and unexpected questions to assess resilience.',
  },
  'group': {
    name: 'Group Interview',
    tooltip:
      'Multiple candidates are interviewed together to assess teamwork, leadership, and how they interact with others.',
  },
  'custom': {
    name: 'Custom Framework',
    tooltip:
      'Create your own interview structure tailored to your specific needs and evaluation criteria.',
  },
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { context, interviewType } = await req.json();

    if (!context || !interviewType) {
      return new Response(
        JSON.stringify({ error: 'Missing context or interviewType' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const framework = interviewFrameworks[interviewType];

    if (!framework) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid interviewType: ${interviewType}. Valid types are: ${Object.keys(interviewFrameworks).join(', ')}` 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const prompt = `
      Based on the following context:
      ---
      ${context}
      ---
      Generate a set of 5-7 interview questions for a ${framework.name} interview.
      For each question, provide a brief explanation of what it assesses.
      You must return only valid JSON with no additional text or formatting.
      Return the response as a JSON object with the following structure:
      {
        "interviewType": "${framework.name}",
        "tooltip": "${framework.tooltip}",
        "questions": [
          {
            "question": "The generated question",
            "assesses": "What the question is designed to assess"
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    // Clean the response to ensure it's valid JSON
    let cleanedText = text.trim();
    
    // Remove markdown code blocks if present
    if (cleanedText.includes('```')) {
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    }
    
    // Try to extract JSON if it's embedded in other text
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }

    // Validate that the cleaned text is parsable JSON
    const parsedResponse = JSON.parse(cleanedText);

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in prepare-interview function:', error);
    
    // Determine error message
    let errorMessage = 'Failed to generate interview questions';
    if (error instanceof SyntaxError) {
      errorMessage = 'Failed to parse AI response. Please try again.';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.toString() : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);

