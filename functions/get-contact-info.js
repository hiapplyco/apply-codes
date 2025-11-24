const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

exports.getContactInfo = functions.https.onRequest(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.set(corsHeaders);
    res.status(204).send('');
    return;
  }

  res.set(corsHeaders);

  try {
    // Get user from Authorization header (Firebase Auth)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized - No token provided' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify user with Firebase Auth
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      if (!decodedToken.uid) {
        res.status(401).json({ error: 'Unauthorized - Invalid token' });
        return;
      }
    } catch (authError) {
      console.error('Auth error:', authError);
      res.status(401).json({ error: 'Unauthorized - Invalid token' });
      return;
    }

    const requestData = req.body || {};
    console.log("Get Contact Info request:", JSON.stringify(requestData).substring(0, 200));

    // Validate input
    const { linkedin_url, profileUrl } = requestData;
    const targetUrl = linkedin_url || profileUrl;

    if (!targetUrl) {
      res.status(400).json({
        error: 'linkedin_url or profileUrl is required'
      });
      return;
    }

    // Get contact information from Nymeria
    const contactData = await getContactFromNymeria(targetUrl);

    if (!contactData) {
      res.status(200).json({
        email: null,
        phone: null,
        linkedin: targetUrl,
        work_email: null,
        personal_emails: [],
        mobile_phone: null,
        phone_numbers: [],
        social_profiles: [],
        message: "No contact information found for this profile"
      });
      return;
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

    res.status(200).json(formattedResponse);

  } catch (error) {
    console.error('Error in get-contact-info function:', error);

    const errorMessage = error.message || 'Unknown error';
    const errorResponse = {
      error: errorMessage,
      type: error.constructor?.name || 'Error',
      timestamp: new Date().toISOString()
    };

    // Special handling for common errors
    if (errorMessage.includes('Missing Nymeria API key')) {
      errorResponse.suggestion = 'Please configure NYMERIA_API_KEY in Cloud Functions environment variables';
    }

    console.error('Detailed error:', errorResponse);

    res.status(500).json(errorResponse);
  }
});

async function getContactFromNymeria(profileUrl) {
  console.log(`Getting contact info for: ${profileUrl}`);

  const apiKey = process.env.NYMERIA_API_KEY;
  if (!apiKey) {
    console.error('NYMERIA_API_KEY is not set');
    throw new Error('API configuration error: Missing Nymeria API key');
  }

  const nymeriaUrl = `https://www.nymeria.io/api/v4/person/enrich?profile=${encodeURIComponent(profileUrl)}`;
  console.log('Calling Nymeria API:', nymeriaUrl);

  try {
    const nymeriaResponse = await axios.get(nymeriaUrl, {
      headers: {
        'X-Api-Key': apiKey
      }
    });

    const enrichedData = nymeriaResponse.data;
    console.log('Nymeria contact data retrieved:', Object.keys(enrichedData));

    // Return the raw data for processing
    return enrichedData.data || enrichedData;

  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const errorText = error.response.data;

      console.error('Nymeria API error:', status, errorText);

      // Handle 404 - Profile not found (return null, not an error)
      if (status === 404) {
        console.log('Profile not found in Nymeria database');
        return null;
      }

      // Handle other errors
      if (status === 401) {
        throw new Error('Invalid Nymeria API key');
      } else if (status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      throw new Error(`Nymeria API error: ${status} - ${errorText}`);
    }

    console.error('Error calling Nymeria API:', error);
    throw error;
  }
}