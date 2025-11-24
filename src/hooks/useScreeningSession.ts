import { useState, useEffect, useCallback } from 'react';
import { createChatSession } from '@/utils/sessionUtils';
import { toast } from 'sonner';
import { useNewAuth } from '@/context/NewAuthContext';

export const useScreeningSession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { user } = useNewAuth();

  const initializeChat = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const chatSession = await createChatSession(user.uid);
      setSessionId(chatSession?.id ?? null);
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Failed to initialize chat session');
    }
  }, [user?.uid]);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  return { sessionId, setSessionId };
};
