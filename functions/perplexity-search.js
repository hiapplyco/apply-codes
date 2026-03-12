const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.perplexitySearch = onCall({ secrets: ["PERPLEXITY_API_KEY"] }, async (request) => {
  const { data, auth } = request;

  // Auth is optional for this function - proceed with or without
  const userId = auth?.uid || null;

  try {
    // Get API key from environment
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      logger.error('PERPLEXITY_API_KEY is not set in environment');
      throw new HttpsError('unavailable', 'Perplexity API key not configured');
    }

    // Parse request data
    const { query, projectId, focus } = data || {};
    logger.info('Request data received:', { query, projectId, focus });

    if (!query || typeof query !== 'string' || query.trim() === '') {
      throw new HttpsError('invalid-argument', 'Query is required and must be a non-empty string');
    }

    // Prepare Perplexity API request
    const perplexityRequestBody = {
      model: 'sonar',
      messages: [
        { role: 'system', content: 'Be precise and concise.' },
        { role: 'user', content: query },
      ],
    };

    logger.info('Sending request to Perplexity:', perplexityRequestBody);

    // Call Perplexity API
    let perplexityResponse;
    try {
      perplexityResponse = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        perplexityRequestBody,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );
    } catch (perplexityError) {
      logger.error('Perplexity API error:', perplexityError.response?.data || perplexityError.message);
      throw new HttpsError('internal', 'Perplexity API request failed');
    }

    const responseData = perplexityResponse.data;
    logger.info('Perplexity response received');

    // Store search result in Firestore
    try {
      const searchRecord = {
        userId: userId,
        projectId: projectId || null,
        query: query,
        perplexityResponse: responseData,
        answerText: responseData.choices?.[0]?.message?.content || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        source: 'perplexity-search-function'
      };

      const docRef = await admin.firestore()
        .collection('searches')
        .add(searchRecord);

      logger.info('Search record saved with ID:', docRef.id);

      return {
        ...responseData,
        searchId: docRef.id
      };
    } catch (dbError) {
      logger.error('Firestore error:', dbError);
      return responseData;
    }

  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error('Error in perplexity-search function:', error);
    throw new HttpsError('internal', error.message || 'Internal Server Error');
  }
});
