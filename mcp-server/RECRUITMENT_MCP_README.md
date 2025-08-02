# Apply.codes Recruitment MCP Server

A Model Context Protocol (MCP) server that exposes Apply.codes recruitment platform capabilities as tools that can be used by any LLM client supporting the MCP protocol.

## Overview

This MCP server provides 12 specialized tools across 4 categories for AI-powered recruitment:

### 🔍 Candidate Sourcing (4 tools)
- **generate_boolean_query** - Generate advanced Boolean search queries for candidate sourcing
- **search_candidates** - Search for candidates across multiple platforms (LinkedIn, GitHub, etc.)
- **analyze_job_requirements** - Extract and analyze key requirements from job descriptions
- **get_market_intelligence** - Get market insights for roles, salaries, and competition

### 📄 Document Processing (3 tools)
- **parse_resume** - Extract structured data from resumes (PDF, DOCX, text)
- **enhance_job_description** - Optimize job descriptions for better candidate attraction
- **compare_documents** - Compare resumes against job requirements with match scoring

### 🤖 AI Orchestration (3 tools)
- **execute_recruitment_workflow** - Run end-to-end recruitment workflows with AI agents
- **create_recruitment_plan** - Generate detailed recruitment strategies and timelines
- **get_orchestrator_status** - Monitor AI agent performance and system health

### 💼 Interview Tools (2 tools)
- **generate_interview_questions** - Create customized interview questions and evaluation frameworks
- **analyze_interview_feedback** - Process interview feedback with hiring recommendations

## Installation

### Prerequisites
- Node.js 18+ with ES module support
- TypeScript 5.0+
- An MCP-compatible client (Claude Desktop, etc.)
- Supabase project (for secure secrets management)

### Setup Options

#### Option 1: Automated Setup with Supabase (Recommended)

For secure API key management using Supabase Edge Functions:

```bash
cd apply-codes
node scripts/setup-mcp.js
```

See [MCP_SUPABASE_SETUP.md](./MCP_SUPABASE_SETUP.md) for detailed instructions.

#### Option 2: Manual Setup

1. **Clone and install dependencies:**
```bash
cd /Users/jms/Development/apply-codes/mcp-server
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Build the TypeScript code:**
```bash
npm run build
```

4. **Configure your MCP client** (example for Claude Desktop):
```json
{
  "mcpServers": {
    "apply-recruitment": {
      "command": "node",
      "args": ["/Users/jms/Development/apply-codes/mcp-server/dist/server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

4. **Start the server** (for testing):
```bash
npm start
```

## Usage Examples

### Basic Candidate Search
```typescript
// Generate a Boolean query
const query = await mcp.callTool('generate_boolean_query', {
  role: 'Senior Software Engineer',
  requiredSkills: ['React', 'Node.js', 'AWS'],
  location: 'San Francisco, CA',
  excludeTerms: ['intern', 'junior']
});

// Search for candidates
const candidates = await mcp.callTool('search_candidates', {
  query: query.booleanQuery,
  platforms: ['linkedin', 'github'],
  maxResults: 20,
  filters: {
    location: 'San Francisco Bay Area',
    experienceLevel: 'senior'
  }
});
```

### Resume Analysis
```typescript
// Parse a resume
const parsedResume = await mcp.callTool('parse_resume', {
  content: resumeText,
  contentType: 'text',
  extractSections: {
    contact: true,
    experience: true,
    skills: true,
    education: true
  }
});

// Compare against job requirements
const comparison = await mcp.callTool('compare_documents', {
  resumeContent: JSON.stringify(parsedResume),
  jobDescription: jobDescriptionText,
  criteria: {
    skills: 0.4,
    experience: 0.3,
    education: 0.2,
    other: 0.1
  }
});
```

### Full Recruitment Workflow
```typescript
// Execute a complete recruitment workflow
const workflow = await mcp.callTool('execute_recruitment_workflow', {
  workflowType: 'full_recruitment',
  input: {
    jobDescription: jobText,
    requiredSkills: ['JavaScript', 'React', 'Node.js'],
    location: 'Remote',
    maxCandidates: 25
  },
  options: {
    priority: 'high',
    async: false
  }
});
```

### Interview Question Generation
```typescript
// Generate interview questions
const interviewPlan = await mcp.callTool('generate_interview_questions', {
  jobTitle: 'Senior Software Engineer',
  requiredSkills: ['React', 'Node.js', 'System Design'],
  experienceLevel: 'senior',
  interviewType: 'technical',
  duration: 60
});
```

## Tool Reference

### Candidate Sourcing Tools

#### `generate_boolean_query`
Generates advanced Boolean search queries for candidate sourcing platforms.

**Parameters:**
- `role` (string) - Target job role/title
- `requiredSkills` (string[]) - Must-have technical skills
- `preferredSkills` (string[]) - Nice-to-have skills
- `location` (string) - Geographic location or "remote"
- `experienceLevel` (enum) - entry, mid, senior, executive
- `excludeTerms` (string[]) - Terms to exclude from search
- `includeAlternatives` (boolean) - Include alternative job titles

#### `search_candidates`
Search for candidates across multiple platforms with AI-powered matching.

**Parameters:**
- `query` (string) - Search query (Boolean or natural language)
- `platforms` (string[]) - Platforms to search: linkedin, github, stackoverflow
- `maxResults` (number) - Maximum candidates to return (1-100)
- `filters` (object) - Location, experience, availability filters
- `enrichmentLevel` (enum) - none, basic, full

#### `analyze_job_requirements`
Extract and analyze key requirements from job descriptions.

**Parameters:**
- `jobDescription` (string) - Full job description text
- `extractSkills` (boolean) - Extract technical skills
- `extractQualifications` (boolean) - Extract education/certifications
- `identifyLevel` (boolean) - Determine experience level
- `suggestKeywords` (boolean) - Suggest search keywords

#### `get_market_intelligence`
Retrieve market insights for roles, compensation, and hiring competition.

**Parameters:**
- `role` (string) - Job role to analyze
- `location` (string) - Geographic market
- `company` (string) - Company name for competitive analysis
- `dataPoints` (string[]) - salary, demand, competition, skills

### Document Processing Tools

#### `parse_resume`
Parse and extract structured data from resume documents.

**Parameters:**
- `content` (string) - Resume content (text or base64)
- `filename` (string) - Original filename
- `contentType` (enum) - text, pdf, docx
- `extractSections` (object) - Sections to extract (contact, experience, etc.)

#### `enhance_job_description`
Optimize job descriptions for better candidate attraction and SEO.

**Parameters:**
- `jobDescription` (string) - Original job description
- `companyInfo` (object) - Company details to include
- `optimizeFor` (string[]) - seo, diversity, clarity, appeal
- `includeStructure` (boolean) - Add structured formatting

#### `compare_documents`
Compare resumes against job requirements with detailed match scoring.

**Parameters:**
- `resumeContent` (string) - Resume content or parsed data
- `jobDescription` (string) - Job description text
- `criteria` (object) - Scoring weights for skills, experience, education
- `detailed` (boolean) - Include detailed analysis and recommendations

### AI Orchestration Tools

#### `execute_recruitment_workflow`
Execute pre-defined recruitment workflows with AI agents.

**Parameters:**
- `workflowType` (enum) - full_recruitment, quick_source, deep_research, strategic_planning, bulk_enrichment
- `input` (object) - Job description, skills, location, candidate limits
- `options` (object) - Async execution, priority, timeout settings

#### `create_recruitment_plan`
Generate detailed recruitment strategies with timelines and resource requirements.

**Parameters:**
- `objective` (string) - Main recruitment objective
- `requirements` (object) - Role details, skills, experience, salary
- `constraints` (object) - Timeline, budget, team size, urgency

#### `get_orchestrator_status`
Monitor AI orchestration system status and performance metrics.

**Parameters:**
- `includeMetrics` (boolean) - Include performance metrics
- `includeHistory` (boolean) - Include recent execution history

### Interview Tools

#### `generate_interview_questions`
Create customized interview questions based on role requirements.

**Parameters:**
- `jobTitle` (string) - Position title
- `requiredSkills` (string[]) - Required technical/soft skills
- `experienceLevel` (enum) - entry, mid, senior, executive
- `interviewType` (enum) - phone, video, onsite, technical, behavioral
- `duration` (number) - Interview duration in minutes
- `candidateBackground` (string) - Optional candidate context
- `focusAreas` (string[]) - Specific areas to emphasize

#### `analyze_interview_feedback`
Analyze interview feedback and provide structured hiring recommendations.

**Parameters:**
- `candidateName` (string) - Candidate being evaluated
- `interviewType` (string) - Type of interview conducted
- `feedback` (object[]) - Feedback from all interviewers with ratings and comments
- `jobRequirements` (object) - Job requirements for comparison

## Error Handling

The server implements comprehensive error handling with custom error types:

- **ValidationError**: Input parameter validation failures
- **MCPError**: Protocol-level errors with error codes
- **ToolNotFoundError**: Requests for non-existent tools

All errors include detailed messages and context for debugging.

## Session Management

The server maintains session state for:
- Workflow continuity across multiple tool calls
- Performance metrics and usage tracking
- Context preservation for complex operations
- Automatic cleanup of expired sessions (1 hour TTL)

## Performance & Monitoring

### Metrics Tracked
- Tool execution times and success rates
- Session activity and resource usage
- Error patterns and failure analysis
- API usage and rate limiting status

### Health Checks
- Agent status monitoring
- External API connectivity
- Message queue health
- Database connection status

## Development

### Building from Source
```bash
npm run build    # Compile TypeScript
npm run dev      # Development mode with hot reload
npm run test     # Run test suite
npm run lint     # Code quality checks
```

### Adding New Tools
1. Create tool class extending `BaseMCPTool`
2. Define Zod schema for input validation
3. Implement `handler` method with business logic
4. Add to appropriate controller exports
5. Update documentation and tests

### Environment Variables
```bash
# Optional configuration
NODE_ENV=production
LOG_LEVEL=info
SESSION_TTL=3600000
MAX_CONCURRENT_SESSIONS=100
```

## Integration Examples

### Claude Desktop Configuration
```json
{
  "mcpServers": {
    "apply-recruitment": {
      "command": "node",
      "args": ["./dist/server.js"],
      "cwd": "/path/to/apply-codes/mcp-server"
    }
  }
}
```

### Custom MCP Client
```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const client = new Client({
  name: "my-recruitment-app",
  version: "1.0.0"
}, {
  capabilities: {}
});

const transport = new StdioClientTransport({
  command: "node",
  args: ["./dist/server.js"]
});

await client.connect(transport);

// List available tools
const tools = await client.request({ method: "tools/list" }, {});

// Call a tool
const result = await client.request({
  method: "tools/call",
  params: {
    name: "search_candidates",
    arguments: {
      query: "Senior JavaScript Developer",
      platforms: ["linkedin"],
      maxResults: 10
    }
  }
}, {});
```

## Architecture

```
mcp-server/
├── src/
│   ├── controllers/          # Tool implementations
│   │   ├── sourcing-tools.ts    # Candidate sourcing
│   │   ├── document-tools.ts    # Document processing  
│   │   ├── orchestration-tools.ts # AI workflows
│   │   └── interview-tools.ts   # Interview management
│   ├── utils/
│   │   └── base-tool.ts      # Base tool class
│   ├── types/
│   │   └── mcp.ts           # Type definitions
│   ├── server.ts            # Main MCP server
│   └── index.ts            # Legacy server (codebase access)
├── dist/                   # Compiled JavaScript
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md             # This file
```

## Security Considerations

- Input validation using Zod schemas
- Session isolation and automatic cleanup
- Rate limiting awareness for external APIs
- Secure handling of sensitive candidate data
- Audit logging for compliance requirements

## Support

For issues, feature requests, or contributions:
1. Check existing documentation
2. Review error logs and session data
3. Test with minimal reproduction case
4. Submit detailed bug reports with context

## License

This MCP server is part of the Apply.codes platform. See main project license for terms and conditions.