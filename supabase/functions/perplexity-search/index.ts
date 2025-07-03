import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

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
      return new Response(JSON.stringify({ error: 'Unauthorized - No user found' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if PERPLEXITY_API_KEY is available
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY')
    if (!perplexityApiKey) {
      console.error('PERPLEXITY_API_KEY environment variable is not set')
      return new Response(JSON.stringify({ error: 'Perplexity API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let requestBody
    try {
      requestBody = await req.json()
      console.log('Request body received:', requestBody)
    } catch (error) {
      console.error('Failed to parse JSON:', error)
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        details: error.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    const { query, projectId } = requestBody
    if (!query || typeof query !== 'string' || query.trim() === '') {
      console.log('Invalid query:', { query, type: typeof query, requestBody })
      return new Response(JSON.stringify({ 
        error: 'Query is required and must be a non-empty string',
        received: { query, type: typeof query, fullBody: requestBody }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // TODO: Add Redis caching here

    const perplexityRequestBody = {
      model: 'sonar',
      messages: [
        { role: 'system', content: 'Be precise and concise.' },
        { role: 'user', content: query },
      ],
    }

    console.log('Sending request to Perplexity:', perplexityRequestBody)

    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${perplexityApiKey}`,
      },
      body: JSON.stringify(perplexityRequestBody),
    })

    console.log('Perplexity response status:', perplexityResponse.status)
    
    if (!perplexityResponse.ok) {
      const errorBody = await perplexityResponse.text()
      console.error(`Perplexity API error (${perplexityResponse.status}):`, errorBody)
      return new Response(JSON.stringify({ 
        error: `Perplexity API request failed with status ${perplexityResponse.status}`,
        details: errorBody,
        perplexityStatus: perplexityResponse.status
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const responseData = await perplexityResponse.json()
    console.log('Perplexity response data:', JSON.stringify(responseData, null, 2))

    // Store search result in database
    try {
      const { data: searchRecord, error: insertError } = await supabase
        .from('searches')
        .insert([
          {
            user_id: user.id,
            project_id: projectId,
            query: query,
            perplexity_response: responseData,
            answer_text: responseData.choices[0].message.content,
          },
        ])
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting search record:', insertError)
        // Do not block the user, just log the error
      }

      // Return response with search record ID for reference
      return new Response(JSON.stringify({
        ...responseData,
        searchId: searchRecord?.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      // Return original response even if DB insert fails
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (error) {
    console.error('Error in perplexity-search function:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
