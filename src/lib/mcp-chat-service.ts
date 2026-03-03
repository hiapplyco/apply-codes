import { auth } from '@/lib/firebase';
import type { MCPChatEvent, PendingConfirmation } from '@/types/mcp-chat';

interface MCPChatOptions {
  message: string;
  sessionId: string | null;
  projectId?: string | null;
  history?: Array<{ role: string; content: string }>;
  confirmation?: {
    confirmationId: string;
    approved: boolean;
    tool: string;
    args: Record<string, unknown>;
  };
  attachments?: Array<{ name: string; content: string }>;
  signal?: AbortSignal;
  onEvent: (event: MCPChatEvent) => void;
}

const MCP_CHAT_ENDPOINT = '/api/mcp-chat/stream';
const STALE_TIMEOUT_MS = 45_000;

export async function streamMCPChat(options: MCPChatOptions): Promise<void> {
  const { message, sessionId, projectId, history, confirmation, attachments, signal, onEvent } = options;

  const currentUser = auth?.currentUser;
  if (!currentUser) {
    throw new Error('Not authenticated');
  }

  const token = await currentUser.getIdToken();

  const body: Record<string, unknown> = {
    message,
    session_id: sessionId,
  };

  if (projectId) body.project_id = projectId;
  if (history?.length) body.history = history;
  if (confirmation) body.confirmation = confirmation;
  if (attachments?.length) body.attachments = attachments;

  const response = await fetch(MCP_CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`MCP Chat request failed (${response.status}): ${errorText}`);
  }

  if (!response.body) {
    throw new Error('Streaming not supported by this browser');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let lastEventTime = Date.now();

  const staleTimer = setInterval(() => {
    if (Date.now() - lastEventTime > STALE_TIMEOUT_MS) {
      console.warn('[mcp-chat] No events received for 45s, connection may be stale');
    }
  }, 10_000);

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith(': ')) continue;
        if (!line.startsWith('data: ')) continue;

        lastEventTime = Date.now();

        try {
          const data = JSON.parse(line.slice(6)) as MCPChatEvent;
          onEvent(data);
        } catch (parseError) {
          console.warn('[mcp-chat] Failed to parse SSE data:', line, parseError);
        }
      }
    }
  } finally {
    clearInterval(staleTimer);
    reader.releaseLock();
  }
}

export function buildConfirmationPayload(
  pending: PendingConfirmation,
  approved: boolean
): MCPChatOptions['confirmation'] {
  return {
    confirmationId: pending.confirmationId,
    approved,
    tool: pending.tool,
    args: pending.args as Record<string, unknown>,
  };
}
