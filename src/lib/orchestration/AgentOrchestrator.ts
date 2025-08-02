import { EventEmitter } from 'events';
import { 
  AgentType, 
  AgentContext, 
  AgentTask,
  AgentResult,
  AgentMessage,
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowStatus,
  OrchestrationConfig
} from '@/types/orchestration';
import { BaseAgent } from './agents/BaseAgent';
import { SourcingAgent } from './agents/SourcingAgent';
import { EnrichmentAgent } from './agents/EnrichmentAgent';
import { PlanningAgent } from './agents/PlanningAgent';
import { supabase } from '@/integrations/supabase/client';

export class AgentOrchestrator extends EventEmitter {
  private agents: Map<string, BaseAgent> = new Map();
  private workflows: Map<string, WorkflowInstance> = new Map();
  private messageQueue: AgentMessage[] = [];
  private config: OrchestrationConfig;
  private isRunning: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<OrchestrationConfig>) {
    super();
    this.config = {
      maxConcurrentAgents: config?.maxConcurrentAgents || 10,
      defaultTimeout: config?.defaultTimeout || 300000, // 5 minutes
      retryPolicy: config?.retryPolicy || {
        maxAttempts: 3,
        backoffMs: 1000
      },
      monitoring: config?.monitoring || {
        enabled: true,
        metricsInterval: 30000 // 30 seconds
      }
    };
  }

  public async initialize(): Promise<void> {
    this.isRunning = true;
    this.startMessageProcessing();
    
    if (this.config.monitoring.enabled) {
      this.startMetricsCollection();
    }

    this.emit('orchestrator:initialized');
  }

  public async createAgent(
    type: AgentType, 
    context: AgentContext
  ): Promise<BaseAgent> {
    if (this.agents.size >= this.config.maxConcurrentAgents) {
      throw new Error('Maximum concurrent agents reached');
    }

    let agent: BaseAgent;

    switch (type) {
      case 'sourcing':
        agent = new SourcingAgent(context);
        break;
      case 'enrichment':
        agent = new EnrichmentAgent(context);
        break;
      case 'planning':
        agent = new PlanningAgent(context);
        break;
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }

    // Set up agent event listeners
    this.setupAgentListeners(agent);

    // Register agent
    this.agents.set(agent.getId(), agent);

    this.emit('agent:created', {
      agentId: agent.getId(),
      type: agent.getType()
    });

    return agent;
  }

  public async executeWorkflow(
    definition: WorkflowDefinition,
    context: AgentContext
  ): Promise<WorkflowInstance> {
    const instance: WorkflowInstance = {
      id: `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workflowId: definition.id,
      status: 'pending',
      context,
      results: {},
      startedAt: new Date()
    };

    this.workflows.set(instance.id, instance);

    this.emit('workflow:started', {
      workflowId: instance.id,
      definition: definition.name
    });

    try {
      instance.status = 'running';
      
      // Execute workflow steps
      for (const step of definition.steps) {
        if (instance.status !== 'running') break;

        instance.currentStep = step.id;
        
        // Check dependencies
        if (step.dependencies?.length) {
          const dependenciesComplete = step.dependencies.every(
            depId => instance.results[depId]?.status === 'success'
          );
          
          if (!dependenciesComplete) {
            throw new Error(`Dependencies not met for step: ${step.id}`);
          }
        }

        // Execute step
        const result = await this.executeWorkflowStep(step, instance);
        instance.results[step.id] = result;

        // Handle step result
        if (result.status === 'failure' && step.onFailure) {
          // Execute failure handling steps
          console.log(`Step ${step.id} failed, executing failure handlers`);
        }
      }

      instance.status = 'completed';
      instance.completedAt = new Date();

    } catch (error) {
      instance.status = 'failed';
      instance.error = error instanceof Error ? error.message : String(error);
      instance.completedAt = new Date();
    }

    this.emit('workflow:completed', {
      workflowId: instance.id,
      status: instance.status,
      duration: instance.completedAt!.getTime() - instance.startedAt.getTime()
    });

    await this.saveWorkflowInstance(instance);
    return instance;
  }

  private async executeWorkflowStep(
    step: any,
    instance: WorkflowInstance
  ): Promise<AgentResult> {
    // Create or reuse agent
    const agent = await this.createAgent(step.agentType, instance.context);

    // Create task from step
    const task: AgentTask = {
      id: `task-${step.id}-${Date.now()}`,
      ...step.task,
      priority: step.task.priority || 'medium'
    };

    // Check if step should run in parallel
    if (step.parallel && step.dependencies) {
      // Execute in parallel with dependencies
      return this.executeParallelTask(agent, task);
    }

    // Execute task
    return agent.processTask(task);
  }

  private async executeParallelTask(
    agent: BaseAgent,
    task: AgentTask
  ): Promise<AgentResult> {
    // Implementation for parallel task execution
    return agent.processTask(task);
  }

  public async sendMessage(message: AgentMessage): Promise<void> {
    this.messageQueue.push(message);
  }

  private startMessageProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processMessageQueue();
    }, 100); // Process messages every 100ms
  }

  private async processMessageQueue(): Promise<void> {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      
      // Find target agent
      const targetAgent = this.agents.get(message.to);
      if (targetAgent) {
        await targetAgent.handleMessage(message);
      } else if (message.to === 'orchestrator') {
        await this.handleOrchestratorMessage(message);
      } else {
        console.warn(`No agent found for message to: ${message.to}`);
      }
    }
  }

  private async handleOrchestratorMessage(message: AgentMessage): Promise<void> {
    switch (message.action) {
      case 'create_agent':
        const { type, context } = message.payload;
        const agent = await this.createAgent(type, context);
        this.sendOrchestratorResponse(message.from, 'agent_created', {
          agentId: agent.getId()
        });
        break;
        
      case 'get_status':
        const status = this.getOrchestratorStatus();
        this.sendOrchestratorResponse(message.from, 'status', status);
        break;
        
      case 'list_agents':
        const agents = Array.from(this.agents.values()).map(a => ({
          id: a.getId(),
          type: a.getType(),
          status: a.getStatus(),
          capabilities: a.getCapabilities()
        }));
        this.sendOrchestratorResponse(message.from, 'agents_list', agents);
        break;
        
      default:
        console.log(`Unknown orchestrator action: ${message.action}`);
    }
  }

  private sendOrchestratorResponse(to: string, action: string, payload: any): void {
    const response: AgentMessage = {
      id: crypto.randomUUID(),
      from: 'orchestrator',
      to,
      type: 'response',
      action,
      payload,
      timestamp: new Date()
    };
    
    this.sendMessage(response);
  }

  private setupAgentListeners(agent: BaseAgent): void {
    agent.on('message:send', (message: AgentMessage) => {
      this.sendMessage(message);
    });

    agent.on('task:start', (data) => {
      this.emit('task:start', data);
    });

    agent.on('task:complete', (data) => {
      this.emit('task:complete', data);
    });

    agent.on('task:error', (data) => {
      this.emit('task:error', data);
    });

    agent.on('agent:shutdown', async (data) => {
      this.agents.delete(data.agentId);
      this.emit('agent:removed', data);
    });
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      const metrics = this.collectMetrics();
      this.emit('metrics:collected', metrics);
      this.saveMetrics(metrics);
    }, this.config.monitoring.metricsInterval);
  }

  private collectMetrics(): any {
    const agents = Array.from(this.agents.values());
    
    return {
      timestamp: new Date(),
      orchestrator: {
        activeAgents: agents.length,
        activeWorkflows: this.workflows.size,
        messageQueueSize: this.messageQueue.length
      },
      agents: agents.map(agent => ({
        id: agent.getId(),
        type: agent.getType(),
        status: agent.getStatus(),
        metrics: agent.getMetrics()
      })),
      workflows: Array.from(this.workflows.values()).map(w => ({
        id: w.id,
        status: w.status,
        currentStep: w.currentStep,
        duration: w.completedAt 
          ? w.completedAt.getTime() - w.startedAt.getTime() 
          : Date.now() - w.startedAt.getTime()
      }))
    };
  }

  private async saveMetrics(metrics: any): Promise<void> {
    try {
      await supabase.from('orchestrator_metrics').insert({
        metrics_data: metrics,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save metrics:', error);
    }
  }

  private async saveWorkflowInstance(instance: WorkflowInstance): Promise<void> {
    try {
      await supabase.from('workflow_instances').insert({
        workflow_id: instance.workflowId,
        instance_id: instance.id,
        status: instance.status,
        context: instance.context,
        results: instance.results,
        error: instance.error,
        started_at: instance.startedAt.toISOString(),
        completed_at: instance.completedAt?.toISOString()
      });
    } catch (error) {
      console.error('Failed to save workflow instance:', error);
    }
  }

  public getOrchestratorStatus(): any {
    return {
      isRunning: this.isRunning,
      activeAgents: this.agents.size,
      maxAgents: this.config.maxConcurrentAgents,
      activeWorkflows: Array.from(this.workflows.values())
        .filter(w => w.status === 'running').length,
      totalWorkflows: this.workflows.size,
      messageQueueSize: this.messageQueue.length
    };
  }

  public async getAgent(agentId: string): Promise<BaseAgent | undefined> {
    return this.agents.get(agentId);
  }

  public async removeAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      await agent.shutdown();
      this.agents.delete(agentId);
    }
  }

  public async pauseWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (workflow && workflow.status === 'running') {
      workflow.status = 'cancelled';
      this.emit('workflow:paused', { workflowId });
    }
  }

  public async resumeWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (workflow && workflow.status === 'cancelled') {
      workflow.status = 'running';
      this.emit('workflow:resumed', { workflowId });
      // Resume execution logic would go here
    }
  }

  public async shutdown(): Promise<void> {
    this.isRunning = false;

    // Stop message processing
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    // Shutdown all agents
    const shutdownPromises = Array.from(this.agents.values()).map(
      agent => agent.shutdown()
    );
    await Promise.all(shutdownPromises);

    // Clear data
    this.agents.clear();
    this.workflows.clear();
    this.messageQueue = [];

    this.emit('orchestrator:shutdown');
  }
}