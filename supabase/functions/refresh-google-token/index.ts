import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RefreshTokenRequest {
  accountId: string;
}

interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
  scope?: string;
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid or expired token');
    }

    // Parse request body
    const { accountId }: RefreshTokenRequest = await req.json();

    if (!accountId) {
      throw new Error('Missing required parameter: accountId');
    }

    // Get the Google account from database
    const { data: googleAccount, error: fetchError } = await supabase
      .from('google_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !googleAccount) {
      throw new Error('Google account not found or unauthorized');
    }

    if (!googleAccount.refresh_token) {
      throw new Error('No refresh token available. Please reconnect your Google account.');
    }

    // Get environment variables
    const clientId = Deno.env.get('VITE_GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Refresh the access token
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: googleAccount.refresh_token,
      grant_type: 'refresh_token',
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
      console.error('Token refresh failed:', error);
      
      // If refresh token is invalid, mark account as needing reconnection
      if (tokenResponse.status === 400) {
        await supabase
          .from('google_accounts')
          .update({
            access_token: null,
            token_expiry: null,
            status: 'needs_reconnection',
            updated_at: new Date().toISOString(),
          })
          .eq('id', accountId);
        
        throw new Error('Refresh token expired. Please reconnect your Google account.');
      }
      
      throw new Error(`Token refresh failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
    }

    const tokenData: RefreshTokenResponse = await tokenResponse.json();

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

    // Update the Google account in database
    const { data: updatedAccount, error: updateError } = await supabase
      .from('google_accounts')
      .update({
        access_token: tokenData.access_token,
        token_expiry: expiresAt,
        scopes: tokenData.scope ? tokenData.scope.split(' ') : googleAccount.scopes,
        status: 'active',
        last_used: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating Google account:', updateError);
      throw new Error('Failed to update account with new token');
    }

    // Return updated account data
    return new Response(
      JSON.stringify({
        access_token: tokenData.access_token,
        token_expiry: expiresAt,
        scopes: tokenData.scope ? tokenData.scope.split(' ') : googleAccount.scopes,
        last_used: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error in refresh-google-token:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to refresh Google token',
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