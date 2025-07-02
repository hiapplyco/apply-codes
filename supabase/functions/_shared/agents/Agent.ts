// types.ts - Core type definitions
export interface PromptParams {
  [key: string]: any;
}

export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  description?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    [key: string]: {
      type: string;
      description: string;
      required?: boolean;
    };
  };
}

export interface Tool {
  definition: ToolDefinition;
  execute(params: any): Promise<any>;
}

export interface AgentContext {
  conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
  toolResults: Array<{
    toolName: string;
    params: any;
    result: any;
    timestamp: Date;
  }>;
}

// promptManager.ts - Prompt management system
export class PromptManager {
  private templates: Map<string, PromptTemplate> = new Map();

  registerTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  render(template: PromptTemplate, params: PromptParams): string {
    let rendered = template.template;
    
    // Replace variables in the template
    for (const [key, value] of Object.entries(params)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }

    // Check for missing required variables
    const missingVars = template.variables.filter(variable => 
      !(variable in params) && rendered.includes(`{{${variable}}}`)
    );

    if (missingVars.length > 0) {
      throw new Error(`Missing required variables: ${missingVars.join(', ')}`);
    }

    return rendered;
  }

  listTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }
}

export const promptManager = new PromptManager();

// Register some default templates
promptManager.registerTemplate({
  id: 'task_execution',
  name: 'Task Execution',
  template: `You are an AI assistant that can execute tasks using available tools.

Task: {{task}}
Context: {{context}}

Available tools:
{{tools}}

Please analyze the task and use the appropriate tools to complete it. When you need to use a tool, format your response like this:
<tool_call>
{"name": "tool_name", "params": {"param1": "value1", "param2": "value2"}}
</tool_call>

You can use multiple tools in sequence if needed. Always explain your reasoning and provide clear responses to the user.`,
  variables: ['task', 'context', 'tools']
});

promptManager.registerTemplate({
  id: 'conversation',
  name: 'Conversation',
  template: `You are a helpful AI assistant. 

Conversation history:
{{history}}

User message: {{message}}

Please respond helpfully and naturally. If you need to use tools to help answer the user's question, use the following format:
<tool_call>
{"name": "tool_name", "params": {"param1": "value1"}}
</tool_call>`,
  variables: ['history', 'message']
});

// ToolRegistry.ts - Tool management system
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool): void {
    this.tools.set(tool.definition.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  getToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(tool => tool.definition);
  }

  getToolsDescription(): string {
    return this.getToolDefinitions()
      .map(tool => `- ${tool.name}: ${tool.description}`)
      .join('\n');
  }

  unregister(name: string): boolean {
    return this.tools.delete(name);
  }
}

// tools/BaseTool.ts - Base tool implementation
export abstract class BaseTool implements Tool {
  abstract definition: ToolDefinition;
  abstract execute(params: any): Promise<any>;

  protected validateParams(params: any): void {
    const required = Object.entries(this.definition.parameters)
      .filter(([_, config]) => config.required)
      .map(([name, _]) => name);

    const missing = required.filter(param => !(param in params));
    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }
  }
}

// tools/HttpTool.ts - HTTP request tool
export class HttpTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'http_request',
    description: 'Make HTTP requests to external APIs',
    parameters: {
      url: {
        type: 'string',
        description: 'The URL to request',
        required: true
      },
      method: {
        type: 'string',
        description: 'HTTP method (GET, POST, PUT, DELETE)',
        required: false
      },
      headers: {
        type: 'object',
        description: 'HTTP headers to include',
        required: false
      },
      body: {
        type: 'object',
        description: 'Request body (for POST/PUT requests)',
        required: false
      }
    }
  };

  async execute(params: any): Promise<any> {
    this.validateParams(params);

    const { url, method = 'GET', headers = {}, body } = params;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const data = await response.json();

      return {
        success: true,
        status: response.status,
        statusText: response.statusText,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// tools/CalculatorTool.ts - Calculator tool
export class CalculatorTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'calculator',
    description: 'Perform mathematical calculations',
    parameters: {
      expression: {
        type: 'string',
        description: 'Mathematical expression to evaluate (e.g., "2 + 3 * 4")',
        required: true
      }
    }
  };

  async execute(params: any): Promise<any> {
    this.validateParams(params);

    const { expression } = params;

    try {
      // Simple expression evaluator (be careful with eval in production!)
      const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
      const result = Function(`"use strict"; return (${sanitized})`)();

      return {
        success: true,
        expression,
        result
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid mathematical expression'
      };
    }
  }
}

// tools/SearchTool.ts - Web search tool (mock implementation)
export class SearchTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'web_search',
    description: 'Search the web for information',
    parameters: {
      query: {
        type: 'string',
        description: 'Search query',
        required: true
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        required: false
      }
    }
  };

  async execute(params: any): Promise<any> {
    this.validateParams(params);

    const { query, limit = 5 } = params;

    // Mock implementation - in real world, integrate with search APIs
    const mockResults = [
      {
        title: `Search result for: ${query}`,
        url: 'https://example.com/result1',
        snippet: `This is a mock search result for the query "${query}". In a real implementation, this would connect to actual search APIs.`
      },
      {
        title: `Another result for: ${query}`,
        url: 'https://example.com/result2',
        snippet: `This is another mock result. Real implementation would use services like Google Search API, Bing API, etc.`
      }
    ];

    return {
      success: true,
      query,
      results: mockResults.slice(0, limit)
    };
  }
}

// tools/FileSystemTool.ts - File system operations
export class FileSystemTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'file_system',
    description: 'Perform file system operations',
    parameters: {
      operation: {
        type: 'string',
        description: 'Operation to perform (read, write, list, delete)',
        required: true
      },
      path: {
        type: 'string',
        description: 'File or directory path',
        required: true
      },
      content: {
        type: 'string',
        description: 'Content to write (for write operations)',
        required: false
      }
    }
  };

  async execute(params: any): Promise<any> {
    this.validateParams(params);

    const { operation, path } = params;

    try {
      switch (operation) {
        case 'read':
          // Mock file read
          return {
            success: true,
            operation,
            path,
            content: `Mock content of file: ${path}`
          };

        case 'write':
          // Mock file write
          return {
            success: true,
            operation,
            path,
            message: `Successfully wrote content to ${path}`
          };

        case 'list':
          // Mock directory listing
          return {
            success: true,
            operation,
            path,
            files: ['file1.txt', 'file2.txt', 'subdirectory/']
          };

        case 'delete':
          // Mock file deletion
          return {
            success: true,
            operation,
            path,
            message: `Successfully deleted ${path}`
          };

        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File system operation failed'
      };
    }
  }
}

// Agent.ts - Updated and improved Agent class
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

export abstract class Agent<T extends PromptParams> {
  protected readonly model: GoogleGenerativeAI;
  protected readonly promptTemplate: PromptTemplate;
  protected readonly toolRegistry: ToolRegistry;
  protected readonly context: AgentContext;

  constructor(model: GoogleGenerativeAI, promptTemplate: PromptTemplate, toolRegistry: ToolRegistry) {
    this.model = model;
    this.promptTemplate = promptTemplate;
    this.toolRegistry = toolRegistry;
    this.context = {
      conversationHistory: [],
      toolResults: []
    };
  }

  protected renderPrompt(params: T): string {
    // Add tools information to params
    const enhancedParams = {
      ...params,
      tools: this.toolRegistry.getToolsDescription()
    };
    return promptManager.render(this.promptTemplate, enhancedParams);
  }

  public async run(params: T): Promise<string> {
    const prompt = this.renderPrompt(params);
    
    // Add to conversation history
    this.context.conversationHistory.push({
      role: 'user',
      content: JSON.stringify(params),
      timestamp: new Date()
    });

    let currentPrompt = prompt;
    let iterations = 0;
    const maxIterations = 5; // Prevent infinite loops

    while (iterations < maxIterations) {
      const result = await this.model.getGenerativeModel({ 
        model: "gemini-2.5-flash" 
      }).generateContent(currentPrompt);
      
      const text = result.response.text();

      // Add assistant response to history
      this.context.conversationHistory.push({
        role: 'assistant',
        content: text,
        timestamp: new Date()
      });

      const toolCalls = this.parseToolCalls(text);
      
      if (toolCalls.length === 0) {
        // No more tool calls, return the final response
        return text;
      }

      // Execute tool calls
      const toolResults = await this.executeToolCalls(toolCalls);
      
      // Store tool results in context
      toolResults.forEach(result => {
        this.context.toolResults.push({
          toolName: result.tool,
          params: result.params || {},
          result: result.result || result.error,
          timestamp: new Date()
        });
      });

      // Prepare next iteration prompt with tool results
      currentPrompt = this.buildFollowUpPrompt(text, toolResults);
      iterations++;
    }

    return "Maximum iterations reached. Please try breaking down your request into smaller steps.";
  }

  private parseToolCalls(text: string): any[] {
    const toolCallRegex = /<tool_call>\s*(.*?)\s*<\/tool_call>/gs;
    const matches = text.matchAll(toolCallRegex);
    const toolCalls = [];
    
    for (const match of matches) {
      try {
        const parsed = JSON.parse(match[1]);
        toolCalls.push(parsed);
      } catch (error) {
        console.error("Error parsing tool call:", error);
        console.error("Raw content:", match[1]);
      }
    }
    
    return toolCalls;
  }

  private async executeToolCalls(toolCalls: any[]): Promise<any[]> {
    const results = [];
    
    for (const toolCall of toolCalls) {
      const tool = this.toolRegistry.get(toolCall.name);
      
      if (tool) {
        try {
          const result = await tool.execute(toolCall.params);
          results.push({ 
            tool: toolCall.name, 
            params: toolCall.params,
            result 
          });
        } catch (error) {
          results.push({ 
            tool: toolCall.name, 
            params: toolCall.params,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      } else {
        results.push({ 
          tool: toolCall.name, 
          params: toolCall.params,
          error: "Tool not found" 
        });
      }
    }
    
    return results;
  }

  private buildFollowUpPrompt(previousResponse: string, toolResults: any[]): string {
    return `Previous response: ${previousResponse}

Tool execution results:
${JSON.stringify(toolResults, null, 2)}

Based on the tool results above, please continue with your response. If you need to use more tools, format them as before. If you have enough information, provide your final answer to the user.`;
  }

  public getContext(): AgentContext {
    return { ...this.context };
  }

  public clearContext(): void {
    this.context.conversationHistory = [];
    this.context.toolResults = [];
  }
}

// TaskAgent.ts - Specific agent implementation for task execution
export class TaskAgent extends Agent<{ task: string; context?: string }> {
  constructor(model: GoogleGenerativeAI) {
    const template = promptManager.getTemplate('task_execution');
    if (!template) {
      throw new Error('Task execution template not found');
    }

    const toolRegistry = new ToolRegistry();
    
    // Register default tools
    toolRegistry.register(new HttpTool());
    toolRegistry.register(new CalculatorTool());
    toolRegistry.register(new SearchTool());
    toolRegistry.register(new FileSystemTool());

    super(model, template, toolRegistry);
  }

  public addTool(tool: Tool): void {
    this.toolRegistry.register(tool);
  }

  public async executeTask(task: string, context: string = ''): Promise<string> {
    return this.run({ task, context });
  }
}

// ConversationAgent.ts - Agent for natural conversations
export class ConversationAgent extends Agent<{ message: string; history?: string }> {
  constructor(model: GoogleGenerativeAI) {
    const template = promptManager.getTemplate('conversation');
    if (!template) {
      throw new Error('Conversation template not found');
    }

    const toolRegistry = new ToolRegistry();
    
    // Register tools that are useful for conversations
    toolRegistry.register(new CalculatorTool());
    toolRegistry.register(new SearchTool());

    super(model, template, toolRegistry);
  }

  public async chat(message: string): Promise<string> {
    const history = this.context.conversationHistory
      .slice(-10) // Keep last 10 messages for context
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    return this.run({ message, history });
  }
}

// Example usage and testing
export async function createExampleUsage() {
  // This would be your actual Google API key
  const genAI = new GoogleGenerativeAI("your-api-key-here");

  // Create a task agent
  const taskAgent = new TaskAgent(genAI);

  // Example: Mathematical task
  console.log("=== Mathematical Task ===");
  const mathResult = await taskAgent.executeTask(
    "Calculate the area of a circle with radius 5, then find what percentage that is of a square with side length 10"
  );
  console.log(mathResult);

  // Create a conversation agent
  const conversationAgent = new ConversationAgent(genAI);

  // Example: Conversation
  console.log("\n=== Conversation ===");
  const chatResult = await conversationAgent.chat(
    "What's the weather like today and can you calculate 15% of 250?"
  );
  console.log(chatResult);

  // Example: Custom tool
  class CustomTool extends BaseTool {
    definition: ToolDefinition = {
      name: 'custom_greeting',
      description: 'Generate a custom greeting',
      parameters: {
        name: {
          type: 'string',
          description: 'Name to greet',
          required: true
        }
      }
    };

    async execute(params: any): Promise<any> {
      this.validateParams(params);
      return {
        success: true,
        greeting: `Hello, ${params.name}! Welcome to the AI orchestration system!`
      };
    }
  }

  // Add custom tool
  taskAgent.addTool(new CustomTool());

  console.log("\n=== Custom Tool Usage ===");
  const customResult = await taskAgent.executeTask(
    "Use the custom greeting tool to greet 'Alice'"
  );
  console.log(customResult);
}

// All classes are already exported inline with their declarations