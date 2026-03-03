'use strict';

const { KEEPALIVE_INTERVAL_MS } = require('./types');

function initSSE(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
}

function createEventSender(res) {
  let closed = false;

  res.on('close', () => {
    closed = true;
  });

  function sendEvent(type, data) {
    if (closed) return;
    const payload = { type, ...data };
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }

  function sendComment(text) {
    if (closed) return;
    res.write(`: ${text}\n\n`);
  }

  function end() {
    if (closed) return;
    closed = true;
    res.end();
  }

  function isClosed() {
    return closed;
  }

  return { sendEvent, sendComment, end, isClosed };
}

function startKeepalive(sender) {
  const interval = setInterval(() => {
    if (sender.isClosed()) {
      clearInterval(interval);
      return;
    }
    sender.sendComment('keepalive');
  }, KEEPALIVE_INTERVAL_MS);

  return () => clearInterval(interval);
}

module.exports = { initSSE, createEventSender, startKeepalive };
