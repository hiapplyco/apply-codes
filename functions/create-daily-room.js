const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const axios = require('axios');
const { DAILY_API_BASE, getDailyHeaders, generateMeetingToken, sanitizeRoomProperties } = require('./utils/daily');

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
        startCloudRecording = false,
        enableTranscription = true,
        userName,
      } = data || {};

      const roomPayload = {
        name: roomName || undefined,
        properties: {
          enable_chat: true,
          enable_screenshare: true,
          enable_knocking: true,
          exp: Math.floor(Date.now() / 1000) + expiresIn,
          start_cloud_recording: startCloudRecording,
          enable_recording: 'cloud',
          recording_data_outputs: ['event-json', 'transcript-webvtt', 'chat-webvtt'],
          enable_transcription: enableTranscription,
          enable_transcription_storage: enableTranscription,
          ...sanitizeRoomProperties(properties),
        }
      };

      const dailyResponse = await axios.post(
        `${DAILY_API_BASE}/rooms`,
        roomPayload,
        { headers: getDailyHeaders(apiKey) }
      );

      const room = dailyResponse.data;

      // Generate a scoped meeting token for this user/room
      let meetingToken = null;
      try {
        meetingToken = await generateMeetingToken(apiKey, room.name, auth.uid, {
          userName,
          startCloudRecording,
          isOwner: true,
          tokenExpiresIn: expiresIn,
        });
      } catch (tokenError) {
        logger.warn('Meeting token generation failed, room still usable:', tokenError.message);
      }

      return {
        success: true,
        room,
        meetingToken,
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('createDailyRoom error:', error.response?.data || error.message);
      throw new HttpsError(
        'internal',
        error.response?.data?.info || error.message || 'Failed to create Daily room'
      );
    }
  }
);
