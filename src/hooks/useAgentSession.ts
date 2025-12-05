/**
 * Hook for managing ADK agent chat sessions.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNewAuth } from '@/context/NewAuthContext';

interface AgentSession {
  sessionId: string | null;
  isStreaming: boolean;
  model: string | null;
  complexity: string | null;
}

interface UseAgentSessionOptions {
  projectId?: string | null;
  autoCreate?: boolean;
}

export function useAgentSession(options: UseAgentSessionOptions = {}) {
  const { projectId, autoCreate = true } = options;
  const { user } = useNewAuth();
  const [session, setSession] = useState<AgentSession>({
    sessionId: null,
    isStreaming: false,
    model: null,
    complexity: null,
  });

  // Create new session when user or project changes
  useEffect(() => {
    if (autoCreate && user?.id) {
      const newSessionId = `session_${user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      setSession(prev => ({
        ...prev,
        sessionId: newSessionId,
        model: null,
        complexity: null,
      }));
    }
  }, [user?.id, projectId, autoCreate]);

  const setSessionId = useCallback((sessionId: string | null) => {
    setSession(prev => ({ ...prev, sessionId }));
  }, []);

  const setStreaming = useCallback((isStreaming: boolean) => {
    setSession(prev => ({ ...prev, isStreaming }));
  }, []);

  const setModelInfo = useCallback((model: string | null, complexity: string | null) => {
    setSession(prev => ({ ...prev, model, complexity }));
  }, []);

  const resetSession = useCallback(() => {
    if (user?.id) {
      const newSessionId = `session_${user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      setSession({
        sessionId: newSessionId,
        isStreaming: false,
        model: null,
        complexity: null,
      });
    }
  }, [user?.id]);

  return {
    ...session,
    setSessionId,
    setStreaming,
    setModelInfo,
    resetSession,
  };
}

export default useAgentSession;
