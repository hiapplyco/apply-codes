#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createToolRegistry } from './tools/index.js';

// Initialize tool registry
const tools = createToolRegistry();

// Initialize the Apply Recruitment Tools MCP Server
const server = new Server(
  {
    name: 'apply-recruitment-tools',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List all registered tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Array.from(tools.values()).map(tool => tool.definition),
  };
});

// Dispatch tool calls to the appropriate handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error('No arguments provided');
  }

  const tool = tools.get(name);
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }

  try {
    const result = await tool.execute(args as Record<string, any>);
    return result as any;
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error executing ${name}: ${error}`,
        },
      ],
    } as any;
  }
});

// Start the server
const transport = new StdioServerTransport();
server.connect(transport);

console.error('Apply Recruitment Tools MCP Server started successfully');
