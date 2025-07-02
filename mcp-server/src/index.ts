#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Create server instance
const server = new Server(
  {
    name: 'apply-codebase-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Define key directories and files for the Apply codebase
const CODEBASE_RESOURCES = [
  {
    uri: 'file://src/components',
    name: 'React Components',
    description: 'All React components including search, profile cards, and UI elements',
    mimeType: 'text/directory',
  },
  {
    uri: 'file://src/pages',
    name: 'Page Components',
    description: 'Main page components for routing',
    mimeType: 'text/directory',
  },
  {
    uri: 'file://supabase/functions',
    name: 'Edge Functions',
    description: '35+ Supabase edge functions for AI operations, search, and data processing',
    mimeType: 'text/directory',
  },
  {
    uri: 'file://src/types',
    name: 'TypeScript Types',
    description: 'Type definitions including domains and interfaces',
    mimeType: 'text/directory',
  },
  {
    uri: 'file://src/hooks',
    name: 'React Hooks',
    description: 'Custom React hooks for auth, data fetching, etc.',
    mimeType: 'text/directory',
  },
  {
    uri: 'file://src/lib',
    name: 'Utilities',
    description: 'Utility functions and helpers',
    mimeType: 'text/directory',
  },
  {
    uri: 'file://src/context',
    name: 'React Context',
    description: 'Context providers for auth, projects, etc.',
    mimeType: 'text/directory',
  },
  {
    uri: 'file://CLAUDE.md',
    name: 'AI Assistant Guide',
    description: 'Development guide and codebase documentation',
    mimeType: 'text/markdown',
  },
  {
    uri: 'file://package.json',
    name: 'Package Configuration',
    description: 'Project dependencies and scripts',
    mimeType: 'application/json',
  },
];

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: CODEBASE_RESOURCES,
  };
});

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  const filepath = uri.replace('file://', '');
  
  try {
    const stats = await fs.stat(filepath);
    
    if (stats.isDirectory()) {
      // List directory contents
      const files = await fs.readdir(filepath);
      const fileList = files
        .filter(f => !f.startsWith('.'))
        .map(f => `- ${f}`)
        .join('\n');
      
      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: `Directory contents of ${filepath}:\n\n${fileList}`,
          },
        ],
      };
    } else {
      // Read file content
      const content = await fs.readFile(filepath, 'utf-8');
      return {
        contents: [
          {
            uri,
            mimeType: uri.endsWith('.json') ? 'application/json' : 'text/plain',
            text: content,
          },
        ],
      };
    }
  } catch (error) {
    throw new Error(`Failed to read resource: ${error}`);
  }
});

// Define tools specific to Apply codebase
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_codebase',
        description: 'Search for patterns or text across the Apply codebase',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: {
              type: 'string',
              description: 'Pattern or text to search for',
            },
            fileType: {
              type: 'string',
              description: 'File extension to filter (e.g., tsx, ts, css)',
              enum: ['tsx', 'ts', 'css', 'json', 'md', 'all'],
            },
            directory: {
              type: 'string',
              description: 'Directory to search in (e.g., src/components)',
            },
          },
          required: ['pattern'],
        },
      },
      {
        name: 'analyze_component',
        description: 'Analyze a React component for dependencies, props, and structure',
        inputSchema: {
          type: 'object',
          properties: {
            componentPath: {
              type: 'string',
              description: 'Path to the component file (e.g., src/components/ProfileCard.tsx)',
            },
          },
          required: ['componentPath'],
        },
      },
      {
        name: 'find_edge_functions',
        description: 'Find and analyze Supabase edge functions',
        inputSchema: {
          type: 'object',
          properties: {
            functionName: {
              type: 'string',
              description: 'Name of the edge function (optional, lists all if empty)',
            },
            category: {
              type: 'string',
              description: 'Category of functions to find',
              enum: ['ai', 'search', 'data', 'auth', 'all'],
            },
          },
        },
      },
      {
        name: 'analyze_ai_integrations',
        description: 'Find all AI/ML integrations (Gemini, OpenAI, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            service: {
              type: 'string',
              description: 'AI service to search for',
              enum: ['gemini', 'openai', 'nymeria', 'all'],
            },
          },
        },
      },
      {
        name: 'get_project_stats',
        description: 'Get statistics about the Apply codebase',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'find_api_endpoints',
        description: 'Find API endpoints and their usage',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'Type of endpoints to find',
              enum: ['supabase', 'external', 'all'],
            },
          },
        },
      },
    ],
  };
});

// Implement tool handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  // Type guard for args
  if (!args) {
    throw new Error('No arguments provided');
  }
  
  try {
    switch (name) {
      case 'search_codebase': {
        const { pattern, fileType = 'all', directory = '.' } = args as { pattern: string; fileType?: string; directory?: string };
        const fileExtension = fileType === 'all' ? '' : `--include="*.${fileType}"`;
        
        const command = `rg "${pattern}" ${directory} ${fileExtension} -n --max-count=50 || true`;
        const { stdout } = await execAsync(command);
        
        return {
          content: [
            {
              type: 'text',
              text: stdout || `No matches found for "${pattern}"`,
            },
          ],
        };
      }
      
      case 'analyze_component': {
        const { componentPath } = args as { componentPath: string };
        
        try {
          const content = await fs.readFile(componentPath, 'utf-8');
          
          // Extract imports
          const imports = content.match(/import\s+.*\s+from\s+['"].*['"]/g) || [];
          
          // Extract props interface
          const propsMatch = content.match(/interface\s+\w*Props\s*{[^}]*}/s);
          
          // Extract exported component
          const exportMatch = content.match(/export\s+(default\s+)?(function|const)\s+(\w+)/);
          
          // Count hooks usage
          const hooks = content.match(/use[A-Z]\w*/g) || [];
          const uniqueHooks = [...new Set(hooks)];
          
          const analysis = `
Component Analysis for ${componentPath}:

Component Name: ${exportMatch ? exportMatch[3] : 'Unknown'}
Type: ${exportMatch ? exportMatch[2] : 'Unknown'}

Dependencies (${imports.length}):
${imports.slice(0, 10).join('\n')}
${imports.length > 10 ? `... and ${imports.length - 10} more` : ''}

Props Interface:
${propsMatch ? propsMatch[0] : 'No props interface found'}

Hooks Used (${uniqueHooks.length}):
${uniqueHooks.join(', ')}

File Stats:
- Lines of code: ${content.split('\n').length}
- Has tests: ${await fs.access(componentPath.replace('.tsx', '.test.tsx')).then(() => 'Yes').catch(() => 'No')}
`;
          
          return {
            content: [
              {
                type: 'text',
                text: analysis,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error analyzing component: ${error}`,
              },
            ],
          };
        }
      }
      
      case 'find_edge_functions': {
        const { functionName, category = 'all' } = args as { functionName?: string; category?: string };
        const functionsDir = 'supabase/functions';
        
        try {
          const functions = await fs.readdir(functionsDir);
          let filteredFunctions = functions.filter(f => !f.startsWith('.'));
          
          if (functionName) {
            filteredFunctions = filteredFunctions.filter(f => 
              f.toLowerCase().includes(functionName.toLowerCase())
            );
          }
          
          if (category !== 'all') {
            const categoryMap: Record<string, string[]> = {
              ai: ['gemini', 'openai', 'chat', 'analyze', 'generate'],
              search: ['search', 'query', 'find', 'boolean'],
              data: ['enrich', 'fetch', 'process', 'parse'],
              auth: ['auth', 'login', 'verify', 'token'],
            };
            
            const keywords = categoryMap[category] || [];
            filteredFunctions = filteredFunctions.filter(f =>
              keywords.some(k => f.toLowerCase().includes(k))
            );
          }
          
          const functionDetails = await Promise.all(
            filteredFunctions.slice(0, 20).map(async (func) => {
              try {
                const indexPath = path.join(functionsDir, func, 'index.ts');
                const content = await fs.readFile(indexPath, 'utf-8');
                const description = content.match(/\/\*\*\s*\n\s*\*\s*(.+)/)?.[1] || 'No description';
                return `- ${func}: ${description}`;
              } catch {
                return `- ${func}: (No index.ts found)`;
              }
            })
          );
          
          return {
            content: [
              {
                type: 'text',
                text: `Found ${filteredFunctions.length} edge functions${category !== 'all' ? ` in category '${category}'` : ''}:\n\n${functionDetails.join('\n')}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error finding edge functions: ${error}`,
              },
            ],
          };
        }
      }
      
      case 'analyze_ai_integrations': {
        const { service = 'all' } = args as { service?: string };
        
        const searchTerms: Record<string, string[]> = {
          gemini: ['gemini', 'googleai', 'generativeai'],
          openai: ['openai', 'gpt', 'chatgpt'],
          nymeria: ['nymeria', 'enrich', 'contact'],
          all: ['gemini', 'openai', 'nymeria', 'googleai', 'generativeai'],
        };
        
        const terms = searchTerms[service] || searchTerms.all;
        const pattern = terms.join('|');
        
        const { stdout } = await execAsync(
          `rg -i "(${pattern})" --type ts --type tsx -n --max-count=30 || true`
        );
        
        const envVars = await execAsync(
          `rg "VITE_.*API_KEY|GEMINI|OPENAI|NYMERIA" .env* || true`
        );
        
        return {
          content: [
            {
              type: 'text',
              text: `AI Integration Analysis for ${service}:\n\nCode References:\n${stdout || 'No references found'}\n\nEnvironment Variables:\n${envVars.stdout || 'No API keys found'}`,
            },
          ],
        };
      }
      
      case 'get_project_stats': {
        const stats = await Promise.all([
          execAsync('find src -name "*.tsx" -o -name "*.ts" | wc -l'),
          execAsync('find src/components -name "*.tsx" | wc -l'),
          execAsync('find supabase/functions -type d -mindepth 1 -maxdepth 1 | wc -l'),
          execAsync('find src -name "*.test.tsx" -o -name "*.test.ts" | wc -l'),
        ]);
        
        const [totalFiles, components, edgeFunctions, testFiles] = stats.map(s => 
          parseInt(s.stdout.trim())
        );
        
        const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
        const dependencies = Object.keys(packageJson.dependencies || {}).length;
        const devDependencies = Object.keys(packageJson.devDependencies || {}).length;
        
        return {
          content: [
            {
              type: 'text',
              text: `Apply Codebase Statistics:

Files:
- Total TypeScript files: ${totalFiles}
- React components: ${components}
- Edge functions: ${edgeFunctions}
- Test files: ${testFiles}

Dependencies:
- Production: ${dependencies}
- Development: ${devDependencies}
- Key frameworks: React, TypeScript, Vite, Tailwind CSS, Supabase

Architecture:
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Supabase (PostgreSQL + Edge Functions)
- AI: Google Gemini 2.0 Flash
- Deployment: Vercel (Frontend) + Supabase (Backend)
`,
            },
          ],
        };
      }
      
      case 'find_api_endpoints': {
        const { type = 'all' } = args as { type?: string };
        
        let searchPattern = '';
        if (type === 'supabase') {
          searchPattern = 'supabase\\.(from|rpc|functions\\.invoke)';
        } else if (type === 'external') {
          searchPattern = 'fetch\\(|axios\\.|https?://';
        } else {
          searchPattern = 'supabase\\.(from|rpc|functions\\.invoke)|fetch\\(|axios\\.|https?://';
        }
        
        const { stdout } = await execAsync(
          `rg "${searchPattern}" src --type ts --type tsx -n --max-count=50 || true`
        );
        
        return {
          content: [
            {
              type: 'text',
              text: `API Endpoints (${type}):\n\n${stdout || 'No endpoints found'}`,
            },
          ],
        };
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error}`,
        },
      ],
    };
  }
});

// Start the server
const transport = new StdioServerTransport();
server.connect(transport);

console.error('Apply MCP Server started successfully');