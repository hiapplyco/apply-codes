import { useState, useEffect, useCallback, useRef } from 'react';
import { AgentOrchestrator } from '@/lib/orchestration/AgentOrchestrator';
import { MessageBus } from '@/lib/orchestration/protocols/MessageBus';
import { WORKFLOW_TEMPLATES, createCustomWorkflow } from '@/lib/orchestration/workflows/templates';
import { 
  WorkflowDefinition, 
  WorkflowInstance, 
  AgentContext,
  AgentMessage,
  AgentMetrics
} from '@/types/orchestration';
import { useNewAuth } from '@/context/NewAuthContext';
import { useProjectContext } from '@/context/ProjectContext';
import { toast } from 'sonner';

interface UseOrchestrationOptions {
  autoInitialize?: boolean;
  maxConcurrentAgents?: number;
  enableMonitoring?: boolean;
}

interface OrchestrationState {
  isInitialized: boolean;
  activeWorkflows: WorkflowInstance[];
  agentMetrics: AgentMetrics[];
  orchestratorStatus: any;
}

export const useOrchestration = (options?: UseOrchestrationOptions) => {
  const { user } = useNewAuth();
  const { currentProject } = useProjectContext();
  const orchestratorRef = useRef<AgentOrchestrator | null>(null);
  const messageBusRef = useRef<MessageBus | null>(null);

  const [state, setState] = useState<OrchestrationState>({
    isInitialized: false,
    activeWorkflows: [],
    agentMetrics: [],
    orchestratorStatus: null
  });

  const [isLoading, setIsLoading] = useState(false);

  // Initialize orchestrator
  const initialize = useCallback(async () => {
    if (orchestratorRef.current || !user) return;

    setIsLoading(true);
    try {
      // Create message bus
      const messageBus = new MessageBus();
      messageBusRef.current = messageBus;

      // Create orchestrator
      const orchestrator = new AgentOrchestrator({
        maxConcurrentAgents: options?.maxConcurrentAgents,
        monitoring: {
          enabled: options?.enableMonitoring ?? true,
          metricsInterval: 30000
        }
      });

      // Set up event listeners
      orchestrator.on('agent:created', (data) => {
        console.log('Agent created:', data);
      });

      orchestrator.on('workflow:started', (data) => {
        toast.info(`Workflow started: ${data.definition}`);
      });

      orchestrator.on('workflow:completed', (data) => {
        toast.success(`Workflow completed in ${data.duration}ms`);
        updateActiveWorkflows();
      });

      orchestrator.on('task:error', (data) => {
        toast.error(`Task error: ${data.error}`);
      });

      orchestrator.on('metrics:collected', (metrics) => {
        setState(prev => ({
          ...prev,
          agentMetrics: metrics.agents,
          orchestratorStatus: {
            activeAgents: metrics.orchestrator.activeAgents,
            activeWorkflows: metrics.orchestrator.activeWorkflows,
            messageQueueSize: metrics.orchestrator.messageQueueSize
          }
        }));
      });

      // Initialize orchestrator
      await orchestrator.initialize();
      orchestratorRef.current = orchestrator;

      setState(prev => ({ ...prev, isInitialized: true }));
      toast.success('AI Orchestration initialized');
    } catch (error) {
      console.error('Failed to initialize orchestration:', error);
      toast.error('Failed to initialize AI orchestration');
    } finally {
      setIsLoading(false);
    }
  }, [user, options]);

  // Auto-initialize if requested
  useEffect(() => {
    if (options?.autoInitialize && user && !orchestratorRef.current) {
      initialize();
    }
  }, [options?.autoInitialize, user, initialize]);

  // Update active workflows
  const updateActiveWorkflows = useCallback(() => {
    if (!orchestratorRef.current) return;
    
    const status = orchestratorRef.current.getOrchestratorStatus();
    setState(prev => ({
      ...prev,
      orchestratorStatus: status
    }));
  }, []);

  // Execute a workflow
  const executeWorkflow = useCallback(async (
    workflowId: string,
    input?: any
  ): Promise<WorkflowInstance | null> => {
    if (!orchestratorRef.current) {
      toast.error('Orchestrator not initialized');
      return null;
    }

    const workflow = WORKFLOW_TEMPLATES[workflowId];
    if (!workflow) {
      toast.error(`Unknown workflow: ${workflowId}`);
      return null;
    }

    const context: AgentContext = {
      userId: user?.id || '',
      sessionId: `session-${Date.now()}`,
      projectId: currentProject?.id,
      metadata: {
        workflowId,
        input
      }
    };

    try {
      setIsLoading(true);
      
      // Prepare workflow with input
      const preparedWorkflow = prepareWorkflowWithInput(workflow, input);
      
      const instance = await orchestratorRef.current.executeWorkflow(
        preparedWorkflow,
        context
      );

      setState(prev => ({
        ...prev,
        activeWorkflows: [...prev.activeWorkflows, instance]
      }));

      return instance;
    } catch (error) {
      console.error('Workflow execution failed:', error);
      toast.error('Failed to execute workflow');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, currentProject]);

  // Execute custom workflow
  const executeCustomWorkflow = useCallback(async (
    params: Parameters<typeof createCustomWorkflow>[0]
  ): Promise<WorkflowInstance | null> => {
    if (!orchestratorRef.current) {
      toast.error('Orchestrator not initialized');
      return null;
    }

    const workflow = createCustomWorkflow(params);
    const context: AgentContext = {
      userId: user?.id || '',
      sessionId: `session-${Date.now()}`,
      projectId: currentProject?.id,
      metadata: {
        customWorkflow: true,
        params
      }
    };

    try {
      setIsLoading(true);
      const instance = await orchestratorRef.current.executeWorkflow(workflow, context);
      
      setState(prev => ({
        ...prev,
        activeWorkflows: [...prev.activeWorkflows, instance]
      }));

      return instance;
    } catch (error) {
      console.error('Custom workflow execution failed:', error);
      toast.error('Failed to execute custom workflow');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, currentProject]);

  // Send message to agent
  const sendMessage = useCallback((message: Omit<AgentMessage, 'id' | 'timestamp'>) => {
    if (!orchestratorRef.current) {
      console.warn('Cannot send message: orchestrator not initialized');
      return;
    }

    const fullMessage: AgentMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    orchestratorRef.current.sendMessage(fullMessage);
    messageBusRef.current?.publish(fullMessage);
  }, []);

  // Subscribe to messages
  const subscribeToMessages = useCallback((
    pattern: string | RegExp,
    handler: (message: AgentMessage) => void
  ): (() => void) => {
    if (!messageBusRef.current) {
      console.warn('Cannot subscribe: message bus not initialized');
      return () => {};
    }

    const handlerId = messageBusRef.current.subscribe(pattern, handler);
    
    return () => {
      messageBusRef.current?.unsubscribe(handlerId);
    };
  }, []);

  // Get workflow status
  const getWorkflowStatus = useCallback((workflowId: string): WorkflowInstance | undefined => {
    return state.activeWorkflows.find(w => w.id === workflowId);
  }, [state.activeWorkflows]);

  // Pause workflow
  const pauseWorkflow = useCallback(async (workflowId: string) => {
    if (!orchestratorRef.current) return;
    
    try {
      await orchestratorRef.current.pauseWorkflow(workflowId);
      toast.info('Workflow paused');
      updateActiveWorkflows();
    } catch (error) {
      console.error('Failed to pause workflow:', error);
      toast.error('Failed to pause workflow');
    }
  }, [updateActiveWorkflows]);

  // Resume workflow
  const resumeWorkflow = useCallback(async (workflowId: string) => {
    if (!orchestratorRef.current) return;
    
    try {
      await orchestratorRef.current.resumeWorkflow(workflowId);
      toast.info('Workflow resumed');
      updateActiveWorkflows();
    } catch (error) {
      console.error('Failed to resume workflow:', error);
      toast.error('Failed to resume workflow');
    }
  }, [updateActiveWorkflows]);

  // Shutdown orchestrator
  const shutdown = useCallback(async () => {
    if (!orchestratorRef.current) return;
    
    try {
      await orchestratorRef.current.shutdown();
      orchestratorRef.current = null;
      messageBusRef.current = null;
      
      setState({
        isInitialized: false,
        activeWorkflows: [],
        agentMetrics: [],
        orchestratorStatus: null
      });
      
      toast.info('AI Orchestration shutdown');
    } catch (error) {
      console.error('Failed to shutdown orchestration:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (orchestratorRef.current) {
        orchestratorRef.current.shutdown();
      }
    };
  }, []);

  return {
    // State
    isInitialized: state.isInitialized,
    isLoading,
    activeWorkflows: state.activeWorkflows,
    agentMetrics: state.agentMetrics,
    orchestratorStatus: state.orchestratorStatus,
    
    // Actions
    initialize,
    executeWorkflow,
    executeCustomWorkflow,
    sendMessage,
    subscribeToMessages,
    getWorkflowStatus,
    pauseWorkflow,
    resumeWorkflow,
    shutdown,
    
    // Templates
    workflowTemplates: WORKFLOW_TEMPLATES
  };
};

// Helper function to prepare workflow with input
function prepareWorkflowWithInput(
  workflow: WorkflowDefinition,
  input: any
): WorkflowDefinition {
  if (!input) return workflow;

  // Deep clone the workflow
  const prepared = JSON.parse(JSON.stringify(workflow));

  // Merge input into each step's task input
  prepared.steps.forEach((step: any) => {
    if (step.task && step.task.input) {
      step.task.input = {
        ...step.task.input,
        ...input
      };
    }
  });

  return prepared;
}