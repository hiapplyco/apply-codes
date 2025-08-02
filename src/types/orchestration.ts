export type AgentType = 'sourcing' | 'enrichment' | 'planning' | 'analysis' | 'communication';

export type AgentStatus = 'idle' | 'working' | 'completed' | 'failed' | 'paused';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AgentCapability {
  name: string;
  description: string;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
}

export interface AgentContext {
  projectId?: string;
  userId: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'status' | 'error';
  action: string;
  payload: any;
  timestamp: Date;
  correlationId?: string;
}

export interface AgentTask {
  id: string;
  type: string;
  priority: TaskPriority;
  input: any;
  requiredCapabilities?: string[];
  dependencies?: string[];
  timeout?: number;
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

export interface AgentResult {
  taskId: string;
  agentId: string;
  status: 'success' | 'failure' | 'partial';
  output?: any;
  error?: string;
  metrics?: {
    startTime: Date;
    endTime: Date;
    tokensUsed?: number;
    apiCalls?: number;
  };
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  steps: WorkflowStep[];
  triggers?: WorkflowTrigger[];
  outputMapping?: Record<string, string>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  agentType: AgentType;
  task: Omit<AgentTask, 'id'>;
  conditions?: WorkflowCondition[];
  onSuccess?: string[];
  onFailure?: string[];
  parallel?: boolean;
}

export interface WorkflowCondition {
  type: 'expression' | 'gate';
  expression?: string;
  gate?: {
    requiredApprovals: number;
    approvers?: string[];
  };
}

export interface WorkflowTrigger {
  type: 'event' | 'schedule' | 'manual';
  event?: string;
  schedule?: string;
  conditions?: Record<string, any>;
}

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  context: AgentContext;
  currentStep?: string;
  results: Record<string, AgentResult>;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface AgentMetrics {
  agentId: string;
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  averageResponseTime: number;
  lastActiveAt: Date;
  capabilities: string[];
}

export interface OrchestrationConfig {
  maxConcurrentAgents: number;
  defaultTimeout: number;
  retryPolicy: {
    maxAttempts: number;
    backoffMs: number;
  };
  monitoring: {
    enabled: boolean;
    metricsInterval: number;
  };
}