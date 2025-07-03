import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get user authentication
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

    const requestData = await req.json();
    console.log("Get Contact Info request:", JSON.stringify(requestData).substring(0, 200));
    
    // Validate input
    const { linkedin_url, profileUrl } = requestData;
    const targetUrl = linkedin_url || profileUrl;
    
    if (!targetUrl) {
      return new Response(JSON.stringify({ 
        error: 'linkedin_url or profileUrl is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get contact information from Nymeria
    const contactData = await getContactFromNymeria(targetUrl);
    
    if (!contactData) {
      return new Response(JSON.stringify({
        email: null,
        phone: null,
        linkedin: targetUrl,
        work_email: null,
        personal_emails: [],
        mobile_phone: null,
        phone_numbers: [],
        social_profiles: [],
        message: "No contact information found for this profile"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Format response to match expected ContactInfo interface
    const formattedResponse = {
      email: contactData.work_email || contactData.emails?.[0] || null,
      phone: contactData.mobile_phone || contactData.phone_numbers?.[0] || null,
      linkedin: targetUrl,
      work_email: contactData.work_email || null,
      personal_emails: contactData.personal_emails || [],
      mobile_phone: contactData.mobile_phone || null,
      phone_numbers: contactData.phone_numbers || [],
      social_profiles: contactData.social_profiles || contactData.profiles || [],
      twitter_url: contactData.twitter_url || null,
      github_url: contactData.github_url || null,
      website: contactData.website || null,
      enriched: true,
      message: "Contact information retrieved successfully"
    };

    return new Response(JSON.stringify(formattedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in get-contact-info function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = {
      error: errorMessage,
      type: error.constructor.name,
      timestamp: new Date().toISOString()
    };
    
    // Special handling for common errors
    if (errorMessage.includes('Missing Nymeria API key')) {
      errorResponse.suggestion = 'Please configure NYMERIA_API_KEY in Supabase Edge Functions environment variables';
    }
    
    console.error('Detailed error:', errorResponse);
    
    return new Response(JSON.stringify(errorResponse), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function getContactFromNymeria(profileUrl: string) {
  console.log(`Getting contact info for: ${profileUrl}`);
  
  const apiKey = Deno.env.get('NYMERIA_API_KEY');
  if (!apiKey) {
    console.error('NYMERIA_API_KEY is not set');
    throw new Error('API configuration error: Missing Nymeria API key');
  }
  
  const nymeriaUrl = `https://www.nymeria.io/api/v4/person/enrich?profile=${encodeURIComponent(profileUrl)}`;
  console.log('Calling Nymeria API:', nymeriaUrl);
  
  try {
    const nymeriaResponse = await fetch(nymeriaUrl, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey
      }
    });
    
    if (!nymeriaResponse.ok) {
      const errorText = await nymeriaResponse.text();
      console.error('Nymeria API error:', nymeriaResponse.status, errorText);
      
      // Handle 404 - Profile not found (return null, not an error)
      if (nymeriaResponse.status === 404) {
        console.log('Profile not found in Nymeria database');
        return null;
      }
      
      // Handle other errors
      if (nymeriaResponse.status === 401) {
        throw new Error('Invalid Nymeria API key');
      } else if (nymeriaResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      throw new Error(`Nymeria API error: ${nymeriaResponse.status} - ${errorText}`);
    }
    
    const enrichedData = await nymeriaResponse.json();
    console.log('Nymeria contact data retrieved:', Object.keys(enrichedData));
    
    // Return the raw data for processing
    return enrichedData.data || enrichedData;
    
  } catch (error) {
    console.error('Error calling Nymeria API:', error);
    throw error;
  }
}