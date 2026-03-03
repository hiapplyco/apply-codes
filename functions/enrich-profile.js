const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const admin = require('firebase-admin');
const { enrichContact } = require('./utils/enrichment-service');
const { searchPerson } = require('./utils/nymeria');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.enrichProfile = onCall(
  {},
  async (request) => {
    logger.info('Enrich profile function called');

    const { data, auth } = request;

    // Require authentication
    if (!auth) {
      throw new HttpsError(
        'unauthenticated',
        'Authentication required to use enrichment'
      );
    }

    try {
      // Check if this is a profile enrichment or a person search request
      if (data.profileUrl || data.profileId) {
        // Profile enrichment — use shared waterfall service (Nymeria -> Hunter -> PDL)
        return await handleProfileEnrichment(data, auth);
      } else if (data.searchParams) {
        // Person search — use shared Nymeria client
        return await handlePersonSearch(data.searchParams);
      } else {
        throw new HttpsError(
          'invalid-argument',
          'Either profileUrl/profileId or searchParams is required'
        );
      }
    } catch (error) {
      logger.error('Error processing request:', error);

      // Already an HttpsError — rethrow as-is
      if (error.httpErrorCode) {
        throw error;
      }

      // Special handling for missing API key
      if (error.message?.includes('API key')) {
        throw new HttpsError(
          'failed-precondition',
          'API configuration error. Please check server configuration.'
        );
      }

      throw new HttpsError(
        'internal',
        error.message || 'Failed to enrich profile',
        {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      );
    }
  }
);

async function handleProfileEnrichment(requestData, auth) {
  const { profileUrl, profileId } = requestData;

  if (!profileUrl && !profileId) {
    throw new Error('Either profileUrl or profileId is required for profile enrichment');
  }

  logger.info(`Enriching profile: ${profileUrl || profileId}`);

  // Use shared enrichment service (waterfall: Nymeria -> Hunter -> PDL, with cache)
  const result = await enrichContact(
    { profileUrl: profileUrl || undefined, email: profileId || undefined },
    { userId: auth.uid }
  );

  if (!result.data) {
    return {
      success: true,
      data: null,
      message: 'Profile not found in contact database',
      profileUrl: profileUrl || profileId
    };
  }

  return {
    success: true,
    data: result.data,
    message: result.cached
      ? 'Profile enriched successfully (cached)'
      : 'Profile enriched successfully',
    cached: result.cached || false,
    provider: result.provider || null
  };
}

async function handlePersonSearch(searchParams) {
  logger.info('Searching for person with params:', searchParams);

  // Use shared Nymeria client for search
  const searchData = await searchPerson(searchParams);

  return {
    success: true,
    data: searchData,
    message: 'Search completed successfully'
  };
}
