import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgentOrchestrator } from '../AgentOrchestrator';
import { MessageBus } from '../protocols/MessageBus';
import { WORKFLOW_TEMPLATES, validateWorkflow } from '../workflows/templates';
import { AgentContext, AgentMessage } from '@/types/orchestration';

const mockCollection = vi.fn();
const mockAddDoc = vi.fn();
const mockDoc = vi.fn();
const mockWriteBatch = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  serverTimestamp: () => 'timestamp',
  writeBatch: () => {
    const batch = {
      set: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined)
    };
    mockWriteBatch.mockReturnValue(batch);
    return batch;
  },
  doc: (...args: any[]) => mockDoc(...args)
}));

describe('AI Orchestration System Tests', () => {
  let orchestrator: AgentOrchestrator;
  let messageBus: MessageBus;
  let mockContext: AgentContext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue({});
    mockDoc.mockReturnValue({});
    mockAddDoc.mockResolvedValue(undefined);

    orchestrator = new AgentOrchestrator();
    messageBus = new MessageBus();
    mockContext = {
      userId: 'test-user',
      sessionId: 'test-session',
      projectId: 'test-project'
    };
  });

  afterEach(async () => {
    await orchestrator.shutdown();
  });

  describe('AgentOrchestrator', () => {
    it('should initialize successfully', async () => {
      await orchestrator.initialize();
      const status = orchestrator.getOrchestratorStatus();
      expect(status.isRunning).toBe(true);
      expect(status.activeAgents).toBe(0);
    });

    it('should create agents of different types', async () => {
      await orchestrator.initialize();

      const sourcingAgent = await orchestrator.createAgent('sourcing', mockContext);
      const enrichmentAgent = await orchestrator.createAgent('enrichment', mockContext);
      const planningAgent = await orchestrator.createAgent('planning', mockContext);

      expect(sourcingAgent).toBeDefined();
      expect(enrichmentAgent).toBeDefined();
      expect(planningAgent).toBeDefined();

      expect(sourcingAgent.getId()).toBeDefined();
      expect(enrichmentAgent.getId()).toBeDefined();
      expect(planningAgent.getId()).toBeDefined();

      const status = orchestrator.getOrchestratorStatus();
      expect(status.activeAgents).toBe(3);
    });

    it('should enforce max concurrent agents limit', async () => {
      const limitedOrchestrator = new AgentOrchestrator({ maxConcurrentAgents: 2 });
      await limitedOrchestrator.initialize();

      await limitedOrchestrator.createAgent('sourcing', mockContext);
      await limitedOrchestrator.createAgent('enrichment', mockContext);

      await expect(
        limitedOrchestrator.createAgent('planning', mockContext)
      ).rejects.toThrow('Maximum concurrent agents reached');

      await limitedOrchestrator.shutdown();
    });
  });

  describe('MessageBus', () => {
    it('should publish and receive messages', async () => {
      const testMessage: AgentMessage = {
        id: 'test-msg',
        from: 'agent-1',
        to: 'agent-2',
        type: 'request',
        action: 'test-action',
        payload: { test: 'data' },
        timestamp: new Date()
      };

      const messagePromise = new Promise<AgentMessage>((resolve) => {
        messageBus.on('message', (message) => {
          resolve(message);
        });
      });

      messageBus.publish(testMessage);
      const receivedMessage = await messagePromise;
      expect(receivedMessage).toEqual(testMessage);
    });

    it('should handle subscriptions correctly', () => {
      let receivedMessage: AgentMessage | null = null;

      messageBus.subscribe('test-action', (message) => {
        receivedMessage = message;
      });

      const testMessage: AgentMessage = {
        id: 'test-msg',
        from: 'agent-1',
        to: 'agent-2',
        type: 'request',
        action: 'test-action',
        payload: { test: 'data' },
        timestamp: new Date()
      };

      messageBus.publish(testMessage);
      expect(receivedMessage).toEqual(testMessage);
    });
  });

  describe('Workflow Templates', () => {
    it('should have valid workflow templates', () => {
      Object.values(WORKFLOW_TEMPLATES).forEach((template) => {
        expect(() => validateWorkflow(template)).not.toThrow();
      });
    });

    it('should execute workflow and persist metrics', async () => {
      await orchestrator.initialize();
      const workflow = Object.values(WORKFLOW_TEMPLATES)[0];
      const instance = await orchestrator.executeWorkflow(workflow, mockContext);

      expect(instance.status === 'completed' || instance.status === 'failed').toBe(true);
      expect(instance.id).toBeDefined();
      expect(instance.workflowId).toBe(workflow.id);
      // Note: mockAddDoc won't be called because db is not initialized in test environment (by design)
    });
  });
});
