import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai'

interface RequestPayload {
  description: string
  jobTitle?: string
  userId?: string
}

interface BooleanSearchResponse {
  success: boolean
  searchString?: string
  error?: string
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Generate boolean search function called')
    
    const { description, jobTitle, userId } = await req.json() as RequestPayload
    console.log('Request payload:', { hasDescription: !!description, hasJobTitle: !!jobTitle, hasUserId: !!userId })

    if (!description) {
      console.error('Description is missing from request')
      return new Response(
        JSON.stringify({ success: false, error: 'Description is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY environment variable is not set')
      throw new Error('GEMINI_API_KEY is not set')
    }
    console.log('Gemini API key found')

    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `Generate a LinkedIn boolean search string for this job posting. Focus on speed and relevance.

Job Title: ${jobTitle || 'Not specified'}
Description: ${description}

Requirements:
1. Include 3-5 job title variations (use OR)
2. Include key skills and technologies mentioned
3. Add seniority indicators if applicable
4. Use proper Boolean operators (AND, OR, NOT)
5. Enclose phrases in quotes
6. Keep it concise but comprehensive
7. Optimize for LinkedIn search

Return ONLY the boolean search string, no explanation or markdown.`

    console.log('Generating content with Gemini...')
    const result = await model.generateContent(prompt)
    const searchString = result.response.text().trim()
    console.log('Generated search string:', searchString)

    if (!searchString) {
      console.error('Empty search string generated')
      throw new Error('Failed to generate boolean search string')
    }

    if (userId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      await supabase
        .from('search_history')
        .insert({
          user_id: userId,
          query: searchString,
          search_type: 'job_boolean',
          source: 'generate-boolean-search',
          metadata: {
            job_title: jobTitle,
            generated_at: new Date().toISOString()
          }
        })
    }

    const response: BooleanSearchResponse = {
      success: true,
      searchString
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error generating boolean search:', error)
    
    const response: BooleanSearchResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})