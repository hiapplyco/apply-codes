const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.perplexitySearch = onRequest({
  cors: true,
  maxInstances: 10,
  invoker: 'public',
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
    // Get user from Authorization header (Firebase Auth)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized - No token provided' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify user with Firebase Auth
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      if (!decodedToken.uid) {
        res.status(401).json({ error: 'Unauthorized - Invalid token' });
        return;
      }
    } catch (authError) {
      console.error('Auth error:', authError);
      res.status(401).json({ error: 'Unauthorized - Invalid token' });
      return;
    }

    // Check if PERPLEXITY_API_KEY is available
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityApiKey) {
      console.error('PERPLEXITY_API_KEY environment variable is not set');
      res.status(500).json({ error: 'Perplexity API key not configured' });
      return;
    }

    // Parse request body
    const { query, projectId } = req.body || {};
    console.log('Request body received:', { query, projectId });

    if (!query || typeof query !== 'string' || query.trim() === '') {
      console.log('Invalid query:', { query, type: typeof query });
      res.status(400).json({
        error: 'Query is required and must be a non-empty string',
        received: { query, type: typeof query }
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
            'Authorization': `Bearer ${perplexityApiKey}`,
          },
        }
      );
    } catch (perplexityError) {
      console.error('Perplexity API error:', perplexityError.response?.data || perplexityError.message);
      res.status(500).json({
        error: 'Perplexity API request failed',
        details: perplexityError.response?.data || perplexityError.message,
        perplexityStatus: perplexityError.response?.status
      });
      return;
    }

    const responseData = perplexityResponse.data;
    console.log('Perplexity response received:', JSON.stringify(responseData, null, 2));

    // Store search result in Firestore
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      const searchRecord = {
        userId: userId,
        projectId: projectId || null,
        query: query,
        perplexityResponse: responseData,
        answerText: responseData.choices?.[0]?.message?.content || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
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