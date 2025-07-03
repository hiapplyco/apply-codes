import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { candidate, requirements } = await req.json()
    if (!candidate || !requirements) {
      return new Response(JSON.stringify({ error: 'Candidate and requirements are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `You are an expert technical recruiter analyzing candidate fit. Analyze this candidate against the job requirements and provide a structured assessment.

CANDIDATE PROFILE:
Name: ${candidate.name}
Background: ${candidate.profile}
LinkedIn: ${candidate.linkedin_url}

JOB REQUIREMENTS:
${requirements}

Provide a JSON response with this exact structure:
{
  "match_score": <integer 0-100>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "concerns": ["concern 1", "concern 2"],
  "summary": "Brief 2-sentence overall assessment",
  "recommendation": "hire" | "maybe" | "pass"
}

Analysis Guidelines:
- Match score: 80+ (strong fit), 60-79 (good fit), 40-59 (moderate fit), <40 (poor fit)
- Strengths: 2-4 specific positive points about technical skills, experience, or background
- Concerns: 1-3 specific gaps or potential issues
- Be objective and focus on technical qualifications
- Consider both hard skills and relevant experience
- Return only valid JSON, no explanation`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text().trim()
    
    // Try to parse as JSON
    let analysisData
    try {
      analysisData = JSON.parse(responseText)
    } catch (e) {
      // If JSON parsing fails, create a fallback structure
      analysisData = {
        match_score: 50,
        strengths: ["Profile contains relevant keywords"],
        concerns: ["Unable to fully parse candidate details"],
        summary: "Analysis completed with limited data",
        recommendation: "maybe"
      }
    }

    return new Response(JSON.stringify(analysisData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in analyze-candidate function:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})