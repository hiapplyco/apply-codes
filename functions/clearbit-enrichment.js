const functions = require('firebase-functions');
const axios = require('axios');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

/**
 * Clearbit Enrichment Cloud Function
 *
 * Enriches company and person data using Clearbit API
 * Supports both email and domain lookups
 *
 * Request formats:
 * 1. Person enrichment: { "email": "user@example.com" }
 * 2. Company enrichment: { "domain": "example.com" }
 * 3. Combined lookup: { "email": "user@example.com", "domain": "example.com" }
 * 4. Prospector search: { "prospector": true, "domain": "example.com", "title": "engineer" }
 */
const clearbitEnrichment = functions.https.onRequest(async (req, res) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.set(corsHeaders);
    res.status(200).send();
    return;
  }

  // Set CORS headers for all responses
  res.set(corsHeaders);

  try {
    const requestData = req.body;
    console.log("Clearbit enrichment request:", JSON.stringify(requestData).substring(0, 200));

    // Validate Clearbit API key
    const clearbitApiKey = process.env.CLEARBIT_API_KEY;
    if (!clearbitApiKey) {
      console.error('CLEARBIT_API_KEY is not set');
      throw new Error('API configuration error: Missing Clearbit API key');
    }

    // Validate authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
    }

    // Verify the token with Supabase-style validation (for compatibility)
    const token = authHeader.substring(7);
    // Note: In a full migration, you'd verify this token with Firebase Auth
    // For now, we'll proceed with basic validation

    // Determine the type of enrichment request
    if (requestData.prospector) {
      return await handleProspectorSearch(requestData, clearbitApiKey, res);
    } else if (requestData.email || requestData.domain) {
      return await handleEnrichment(requestData, clearbitApiKey, res);
    } else {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Either email, domain, or prospector parameters are required'
      });
    }

  } catch (error) {
    console.error('Error processing Clearbit enrichment request:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = {
      error: errorMessage,
      type: error.constructor.name,
      timestamp: new Date().toISOString()
    };

    // Special handling for missing API key
    if (errorMessage.includes('Missing Clearbit API key')) {
      errorDetails.suggestion = 'Please configure CLEARBIT_API_KEY in Firebase Functions environment variables';
    }

    console.error('Detailed error:', errorDetails);

    return res.status(500).json(errorDetails);
  }
});

/**
 * Handle person and company enrichment
 */
async function handleEnrichment(requestData, apiKey, res) {
  const { email, domain } = requestData;
  const results = {};

  try {
    // Person enrichment (if email provided)
    if (email) {
      console.log(`Enriching person data for email: ${email}`);
      const personData = await enrichPerson(email, apiKey);
      results.person = personData;
    }

    // Company enrichment (if domain provided or extracted from email)
    const companyDomain = domain || (email ? email.split('@')[1] : null);
    if (companyDomain) {
      console.log(`Enriching company data for domain: ${companyDomain}`);
      const companyData = await enrichCompany(companyDomain, apiKey);
      results.company = companyData;
    }

    // Log enrichment action for analytics
    await logEnrichmentAction('enrichment', email, domain);

    return res.status(200).json({
      success: true,
      data: results,
      message: 'Enrichment completed successfully',
      enriched_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Enrichment error:', error);

    // Handle Clearbit-specific errors
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      // Handle 404 - Not found (normal case)
      if (status === 404) {
        console.log('Profile/company not found in Clearbit database');
        return res.status(200).json({
          success: true,
          data: null,
          message: 'Profile or company not found in Clearbit database',
          email: email,
          domain: domain
        });
      }

      // Handle 401 - Unauthorized
      if (status === 401) {
        throw new Error('Invalid Clearbit API key. Please check your configuration.');
      }

      // Handle 402 - Payment required
      if (status === 402) {
        throw new Error('Clearbit API quota exceeded. Please upgrade your plan.');
      }

      // Handle 422 - Invalid email/domain
      if (status === 422) {
        throw new Error('Invalid email address or domain format.');
      }

      throw new Error(`Clearbit API error: ${status} - ${JSON.stringify(errorData)}`);
    }

    throw error;
  }
}

/**
 * Handle Clearbit Prospector search for finding leads
 */
async function handleProspectorSearch(requestData, apiKey, res) {
  const { domain, title, role, seniority, limit = 10 } = requestData;

  if (!domain) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Domain is required for prospector search'
    });
  }

  try {
    console.log(`Running Clearbit Prospector search for domain: ${domain}`);

    const prospectorData = await searchProspector({
      domain,
      title,
      role,
      seniority,
      limit
    }, apiKey);

    // Log prospector action
    await logEnrichmentAction('prospector', null, { domain, title, role, seniority });

    return res.status(200).json({
      success: true,
      data: prospectorData,
      message: 'Prospector search completed successfully',
      searched_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Prospector search error:', error);
    throw error;
  }
}

/**
 * Enrich person data using Clearbit Person API
 */
async function enrichPerson(email, apiKey) {
  const url = `https://person.clearbit.com/v2/people/find?email=${encodeURIComponent(email)}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    return response.data;
  } catch (error) {
    console.error('Person enrichment failed:', error.response?.status, error.response?.data);
    throw error;
  }
}

/**
 * Enrich company data using Clearbit Company API
 */
async function enrichCompany(domain, apiKey) {
  const url = `https://company.clearbit.com/v2/companies/find?domain=${encodeURIComponent(domain)}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    return response.data;
  } catch (error) {
    console.error('Company enrichment failed:', error.response?.status, error.response?.data);
    throw error;
  }
}

/**
 * Search for leads using Clearbit Prospector API
 */
async function searchProspector(params, apiKey) {
  const { domain, title, role, seniority, limit } = params;

  // Build query parameters
  const queryParams = new URLSearchParams();
  queryParams.append('domain', domain);

  if (title) queryParams.append('title', title);
  if (role) queryParams.append('role', role);
  if (seniority) queryParams.append('seniority', seniority);
  if (limit) queryParams.append('limit', limit.toString());

  const url = `https://prospector.clearbit.com/v1/people/search?${queryParams.toString()}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 45000 // 45 second timeout for search operations
    });

    return response.data;
  } catch (error) {
    console.error('Prospector search failed:', error.response?.status, error.response?.data);
    throw error;
  }
}

/**
 * Log enrichment actions for analytics and monitoring
 */
async function logEnrichmentAction(actionType, email, domain) {
  try {
    // In a full Firebase migration, this would use Firestore
    // For now, we'll use console logging and could extend to Firestore later
    const logData = {
      action_type: actionType,
      email: email,
      domain: domain,
      timestamp: new Date().toISOString(),
      service: 'clearbit'
    };

    console.log('Enrichment action logged:', JSON.stringify(logData));

    // TODO: Implement Firestore logging when database migration is complete
    // const db = admin.firestore();
    // await db.collection('enrichment_logs').add(logData);

  } catch (error) {
    console.error('Error logging enrichment action:', error);
    // Don't throw error to avoid failing the main operation
  }
}

module.exports = {
  clearbitEnrichment
};