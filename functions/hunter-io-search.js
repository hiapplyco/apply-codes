/**
 * Hunter.io Search Cloud Function
 *
 * Provides three main search capabilities:
 * 1. Domain Search: Find email addresses associated with a domain
 * 2. Email Finder: Find specific person's email address using name and domain
 * 3. Email Verifier: Verify the deliverability of an email address
 *
 * @param {Object} req.body - Request body containing search parameters
 * @param {string} req.body.searchType - Type of search: 'domain', 'email_finder', or 'email_verifier'
 * @param {string} req.body.domain - Domain to search (required for domain and email_finder)
 * @param {string} req.body.company - Company name (optional for email_finder)
 * @param {string} req.body.fullName - Full name (for email_finder, alternative to firstName/lastName)
 * @param {string} req.body.firstName - First name (for email_finder)
 * @param {string} req.body.lastName - Last name (for email_finder)
 * @param {string} req.body.email - Email to verify (required for email_verifier)
 * @param {number} req.body.limit - Limit results for domain search (default: 10, max: 100)
 * @param {number} req.body.offset - Offset for domain search pagination (default: 0)
 *
 * @returns {Object} JSON response with search results and metadata
 */

const functions = require('firebase-functions');
const axios = require('axios');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

exports.hunterIoSearch = functions.https.onRequest(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.set(corsHeaders);
    res.status(204).send('');
    return;
  }

  res.set(corsHeaders);

  try {
    const { searchType, domain, company, fullName, firstName, lastName, limit = 10, offset = 0 } = req.body || {};

    console.log("Hunter.io search params:", { searchType, domain, company, fullName, firstName, lastName, limit, offset });

    // Validate search type
    const validSearchTypes = ['domain', 'email_finder', 'email_verifier'];
    if (!searchType || !validSearchTypes.includes(searchType)) {
      res.status(400).json({
        error: `Invalid search type. Must be one of: ${validSearchTypes.join(', ')}`,
        type: 'ValidationError',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Get API key
    const apiKey = process.env.HUNTER_IO_API_KEY;
    if (!apiKey) {
      console.error('HUNTER_IO_API_KEY is not set');
      res.status(500).json({
        error: 'API configuration error: Missing Hunter.io API key',
        type: 'ConfigurationError',
        timestamp: new Date().toISOString()
      });
      return;
    }

    let hunterUrl;
    let searchParams = new URLSearchParams();
    searchParams.append('api_key', apiKey);

    // Validate and build query based on search type
    switch (searchType) {
      case 'domain':
        if (!domain) {
          res.status(400).json({
            error: 'Domain is required for domain search',
            type: 'ValidationError',
            timestamp: new Date().toISOString()
          });
          return;
        }
        searchParams.append('domain', domain);
        searchParams.append('limit', Math.min(100, Math.max(1, limit)).toString());
        searchParams.append('offset', Math.max(0, offset).toString());
        hunterUrl = `https://api.hunter.io/v2/domain-search?${searchParams.toString()}`;
        break;

      case 'email_finder':
        if (!domain || (!fullName && (!firstName || !lastName))) {
          res.status(400).json({
            error: 'Domain and either fullName or both firstName and lastName are required for email finder',
            type: 'ValidationError',
            timestamp: new Date().toISOString()
          });
          return;
        }
        searchParams.append('domain', domain);
        if (fullName) {
          searchParams.append('full_name', fullName);
        } else {
          searchParams.append('first_name', firstName);
          searchParams.append('last_name', lastName);
        }
        if (company) {
          searchParams.append('company', company);
        }
        hunterUrl = `https://api.hunter.io/v2/email-finder?${searchParams.toString()}`;
        break;

      case 'email_verifier':
        if (!req.body.email) {
          res.status(400).json({
            error: 'Email is required for email verification',
            type: 'ValidationError',
            timestamp: new Date().toISOString()
          });
          return;
        }
        searchParams.append('email', req.body.email);
        hunterUrl = `https://api.hunter.io/v2/email-verifier?${searchParams.toString()}`;
        break;

      default:
        res.status(400).json({
          error: 'Invalid search type',
          type: 'ValidationError',
          timestamp: new Date().toISOString()
        });
        return;
    }

    console.log('Calling Hunter.io API:', hunterUrl.replace(apiKey, '[REDACTED]'));

    // Call Hunter.io API
    let hunterResponse;
    try {
      hunterResponse = await axios.get(hunterUrl, {
        timeout: 30000, // 30 second timeout
        headers: {
          'User-Agent': 'Apply.codes/1.0 (https://apply.codes)'
        }
      });
    } catch (hunterError) {
      const status = hunterError.response?.status;
      const errorData = hunterError.response?.data;

      console.error('Hunter.io API error:', status, errorData);

      if (status === 401) {
        res.status(401).json({
          error: 'Invalid Hunter.io API key. Please check your configuration.',
          type: 'AuthenticationError',
          timestamp: new Date().toISOString()
        });
        return;
      } else if (status === 429) {
        res.status(429).json({
          error: 'Hunter.io rate limit exceeded. Please try again later.',
          type: 'RateLimitError',
          timestamp: new Date().toISOString()
        });
        return;
      } else if (status === 402) {
        res.status(402).json({
          error: 'Hunter.io API credits exhausted. Please upgrade your plan.',
          type: 'PaymentRequiredError',
          timestamp: new Date().toISOString()
        });
        return;
      } else if (hunterError.code === 'ECONNABORTED') {
        res.status(408).json({
          error: 'Hunter.io API request timed out. Please try again.',
          type: 'TimeoutError',
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(500).json({
        error: `Hunter.io API error: ${status} - ${errorData?.errors?.[0]?.details || 'Unknown error'}`,
        type: 'APIError',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const responseData = hunterResponse.data;
    console.log(`Hunter.io API response received for ${searchType}`);

    // Transform response based on search type
    let transformedData;

    switch (searchType) {
      case 'domain':
        transformedData = {
          domain: responseData.data?.domain,
          organization: responseData.data?.organization,
          description: responseData.data?.description,
          industry: responseData.data?.industry,
          twitter: responseData.data?.twitter,
          facebook: responseData.data?.facebook,
          linkedin: responseData.data?.linkedin,
          instagram: responseData.data?.instagram,
          youtube: responseData.data?.youtube,
          technologies: responseData.data?.technologies || [],
          pattern: responseData.data?.pattern,
          emails: (responseData.data?.emails || []).map(email => ({
            value: email.value,
            type: email.type,
            confidence: email.confidence,
            sources: email.sources?.map(source => ({
              domain: source.domain,
              uri: source.uri,
              extracted_on: source.extracted_on,
              still_on_page: source.still_on_page
            })) || [],
            first_name: email.first_name,
            last_name: email.last_name,
            position: email.position,
            seniority: email.seniority,
            department: email.department,
            linkedin: email.linkedin,
            twitter: email.twitter,
            phone_number: email.phone_number,
            verification: {
              date: email.verification?.date,
              status: email.verification?.status
            }
          })),
          total: responseData.data?.emails?.length || 0,
          offset: offset,
          limit: limit
        };
        break;

      case 'email_finder':
        transformedData = {
          email: responseData.data?.email,
          score: responseData.data?.score,
          first_name: responseData.data?.first_name,
          last_name: responseData.data?.last_name,
          position: responseData.data?.position,
          twitter: responseData.data?.twitter,
          linkedin_url: responseData.data?.linkedin_url,
          phone_number: responseData.data?.phone_number,
          company: responseData.data?.company,
          domain: domain,
          sources: responseData.data?.sources?.map(source => ({
            domain: source.domain,
            uri: source.uri,
            extracted_on: source.extracted_on,
            still_on_page: source.still_on_page
          })) || [],
          verification: {
            date: responseData.data?.verification?.date,
            status: responseData.data?.verification?.status
          }
        };
        break;

      case 'email_verifier':
        transformedData = {
          email: responseData.data?.email,
          status: responseData.data?.status,
          result: responseData.data?.result,
          score: responseData.data?.score,
          regexp: responseData.data?.regexp,
          gibberish: responseData.data?.gibberish,
          disposable: responseData.data?.disposable,
          webmail: responseData.data?.webmail,
          mx_records: responseData.data?.mx_records,
          smtp_server: responseData.data?.smtp_server,
          smtp_check: responseData.data?.smtp_check,
          accept_all: responseData.data?.accept_all,
          block: responseData.data?.block,
          sources: responseData.data?.sources?.map(source => ({
            domain: source.domain,
            uri: source.uri,
            extracted_on: source.extracted_on,
            still_on_page: source.still_on_page
          })) || []
        };
        break;
    }

    // Add metadata
    const finalResponse = {
      data: transformedData,
      meta: {
        searchType,
        params: { domain, company, fullName, firstName, lastName, limit, offset },
        requests: {
          used: responseData.meta?.requests?.used,
          available: responseData.meta?.requests?.available
        }
      }
    };

    res.status(200).json(finalResponse);

  } catch (error) {
    console.error('Error processing Hunter.io request:', error);

    const errorMessage = error.message || 'Unknown error';
    const errorDetails = {
      error: errorMessage,
      type: error.constructor?.name || 'Error',
      timestamp: new Date().toISOString()
    };

    res.status(500).json(errorDetails);
  }
});