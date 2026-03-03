const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const { searchPerson } = require('./utils/nymeria');

exports.searchContacts = onCall(
  {
    maxInstances: 10,
  },
  async (request) => {
    const { data, auth } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    try {
      const { searchParams } = data || {};
      logger.info("Search params:", searchParams);

      // Validate that we have at least one search parameter
      const validSearchParams = ['first_name', 'last_name', 'location', 'country', 'industry', 'title', 'company'];
      const hasValidParam = validSearchParams.some(param => searchParams?.[param]);

      if (!hasValidParam) {
        throw new HttpsError(
          'invalid-argument',
          'At least one search parameter is required (first_name, last_name, location, country, industry, title, or company)'
        );
      }

      // Build query parameters (only valid ones)
      const queryForNymeria = {};
      validSearchParams.forEach(param => {
        if (searchParams[param]) {
          queryForNymeria[param] = searchParams[param];
        }
      });

      // Add pagination
      queryForNymeria.limit = searchParams.limit
        ? Math.min(25, Math.max(1, searchParams.limit))
        : 25;
      if (searchParams.offset) {
        queryForNymeria.offset = Math.min(9999, Math.max(0, searchParams.offset));
      }

      // Use shared Nymeria client
      const searchData = await searchPerson(queryForNymeria);
      logger.info(`Found ${searchData.total} results`);

      // Transform the response to ensure consistent format
      const transformedData = {
        data: (searchData.data || []).map(person => ({
          uuid: person.uuid,
          name: `${person.first_name || ''} ${person.last_name || ''}`.trim(),
          first_name: person.first_name,
          last_name: person.last_name,
          location: person.location,
          country: person.country,
          job_title: person.job_title,
          company: person.job_company_name,
          industry: person.industry,
          work_email: person.work_email,
          personal_emails: person.personal_emails || [],
          mobile_phone: person.mobile_phone,
          linkedin_username: person.linkedin_username,
          linkedin_url: person.linkedin_username ? `https://linkedin.com/in/${person.linkedin_username}` : null,
          hasContactInfo: !!(person.work_email || person.personal_emails?.length || person.mobile_phone)
        })),
        total: searchData.total,
        meta: searchData.meta,
      };

      return transformedData;

    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('Error processing request:', error);
      throw new HttpsError('internal', error.message || 'Unknown error');
    }
  }
);
