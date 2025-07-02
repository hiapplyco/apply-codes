# Apply Recruitment Tools - MCP Server

An MCP (Model Context Protocol) server that provides AI-powered recruitment tools for job posting creation, boolean search generation, candidate analysis, and talent sourcing strategies.

## Features

This MCP server provides 7 powerful recruitment tools:

### 1. **Generate Boolean Search** 
Create optimized LinkedIn boolean search strings for any role with automatic title variations and skill matching.

### 2. **Create Job Posting**
Generate comprehensive job postings with market insights and best practices.

### 3. **Analyze Candidate Fit**
Evaluate how well a candidate matches a job description with detailed analysis and recommendations.

### 4. **Generate Interview Questions**
Create strategic interview questions tailored to role, experience level, and interview type.

### 5. **Enhance Job Description**
Transform basic job descriptions into compelling postings that attract top talent.

### 6. **Market Compensation Analysis**
Get real-time market compensation data with percentiles, trends, and total comp breakdowns.

### 7. **Talent Sourcing Strategy**
Develop comprehensive sourcing strategies with channel recommendations and week-by-week plans.

## Installation

### For Claude Desktop

1. Install the MCP server globally:
```bash
npm install -g apply-recruitment-tools
```

2. Add to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "recruitment-tools": {
      "command": "apply-recruitment-tools"
    }
  }
}
```

3. Restart Claude Desktop

### For Development

1. Clone the repository:
```bash
git clone https://github.com/hiapplyco/apply-recruitment-tools-mcp.git
cd apply-recruitment-tools-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the server:
```bash
npm run build
```

4. Add to Claude Desktop config with local path:
```json
{
  "mcpServers": {
    "recruitment-tools": {
      "command": "node",
      "args": ["/path/to/apply-recruitment-tools-mcp/dist/index.js"]
    }
  }
}
```

## Usage Examples

Once installed, you can use these tools in Claude Desktop:

### Boolean Search Generation
"Use the recruitment tools to generate a boolean search for a Senior React Engineer with TypeScript experience in San Francisco"

### Job Posting Creation
"Create a job posting for a Product Manager at a Series B startup in Austin, Texas"

### Candidate Analysis
"Analyze how well this candidate's resume matches our Senior Data Scientist job description"

### Interview Questions
"Generate behavioral and technical interview questions for a mid-level DevOps Engineer"

### Compensation Analysis
"What's the market compensation for a Senior Software Engineer in Seattle with Python and AWS skills?"

### Sourcing Strategy
"Create a talent sourcing strategy for hiring 5 sales representatives within the next month"

## Tool Reference

### generate_boolean_search
- `jobTitle` (required): Target job title
- `skills`: Array of required skills
- `experience`: Years of experience
- `location`: Geographic preference
- `industry`: Target industry

### create_job_posting
- `companyName` (required): Hiring company
- `jobTitle` (required): Position title
- `location` (required): Job location
- `jobType` (required): Employment type
- `experienceLevel` (required): Seniority level
- `department`: Team/department
- `responsibilities`: Key duties
- `requirements`: Qualifications
- `salaryRange`: Compensation range
- `benefits`: Benefits package

### analyze_candidate_fit
- `jobDescription` (required): Job requirements
- `candidateProfile` (required): Resume/profile text
- `prioritySkills`: Must-have skills

### generate_interview_questions
- `jobTitle` (required): Position
- `interviewType` (required): Type of questions
- `skillsToAssess`: Specific competencies
- `experienceLevel`: Candidate level

### enhance_job_description
- `basicDescription` (required): Original posting
- `targetAudience`: Ideal candidate persona
- `companyHighlights`: Unique selling points

### market_compensation_analysis
- `jobTitle` (required): Role to analyze
- `location` (required): Geographic area
- `experienceLevel`: Seniority
- `skills`: Relevant skills
- `industry`: Industry sector

### talent_sourcing_strategy
- `role` (required): Position to fill
- `urgency` (required): Timeline
- `challenges`: Specific obstacles
- `budget`: Resource constraints

## Contributing

We welcome contributions! Please submit pull requests with:
- New recruitment tools
- Enhanced algorithms
- Bug fixes
- Documentation improvements

## License

MIT

## Support

For issues or questions:
- GitHub Issues: https://github.com/hiapplyco/apply-recruitment-tools-mcp/issues
- Email: support@apply.codes

## About Apply

Apply is an AI-powered recruitment platform that helps companies find and hire top talent faster. Learn more at [apply.codes](https://apply.codes).