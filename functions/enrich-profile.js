const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.enrichProfile = functions
  .https.onCall(async (data, context) => {
    console.log('Enrich profile function called');

    try {
      // Check if this is a profile enrichment or a person search request
      if (data.profileUrl || data.profileId) {
        // Profile enrichment
        return await handleProfileEnrichment(data, context);
      } else if (data.searchParams) {
        // Person search
        return await handlePersonSearch(data.searchParams, context);
      } else {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Either profileUrl/profileId or searchParams is required'
        );
      }
    } catch (error) {
      console.error('Error processing request:', error);

      // Special handling for missing API key
      if (error.message?.includes('API key')) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'API configuration error. Please check server configuration.'
        );
      }

      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to enrich profile',
        {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      );
    }
  });

async function handleProfileEnrichment(requestData, context) {
  const { profileUrl, profileId } = requestData;

  if (!profileUrl && !profileId) {
    throw new Error('Either profileUrl or profileId is required for profile enrichment');
  }

  console.log(`Enriching profile: ${profileUrl || profileId}`);

  // Get Nymeria API key from environment
  const apiKey = functions.config().nymeria?.api_key || process.env.NYMERIA_API_KEY;

  if (!apiKey) {
    console.error('NYMERIA_API_KEY is not configured');
    throw new Error('API configuration error: Missing Nymeria API key');
  }

  const nymeriaUrl = `https://www.nymeria.io/api/v4/person/enrich?${
    profileUrl ? `profile=${encodeURIComponent(profileUrl)}` : `lid=${profileId}`
  }`;
  console.log('Calling Nymeria API:', nymeriaUrl);

  try {
    // Call Nymeria Person Enrich API
    const nymeriaResponse = await axios.get(nymeriaUrl, {
      headers: {
        'X-Api-Key': apiKey
      }
    });

    const enrichedData = nymeriaResponse.data;
    console.log('Nymeria API returned data:', JSON.stringify(enrichedData).substring(0, 500) + '...');

    // Optionally log to Firestore
    if (context && context.auth) {
      try {
        const db = admin.firestore();
        await db.collection('enrichment_logs').add({
          action_type: 'profile_enrichment',
          profile_url: profileUrl || profileId,
          user_id: context.auth.uid,
          status: 'success',
          created_at: admin.firestore.Timestamp.now()
        });
      } catch (logError) {
        console.error('Error logging enrichment action:', logError);
        // Don't fail the main operation
      }
    }

    // Return the enriched data with success indicator
    return {
      success: true,
      data: enrichedData,
      message: 'Profile enriched successfully'
    };

  } catch (error) {
    // Handle axios errors
    if (error.response) {
      const status = error.response.status;
      const errorText = error.response.data;
      console.error('Nymeria API error:', status, errorText);

      // Handle 404 - Profile not found (this is normal, not an error)
      if (status === 404) {
        console.log('Profile not found in Nymeria database - returning no data response');
        return {
          success: true,
          data: null,
          message: 'Profile not found in contact database',
          profileUrl: profileUrl || profileId
        };
      }

      // Handle other common error cases
      if (status === 401) {
        throw new Error('Invalid Nymeria API key. Please check your configuration.');
      } else if (status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      throw new Error(`Nymeria API error: ${status} - ${JSON.stringify(errorText)}`);
    } else {
      throw error;
    }
  }
}

async function handlePersonSearch(searchParams, context) {
  console.log(`Searching for person with params:`, searchParams);

  // Get Nymeria API key from environment
  const apiKey = functions.config().nymeria?.api_key || process.env.NYMERIA_API_KEY;

  if (!apiKey) {
    throw new Error('API configuration error: Missing Nymeria API key');
  }

  // Construct query string from search parameters
  const queryParams = new URLSearchParams();

  // Add all valid search params
  const validParams = [
    'first_name', 'last_name', 'name', 'title', 'company',
    'industry', 'location', 'country', 'filter', 'require',
    'limit', 'offset'
  ];

  validParams.forEach(param => {
    if (searchParams[param]) {
      queryParams.append(param, searchParams[param]);
    }
  });

  // Set default limit if not provided
  if (!searchParams.limit) {
    queryParams.append('limit', '10');
  }

  const nymeriaSearchUrl = `https://www.nymeria.io/api/v4/person/search?${queryParams.toString()}`;
  console.log(`Making request to: ${nymeriaSearchUrl}`);

  try {
    // Call Nymeria Person Search API
    const nymeriaResponse = await axios.get(nymeriaSearchUrl, {
      headers: {
        'X-Api-Key': apiKey
      }
    });

    const searchData = nymeriaResponse.data;

    // Return the search results
    return {
      success: true,
      data: searchData,
      message: 'Search completed successfully'
    };

  } catch (error) {
    // Handle axios errors
    if (error.response) {
      const status = error.response.status;
      const errorText = error.response.data;
      console.error('Nymeria API error:', errorText);

      if (status === 401) {
        throw new Error('Invalid Nymeria API key');
      } else if (status === 429) {
        throw new Error('Rate limit exceeded');
      }

      throw new Error(`Failed to search for person: ${status}`);
    } else {
      throw error;
    }
  }
}