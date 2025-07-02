// Compatibility layer to support both old and new agent/tool interfaces
import { Agent as LegacyAgent } from "../agents/Agent.ts";
import { Tool as LegacyTool } from "../tools/Tool.ts";
import { Agent as EnhancedAgent, Tool as EnhancedTool, BaseTool, ToolDefinition } from "../agents/Agent.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { PromptParams } from "../prompts/types.ts";

// Feature flags for gradual migration
export const FEATURE_FLAGS = {
  USE_ENHANCED_AGENTS: Deno.env.get('USE_ENHANCED_AGENTS') === 'true',
  USE_NEW_ORCHESTRATOR: Deno.env.get('USE_NEW_ORCHESTRATOR') === 'true',
  USE_WORKFLOW_TEMPLATES: Deno.env.get('USE_WORKFLOW_TEMPLATES') === 'true',
  ENABLE_AGENT_TOOLS: Deno.env.get('ENABLE_AGENT_TOOLS') === 'true',
};

// Adapter to use legacy tools with new system
export class LegacyToolAdapter extends BaseTool implements EnhancedTool {
  private legacyTool: LegacyTool<any, any>;
  definition: ToolDefinition;

  constructor(legacyTool: LegacyTool<any, any>, name: string, description: string = '') {
    super();
    this.legacyTool = legacyTool;
    this.definition = {
      name,
      description: description || `Legacy tool: ${name}`,
      parameters: {
        input: {
          type: 'any',
          description: 'Input for legacy tool',
          required: true
        }
      }
    };
  }

  async execute(params: any): Promise<any> {
    try {
      // Legacy tools expect direct input, not wrapped in params object
      const result = await this.legacyTool.execute(params.input || params);
      return {
        success: true,
        result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Legacy tool execution failed'
      };
    }
  }
}

// Adapter to use new agents in place of legacy agents
export class EnhancedAgentAdapter<T extends PromptParams> extends LegacyAgent<T> {
  private enhancedAgent: EnhancedAgent<T>;

  constructor(enhancedAgent: EnhancedAgent<T>) {
    // Legacy Agent constructor expects model and prompt
    const dummyModel = {} as GoogleGenerativeAI;
    const dummyPrompt = { prompt: '', version: '1.0.0' };
    super(dummyModel, dummyPrompt);
    this.enhancedAgent = enhancedAgent;
  }

  async run(params: T): Promise<string> {
    return this.enhancedAgent.run(params);
  }
}

// Factory functions to create agents based on feature flags
export function createAgent<T extends PromptParams>(
  type: string,
  model: GoogleGenerativeAI,
  ...args: any[]
): LegacyAgent<T> | EnhancedAgent<T> {
  if (FEATURE_FLAGS.USE_ENHANCED_AGENTS) {
    // Import enhanced agents dynamically to avoid circular dependencies
    switch (type) {
      case 'CompensationAgent': {
        const { EnhancedCompensationAgent } = require('../agents/EnhancedCompensationAgent.ts');
        return new EnhancedCompensationAgent(model);
      }
      case 'TaskAgent': {
        const { TaskAgent } = require('../agents/Agent.ts');
        return new TaskAgent(model);
      }
      case 'ConversationAgent': {
        const { ConversationAgent } = require('../agents/Agent.ts');
        return new ConversationAgent(model);
      }
      case 'RecruitmentAgent': {
        const { RecruitmentAgent } = require('../agents/RecruitmentAgent.ts');
        return new RecruitmentAgent(model);
      }
      case 'BooleanSearchAgent': {
        const { BooleanSearchAgent } = require('../agents/RecruitmentAgent.ts');
        return new BooleanSearchAgent(model);
      }
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  } else {
    // Use legacy agents
    switch (type) {
      case 'CompensationAgent': {
        const { CompensationAgent } = require('../agents/CompensationAgent.ts');
        const { ToolRegistry } = require('../tools/ToolRegistry.ts');
        return new CompensationAgent(model, new ToolRegistry());
      }
      default:
        throw new Error(`Legacy agent not implemented: ${type}`);
    }
  }
}

// Monitoring wrapper to track agent performance
export class MonitoredAgent<T extends PromptParams> extends LegacyAgent<T> {
  private agent: LegacyAgent<T>;
  private agentName: string;

  constructor(agent: LegacyAgent<T>, agentName: string) {
    const dummyModel = {} as GoogleGenerativeAI;
    const dummyPrompt = { prompt: '', version: '1.0.0' };
    super(dummyModel, dummyPrompt);
    this.agent = agent;
    this.agentName = agentName;
  }

  async run(params: T): Promise<string> {
    const startTime = Date.now();
    let success = true;
    let error: Error | null = null;

    try {
      const result = await this.agent.run(params);
      return result;
    } catch (e) {
      success = false;
      error = e instanceof Error ? e : new Error('Unknown error');
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      
      // Log metrics (in production, send to monitoring service)
      console.log({
        agent: this.agentName,
        duration,
        success,
        error: error?.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Migration utilities
export class MigrationHelper {
  static async testAgentCompatibility(
    legacyAgent: LegacyAgent<any>,
    enhancedAgent: EnhancedAgent<any>,
    testParams: any
  ): Promise<{
    compatible: boolean;
    legacyResult?: string;
    enhancedResult?: string;
    error?: string;
  }> {
    try {
      const [legacyResult, enhancedResult] = await Promise.all([
        legacyAgent.run(testParams),
        enhancedAgent.run(testParams)
      ]);

      // Compare results (in production, use more sophisticated comparison)
      const compatible = legacyResult.length > 0 && enhancedResult.length > 0;

      return {
        compatible,
        legacyResult,
        enhancedResult
      };
    } catch (error) {
      return {
        compatible: false,
        error: error instanceof Error ? error.message : 'Compatibility test failed'
      };
    }
  }

  static migrateConfiguration(legacyConfig: any): any {
    // Transform legacy configuration to new format
    return {
      ...legacyConfig,
      agents: legacyConfig.agents?.map((agent: any) => ({
        ...agent,
        type: agent.type.replace('Agent', ''), // Remove 'Agent' suffix
        enhanced: true
      })),
      features: {
        ...legacyConfig.features,
        enhancedAgents: FEATURE_FLAGS.USE_ENHANCED_AGENTS,
        workflows: FEATURE_FLAGS.USE_WORKFLOW_TEMPLATES
      }
    };
  }
}