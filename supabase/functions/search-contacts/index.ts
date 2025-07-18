import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { searchParams } = await req.json();
    console.log("Search params:", searchParams);
    
    // Validate that we have at least one search parameter
    const validSearchParams = ['first_name', 'last_name', 'location', 'country', 'industry', 'title', 'company'];
    const hasValidParam = validSearchParams.some(param => searchParams[param]);
    
    if (!hasValidParam) {
      throw new Error('At least one search parameter is required (first_name, last_name, location, country, industry, title, or company)');
    }
    
    // Get API key
    const apiKey = Deno.env.get('NYMERIA_API_KEY');
    if (!apiKey) {
      console.error('NYMERIA_API_KEY is not set');
      throw new Error('API configuration error: Missing Nymeria API key');
    }
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    // Add search parameters
    validSearchParams.forEach(param => {
      if (searchParams[param]) {
        queryParams.append(param, searchParams[param]);
      }
    });
    
    // Add pagination parameters
    if (searchParams.limit) {
      queryParams.append('limit', Math.min(25, Math.max(1, searchParams.limit)).toString());
    } else {
      queryParams.append('limit', '25'); // Increased default limit to maximum allowed by Nymeria
    }
    
    if (searchParams.offset) {
      queryParams.append('offset', Math.min(9999, Math.max(0, searchParams.offset)).toString());
    }
    
    const nymeriaUrl = `https://www.nymeria.io/api/v4/person/search?${queryParams.toString()}`;
    console.log('Calling Nymeria Search API:', nymeriaUrl);
    
    // Call Nymeria Person Search API
    const nymeriaResponse = await fetch(nymeriaUrl, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey
      }
    });
    
    if (!nymeriaResponse.ok) {
      const errorText = await nymeriaResponse.text();
      console.error('Nymeria API error:', nymeriaResponse.status, errorText);
      
      if (nymeriaResponse.status === 401) {
        throw new Error('Invalid Nymeria API key. Please check your configuration.');
      } else if (nymeriaResponse.status === 404) {
        // No results found - return empty array instead of error
        return new Response(
          JSON.stringify({
            data: [],
            total: 0,
            meta: searchParams
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (nymeriaResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      throw new Error(`Nymeria API error: ${nymeriaResponse.status} - ${errorText}`);
    }
    
    const searchData = await nymeriaResponse.json();
    console.log(`Found ${searchData.total} results`);
    
    // Transform the response to ensure consistent format
    const transformedData = {
      data: searchData.data.map(person => ({
        uuid: person.uuid,
        name: `${person.first_name} ${person.last_name}`.trim(),
        first_name: person.first_name,
        last_name: person.last_name,
        location: person.location,
        country: person.country,
        job_title: person.job_title,
        company: person.job_company_name,
        industry: person.industry,
        // Contact information
        work_email: person.work_email,
        personal_emails: person.personal_emails || [],
        mobile_phone: person.mobile_phone,
        // Social profiles
        linkedin_username: person.linkedin_username,
        linkedin_url: person.linkedin_username ? `https://linkedin.com/in/${person.linkedin_username}` : null,
        // Summary for display
        hasContactInfo: !!(person.work_email || person.personal_emails?.length || person.mobile_phone)
      })),
      total: searchData.total,
      meta: searchData.meta,
      credits_used: nymeriaResponse.headers.get('X-Call-Credits-Spent'),
      credits_remaining: nymeriaResponse.headers.get('X-Total-Limit-Remaining')
    };
    
    return new Response(
      JSON.stringify(transformedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = {
      error: errorMessage,
      type: error.constructor.name,
      timestamp: new Date().toISOString()
    };
    
    return new Response(
      JSON.stringify(errorDetails),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});