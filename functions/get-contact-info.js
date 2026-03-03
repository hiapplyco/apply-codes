const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.getContactInfo = onCall({}, async (request) => {
  const { data, auth } = request;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    const requestData = data || {};
    logger.info("Get Contact Info request", { url: (requestData.linkedin_url || requestData.profileUrl || '').substring(0, 100) });

    // Validate input
    const { linkedin_url, profileUrl } = requestData;
    const targetUrl = linkedin_url || profileUrl;

    if (!targetUrl) {
      throw new HttpsError('invalid-argument', 'linkedin_url or profileUrl is required');
    }

    // Get contact information from Nymeria
    const contactData = await getContactFromNymeria(targetUrl);

    if (!contactData) {
      return {
        email: null,
        phone: null,
        linkedin: targetUrl,
        work_email: null,
        personal_emails: [],
        mobile_phone: null,
        phone_numbers: [],
        social_profiles: [],
        message: "No contact information found for this profile"
      };
    }

    // Format response to match expected ContactInfo interface
    return {
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

  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error('Error in get-contact-info function:', error);

    const errorMessage = error.message || 'Unknown error';

    // Special handling for common errors
    if (errorMessage.includes('Missing Nymeria API key')) {
      throw new HttpsError('unavailable', 'Please configure NYMERIA_API_KEY in Cloud Functions environment variables');
    }

    throw new HttpsError('internal', errorMessage);
  }
});

async function getContactFromNymeria(profileUrl) {
  logger.info('Getting contact info', { profileUrl: profileUrl.substring(0, 80) });

  // Check cache first
  const db = admin.firestore();
  try {
    const cacheQuery = await db.collection('enrichment_cache')
      .where('cache_key', '==', profileUrl)
      .where('created_at', '>', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // 30-day cache
      .limit(1)
      .get();

    if (!cacheQuery.empty) {
      const cached = cacheQuery.docs[0].data();
      logger.info('Returning cached contact data for:', profileUrl.substring(0, 80));
      return cached.data;
    }
  } catch (cacheErr) {
    logger.error('Cache lookup failed, proceeding with API call:', cacheErr);
  }

  const apiKey = process.env.NYMERIA_API_KEY;
  if (!apiKey) {
    logger.error('NYMERIA_API_KEY is not set');
    throw new Error('API configuration error: Missing Nymeria API key');
  }

  const nymeriaUrl = `https://www.nymeria.io/api/v4/person/enrich?profile=${encodeURIComponent(profileUrl)}`;
  logger.info('Calling Nymeria API');

  try {
    const nymeriaResponse = await axios.get(nymeriaUrl, {
      headers: {
        'X-Api-Key': apiKey
      },
      timeout: 30000 // 30 second timeout
    });

    const enrichedData = nymeriaResponse.data;
    logger.info('Nymeria contact data retrieved', { keys: Object.keys(enrichedData) });

    const resultData = enrichedData.data || enrichedData;

    // Cache the result
    try {
      await db.collection('enrichment_cache').add({
        cache_key: profileUrl,
        data: resultData,
        provider: 'nymeria',
        created_at: admin.firestore.Timestamp.now()
      });
    } catch (cacheErr) {
      logger.error('Failed to cache enrichment result:', cacheErr);
    }

    return resultData;

  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const errorText = error.response.data;

      logger.error('Nymeria API error:', status, errorText);

      // Handle 404 - Profile not found (return null, not an error)
      if (status === 404) {
        logger.info('Profile not found in Nymeria database');
        return null;
      }

      // Handle other errors
      if (status === 401) {
        throw new Error('Invalid Nymeria API key');
      } else if (status === 402) {
        throw new Error('Nymeria API credits exhausted. Please check your plan.');
      } else if (status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      throw new Error(`Nymeria API error: ${status} - ${errorText}`);
    }

    // Handle timeout
    if (error.code === 'ECONNABORTED') {
      throw new Error('Nymeria API request timed out. Please try again.');
    }

    logger.error('Error calling Nymeria API:', error);
    throw error;
  }
}
