'use strict';

const StreamEventType = {
  SESSION: 'session',
  THINKING: 'thinking',
  TOOL_CALL: 'tool_call',
  TOOL_PROGRESS: 'tool_progress',
  TOOL_RESULT: 'tool_result',
  TOKEN: 'token',
  ERROR: 'error',
  DONE: 'done',
  PENDING_CONFIRMATION: 'pending_confirmation',
};

const HIGH_IMPACT_TOOLS = [
  'send_outreach_email',
  'send_email',
  'send_campaign_email',
  'schedule_interview',
  'share_google_doc',
];

const MAX_TOOL_CALLS_PER_TURN = 5;

const KEEPALIVE_INTERVAL_MS = 10000;

module.exports = {
  StreamEventType,
  HIGH_IMPACT_TOOLS,
  MAX_TOOL_CALLS_PER_TURN,
  KEEPALIVE_INTERVAL_MS,
};
