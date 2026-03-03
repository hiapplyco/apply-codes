/**
 * Hunter.io Search Cloud Function
 *
 * Provides three main search capabilities:
 * 1. Domain Search: Find email addresses associated with a domain
 * 2. Email Finder: Find specific person's email address using name and domain
 * 3. Email Verifier: Verify the deliverability of an email address
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const axios = require('axios');

exports.hunterIoSearch = onCall({}, async (request) => {
  const { data, auth } = request;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    const { searchType, domain, company, fullName, firstName, lastName, limit = 10, offset = 0 } = data || {};

    logger.info("Hunter.io search params:", { searchType, domain, company, fullName, firstName, lastName, limit, offset });

    // Validate search type
    const validSearchTypes = ['domain', 'email_finder', 'email_verifier'];
    if (!searchType || !validSearchTypes.includes(searchType)) {
      throw new HttpsError('invalid-argument', `Invalid search type. Must be one of: ${validSearchTypes.join(', ')}`);
    }

    // Get API key
    const apiKey = process.env.HUNTER_IO_API_KEY;
    if (!apiKey) {
      logger.error('HUNTER_IO_API_KEY is not set');
      throw new HttpsError('unavailable', 'API configuration error: Missing Hunter.io API key');
    }

    let hunterUrl;
    let searchParams = new URLSearchParams();
    searchParams.append('api_key', apiKey);

    // Validate and build query based on search type
    switch (searchType) {
      case 'domain':
        if (!domain) {
          throw new HttpsError('invalid-argument', 'Domain is required for domain search');
        }
        searchParams.append('domain', domain);
        searchParams.append('limit', Math.min(100, Math.max(1, limit)).toString());
        searchParams.append('offset', Math.max(0, offset).toString());
        hunterUrl = `https://api.hunter.io/v2/domain-search?${searchParams.toString()}`;
        break;

      case 'email_finder':
        if (!domain || (!fullName && (!firstName || !lastName))) {
          throw new HttpsError('invalid-argument', 'Domain and either fullName or both firstName and lastName are required for email finder');
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
        if (!data.email) {
          throw new HttpsError('invalid-argument', 'Email is required for email verification');
        }
        searchParams.append('email', data.email);
        hunterUrl = `https://api.hunter.io/v2/email-verifier?${searchParams.toString()}`;
        break;

      default:
        throw new HttpsError('invalid-argument', 'Invalid search type');
    }

    logger.info('Calling Hunter.io API:', hunterUrl.replace(apiKey, '[REDACTED]'));

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

      logger.error('Hunter.io API error:', status, errorData);

      if (status === 401) {
        throw new HttpsError('unauthenticated', 'Invalid Hunter.io API key. Please check your configuration.');
      } else if (status === 429) {
        throw new HttpsError('resource-exhausted', 'Hunter.io rate limit exceeded. Please try again later.');
      } else if (status === 402) {
        throw new HttpsError('resource-exhausted', 'Hunter.io API credits exhausted. Please upgrade your plan.');
      } else if (hunterError.code === 'ECONNABORTED') {
        throw new HttpsError('deadline-exceeded', 'Hunter.io API request timed out. Please try again.');
      }

      throw new HttpsError('internal', `Hunter.io API error: ${status} - ${errorData?.errors?.[0]?.details || 'Unknown error'}`);
    }

    const responseData = hunterResponse.data;
    logger.info(`Hunter.io API response received for ${searchType}`);

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
    return {
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

  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error('Error processing Hunter.io request:', error);
    throw new HttpsError('internal', error.message || 'Unknown error');
  }
});
