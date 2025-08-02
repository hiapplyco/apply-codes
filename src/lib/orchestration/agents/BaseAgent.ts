import { 
  AgentType, 
  AgentStatus, 
  AgentCapability, 
  AgentContext,
  AgentTask,
  AgentResult,
  AgentMessage,
  AgentMetrics
} from '@/types/orchestration';
import { supabase } from '@/integrations/supabase/client';
import { EventEmitter } from 'events';

export abstract class BaseAgent extends EventEmitter {
  protected id: string;
  protected type: AgentType;
  protected status: AgentStatus = 'idle';
  protected capabilities: AgentCapability[] = [];
  protected context: AgentContext;
  protected metrics: AgentMetrics;
  protected currentTask: AgentTask | null = null;

  constructor(type: AgentType, context: AgentContext) {
    super();
    this.id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.context = context;
    this.metrics = {
      agentId: this.id,
      totalTasks: 0,
      successfulTasks: 0,
      failedTasks: 0,
      averageResponseTime: 0,
      lastActiveAt: new Date(),
      capabilities: []
    };
    
    this.initialize();
  }

  protected abstract initialize(): void;

  public abstract canHandle(task: AgentTask): boolean;

  protected abstract executeTask(task: AgentTask): Promise<any>;

  public async processTask(task: AgentTask): Promise<AgentResult> {
    if (!this.canHandle(task)) {
      throw new Error(`Agent ${this.id} cannot handle task type: ${task.type}`);
    }

    this.status = 'working';
    this.currentTask = task;
    this.metrics.totalTasks++;
    this.metrics.lastActiveAt = new Date();

    const startTime = Date.now();
    const result: AgentResult = {
      taskId: task.id,
      agentId: this.id,
      status: 'failure',
      metrics: {
        startTime: new Date(startTime),
        endTime: new Date()
      }
    };

    try {
      this.emit('task:start', { agentId: this.id, task });
      
      const output = await this.executeTask(task);
      
      result.status = 'success';
      result.output = output;
      this.metrics.successfulTasks++;
      
      this.emit('task:complete', { agentId: this.id, task, result });
    } catch (error) {
      result.status = 'failure';
      result.error = error instanceof Error ? error.message : String(error);
      this.metrics.failedTasks++;
      
      this.emit('task:error', { agentId: this.id, task, error: result.error });
    } finally {
      const endTime = Date.now();
      result.metrics!.endTime = new Date(endTime);
      
      const responseTime = endTime - startTime;
      this.updateAverageResponseTime(responseTime);
      
      this.status = 'idle';
      this.currentTask = null;
    }

    await this.logActivity(task, result);
    return result;
  }

  protected async callGeminiAPI(prompt: string, data?: any): Promise<any> {
    try {
      const { data: response, error } = await supabase.functions.invoke('gemini-api', {
        body: {
          prompt,
          data,
          context: {
            agentType: this.type,
            agentId: this.id,
            taskId: this.currentTask?.id
          }
        }
      });

      if (error) throw error;
      return response;
    } catch (error) {
      console.error(`Gemini API call failed for agent ${this.id}:`, error);
      throw error;
    }
  }

  public sendMessage(to: string, action: string, payload: any): void {
    const message: AgentMessage = {
      id: crypto.randomUUID(),
      from: this.id,
      to,
      type: 'request',
      action,
      payload,
      timestamp: new Date()
    };

    this.emit('message:send', message);
  }

  public async handleMessage(message: AgentMessage): Promise<void> {
    if (message.to !== this.id) return;

    try {
      switch (message.type) {
        case 'request':
          await this.handleRequest(message);
          break;
        case 'status':
          await this.handleStatusUpdate(message);
          break;
        default:
          console.log(`Agent ${this.id} received message:`, message);
      }
    } catch (error) {
      console.error(`Error handling message in agent ${this.id}:`, error);
      this.sendErrorResponse(message.from, message.id, error);
    }
  }

  protected async handleRequest(message: AgentMessage): Promise<void> {
    // Override in subclasses for specific request handling
    console.log(`Agent ${this.id} handling request:`, message.action);
  }

  protected async handleStatusUpdate(message: AgentMessage): Promise<void> {
    // Override in subclasses for specific status handling
    console.log(`Agent ${this.id} received status update:`, message.payload);
  }

  protected sendErrorResponse(to: string, correlationId: string, error: any): void {
    const errorMessage: AgentMessage = {
      id: crypto.randomUUID(),
      from: this.id,
      to,
      type: 'error',
      action: 'error',
      payload: {
        error: error instanceof Error ? error.message : String(error)
      },
      timestamp: new Date(),
      correlationId
    };

    this.emit('message:send', errorMessage);
  }

  private updateAverageResponseTime(responseTime: number): void {
    const totalTasks = this.metrics.totalTasks;
    const currentAverage = this.metrics.averageResponseTime;
    this.metrics.averageResponseTime = 
      (currentAverage * (totalTasks - 1) + responseTime) / totalTasks;
  }

  private async logActivity(task: AgentTask, result: AgentResult): Promise<void> {
    try {
      await supabase.from('agent_activity_logs').insert({
        agent_id: this.id,
        agent_type: this.type,
        task_id: task.id,
        task_type: task.type,
        status: result.status,
        duration_ms: result.metrics?.endTime && result.metrics?.startTime
          ? result.metrics.endTime.getTime() - result.metrics.startTime.getTime()
          : null,
        error: result.error,
        context: this.context,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log agent activity:', error);
    }
  }

  public getMetrics(): AgentMetrics {
    return { ...this.metrics };
  }

  public getStatus(): AgentStatus {
    return this.status;
  }

  public getId(): string {
    return this.id;
  }

  public getType(): AgentType {
    return this.type;
  }

  public getCapabilities(): AgentCapability[] {
    return [...this.capabilities];
  }

  public updateContext(updates: Partial<AgentContext>): void {
    this.context = { ...this.context, ...updates };
  }

  public async pause(): Promise<void> {
    if (this.status === 'working') {
      this.status = 'paused';
      this.emit('agent:paused', { agentId: this.id });
    }
  }

  public async resume(): Promise<void> {
    if (this.status === 'paused') {
      this.status = 'working';
      this.emit('agent:resumed', { agentId: this.id });
    }
  }

  public async shutdown(): Promise<void> {
    this.status = 'idle';
    this.currentTask = null;
    this.removeAllListeners();
    this.emit('agent:shutdown', { agentId: this.id });
  }
}