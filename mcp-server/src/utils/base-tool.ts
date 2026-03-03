import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { MCPTool, MCPToolCall, MCPToolResponse, MCPSession, ValidationError } from '../types/mcp.js';

export abstract class BaseMCPTool {
  protected name: string;
  protected description: string;
  protected inputSchema: z.ZodObject<any>;

  constructor(name: string, description: string, inputSchema: z.ZodObject<any>) {
    this.name = name;
    this.description = description;
    this.inputSchema = inputSchema;
  }

  public getDefinition(): MCPTool {
    const jsonSchema = zodToJsonSchema(this.inputSchema, { target: 'openApi3' }) as Record<string, any>;

    return {
      name: this.name,
      description: this.description,
      inputSchema: {
        type: 'object',
        properties: jsonSchema.properties || {},
        required: jsonSchema.required || [],
        additionalProperties: false
      },
    };
  }

  public async execute(
    call: MCPToolCall, 
    session?: MCPSession
  ): Promise<MCPToolResponse> {
    try {
      // Validate input
      const validatedInput = this.inputSchema.parse(call.arguments);
      
      // Execute the tool logic
      const result = await this.handler(validatedInput, session);
      
      // Format response
      return this.formatResponse(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Invalid input: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          error.errors
        );
      }
      throw error;
    }
  }

  protected abstract handler(input: any, session?: MCPSession): Promise<any>;

  protected formatResponse(result: any): MCPToolResponse {
    let text: string;
    
    if (typeof result === 'string') {
      text = result;
    } else if (typeof result === 'object' && result !== null) {
      try {
        text = JSON.stringify(result, null, 2);
      } catch (error) {
        text = `[Object: ${Object.prototype.toString.call(result)}]`;
      }
    } else {
      text = String(result);
    }

    return {
      content: [
        {
          type: 'text',
          text: text,
        },
      ],
    };
  }

  protected formatErrorResponse(error: Error): MCPToolResponse {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }

  protected log(message: string, data?: any): void {
    console.error(`[${this.name}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  protected logError(message: string, error?: any): void {
    console.error(`[${this.name}] ERROR: ${message}`, error);
  }
}