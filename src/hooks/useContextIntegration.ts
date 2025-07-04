import { useCallback, useEffect, useState } from 'react';
import { useProjectContext } from '@/context/ProjectContext';
import { ContextIntegrationService, ContextContent, PipecatContext } from '@/services/ContextIntegrationService';
import { toast } from 'sonner';

export interface UseContextIntegrationProps {
  /** Current page context */
  context: 'sourcing' | 'meeting' | 'chat' | 'job-posting' | 'screening' | 'general';
  
  /** Session ID for WebSocket connections */
  sessionId?: string;
  
  /** Meeting ID for meeting-specific contexts */
  meetingId?: string;
  
  /** Enable real-time processing */
  enableRealTime?: boolean;
  
  /** Agent orchestration configuration */
  agentConfig?: {
    agentTypes: string[];
    maxConcurrency: number;
    contextPropagation: boolean;
  };
}

export interface UseContextIntegrationReturn {
  /** Process content with full orchestration */
  processContent: (content: ContextContent) => Promise<any>;
  
  /** Send content to WebSocket for real-time processing */
  sendToWebSocket: (content: ContextContent) => Promise<void>;
  
  /** Get project context data */
  getProjectContext: () => Promise<any[]>;
  
  /** Processing state */
  isProcessing: boolean;
  
  /** WebSocket connection state */
  isWebSocketConnected: boolean;
  
  /** Last processed content */
  lastProcessedContent: ContextContent | null;
  
  /** Cleanup function */
  cleanup: () => void;
}

export const useContextIntegration = ({
  context,
  sessionId,
  meetingId,
  enableRealTime = false,
  agentConfig = {
    agentTypes: ['RecruitmentAgent', 'ProfileEnrichmentAgent'],
    maxConcurrency: 3,
    contextPropagation: true
  }
}: UseContextIntegrationProps): UseContextIntegrationReturn => {
  const { selectedProject } = useProjectContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [lastProcessedContent, setLastProcessedContent] = useState<ContextContent | null>(null);
  const [integrationService] = useState(() => ContextIntegrationService.getInstance());

  // Initialize WebSocket connection if needed
  useEffect(() => {
    if (enableRealTime && sessionId) {
      const initializeWebSocket = async () => {
        try {
          await integrationService.connectWebSocket(sessionId, (data) => {
            console.log('WebSocket message received:', data);
            // Handle real-time messages
            if (data.type === 'agent-response' && data.content) {
              toast.success('AI agent processed your content');
            }
          });
          setIsWebSocketConnected(true);
        } catch (error) {
          console.error('WebSocket initialization error:', error);
          toast.error('Failed to connect real-time processing');
        }
      };

      initializeWebSocket();
    }

    // Cleanup on unmount
    return () => {
      if (sessionId) {
        setIsWebSocketConnected(false);
      }
    };
  }, [enableRealTime, sessionId, integrationService]);

  // Process content with orchestration
  const processContent = useCallback(async (content: ContextContent): Promise<any> => {
    setIsProcessing(true);
    
    try {
      const pipecatContext: PipecatContext = {
        sessionId,
        meetingId,
        context,
        projectId: selectedProject?.id
      };

      const result = await integrationService.processWithOrchestration(
        content,
        pipecatContext,
        {
          enableRealTimeProcessing: enableRealTime,
          ...agentConfig
        }
      );

      setLastProcessedContent(content);
      
      // Show success notification
      toast.success(`${content.type} content processed successfully`);
      
      return result;
    } catch (error) {
      console.error('Content processing error:', error);
      toast.error(`Failed to process ${content.type} content`);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [context, sessionId, meetingId, selectedProject, enableRealTime, agentConfig, integrationService]);

  // Send content to WebSocket
  const sendToWebSocket = useCallback(async (content: ContextContent): Promise<void> => {
    if (!sessionId || !isWebSocketConnected) {
      throw new Error('WebSocket not connected');
    }

    try {
      const pipecatContext: PipecatContext = {
        sessionId,
        meetingId,
        context,
        projectId: selectedProject?.id
      };

      await integrationService.sendContentToWebSocket(sessionId, content, pipecatContext);
      toast.success('Content sent for real-time processing');
    } catch (error) {
      console.error('WebSocket send error:', error);
      toast.error('Failed to send content for real-time processing');
      throw error;
    }
  }, [sessionId, meetingId, context, selectedProject, isWebSocketConnected, integrationService]);

  // Get project context data
  const getProjectContext = useCallback(async (): Promise<any[]> => {
    if (!selectedProject?.id) {
      return [];
    }

    try {
      const contextData = await integrationService.getProjectContext(selectedProject.id, context);
      return contextData;
    } catch (error) {
      console.error('Failed to get project context:', error);
      toast.error('Failed to load project context');
      return [];
    }
  }, [selectedProject, context, integrationService]);

  // Cleanup function
  const cleanup = useCallback(() => {
    integrationService.cleanup();
    setIsWebSocketConnected(false);
    setLastProcessedContent(null);
  }, [integrationService]);

  return {
    processContent,
    sendToWebSocket,
    getProjectContext,
    isProcessing,
    isWebSocketConnected,
    lastProcessedContent,
    cleanup
  };
};

export default useContextIntegration;