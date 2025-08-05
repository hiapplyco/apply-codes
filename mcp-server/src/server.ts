#!/usr/bin/env node

// Load environment variables
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load from parent directory first (for development)
dotenv.config({ path: path.join(__dirname, '../../.env') });
// Also try current directory
dotenv.config();

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import all tool controllers
import { sourcingTools } from './controllers/sourcing-tools.js';
import { documentTools } from './controllers/document-tools.js';
import { orchestrationTools } from './controllers/orchestration-tools.js';
import { interviewTools } from './controllers/interview-tools.js';
import { BaseMCPTool } from './utils/base-tool.js';
import { MCPServerConfig, MCPSession, MCPError, ValidationError } from './types/mcp.js';
import { secretsManager } from './services/secrets-manager.js';
import { RECRUITMENT_MCP_SYSTEM_PROMPT, getToolSelectionPrompt } from './prompts/system-prompts.js';

class ApplyMCPServer {
  private server: Server;
  private tools: Map<string, BaseMCPTool> = new Map();
  private sessions: Map<string, MCPSession> = new Map();
  private config: MCPServerConfig;

  constructor() {
    this.config = {
      name: 'apply-mcp-server',
      version: '1.0.0',
      description: 'MCP Server for Apply.codes - AI-powered recruitment platform tools',
      capabilities: {
        tools: true,
        resources: true,
        prompts: true,
      },
    };

    this.server = new Server(
      {
        name: this.config.name,
        version: this.config.version,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupTools();
    this.setupHandlers();
    this.startSessionCleanup();
  }

  private setupTools(): void {
    // Register all tools
    const allTools = [
      ...sourcingTools,
      ...documentTools,
      ...orchestrationTools,
      ...interviewTools,
    ];

    allTools.forEach(tool => {
      this.tools.set(tool.getDefinition().name, tool);
    });

    console.error(`Registered ${this.tools.size} MCP tools`);
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = Array.from(this.tools.values()).map(tool => 
        tool.getDefinition()
      );

      return { tools };
    });

    // Execute tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      const tool = this.tools.get(name);
      if (!tool) {
        throw new MCPError(`Unknown tool: ${name}`, 'TOOL_NOT_FOUND');
      }

      try {
        // Get or create session
        const sessionId = this.getSessionId(request);
        const session = this.getOrCreateSession(sessionId);

        // Execute the tool
        const result = await tool.execute({
          name,
          arguments: args || {},
        }, session);

        // Update session activity
        session.lastActivity = new Date();

        return result;
      } catch (error) {
        console.error(`Tool execution error for ${name}:`, error);
        
        if (error instanceof ValidationError) {
          throw new MCPError(error.message, 'VALIDATION_ERROR', error.details);
        } else if (error instanceof MCPError) {
          throw error;
        } else {
          throw new MCPError(
            `Internal error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`,
            'INTERNAL_ERROR'
          );
        }
      }
    });

    // Handle resources/list request
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return { resources: [] }; // Return empty array for now
    });

    // Handle prompts/list request  
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return { 
        prompts: [
          {
            name: 'recruitment-search-guide',
            description: 'Guidelines for using Apply.codes recruitment search tools effectively',
            arguments: []
          },
          {
            name: 'tool-selection-help', 
            description: 'Get specific guidance on which tool to use for a given query',
            arguments: [
              {
                name: 'userQuery',
                description: 'The user query to analyze',
                required: true
              }
            ]
          }
        ]
      };
    });

    // Handle prompts/get request
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      if (name === 'recruitment-search-guide') {
        return {
          description: 'Complete guide for using Apply.codes recruitment tools',
          messages: [
            {
              role: 'system',
              content: {
                type: 'text',
                text: RECRUITMENT_MCP_SYSTEM_PROMPT
              }
            }
          ]
        };
      } else if (name === 'tool-selection-help' && args?.userQuery) {
        return {
          description: 'Specific guidance for your query',
          messages: [
            {
              role: 'system', 
              content: {
                type: 'text',
                text: getToolSelectionPrompt(args.userQuery as string)
              }
            }
          ]
        };
      }
      
      throw new MCPError('Unknown prompt', 'PROMPT_NOT_FOUND');
    });

    // Error handling
    this.server.onerror = (error) => {
      console.error('MCP Server error:', error);
    };

    process.on('SIGINT', async () => {
      console.error('\\nShutting down Apply MCP Server...');
      await this.server.close();
      process.exit(0);
    });
  }

  private getSessionId(request: any): string {
    // In a real implementation, this would extract session ID from request context
    // For now, we'll use a default session
    return request.meta?.sessionId || 'default-session';
  }

  private getOrCreateSession(sessionId: string): MCPSession {
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      session = {
        id: sessionId,
        createdAt: new Date(),
        lastActivity: new Date(),
        context: {},
      };
      this.sessions.set(sessionId, session);
    }

    return session;
  }

  public async start(): Promise<void> {
    // Initialize secrets manager
    console.error('Initializing secrets manager...');
    await secretsManager.initialize();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('Apply MCP Server started successfully');
    console.error(`Server: ${this.config.name} v${this.config.version}`);
    console.error(`Description: ${this.config.description}`);
    console.error(`Available tools: ${this.tools.size}`);
    console.error('\\nTool categories:');
    console.error('  • Candidate Sourcing: Boolean queries, market intelligence, candidate search');
    console.error('  • Document Processing: Resume parsing, job description enhancement, comparison');
    console.error('  • AI Orchestration: Workflow execution, recruitment planning, system status');
    console.error('  • Interview Tools: Question generation, feedback analysis');
    console.error('\\nReady to accept tool calls from MCP clients...\\n');
  }

  // Cleanup old sessions periodically
  private startSessionCleanup(): void {
    setInterval(() => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.lastActivity < oneHourAgo) {
          this.sessions.delete(sessionId);
        }
      }
    }, 15 * 60 * 1000); // Clean up every 15 minutes
  }

  public getServerInfo() {
    return {
      config: this.config,
      stats: {
        totalTools: this.tools.size,
        activeSessions: this.sessions.size,
        toolBreakdown: {
          sourcing: sourcingTools.length,
          document: documentTools.length,
          orchestration: orchestrationTools.length,
          interview: interviewTools.length,
        },
      },
    };
  }
}

// Main execution
async function main() {
  try {
    const server = new ApplyMCPServer();
    await server.start();
  } catch (error) {
    console.error('Failed to start Apply MCP Server:', error);
    process.exit(1);
  }
}

// Run the server
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ApplyMCPServer };