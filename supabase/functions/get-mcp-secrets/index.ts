import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as jwt from 'https://deno.land/x/djwt@v2.8/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the token is valid
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verify the JWT token
    try {
      const payload = await jwt.verify(token, Deno.env.get('SUPABASE_JWT_SECRET')!)
      
      // Check if user is authenticated
      if (!payload.sub) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch (error) {
      // If JWT verification fails, check if it's a valid API key
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('api_key', token)
        .single()
      
      if (!profile) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Return encrypted secrets
    const secrets = {
      GOOGLE_CSE_API_KEY: Deno.env.get('GOOGLE_CSE_API_KEY') || '',
      GOOGLE_CSE_ID: Deno.env.get('GOOGLE_CSE_ID') || '',
      PERPLEXITY_API_KEY: Deno.env.get('PERPLEXITY_API_KEY') || '',
      OPENAI_API_KEY: Deno.env.get('OPENAI_API_KEY') || '',
      ANTHROPIC_API_KEY: Deno.env.get('ANTHROPIC_API_KEY') || '',
    }

    // Filter out empty values
    const filteredSecrets = Object.fromEntries(
      Object.entries(secrets).filter(([_, value]) => value !== '')
    )

    return new Response(
      JSON.stringify(filteredSecrets),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=3600' // Cache for 1 hour
        } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})