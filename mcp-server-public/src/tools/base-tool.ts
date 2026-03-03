/**
 * Base tool interface for the public MCP server.
 * Each tool defines its schema (JSON Schema) and handler.
 */

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export interface ToolResponse {
  content: Array<{ type: 'text'; text: string }>;
}

export abstract class BaseMCPTool {
  abstract readonly definition: ToolDefinition;

  abstract execute(args: Record<string, any>): Promise<ToolResponse>;

  protected textResponse(text: string): ToolResponse {
    return {
      content: [{ type: 'text', text }],
    };
  }
}
