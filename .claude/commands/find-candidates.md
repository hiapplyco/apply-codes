# Find Candidates Command

Execute a complete candidate search workflow using Apply.codes MCP tools.

## Usage
```
/project:find-candidates "Senior React Developer with TypeScript experience"
```

## Workflow Steps

1. **Parse Requirements**
   - Extract key skills and qualifications
   - Identify experience level
   - Determine location preferences

2. **Generate Boolean Query**
   - Use AI to create optimized search string
   - Include synonyms and variations
   - Apply platform-specific syntax

3. **Execute Search**
   - Search across LinkedIn, Indeed, GitHub
   - Apply filters for relevance
   - Collect candidate profiles

4. **Analyze Candidates**
   - Parse profile information
   - Calculate match scores
   - Rank by relevance

5. **Generate Report**
   - Create summary of top candidates
   - Include contact information if available
   - Provide recommendations for outreach

## Required Tools
- `mcp__apply-recruitment__boolean_search`
- `mcp__apply-recruitment__search_candidates`
- `mcp__apply-recruitment__analyze_job_requirements`

## Options
- `--location`: Specify geographic location
- `--max-results`: Limit number of results (default: 20)
- `--platforms`: Choose specific platforms
- `--export`: Export results to file

## Example Output
```
Found 15 candidates matching criteria:

1. Jane Doe - Senior React Developer
   - 8 years experience
   - Skills: React, TypeScript, Node.js
   - Match Score: 95%
   - Location: San Francisco, CA

2. John Smith - Full Stack Engineer
   - 6 years experience
   - Skills: React, TypeScript, GraphQL
   - Match Score: 88%
   - Location: Remote
```