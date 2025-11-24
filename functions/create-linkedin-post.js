const { onRequest } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');

exports.createLinkedinPost = onRequest(
  {
    cors: true,
    timeoutSeconds: 60,
    memory: '512MiB'
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(204).send('');
      return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { text, accessToken } = req.body;

      if (!text) {
        res.status(400).json({ error: 'Text is required' });
        return;
      }

      if (!accessToken) {
        res.status(400).json({ error: 'Access token is required' });
        return;
      }

      const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author: `urn:li:person:${accessToken}`, // This will be replaced with actual user ID
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: text
              },
              shareMediaCategory: 'NONE'
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('LinkedIn API error:', errorText);
        res.status(400).json({ error: `LinkedIn API error: ${errorText}` });
        return;
      }

      const data = await response.json();

      res.status(200).json({ success: true, data });

    } catch (error) {
      logger.error('Error posting to LinkedIn:', error);
      res.status(500).json({ error: error.message });
    }
  }
);