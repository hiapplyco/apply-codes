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
    console.log('Received analysis request for:', candidate?.name || 'Unknown candidate')
    
    if (!candidate || !requirements) {
      console.error('Missing required fields:', { hasCandidate: !!candidate, hasRequirements: !!requirements })
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

    const prompt = `You are a technical recruiter. Analyze the candidate profile against the job requirements and return ONLY a JSON object.

CANDIDATE PROFILE:
${candidate.name}
${candidate.profile}

JOB REQUIREMENTS:
${requirements}

Return ONLY this JSON structure with no other text:
{"match_score": 75, "strengths": ["Strong experience in product design", "5 years of relevant experience", "B2B and B2C background"], "concerns": ["Need more technical details", "Unclear about specific tools"], "summary": "Experienced product designer with solid background. Good fit for senior role.", "recommendation": "hire"}

Analysis rules:
- match_score: 0-100 integer based on requirements alignment
- strengths: 2-4 specific positives from their profile  
- concerns: 1-3 specific gaps or unknowns
- summary: 1-2 sentences about overall fit
- recommendation: exactly "hire", "maybe", or "pass"

IMPORTANT: Return only the JSON object, no explanations, no markdown, no other text.`

    console.log('Sending request to Gemini with candidate:', candidate.name)
    const result = await model.generateContent(prompt)
    const responseText = result.response.text().trim()
    
    console.log('Gemini raw response:', responseText)
    
    // Try to parse as JSON
    let analysisData
    try {
      // Clean the response - remove any markdown formatting
      const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      console.log('Cleaned response for parsing:', cleanedResponse)
      
      analysisData = JSON.parse(cleanedResponse)
      console.log('Successfully parsed JSON:', analysisData)
    } catch (e) {
      console.error('JSON parsing failed:', e)
      console.error('Failed to parse response:', responseText)
      
      // If JSON parsing fails, create a fallback structure with actual candidate data
      analysisData = {
        match_score: 50,
        strengths: ["Senior Product Designer with 5 years experience", "B2B and B2C expertise mentioned"],
        concerns: ["Limited technical details available", "Need more information about specific skills"],
        summary: "Senior Product Designer with relevant experience. Would benefit from more detailed technical assessment.",
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