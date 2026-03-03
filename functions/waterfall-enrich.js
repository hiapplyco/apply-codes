/**
 * Waterfall Enrichment Cloud Function
 *
 * Sequentially queries multiple enrichment providers to maximize hit rates.
 * Order: Nymeria -> Hunter.io -> PDL
 * Stops at first provider that returns contact data.
 * Returns normalized data in a consistent format regardless of provider.
 *
 * Request format:
 * {
 *   "profileUrl": "https://linkedin.com/in/username",  // LinkedIn lookup
 *   "email": "user@example.com",                        // Email lookup
 *   "firstName": "John",                                // Name search
 *   "lastName": "Doe",
 *   "company": "Acme Inc",
 *   "domain": "acme.com"
 * }
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const TIMEOUT_MS = 30000;

/**
 * Normalize enrichment data from any provider into a consistent format
 */
function normalizeEnrichmentData(provider, rawData) {
  if (!rawData) return null;

  switch (provider) {
    case 'nymeria':
      return {
        name: rawData.name || `${rawData.first_name || ''} ${rawData.last_name || ''}`.trim() || null,
        first_name: rawData.first_name || null,
        last_name: rawData.last_name || null,
        work_email: rawData.work_email || rawData.emails?.[0]?.address || null,
        personal_emails: rawData.personal_emails || [],
        mobile_phone: rawData.mobile_phone || null,
        phone_numbers: rawData.phone_numbers || [],
        job_title: rawData.current_title || rawData.job_title || null,
        job_company_name: rawData.current_employer || rawData.job_company_name || null,
        location: rawData.city ? `${rawData.city}, ${rawData.state || ''}`.trim() : rawData.location || null,
        country: rawData.country || null,
        industry: rawData.industry || null,
        linkedin_url: rawData.linkedin_url || null,
        github_url: rawData.github_url || null,
        twitter_url: rawData.twitter_url || null,
        social_profiles: rawData.social_profiles || rawData.profiles || [],
        provider: 'nymeria',
      };

    case 'hunter':
      return {
        name: rawData.first_name && rawData.last_name
          ? `${rawData.first_name} ${rawData.last_name}`
          : null,
        first_name: rawData.first_name || null,
        last_name: rawData.last_name || null,
        work_email: rawData.email || null,
        personal_emails: [],
        mobile_phone: rawData.phone_number || null,
        phone_numbers: rawData.phone_number ? [rawData.phone_number] : [],
        job_title: rawData.position || null,
        job_company_name: rawData.company || null,
        location: null,
        country: null,
        industry: null,
        linkedin_url: rawData.linkedin_url || null,
        github_url: null,
        twitter_url: rawData.twitter || null,
        social_profiles: [],
        provider: 'hunter',
        confidence: rawData.score || rawData.confidence || null,
      };

    case 'pdl':
      return {
        name: rawData.full_name || `${rawData.first_name || ''} ${rawData.last_name || ''}`.trim() || null,
        first_name: rawData.first_name || null,
        last_name: rawData.last_name || null,
        work_email: rawData.emails?.[0]?.address || rawData.emails?.[0] || null,
        personal_emails: (rawData.emails || []).slice(1).map(e => e.address || e),
        mobile_phone: rawData.phone_numbers?.[0]?.number || rawData.phone_numbers?.[0] || null,
        phone_numbers: (rawData.phone_numbers || []).map(p => p.number || p),
        job_title: rawData.job_title || null,
        job_company_name: rawData.job_company_name || null,
        location: rawData.location_names?.[0] || rawData.location_locality || null,
        country: rawData.location_country || null,
        industry: rawData.job_company_industry || rawData.industry || null,
        linkedin_url: rawData.linkedin_url || null,
        github_url: rawData.github_url || null,
        twitter_url: rawData.twitter_url || null,
        social_profiles: rawData.profiles || [],
        provider: 'pdl',
      };

    default:
      return rawData;
  }
}

/**
 * Try Nymeria enrichment
 */
async function tryNymeria(profileUrl) {
  const apiKey = process.env.NYMERIA_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://www.nymeria.io/api/v4/person/enrich?profile=${encodeURIComponent(profileUrl)}`;
    const response = await axios.get(url, {
      headers: { 'X-Api-Key': apiKey },
      timeout: TIMEOUT_MS
    });

    const data = response.data?.data || response.data;
    if (data && (data.work_email || data.personal_emails?.length || data.mobile_phone || data.emails?.length)) {
      return normalizeEnrichmentData('nymeria', data);
    }
    return null;
  } catch (error) {
    if (error.response?.status === 404) return null;
    logger.error('Nymeria waterfall error:', error.response?.status || error.message);
    return null;
  }
}

/**
 * Try Hunter.io email finder (requires name + domain)
 */
async function tryHunter(firstName, lastName, domain) {
  const apiKey = process.env.HUNTER_IO_API_KEY;
  if (!apiKey || !firstName || !lastName || !domain) return null;

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      domain,
      first_name: firstName,
      last_name: lastName,
    });
    const url = `https://api.hunter.io/v2/email-finder?${params.toString()}`;

    const response = await axios.get(url, { timeout: TIMEOUT_MS });
    const data = response.data?.data;

    if (data?.email) {
      return normalizeEnrichmentData('hunter', data);
    }
    return null;
  } catch (error) {
    if (error.response?.status === 404) return null;
    logger.error('Hunter waterfall error:', error.response?.status || error.message);
    return null;
  }
}

/**
 * Try PDL person enrichment
 */
async function tryPDL(params) {
  const apiKey = process.env.PDL_API_KEY || process.env.PEOPLE_DATA_LABS_API_KEY;
  if (!apiKey) return null;

  try {
    const queryParams = new URLSearchParams();
    if (params.profileUrl) queryParams.append('profile', params.profileUrl);
    if (params.email) queryParams.append('email', params.email);
    if (params.firstName) queryParams.append('first_name', params.firstName);
    if (params.lastName) queryParams.append('last_name', params.lastName);
    if (params.company) queryParams.append('company', params.company);

    const url = `https://api.peopledatalabs.com/v5/person/enrich?${queryParams.toString()}`;
    const response = await axios.get(url, {
      headers: { 'X-Api-Key': apiKey },
      timeout: TIMEOUT_MS,
    });

    const data = response.data;
    if (data && (data.emails?.length || data.phone_numbers?.length)) {
      return normalizeEnrichmentData('pdl', data);
    }
    return null;
  } catch (error) {
    if (error.response?.status === 404) return null;
    logger.error('PDL waterfall error:', error.response?.status || error.message);
    return null;
  }
}

exports.waterfallEnrich = onCall({}, async (request) => {
  const { data, auth } = request;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    const requestData = data || {};
    const { profileUrl, email, firstName, lastName, company, domain } = requestData;

    if (!profileUrl && !email && !(firstName && lastName)) {
      throw new HttpsError('invalid-argument', 'At least one of profileUrl, email, or firstName+lastName is required');
    }

    logger.info('Waterfall enrichment request', {
      hasProfile: !!profileUrl,
      hasEmail: !!email,
      hasName: !!(firstName && lastName),
    });

    // Check cache first
    const cacheKey = profileUrl || email || `${firstName}_${lastName}_${company || ''}`;
    const db = admin.firestore();
    try {
      const cacheQuery = await db.collection('enrichment_cache')
        .where('cache_key', '==', cacheKey)
        .where('created_at', '>', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .limit(1)
        .get();

      if (!cacheQuery.empty) {
        const cached = cacheQuery.docs[0].data();
        logger.info('Returning cached waterfall result');
        return {
          success: true,
          data: cached.data,
          provider: cached.provider,
          cached: true,
        };
      }
    } catch (cacheErr) {
      logger.error('Cache lookup error:', cacheErr);
    }

    // Waterfall: try providers in order
    const providers = [];
    let result = null;

    // Step 1: Nymeria (if we have a profile URL)
    if (profileUrl) {
      providers.push('nymeria');
      result = await tryNymeria(profileUrl);
    }

    // Step 2: Hunter.io (if we have name + domain)
    if (!result && firstName && lastName && domain) {
      providers.push('hunter');
      result = await tryHunter(firstName, lastName, domain);
    }

    // Step 3: PDL (broader search)
    if (!result) {
      providers.push('pdl');
      result = await tryPDL({ profileUrl, email, firstName, lastName, company });
    }

    // Log the attempt
    try {
      await db.collection('enrichment_logs').add({
        action_type: 'waterfall_enrichment',
        cache_key: cacheKey,
        user_id: auth.uid,
        providers_tried: providers,
        provider_found: result?.provider || null,
        status: result ? 'success' : 'not_found',
        created_at: admin.firestore.Timestamp.now(),
      });
    } catch (logErr) {
      logger.error('Failed to log waterfall attempt:', logErr);
    }

    if (result) {
      // Cache the result
      try {
        await db.collection('enrichment_cache').add({
          cache_key: cacheKey,
          data: result,
          provider: result.provider,
          created_at: admin.firestore.Timestamp.now(),
        });
      } catch (cacheErr) {
        logger.error('Failed to cache waterfall result:', cacheErr);
      }

      return {
        success: true,
        data: result,
        provider: result.provider,
        providers_tried: providers,
        enriched: true,
      };
    } else {
      return {
        success: true,
        data: null,
        providers_tried: providers,
        enriched: false,
        message: 'No contact information found across all providers',
      };
    }

  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error('Waterfall enrichment error:', error);
    throw new HttpsError('internal', error.message || 'Unknown error');
  }
});

// Export normalizer for use by other functions
exports.normalizeEnrichmentData = normalizeEnrichmentData;
