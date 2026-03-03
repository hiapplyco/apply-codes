const { onCall, HttpsError } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');

exports.createLinkedinPost = onCall(
  {
    timeoutSeconds: 60,
    memory: '512MiB'
  },
  async (request) => {
    const { data, auth } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    try {
      const { text, accessToken } = data;

      if (!text) {
        throw new HttpsError('invalid-argument', 'Text is required');
      }

      if (!accessToken) {
        throw new HttpsError('invalid-argument', 'Access token is required');
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
        throw new HttpsError('internal', `LinkedIn API error: ${errorText}`);
      }

      const responseData = await response.json();

      return { success: true, data: responseData };

    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('Error posting to LinkedIn:', error);
      throw new HttpsError('internal', error.message);
    }
  }
);
