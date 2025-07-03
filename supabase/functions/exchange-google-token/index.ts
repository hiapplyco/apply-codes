import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface TokenExchangeRequest {
  code: string;
  redirectUri: string;
  scopes?: string[];
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('Only POST method is allowed');
    }

    // Parse request body
    const { code, redirectUri, scopes = [] }: TokenExchangeRequest = await req.json();

    if (!code || !redirectUri) {
      throw new Error('Missing required parameters: code and redirectUri');
    }

    // Get environment variables
    const clientId = Deno.env.get('VITE_GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Exchange authorization code for tokens
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const tokenParams = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams,
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
    }

    const tokenData: TokenResponse = await tokenResponse.json();

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

    // Return token data
    return new Response(
      JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        scope: tokenData.scope,
        token_type: tokenData.token_type,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error in exchange-google-token:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to exchange authorization code for tokens',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});