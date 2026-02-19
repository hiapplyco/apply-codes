// System prompts for guiding LLM agents on tool usage

export const RECRUITMENT_MCP_SYSTEM_PROMPT = `
# Apply.codes MCP Server - Tool Usage Guidelines

You have access to Apply.codes recruitment tools. Follow these guidelines for optimal results:

## TOOL REFERENCE

### Candidate Sourcing (3 tools):
1. **boolean_search** — PRIMARY TOOL for ALL candidate searches. Uses Gemini AI to generate boolean queries, then executes Google CSE search. Returns structured candidate results.
2. **analyze_job_requirements** — Extract structured requirements from job descriptions. Use BEFORE searching.
3. **get_market_intelligence** — Get salary data, market demand, and hiring trends for roles.

### Document Processing (3 tools):
1. **parse_resume** — Extract structured data from resume text (skills, experience, education).
2. **enhance_job_description** — Improve job postings with better language and structure.
3. **compare_documents** — Match resumes to job descriptions with scoring.

### Workflow Automation (3 tools):
1. **execute_recruitment_workflow** — Full end-to-end recruitment workflows.
2. **create_recruitment_plan** — Generate strategic recruitment plans with timelines.
3. **get_orchestrator_status** — Check system status and health.

### Interviews (2 tools):
1. **generate_interview_questions** — Create tailored interview questions by role and type.
2. **analyze_interview_feedback** — Evaluate interview responses and generate reports.

## SEARCH WORKFLOW

For candidate sourcing, use boolean_search with natural language:
\`\`\`json
{
  "customInstructions": "senior Python developers with AWS experience",
  "location": "Seattle",
  "platforms": ["linkedin"],
  "maxResults": 20
}
\`\`\`

## BEST PRACTICES

1. **Start with context**: Use analyze_job_requirements if you have a job description
2. **Use boolean_search**: For ALL candidate searches — it handles query generation + execution
3. **Provide location**: Always include location if mentioned by the user
4. **Set reasonable limits**: Use 10-20 results for initial searches
5. **Follow up**: Use get_market_intelligence for salary/market insights
6. **Extract semantics**: Parse user requests for skills, titles, experience level, and location
`;

export const TOOL_SELECTION_RULES = {
  candidate_search: {
    primary: 'boolean_search',
    guidance: 'Always use boolean_search for ANY candidate search request'
  },
  job_analysis: {
    primary: 'analyze_job_requirements',
    guidance: 'Use this BEFORE searching to understand what to look for'
  },
  document_processing: {
    resume: 'parse_resume',
    job_posting: 'enhance_job_description',
    comparison: 'compare_documents',
    guidance: 'Choose based on document type'
  }
};

export function getToolSelectionPrompt(userQuery: string): string {
  const query = userQuery.toLowerCase();

  if (query.includes('find') || query.includes('search') || query.includes('look for') || query.includes('candidates')) {
    return `For this search request, use the boolean_search tool.
Extract from the query:
- customInstructions: The search criteria (skills, experience, etc.)
- location: Any geographic location mentioned
- platforms: Default to ["linkedin"] unless specified
- maxResults: Default to 20 unless specified`;
  }

  if (query.includes('resume') || query.includes('cv')) {
    return 'Use parse_resume tool for resume/CV processing.';
  }

  if (query.includes('job description') || query.includes('job posting')) {
    return 'Use enhance_job_description or analyze_job_requirements based on the need.';
  }

  return RECRUITMENT_MCP_SYSTEM_PROMPT;
}
