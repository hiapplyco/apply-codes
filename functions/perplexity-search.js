const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const perplexityApiKey = defineSecret('PERPLEXITY_API_KEY');

exports.perplexitySearch = onRequest({
  cors: true,
  secrets: [perplexityApiKey]
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
        console.warn('Auth token verification failed, proceeding as anonymous:', authError.message);
      }
    } else {
      console.log('No auth token provided, proceeding as anonymous');
    }

    // Get API key from secrets
    const apiKey = perplexityApiKey.value();
    if (!apiKey) {
      console.error('PERPLEXITY_API_KEY secret is not set');
      res.status(500).json({ error: 'Perplexity API key not configured' });
      return;
    }

    // Parse request body
    const { query, projectId, focus } = req.body || {};
    console.log('Request body received:', { query, projectId, focus });

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

    console.log('Sending request to Perplexity:', perplexityRequestBody);

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
      console.error('Perplexity API error:', perplexityError.response?.data || perplexityError.message);
      res.status(500).json({
        error: 'Perplexity API request failed',
        details: perplexityError.response?.data || perplexityError.message
      });
      return;
    }

    const responseData = perplexityResponse.data;
    console.log('Perplexity response received');

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

      console.log('Search record saved with ID:', docRef.id);

      // Return response with search record ID for reference
      res.status(200).json({
        ...responseData,
        searchId: docRef.id
      });
    } catch (dbError) {
      console.error('Firestore error:', dbError);
      // Return original response even if DB insert fails
      res.status(200).json(responseData);
    }

  } catch (error) {
    console.error('Error in perplexity-search function:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      details: error.message
    });
  }
});