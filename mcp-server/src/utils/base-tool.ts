import { z } from 'zod';
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
    const properties = this.zodToJsonSchema(this.inputSchema);
    const required = this.getRequiredFields(this.inputSchema);
    
    return {
      name: this.name,
      description: this.description,
      inputSchema: {
        type: 'object',
        properties,
        required,
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

  private zodToJsonSchema(schema: z.ZodObject<any>): Record<string, any> {
    const shape = schema.shape;
    const properties: Record<string, any> = {};

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = this.zodTypeToJsonSchema(value as z.ZodType);
    }

    return properties;
  }

  private zodTypeToJsonSchema(zodType: z.ZodType): any {
    if (zodType instanceof z.ZodString) {
      const schema: any = { type: 'string' };
      if (zodType._def.checks) {
        for (const check of zodType._def.checks) {
          if (check.kind === 'email') {
            schema.format = 'email';
          } else if (check.kind === 'url') {
            schema.format = 'uri';
          } else if (check.kind === 'min') {
            schema.minLength = check.value;
          } else if (check.kind === 'max') {
            schema.maxLength = check.value;
          }
        }
      }
      return schema;
    }

    if (zodType instanceof z.ZodNumber) {
      const schema: any = { type: 'number' };
      if (zodType._def.checks) {
        for (const check of zodType._def.checks) {
          if (check.kind === 'min') {
            schema.minimum = check.value;
          } else if (check.kind === 'max') {
            schema.maximum = check.value;
          } else if (check.kind === 'int') {
            schema.type = 'integer';
          }
        }
      }
      return schema;
    }

    if (zodType instanceof z.ZodBoolean) {
      return { type: 'boolean' };
    }

    if (zodType instanceof z.ZodArray) {
      return {
        type: 'array',
        items: this.zodTypeToJsonSchema(zodType.element),
      };
    }

    if (zodType instanceof z.ZodObject) {
      return {
        type: 'object',
        properties: this.zodToJsonSchema(zodType),
        required: this.getRequiredFields(zodType),
      };
    }

    if (zodType instanceof z.ZodEnum) {
      return {
        type: 'string',
        enum: zodType._def.values,
      };
    }

    if (zodType instanceof z.ZodOptional) {
      return this.zodTypeToJsonSchema(zodType.unwrap());
    }

    if (zodType instanceof z.ZodDefault) {
      const schema = this.zodTypeToJsonSchema(zodType.removeDefault());
      schema.default = zodType._def.defaultValue();
      return schema;
    }

    if (zodType instanceof z.ZodLiteral) {
      return {
        type: typeof zodType.value,
        const: zodType.value,
      };
    }

    // Fallback
    return { type: 'string' };
  }

  private getRequiredFields(schema: z.ZodObject<any>): string[] {
    const shape = schema.shape;
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const zodType = value as z.ZodType;
      if (!(zodType instanceof z.ZodOptional) && !(zodType instanceof z.ZodDefault)) {
        required.push(key);
      }
    }

    return required;
  }

  protected log(message: string, data?: any): void {
    console.error(`[${this.name}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  protected logError(message: string, error?: any): void {
    console.error(`[${this.name}] ERROR: ${message}`, error);
  }
}