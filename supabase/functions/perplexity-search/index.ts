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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { query, projectId } = await req.json()
    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // TODO: Add Redis caching here

    const requestBody = {
      model: 'sonar-medium-online',
      messages: [
        { role: 'system', content: 'You are an AI assistant that provides concise and accurate answers.' },
        { role: 'user', content: query },
      ],
    }

    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('PERPLEXITY_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!perplexityResponse.ok) {
      const errorBody = await perplexityResponse.text()
      console.error(`Perplexity API error: ${errorBody}`)
      return new Response(JSON.stringify({ error: `Perplexity API request failed with status ${perplexityResponse.status}` }), {
        status: perplexityResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const responseData = await perplexityResponse.json()

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
