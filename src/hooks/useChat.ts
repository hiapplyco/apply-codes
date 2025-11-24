
import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNewAuth } from '@/context/NewAuthContext';
import { toast } from "sonner";

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: string[];
  timestamp?: Date;
  sessionId?: string;
}

export const useChat = (callId: string | null, mode: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { user } = useNewAuth();

  // Set up real-time message listener
  useEffect(() => {
    if (!callId || !db || !user) {
      setIsLoading(false);
      return;
    }

    let unsubscribeMessages: (() => void) | undefined;

    const setupMessageListener = async () => {
      try {
        // First, try to get or create a session for this call
        const sessionDocRef = doc(db, 'chat_sessions', callId);
        const sessionSnapshot = await getDoc(sessionDocRef);

        if (!sessionSnapshot.exists()) {
          // Create new session if it doesn't exist
          await addDoc(collection(db, 'chat_sessions'), {
            id: callId,
            callId,
            userId: user.uid,
            title: `Chat for call ${callId}`,
            createdAt: serverTimestamp(),
            mode
          });
        }

        setSessionId(callId);

        // Set up real-time listener for messages in this session
        const messagesQuery = query(
          collection(db, 'chat_messages'),
          where('sessionId', '==', callId),
          orderBy('timestamp', 'asc')
        );

        unsubscribeMessages = onSnapshot(
          messagesQuery,
          (snapshot) => {
            const chatMessages: ChatMessage[] = [];

            snapshot.forEach((doc) => {
              const data = doc.data();
              chatMessages.push({
                id: doc.id,
                role: data.role,
                content: data.content,
                sources: data.sources,
                timestamp: data.timestamp?.toDate(),
                sessionId: data.sessionId
              });
            });

            setMessages(chatMessages);
            setIsLoading(false);
          },
          (error) => {
            console.error('Error listening to messages:', error);
            toast.error('Failed to load messages');
            setIsLoading(false);
          }
        );

        // Generate initial summary if in kickoff mode and no messages exist
        if (mode === 'kickoff' && messages.length === 0) {
          await generateInitialSummary();
        }

      } catch (error) {
        console.error('Error setting up message listener:', error);
        toast.error('Failed to set up chat');
        setIsLoading(false);
      }
    };

    setupMessageListener();

    return () => {
      if (unsubscribeMessages) {
        unsubscribeMessages();
      }
    };
  }, [callId, mode, user]);

  const generateInitialSummary = async () => {
    if (!callId || !db) return;

    try {
      setIsGenerating(true);

      // Call Firebase Cloud Function to process kickoff call
      const functionUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL || 'https://us-central1-apply-codes.cloudfunctions.net';
      const response = await fetch(`${functionUrl}/process-kickoff-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callId,
          mode
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const summaryData = await response.json();

      if (summaryData.summary) {
        // Add system message with summary to Firestore
        await addDoc(collection(db, 'chat_messages'), {
          sessionId: callId,
          role: 'system',
          content: summaryData.summary,
          sources: summaryData.sources || [],
          timestamp: serverTimestamp(),
          userId: user?.id
        });
      }

    } catch (error) {
      console.error('Error generating initial summary:', error);
      toast.error('Failed to generate summary');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !callId || !db || !user) return;

    const userMessage = { role: 'user' as const, content: input };
    const messageContent = input;
    setInput('');

    try {
      setIsLoading(true);

      // Add user message to Firestore
      await addDoc(collection(db, 'chat_messages'), {
        sessionId: callId,
        role: userMessage.role,
        content: userMessage.content,
        timestamp: serverTimestamp(),
        userId: user.uid
      });

      // Process chat message via Firebase Cloud Function
      const functionUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL || 'https://us-central1-apply-codes.cloudfunctions.net';
      const response = await fetch(`${functionUrl}/process-chat-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callId,
          sessionId: callId,
          message: messageContent,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process message');
      }

      const responseData = await response.json();

      // Add assistant response to Firestore
      if (responseData.response) {
        await addDoc(collection(db, 'chat_messages'), {
          sessionId: callId,
          role: 'assistant',
          content: responseData.response,
          sources: responseData.sources || [],
          timestamp: serverTimestamp(),
          userId: user.uid
        });
      }

    } catch (error) {
      console.error('Error in chat:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    input,
    setInput,
    isLoading,
    isGenerating,
    handleSubmit
  };
};
