const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const axios = require('axios');

exports.createDailyRoom = onCall(
  {
    maxInstances: 10,
  },
  async (request) => {
    const { data, auth } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) {
      throw new HttpsError('failed-precondition', 'Daily API key not configured');
    }

    try {
      const {
        roomName,
        properties = {},
        expiresIn = 60 * 60, // 1 hour default
        startCloudRecording = false
      } = data || {};

      const payload = {
        name: roomName || undefined,
        properties: {
          enable_chat: true,
          enable_screenshare: true,
          enable_knocking: true,
          exp: Math.floor(Date.now() / 1000) + expiresIn,
          start_cloud_recording: startCloudRecording,
          ...properties
        }
      };

      const dailyResponse = await axios.post(
        'https://api.daily.co/v1/rooms',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          }
        }
      );

      return {
        success: true,
        room: dailyResponse.data
      };
    } catch (error) {
      logger.error('createDailyRoom error:', error.response?.data || error.message);
      throw new HttpsError(
        'internal',
        error.response?.data?.info || error.message || 'Failed to create Daily room'
      );
    }
  }
);
