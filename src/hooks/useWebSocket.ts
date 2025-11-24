
import { useRef, useEffect } from 'react';
import { setupWebSocketEventHandlers, initializeWebSocketConnection } from '@/utils/websocketUtils';

export const useWebSocket = (sessionId: string | null) => {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const setupConnection = async () => {
      try {
        // Only attempt to connect if we have a valid sessionId
        if (!sessionId) {
          console.log('No sessionId provided for WebSocket connection');
          return;
        }
        
        const websocketUrl = await initializeWebSocketConnection();
        
        // Check if we have a valid websocketUrl
        if (!websocketUrl) {
          console.error('Failed to get valid WebSocket URL');
          return;
        }
        
        const ws = new WebSocket(websocketUrl);
        wsRef.current = ws;

        setupWebSocketEventHandlers(ws, sessionId);
      } catch (error) {
        console.error('Error initializing WebSocket:', error);
        // No toast for connection errors
      }
    };

    setupConnection();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [sessionId]);

  return wsRef;
};
