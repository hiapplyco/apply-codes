# Apply.codes MCP Server - Usage Examples

This document provides practical examples of how to use the Apply.codes MCP Server for recruitment workflows.

## Getting Started

First, ensure your MCP client is configured to connect to the Apply.codes MCP Server:

```json
{
  "mcpServers": {
    "apply-recruitment": {
      "command": "node",
      "args": ["/path/to/apply-codes/mcp-server/dist/server.js"],
      "cwd": "/path/to/apply-codes"
    }
  }
}
```

## Complete Recruitment Scenarios

### Scenario 1: Hiring a Senior Software Engineer

#### Step 1: Analyze Job Requirements
```
I need to hire a Senior Software Engineer. Here's my job description:

"We're looking for a Senior Software Engineer with 5+ years of experience in React, Node.js, and cloud technologies. The role involves leading a team of 3-4 developers, architecting scalable systems, and mentoring junior engineers. Strong AWS experience and startup experience preferred."

Can you analyze this job description and extract the key requirements?
```

**MCP Tool Used:** `analyze_job_requirements`

Expected response includes:
- Required skills: React, Node.js, AWS, Leadership
- Experience level: Senior (5+ years)
- Key responsibilities: Team leadership, Architecture, Mentoring
- Preferred qualifications: Startup experience

#### Step 2: Generate Search Query
```
Based on those requirements, generate an advanced Boolean search query I can use on LinkedIn to find candidates.
```

**MCP Tool Used:** `generate_boolean_query`

#### Step 3: Search for Candidates
```
Now search for candidates using that query across LinkedIn and GitHub. I want to find 25 candidates maximum.
```

**MCP Tool Used:** `search_candidates`

#### Step 4: Parse Candidate Resumes
```
I've received several resumes. Here's one candidate's resume:

[Resume content would go here]

Can you parse this resume and extract all the key information?
```

**MCP Tool Used:** `parse_resume`

#### Step 5: Compare Against Requirements
```
Now compare this parsed resume against our original job description. I want detailed scoring with recommendations.
```

**MCP Tool Used:** `compare_documents`

#### Step 6: Generate Interview Questions
```
This candidate looks promising with an 85% match score. Generate a comprehensive set of interview questions for a 60-minute technical interview focusing on React, Node.js, and leadership skills.
```

**MCP Tool Used:** `generate_interview_questions`

#### Step 7: Analyze Interview Feedback
```
Here's the feedback from our interview panel:

Interviewer 1 (Technical): Rating 4/5 - "Strong React knowledge, good system design thinking. Needs more AWS depth."
Interviewer 2 (Leadership): Rating 5/5 - "Excellent leadership examples, great communication skills."
Interviewer 3 (Culture): Rating 4/5 - "Good team fit, collaborative approach. Slightly concerned about startup pace."

Should we hire this candidate?
```

**MCP Tool Used:** `analyze_interview_feedback`

### Scenario 2: Bulk Candidate Processing

#### Processing Multiple Resumes
```
I have 50 resumes for a software engineering role. Can you help me process them all and rank them against this job description?

Job Description: "Full Stack Developer with React, Node.js, and database experience. 3+ years experience required."
```

Use the **bulk_enrichment** workflow:

**MCP Tool Used:** `execute_recruitment_workflow`
```json
{
  "workflowType": "bulk_enrichment",
  "input": {
    "jobDescription": "Full Stack Developer with React, Node.js, and database experience. 3+ years experience required.",
    "maxCandidates": 50,
    "enrichmentTypes": ["skills", "experience", "contact"]
  }
}
```

### Scenario 3: Market Research

#### Understanding the Market
```
I'm planning to hire 3 Senior Frontend Engineers in San Francisco. What's the current market like for this role?
```

**MCP Tool Used:** `get_market_intelligence`

#### Strategic Planning
```
Based on the market data, create a comprehensive recruitment plan for hiring these 3 engineers within 8 weeks.
```

**MCP Tool Used:** `create_recruitment_plan`

## Advanced Workflows

### Custom Recruitment Pipeline

#### Full Recruitment Workflow
```
Execute a complete recruitment workflow for this role:
- Position: Senior Backend Engineer
- Skills: Python, Django, PostgreSQL, AWS
- Location: Remote (US timezone)
- Timeline: 6 weeks
- Number of candidates needed: 20
```

**MCP Tool Used:** `execute_recruitment_workflow`
```json
{
  "workflowType": "full_recruitment",
  "input": {
    "jobDescription": "Senior Backend Engineer - Python, Django, PostgreSQL, AWS",
    "requiredSkills": ["Python", "Django", "PostgreSQL", "AWS"],
    "location": "Remote",
    "maxCandidates": 20
  },
  "options": {
    "priority": "high",
    "async": false
  }
}
```

#### Deep Research Workflow
```
I'm hiring for a very specialized role - ML Engineer with expertise in computer vision and edge computing. I need deep research on the candidate pool.
```

**MCP Tool Used:** `execute_recruitment_workflow`
```json
{
  "workflowType": "deep_research",
  "input": {
    "jobDescription": "ML Engineer - Computer Vision, Edge Computing",
    "requiredSkills": ["Computer Vision", "PyTorch", "TensorFlow", "Edge Computing"],
    "maxCandidates": 10
  }
}
```

### Job Description Optimization

#### Enhance Job Posting
```
Here's my current job description. Can you enhance it for better candidate attraction and diversity?

[Original job description]

Optimize for: diversity, appeal, and SEO.
```

**MCP Tool Used:** `enhance_job_description`

## Interview Management

### Question Generation for Different Interview Types

#### Technical Interview
```
Generate questions for a 90-minute technical interview for a Senior Frontend Engineer focusing on React, TypeScript, and system design.
```

#### Behavioral Interview
```
Create behavioral interview questions for assessing leadership potential and cultural fit for a Team Lead position.
```

#### Phone Screen
```
I need a 30-minute phone screen script for quickly evaluating candidates for a JavaScript Developer role.
```

### Processing Interview Results

#### Multiple Interviewer Feedback
```
Here's feedback from our interview panel for candidate Sarah Chen:

Technical Interviewer:
- Rating: 4/5
- Comments: "Strong React skills, good problem-solving approach"
- Strengths: ["React expertise", "Clean code", "Testing knowledge"]
- Concerns: ["Limited TypeScript experience"]

Behavioral Interviewer:
- Rating: 5/5  
- Comments: "Excellent communication, great leadership examples"
- Strengths: ["Leadership", "Communication", "Team collaboration"]
- Concerns: []

Hiring Manager:
- Rating: 4/5
- Comments: "Good technical skills, fits team culture well"
- Strengths: ["Technical depth", "Cultural fit"]
- Concerns: ["May need mentoring on architecture"]

Job Requirements:
- Required Skills: ["React", "TypeScript", "Node.js"]
- Experience Level: "senior"
- Critical Competencies: ["Leadership", "Technical Architecture"]

Should we extend an offer?
```

## Monitoring and Status

### System Health Check
```
Check the status of the AI orchestration system. Include performance metrics and recent workflow history.
```

**MCP Tool Used:** `get_orchestrator_status`

### Workflow Monitoring
```
I started a bulk recruitment workflow 2 hours ago. What's the current status?
```

Use the orchestrator status tool to monitor active workflows and their progress.

## Error Handling Examples

### Invalid Input Handling
```
# This will trigger validation error
generate_boolean_query with invalid experience level: "super-senior"
```

### Rate Limiting
```
# When external APIs hit rate limits
search_candidates: "Rate limit exceeded for LinkedIn API. Please retry in 15 minutes."
```

### Session Management
```
# Long-running workflows maintain context
workflow_123: "Continuing candidate enrichment from previous session..."
```

## Integration Patterns

### Batch Processing
```
I have a CSV file with 200 candidate emails. Can you enrich all their profiles and score them against this job description?
```

### Webhook Integration
```
Set up a workflow to automatically process new resumes as they're submitted through our careers page.
```

### CRM Integration
```
Export the top 10 candidates to our ATS with all enriched data and match scores.
```

## Best Practices

### Effective Search Queries
- Use specific technical skills: "React" not "frontend"
- Include alternative terms: "Software Engineer" OR "Developer"
- Exclude irrelevant terms: NOT "intern" NOT "student"

### Resume Analysis
- Always parse resumes before comparing to job descriptions
- Use structured extraction for consistent results
- Validate contact information quality

### Interview Planning
- Generate questions based on actual job requirements
- Include both technical and behavioral assessments
- Plan appropriate time allocation for each section

### Workflow Optimization
- Use async workflows for large candidate pools
- Monitor system status during heavy usage
- Implement retry logic for failed API calls

## Troubleshooting

### Common Issues

1. **Tool Not Found Error**
   ```
   Error: Unknown tool: search_candidate
   ```
   Solution: Check tool name spelling (should be `search_candidates`)

2. **Validation Error**
   ```
   Error: Invalid experience level: "expert"
   ```
   Solution: Use valid enum values: "entry", "mid", "senior", "executive"

3. **Rate Limiting**
   ```
   Warning: LinkedIn API rate limit at 80%
   ```
   Solution: Reduce search frequency or wait for rate limit reset

4. **Session Timeout**
   ```
   Error: Session expired
   ```
   Solution: Sessions auto-expire after 1 hour. Start a new workflow.

### Performance Tips

- Use `maxResults` parameter to limit large queries
- Enable async mode for long-running workflows  
- Monitor orchestrator status during peak usage
- Cache frequently used job descriptions and requirements

## Support and Resources

- Server logs: Check console output for detailed error messages
- Session management: Monitor active sessions and cleanup
- Performance metrics: Use orchestrator status for system health
- API documentation: Refer to tool schemas for parameter details