const { logger } = require("firebase-functions/v2");
const axios = require('axios');

const DAILY_API_BASE = 'https://api.daily.co/v1';

const resolveDailyApiKey = () => {
  return process.env.DAILY_API_KEY || null;
};

const resolvePipecatApiKey = () => {
  return process.env.PIPECAT_API_KEY || null;
};

function getDailyHeaders(apiKey) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`
  };
}

async function generateMeetingToken(apiKey, roomName, userId, options = {}) {
  const tokenPayload = {
    properties: {
      room_name: roomName,
      user_id: userId,
      user_name: options.userName || undefined,
      enable_recording: options.enableRecording !== false ? 'cloud' : undefined,
      enable_screenshare: true,
      start_cloud_recording: options.startCloudRecording || false,
      exp: Math.floor(Date.now() / 1000) + (options.tokenExpiresIn || 3600),
      is_owner: options.isOwner || false,
    }
  };

  const response = await axios.post(
    `${DAILY_API_BASE}/meeting-tokens`,
    tokenPayload,
    { headers: getDailyHeaders(apiKey) }
  );

  return response.data.token;
}

// Allowlisted room properties that callers can override
const ALLOWED_ROOM_OVERRIDES = [
  'enable_chat',
  'enable_screenshare',
  'max_participants',
  'start_audio_off',
  'start_video_off',
];

function sanitizeRoomProperties(properties) {
  if (!properties || typeof properties !== 'object') return {};
  return Object.fromEntries(
    Object.entries(properties).filter(([key]) => ALLOWED_ROOM_OVERRIDES.includes(key))
  );
}

module.exports = {
  DAILY_API_BASE,
  resolveDailyApiKey,
  resolvePipecatApiKey,
  getDailyHeaders,
  generateMeetingToken,
  sanitizeRoomProperties,
};
