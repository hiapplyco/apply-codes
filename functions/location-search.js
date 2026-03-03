const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const axios = require('axios');

exports.locationSearch = onCall(
  {
    maxInstances: 10,
  },
  async (request) => {
    const { data, auth } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    try {
      const { query } = data;

      if (!query) {
        throw new HttpsError('invalid-argument', 'Query parameter is required');
      }

      // Use the same API key as other Google services or a specific Maps key
      const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY;

      if (!apiKey) {
        logger.error('Google Maps API key not configured');
        throw new HttpsError('failed-precondition', 'Server configuration error');
      }

      logger.info(`Searching for location: ${query}`);

      // Use Google Places Text Search API
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/textsearch/json`,
        {
          params: {
            query: query,
            key: apiKey,
            fields: 'formatted_address,geometry,place_id,name'
          }
        }
      );

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        logger.error('Google Maps API error:', response.data);
        throw new HttpsError('internal', `Failed to search location: ${response.data.status}`);
      }

      const results = response.data.results.map(place => ({
        formatted_address: place.formatted_address,
        place_id: place.place_id,
        name: place.name,
        location: place.geometry?.location,
        types: place.types
      }));

      logger.info(`Found ${results.length} locations`);

      return {
        success: true,
        locations: results
      };

    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('Error in location search:', error);
      throw new HttpsError('internal', error.message || 'Internal server error');
    }
  }
);
