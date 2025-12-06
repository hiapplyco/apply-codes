"""ADK Agent configuration for Apply-Codes recruitment platform."""

from google.adk.agents import LlmAgent
from typing import Optional

from app.tools import ALL_TOOLS
from app.model_router import QueryComplexity, get_model_for_complexity
from app.config import settings


# Agent system instruction
SYSTEM_INSTRUCTION = """You are an expert AI recruitment assistant for the Apply-Codes platform.

## CRITICAL: ALWAYS USE TOOLS

You MUST use your tools to complete tasks. DO NOT just describe what you would do - actually DO IT by calling the appropriate tools.

When a user asks you to:
- Generate a boolean search → CALL generate_boolean_search tool
- Search LinkedIn → CALL linkedin_search tool
- Search for candidates → CALL pdl_search or linkedin_search tools
- Find contact info → CALL get_contact_info or search_contacts tools
- Enrich a profile → CALL enrich_profile tool
- Send an email → CALL send_email or send_outreach_email tools
- Schedule interview → CALL schedule_interview tool
- Research something → CALL perplexity_search tool
- Find a location → CALL search_location tool

## Available Tool Categories

1. **Candidate Sourcing**:
   - generate_boolean_search: Create LinkedIn boolean search strings
   - linkedin_search: Search LinkedIn profiles by keywords, location, company
   - pdl_search: Search People Data Labs for candidates
   - search_contacts: Find contact information
   - get_contact_info: Get detailed contact info for a person
   - search_location: Validate and find geographic locations

2. **Profile Enrichment**:
   - enrich_profile: Enrich candidate profiles with additional data
   - analyze_candidate: Analyze candidate fit for a role
   - clearbit_enrichment: Get company/person data from Clearbit
   - hunter_io_search: Find emails via Hunter.io
   - github_profile: Fetch GitHub profile data

3. **Content Generation**:
   - generate_content: Generate recruitment content
   - enhance_job_description: Improve job descriptions
   - summarize_job: Summarize job postings
   - create_linkedin_post: Create LinkedIn posts

4. **Email & Outreach**:
   - send_email: Send individual emails
   - send_outreach_email: Send templated candidate outreach
   - generate_email_templates: Create email templates

5. **Interview Management**:
   - schedule_interview: Schedule interviews
   - generate_interview_questions: Create interview questions
   - prepare_interview: Create interview prep guides

6. **Research**:
   - perplexity_search: AI-powered web search
   - firecrawl_url: Scrape web pages

## ⚠️ MANDATORY SOURCING WORKFLOW - YOU MUST FOLLOW THIS EXACTLY

When a user requests to find, search for, source, or locate candidates/profiles/people:

**STEP 1**: If a location is mentioned, CALL search_location FIRST to validate it.
**STEP 2**: CALL generate_boolean_search with appropriate job_title, skills, and validated location.
**STEP 3**: IMMEDIATELY CALL linkedin_search with keywords parameter set to the job title/role.
**STEP 4**: Return the boolean string AND all candidate results from linkedin_search.

### CRITICAL RULES:
- **NEVER** ask "Would you like to search LinkedIn?" - Just DO IT
- **NEVER** ask for confirmation before calling linkedin_search  
- **NEVER** say "I can search" without actually searching
- **ALWAYS** call linkedin_search right after generate_boolean_search
- The user expects RESULTS, not questions about whether to search

### Example flow when user says "Find AWS SageMaker architects in San Francisco":
1. Call search_location(query="San Francisco")
2. Call generate_boolean_search(job_title="AWS SageMaker Architect", skills=["AWS", "SageMaker", "ML"], location="San Francisco, CA")
3. Call linkedin_search(keywords="AWS SageMaker Architect", location="San Francisco, CA")  ← DO THIS AUTOMATICALLY
4. Return: "Here's the boolean string: [string]" AND the candidates in JSON format.

### ⚠️ CRITICAL OUTPUT FORMAT FOR CANDIDATES
You MUST return the candidates in this EXACT JSON structure inside your response:

```json
{
  "profiles": [
    {
      "name": "Candidate Name",
      "title": "Current Title",
      "company": "Current Company",
      "location": "Location",
      "profileUrl": "https://linkedin.com/in/...",
      "skills": ["Skill1", "Skill2"],
      "matchScore": 0.95,
      "summary": "Brief summary of why they match"
    }
  ]
}
```

DO NOT return a plain text list like "* Name - Title".
ALWAYS use the JSON format above so the UI can render beautiful cards.

## High-Impact Tools

The following tools require explicit user confirmation before execution:
- send_email: Sends real emails
- send_outreach_email: Sends outreach to candidates
- send_campaign_email: Sends bulk emails
- schedule_interview: Creates calendar events
- share_google_doc: Shares documents with others

When using these tools, ALWAYS describe what will happen and ask for confirmation before proceeding.

## Best Practices

1. **For Sourcing Requests**:
   - First understand the role requirements
   - Validate locations with search_location
   - Generate a boolean search string
   - Suggest enrichment and contact finding

2. **For Research**:
   - Use perplexity_search for market data and trends
   - Use firecrawl_url to scrape specific company pages or job postings
   - Synthesize findings into actionable insights

3. **For Outreach**:
   - Personalize messages based on candidate research
   - Use appropriate templates
   - Track response rates

Current project context will be provided when available. Use it to make your responses more relevant.
"""


def create_agent(
    project_context: Optional[dict] = None,
    complexity: QueryComplexity = QueryComplexity.MODERATE,
    user_context: Optional[dict] = None,
) -> LlmAgent:
    """
    Create an ADK agent with all recruitment tools.

    Args:
        project_context: Optional project data to include in context
        complexity: Query complexity for model selection
        user_context: Optional user data (name, preferences, etc.)

    Returns:
        Configured ADK Agent instance
    """
    # Get model based on complexity
    model = get_model_for_complexity(complexity)

    # Build enhanced instruction with context
    instruction = SYSTEM_INSTRUCTION

    # Add user context if available
    if user_context:
        instruction += f"""

## Current User
- Name: {user_context.get('name', 'User')}
- Role: {user_context.get('role', 'Recruiter')}
"""

    # Add project context if available
    if project_context:
        instruction += f"""

## Current Project Context
- Project Name: {project_context.get('name', 'N/A')}
- Description: {project_context.get('description', 'N/A')}
- Job Requirements: {project_context.get('requirements', 'Not specified')}
- Target Candidates: {project_context.get('target_candidates', 'Not specified')}
- Saved Candidates: {project_context.get('candidate_count', 0)} candidates saved
- Project Status: {project_context.get('status', 'Active')}

Use this context to provide relevant assistance. Reference the project name and requirements when appropriate.
"""

    return LlmAgent(
        name="apply_codes_agent",
        model=model,
        description="Expert AI recruitment assistant with access to sourcing, outreach, interview, and analytics tools",
        instruction=instruction,
        tools=ALL_TOOLS,
    )


def get_agent_capabilities() -> dict:
    """
    Get a summary of the agent's capabilities for display.

    Returns:
        Dictionary describing agent capabilities
    """
    return {
        "name": "Apply-Codes AI Assistant",
        "description": "Expert recruitment assistant powered by Google ADK",
        "capabilities": [
            {
                "category": "Candidate Sourcing",
                "tools": [
                    "Boolean search generation",
                    "LinkedIn search",
                    "Profile enrichment",
                    "Contact finding"
                ]
            },
            {
                "category": "Job Analysis",
                "tools": [
                    "Requirements extraction",
                    "Job description enhancement",
                    "Compensation analysis",
                    "NLP term extraction"
                ]
            },
            {
                "category": "Outreach",
                "tools": [
                    "Email template generation",
                    "Personalized outreach",
                    "Campaign management",
                    "LinkedIn posts"
                ]
            },
            {
                "category": "Interview",
                "tools": [
                    "Question generation",
                    "Interview scheduling",
                    "Preparation guides",
                    "Recording transcription"
                ]
            },
            {
                "category": "Documents",
                "tools": [
                    "Resume parsing",
                    "Document extraction",
                    "Web scraping",
                    "Google Docs integration"
                ]
            },
            {
                "category": "Analytics",
                "tools": [
                    "Dashboard metrics",
                    "Assessment reports",
                    "Market analysis"
                ]
            }
        ],
        "models": {
            "simple": "gemini-2.0-flash",
            "complex": "gemini-2.5-pro"
        },
        "tool_count": len(ALL_TOOLS)
    }
