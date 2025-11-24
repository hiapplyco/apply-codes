
import { toast } from "sonner";
import { functionBridge } from "@/lib/function-bridge";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export const initializeWebSocketConnection = async () => {
  const response = await functionBridge.initializeDailyBot();
  if (!response?.websocket_url) {
    throw new Error('Failed to initialize Daily bot connection');
  }
  return response.websocket_url;
};

export const setupWebSocketEventHandlers = (
  ws: WebSocket, 
  sessionId: string | null,
  onError?: (error: ErrorEvent) => void
) => {
  ws.onopen = () => {
    console.log('WebSocket Connected');
    ws.send(JSON.stringify({
      setup: {
        generation_config: { response_modalities: ["TEXT"] }
      }
    }));
  };

  ws.onmessage = async (event: MessageEvent) => {
    try {
      const response = JSON.parse(event.data as string);
      
      if (response.text && sessionId && db) {
        await addDoc(collection(db, 'chatMessages'), {
          sessionId,
          role: 'assistant',
          content: response.text,
          createdAt: serverTimestamp()
        });

        toast.success('Received response from assistant');
      }

      if (response.error) {
        console.error('WebSocket response error:', response.error);
        // Only show toast for application-level errors, not connection errors
        if (typeof response.error === 'string' && !response.error.includes('connection')) {
          toast.error(response.error);
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      // Don't show toast for parsing errors as they may be related to connection issues
    }
  };

  ws.onerror = (error: ErrorEvent) => {
    console.error('WebSocket error:', error);
    if (onError) onError(error);
    // Remove toast notification for WebSocket connection errors
    // They are expected in some environments and don't affect core functionality
  };

  ws.onclose = () => {
    console.log('WebSocket connection closed');
  };
};
