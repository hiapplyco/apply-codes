#!/usr/bin/env node

// Load environment variables
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { sourcingTools } from './controllers/sourcing-tools.js';
import { documentTools } from './controllers/document-tools.js';
import { orchestrationTools } from './controllers/orchestration-tools.js';
import { interviewTools } from './controllers/interview-tools.js';
import { BaseMCPTool } from './utils/base-tool.js';
import { MCPSession, MCPError, ValidationError } from './types/mcp.js';
import { secretsManager } from './services/secrets-manager.js';
import { RECRUITMENT_MCP_SYSTEM_PROMPT, getToolSelectionPrompt } from './prompts/system-prompts.js';
import { authManager } from './utils/auth-manager.js';
import { rateLimiter } from './utils/rate-limiter.js';

// ── Resource Definitions ──────────────────────────────────────────────
const RESOURCES = [
  {
    uri: 'apply://schemas/candidate',
    name: 'Candidate Schema',
    description: 'JSON Schema for candidate objects returned by search tools',
    mimeType: 'application/json',
  },
  {
    uri: 'apply://schemas/job-requirements',
    name: 'Job Requirements Schema',
    description: 'JSON Schema for structured job requirements used in matching',
    mimeType: 'application/json',
  },
  {
    uri: 'apply://config/skills-taxonomy',
    name: 'Skills Taxonomy',
    description: 'Hierarchical skills taxonomy used for candidate matching and search',
    mimeType: 'application/json',
  },
  {
    uri: 'apply://config/search-filters',
    name: 'Search Filter Options',
    description: 'Available filter options for candidate sourcing (platforms, experience levels, etc.)',
    mimeType: 'application/json',
  },
  {
    uri: 'apply://guides/tool-reference',
    name: 'Tool Reference Guide',
    description: 'Complete reference for all 11 recruitment tools with usage examples',
    mimeType: 'text/plain',
  },
];

function getResourceContent(uri: string): string {
  switch (uri) {
    case 'apply://schemas/candidate':
      return JSON.stringify({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        title: 'Candidate',
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique candidate identifier' },
          name: { type: 'string', description: 'Full name' },
          title: { type: 'string', description: 'Current job title' },
          company: { type: 'string', description: 'Current employer' },
          location: { type: 'string', description: 'Geographic location' },
          skills: { type: 'array', items: { type: 'string' }, description: 'Technical skills' },
          profileUrl: { type: 'string', format: 'uri', description: 'LinkedIn/profile URL' },
          source: { type: 'string', enum: ['linkedin', 'github', 'indeed', 'google'], description: 'Source platform' },
          summary: { type: 'string', description: 'Profile snippet/summary' },
          matchScore: { type: 'number', minimum: 0, maximum: 1, description: 'Relevance score (0-1)' },
        },
        required: ['id', 'name', 'profileUrl', 'source'],
      }, null, 2);

    case 'apply://schemas/job-requirements':
      return JSON.stringify({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        title: 'JobRequirements',
        type: 'object',
        properties: {
          title: { type: 'string' },
          requiredSkills: { type: 'array', items: { type: 'string' } },
          preferredSkills: { type: 'array', items: { type: 'string' } },
          experienceLevel: { type: 'string', enum: ['entry', 'mid', 'senior', 'executive'] },
          location: { type: 'string' },
          salaryRange: {
            type: 'object',
            properties: {
              min: { type: 'number' },
              max: { type: 'number' },
              currency: { type: 'string', default: 'USD' },
            },
          },
        },
        required: ['title', 'requiredSkills'],
      }, null, 2);

    case 'apply://config/skills-taxonomy':
      return JSON.stringify({
        categories: {
          'Programming Languages': ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#', 'Scala', 'R', 'Ruby', 'PHP', 'Swift', 'Kotlin'],
          'Frontend': ['React', 'Angular', 'Vue.js', 'Svelte', 'Next.js', 'Tailwind CSS', 'HTML/CSS'],
          'Backend': ['Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', '.NET', 'FastAPI', 'NestJS'],
          'Cloud & Infrastructure': ['AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'Serverless'],
          'Data & Databases': ['SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'BigQuery', 'Snowflake'],
          'AI & Machine Learning': ['TensorFlow', 'PyTorch', 'Vertex AI', 'OpenAI', 'LLMs', 'NLP', 'Computer Vision', 'MLOps'],
          'DevOps & Tools': ['CI/CD', 'Jenkins', 'GitHub Actions', 'Git', 'Linux', 'Monitoring', 'Observability'],
        },
        experienceLevels: {
          entry: { yearsRange: [0, 2], titles: ['Junior', 'Associate', 'Graduate'] },
          mid: { yearsRange: [3, 5], titles: ['Mid-level', 'Engineer II', 'Developer'] },
          senior: { yearsRange: [6, 10], titles: ['Senior', 'Lead', 'Staff'] },
          executive: { yearsRange: [10, 99], titles: ['Principal', 'Director', 'VP', 'CTO'] },
        },
      }, null, 2);

    case 'apply://config/search-filters':
      return JSON.stringify({
        platforms: {
          linkedin: { label: 'LinkedIn', supported: true, xRayEnabled: true },
          github: { label: 'GitHub', supported: true, xRayEnabled: false },
          indeed: { label: 'Indeed', supported: false, xRayEnabled: false },
          google: { label: 'Google', supported: true, xRayEnabled: true },
        },
        experienceLevels: ['entry', 'mid', 'senior', 'executive'],
        maxResults: { min: 1, max: 100, default: 20 },
        interviewTypes: ['technical', 'behavioral', 'cultural', 'screening', 'panel', 'final'],
        documentTypes: ['resume', 'cover_letter', 'job_description'],
      }, null, 2);

    case 'apply://guides/tool-reference':
      return RECRUITMENT_MCP_SYSTEM_PROMPT;

    default:
      throw new MCPError(`Resource not found: ${uri}`, 'RESOURCE_NOT_FOUND');
  }
}

// ── Prompt Definitions ────────────────────────────────────────────────
const PROMPTS = [
  {
    name: 'source-candidates',
    description: 'Guided workflow for sourcing candidates — extracts requirements, runs search, summarizes results',
    arguments: [
      { name: 'role', description: 'Job title or role description', required: true },
      { name: 'location', description: 'Geographic location or "remote"', required: false },
      { name: 'skills', description: 'Comma-separated required skills', required: false },
    ],
  },
  {
    name: 'analyze-resume',
    description: 'Guided workflow for analyzing a resume against a job description',
    arguments: [
      { name: 'resume', description: 'Resume text content', required: true },
      { name: 'jobDescription', description: 'Job description to match against', required: false },
    ],
  },
  {
    name: 'plan-recruitment',
    description: 'Generate a comprehensive recruitment plan for one or more roles',
    arguments: [
      { name: 'roles', description: 'Comma-separated list of roles to hire', required: true },
      { name: 'timeline', description: 'Hiring timeline (e.g., "8 weeks")', required: false },
      { name: 'budget', description: 'Recruitment budget', required: false },
    ],
  },
  {
    name: 'recruitment-search-guide',
    description: 'Complete reference guide for using all Apply.codes recruitment tools',
    arguments: [],
  },
  {
    name: 'tool-selection-help',
    description: 'Get specific guidance on which tool to use for your query',
    arguments: [
      { name: 'userQuery', description: 'The recruitment task you want to accomplish', required: true },
    ],
  },
];

function getPromptMessages(name: string, args: Record<string, string>): any {
  switch (name) {
    case 'source-candidates':
      return {
        description: `Source candidates for: ${args.role}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                `I need to source candidates for: ${args.role}`,
                args.location ? `Location: ${args.location}` : '',
                args.skills ? `Required skills: ${args.skills}` : '',
                '',
                'Please:',
                '1. Use analyze_job_requirements if I provided detailed requirements',
                '2. Use boolean_search to find candidates',
                '3. Summarize the top candidates with their match scores',
                '4. Suggest refinements if results are too broad or narrow',
              ].filter(Boolean).join('\n'),
            },
          },
        ],
      };

    case 'analyze-resume':
      return {
        description: 'Analyze resume and match against requirements',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                'Please analyze this resume:',
                '',
                args.resume,
                '',
                args.jobDescription
                  ? `Match it against this job description:\n${args.jobDescription}`
                  : 'Extract skills, experience, and provide a summary.',
                '',
                'Use parse_resume to extract structured data, then use compare_documents if a job description was provided.',
              ].filter(Boolean).join('\n'),
            },
          },
        ],
      };

    case 'plan-recruitment':
      return {
        description: `Recruitment plan for: ${args.roles}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                `Create a recruitment plan for these roles: ${args.roles}`,
                args.timeline ? `Timeline: ${args.timeline}` : '',
                args.budget ? `Budget: ${args.budget}` : '',
                '',
                'Use create_recruitment_plan to generate a comprehensive plan,',
                'then use get_market_intelligence for salary benchmarks for each role.',
              ].filter(Boolean).join('\n'),
            },
          },
        ],
      };

    case 'recruitment-search-guide':
      return {
        description: 'Complete guide for using Apply.codes recruitment tools',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: RECRUITMENT_MCP_SYSTEM_PROMPT,
            },
          },
        ],
      };

    case 'tool-selection-help':
      return {
        description: 'Tool selection guidance for your query',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: getToolSelectionPrompt(args.userQuery || ''),
            },
          },
        ],
      };

    default:
      throw new MCPError(`Unknown prompt: ${name}`, 'PROMPT_NOT_FOUND');
  }
}

// ── Main Server Class ─────────────────────────────────────────────────
class ApplyMCPServer {
  private server: Server;
  private tools: Map<string, BaseMCPTool> = new Map();
  private sessions: Map<string, MCPSession> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: 'apply-recruitment',
        version: '2.0.0',
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
    const allTools = [
      ...sourcingTools,
      ...documentTools,
      ...orchestrationTools,
      ...interviewTools,
    ];

    allTools.forEach(tool => {
      this.tools.set(tool.getDefinition().name, tool);
    });

    console.error(`Registered ${this.tools.size} tools`);
  }

  private setupHandlers(): void {
    // ── Tools ──────────────────────────────────────────────────────
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(this.tools.values()).map(tool => tool.getDefinition()),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        authManager.validateRequest(request);

        const tool = this.tools.get(name);
        if (!tool) {
          throw new MCPError(`Unknown tool: ${name}`, 'TOOL_NOT_FOUND');
        }

        const sessionId = this.getSessionId(request);
        const session = this.getOrCreateSession(sessionId);
        rateLimiter.checkLimit(sessionId, name);

        const result = await tool.execute({ name, arguments: args || {} }, session);
        session.lastActivity = new Date();

        return result;
      } catch (error) {
        console.error(`Tool error [${name}]:`, error);

        if (error instanceof ValidationError) {
          throw new MCPError(error.message, 'VALIDATION_ERROR', error.details);
        } else if (error instanceof MCPError) {
          throw error;
        }
        throw new MCPError(
          `Internal error in ${name}: ${error instanceof Error ? error.message : String(error)}`,
          'INTERNAL_ERROR'
        );
      }
    });

    // ── Resources ─────────────────────────────────────────────────
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return { resources: RESOURCES };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      const resource = RESOURCES.find(r => r.uri === uri);
      if (!resource) {
        throw new MCPError(`Resource not found: ${uri}`, 'RESOURCE_NOT_FOUND');
      }
      return {
        contents: [
          {
            uri,
            mimeType: resource.mimeType,
            text: getResourceContent(uri),
          },
        ],
      };
    });

    // ── Prompts ───────────────────────────────────────────────────
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return { prompts: PROMPTS };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return getPromptMessages(name, (args || {}) as Record<string, string>);
    });

    // ── Error & Shutdown ──────────────────────────────────────────
    this.server.onerror = (error) => {
      console.error('MCP Server error:', error);
    };

    process.on('SIGINT', async () => {
      console.error('Shutting down...');
      rateLimiter.stop();
      await this.server.close();
      process.exit(0);
    });
  }

  private getSessionId(request: any): string {
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
    console.error('Initializing Apply MCP Server v2.0.0...');
    await secretsManager.initialize();

    const authStatus = authManager.getStatus();
    const rateLimitConfig = rateLimiter.getConfig();

    console.error(`Auth: ${authStatus.enabled ? 'ON' : 'OFF'} | Rate limit: ${rateLimitConfig.enabled ? 'ON' : 'OFF'}`);

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error(`Ready — ${this.tools.size} tools, ${RESOURCES.length} resources, ${PROMPTS.length} prompts`);
  }

  private startSessionCleanup(): void {
    setInterval(() => {
      const cutoff = new Date(Date.now() - 60 * 60 * 1000);
      for (const [id, session] of this.sessions.entries()) {
        if (session.lastActivity < cutoff) {
          this.sessions.delete(id);
        }
      }
    }, 15 * 60 * 1000);
  }
}

// ── Entry Point ───────────────────────────────────────────────────────
async function main() {
  try {
    const server = new ApplyMCPServer();
    await server.start();
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

main().catch(console.error);

export { ApplyMCPServer };
