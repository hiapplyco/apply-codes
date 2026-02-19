const { onRequest } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}



exports.perplexitySearch = onRequest({
  cors: true,
  
}, async (req, res) => {
  // Set CORS headers for all responses
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    let userId = null;
    const authHeader = req.headers.authorization;

    // Try to authenticate if header is present
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        userId = decodedToken.uid;
      } catch (authError) {
        logger.warn('Auth token verification failed, proceeding as anonymous:', authError.message);
      }
    } else {
      logger.info('No auth token provided, proceeding as anonymous');
    }

    // Get API key from environment
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      logger.error('PERPLEXITY_API_KEY is not set in environment');
      res.status(500).json({ error: 'Perplexity API key not configured' });
      return;
    }

    // Parse request body
    const { query, projectId, focus } = req.body || {};
    logger.info('Request body received:', { query, projectId, focus });

    if (!query || typeof query !== 'string' || query.trim() === '') {
      res.status(400).json({
        error: 'Query is required and must be a non-empty string'
      });
      return;
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
      res.status(500).json({
        error: 'Perplexity API request failed',
        details: perplexityError.response?.data || perplexityError.message
      });
      return;
    }

    const responseData = perplexityResponse.data;
    logger.info('Perplexity response received');

    // Store search result in Firestore if userId is present (or even if not, maybe?)
    // If no userId, we can still store it with null userId or skip
    try {
      const searchRecord = {
        userId: userId, // Can be null
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

      // Return response with search record ID for reference
      res.status(200).json({
        ...responseData,
        searchId: docRef.id
      });
    } catch (dbError) {
      logger.error('Firestore error:', dbError);
      // Return original response even if DB insert fails
      res.status(200).json(responseData);
    }

  } catch (error) {
    logger.error('Error in perplexity-search function:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      details: error.message
    });
  }
});