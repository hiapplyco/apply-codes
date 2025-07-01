/**
 * Phase 1: Compatibility Layer
 * This file provides adapters to make the new agent system work with existing code
 */

import { Agent as LegacyAgent } from "@/supabase/functions/_shared/agents/Agent";
import { Tool as LegacyTool } from "@/supabase/functions/_shared/tools/Tool";
import { 
  Agent as NewAgent, 
  BaseTool,
  ToolDefinition,
  PromptTemplate,
  PromptParams,
  ToolRegistry as NewToolRegistry
} from "./new-agent-system";

/**
 * Adapter to make legacy tools work with the new system
 */
export class LegacyToolAdapter extends BaseTool {
  private legacyTool: LegacyTool<any, any>;

  constructor(legacyTool: LegacyTool<any, any>) {
    super();
    this.legacyTool = legacyTool;
  }

  get definition(): ToolDefinition {
    return {
      name: this.legacyTool.name,
      description: this.legacyTool.description,
      parameters: {
        input: {
          type: 'any',
          description: 'Input for the legacy tool',
          required: true
        }
      }
    };
  }

  async execute(params: any): Promise<any> {
    try {
      const result = await this.legacyTool.execute(params.input);
      return {
        success: true,
        result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Adapter to make new agents work with legacy orchestrator
 */
export class NewAgentAdapter<T extends PromptParams> {
  private newAgent: NewAgent<T>;
  private defaultParams: Partial<T>;

  constructor(newAgent: NewAgent<T>, defaultParams: Partial<T> = {}) {
    this.newAgent = newAgent;
    this.defaultParams = defaultParams;
  }

  async run(params: PromptParams): Promise<string> {
    const mergedParams = { ...this.defaultParams, ...params } as T;
    return this.newAgent.run(mergedParams);
  }
}

/**
 * Factory for creating agents with backward compatibility
 */
export class AgentFactory {
  private static featureFlags = {
    useNewAgentSystem: process.env.ENABLE_NEW_AGENT_SYSTEM === 'true'
  };

  static createAgent(type: string, model: any, toolRegistry: any): any {
    if (this.featureFlags.useNewAgentSystem) {
      // Return new agent wrapped in adapter
      switch (type) {
        case 'compensation':
          // Create new agent with compensation template
          const template: PromptTemplate = {
            id: 'compensation',
            name: 'Compensation Analysis',
            template: '{{content}}',
            variables: ['content']
          };
          const newAgent = new NewAgent(model, template, toolRegistry);
          return new NewAgentAdapter(newAgent);
        default:
          throw new Error(`Unknown agent type: ${type}`);
      }
    } else {
      // Return legacy agent
      switch (type) {
        case 'compensation':
          const { CompensationAgent } = require('@/supabase/functions/_shared/agents/CompensationAgent');
          return new CompensationAgent(model, toolRegistry);
        default:
          throw new Error(`Unknown agent type: ${type}`);
      }
    }
  }
}

/**
 * Migration utilities
 */
export class MigrationUtils {
  static async testParallelExecution(
    legacyAgent: any,
    newAgent: any,
    testParams: any
  ): Promise<{ 
    match: boolean; 
    legacyResult: string; 
    newResult: string; 
    timings: { legacy: number; new: number } 
  }> {
    // Run both agents in parallel
    const startLegacy = Date.now();
    const legacyPromise = legacyAgent.run(testParams);
    
    const startNew = Date.now();
    const newPromise = newAgent.run(testParams);
    
    const [legacyResult, newResult] = await Promise.all([legacyPromise, newPromise]);
    
    const timings = {
      legacy: Date.now() - startLegacy,
      new: Date.now() - startNew
    };

    // Compare results (this is a simple comparison, you might need more sophisticated logic)
    const match = this.compareResults(legacyResult, newResult);

    return { match, legacyResult, newResult, timings };
  }

  private static compareResults(result1: string, result2: string): boolean {
    // Simple comparison - in reality, you'd want more sophisticated comparison
    // that ignores minor differences in formatting, etc.
    return result1.trim().toLowerCase() === result2.trim().toLowerCase();
  }

  static logMigrationProgress(phase: string, status: 'started' | 'completed' | 'failed', details?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      phase,
      status,
      details
    };
    
    // In production, this would log to your monitoring system
    console.log('[MIGRATION]', JSON.stringify(logEntry, null, 2));
  }
}