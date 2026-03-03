const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const axios = require('axios');
const { resolvePipecatApiKey } = require('./utils/daily');

const PIPECAT_API_BASE = 'https://api.pipecat.daily.co/v1';

exports.initializeDailyBot = onCall({}, async (request) => {
  const { data, auth } = request;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  const pipecatApiKey = resolvePipecatApiKey();

  if (!pipecatApiKey) {
    logger.warn('PIPECAT_API_KEY not configured, returning placeholder');
    return {
      websocket_url: null,
      status: 'not_configured',
      message: 'Pipecat Cloud not configured. Set PIPECAT_API_KEY to enable AI interview coaching.'
    };
  }

  try {
    const {
      roomUrl,
      roomName,
      agentType = 'interview-coach',
      services = {},
    } = data || {};

    if (!roomUrl && !roomName) {
      throw new HttpsError('invalid-argument', 'Room URL or room name is required');
    }

    const targetRoomUrl = roomUrl || `https://hiapply.daily.co/${roomName}`;

    const agentPayload = {
      room_url: targetRoomUrl,
      agent_name: agentType,
      agent_config: {
        tts: {
          service: services.tts || 'cartesia',
          voice_id: services.voiceId || undefined,
        },
        stt: {
          service: services.stt || 'deepgram',
          model: 'nova-2',
          language: 'en',
        },
        llm: {
          service: 'google',
          model: process.env.GEMINI_MODEL || 'gemini-3.1-pro-preview',
        },
        vad: {
          smart_turn: true,
        },
      },
    };

    const response = await axios.post(
      `${PIPECAT_API_BASE}/agents`,
      agentPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pipecatApiKey}`
        },
        timeout: 30000,
      }
    );

    const agentData = response.data;

    return {
      websocket_url: agentData.websocket_url || agentData.data_channel_url || null,
      agent_id: agentData.agent_id || null,
      status: 'connected',
      room_url: targetRoomUrl,
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error('initializeDailyBot error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      throw new HttpsError('unauthenticated', 'Invalid Pipecat API key');
    }
    if (error.response?.status === 429) {
      throw new HttpsError('resource-exhausted', 'Pipecat API rate limit exceeded');
    }

    throw new HttpsError('internal', error.response?.data?.message || error.message || 'Failed to initialize AI agent');
  }
});
