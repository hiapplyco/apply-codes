import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RevokeTokenRequest {
  accountId: string;
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
    const { accountId }: RevokeTokenRequest = await req.json();

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

    // Revoke the token with Google
    if (googleAccount.access_token) {
      try {
        const revokeUrl = `https://oauth2.googleapis.com/revoke?token=${googleAccount.access_token}`;
        const revokeResponse = await fetch(revokeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        if (!revokeResponse.ok) {
          console.warn('Failed to revoke token with Google:', revokeResponse.status);
          // Continue with database deletion even if revocation fails
        }
      } catch (revokeError) {
        console.warn('Error revoking token with Google:', revokeError);
        // Continue with database deletion even if revocation fails
      }
    }

    // Delete the Google account from database
    const { error: deleteError } = await supabase
      .from('google_accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting Google account:', deleteError);
      throw new Error('Failed to delete Google account');
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Google account disconnected successfully',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error in revoke-google-token:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to revoke Google token',
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