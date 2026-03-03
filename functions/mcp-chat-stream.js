'use strict';

const { onRequest } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions/v2');
const { withAuth } = require('./utils/auth-cors');
const { initSSE, createEventSender, startKeepalive } = require('./mcp-chat/sse-transport');
const { orchestrate } = require('./mcp-chat/gemini-orchestrator');
const { validateSecrets } = require('./mcp-chat/secrets-bridge');
const { StreamEventType } = require('./mcp-chat/types');

// All API keys are provided via process.env from functions/.env
// No defineSecret needed — avoids Cloud Run overlap with .env vars

exports.mcpChatStream = onRequest(
  {
    timeoutSeconds: 540,
    memory: '1GiB',
    cors: false,
  },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      });
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const authResult = await withAuth(req, res, { optional: false });
    if (authResult === false) return;

    const secretsCheck = validateSecrets();
    if (!secretsCheck.valid) {
      res.status(503).json({
        error: 'Service not configured',
        missing: secretsCheck.missing,
      });
      return;
    }

    const { message, session_id, project_id, history, confirmation } = req.body || {};

    if (!message && !confirmation) {
      res.status(400).json({ error: 'message or confirmation is required' });
      return;
    }

    const sessionId = session_id || `mcp_${Date.now()}_${authResult.uid}`;

    initSSE(res);
    const sender = createEventSender(res);
    const stopKeepalive = startKeepalive(sender);

    try {
      await orchestrate(
        message || '',
        history,
        (type, data) => sender.sendEvent(type, data),
        {
          sessionId,
          projectId: project_id,
          uid: authResult.uid,
          confirmation,
        }
      );
    } catch (err) {
      logger.error('[mcp-chat-stream] Orchestration error:', err);
      sender.sendEvent(StreamEventType.ERROR, {
        message: err.message || 'Internal error',
        code: 'ORCHESTRATION_ERROR',
      });
      sender.sendEvent(StreamEventType.DONE, {});
    } finally {
      stopKeepalive();
      sender.end();
    }
  }
);
