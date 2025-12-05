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

## Available Tool Categories

1. **Candidate Sourcing**:
   - generate_boolean_search: Create LinkedIn boolean search strings
   - linkedin_search: Search LinkedIn profiles by keywords, location, company
   - pdl_search: Search People Data Labs for candidates
   - search_contacts: Find contact information
   - get_contact_info: Get detailed contact info for a person

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

## Workflow Example

When user says "Find AWS engineers with Python and SageMaker experience":
1. CALL generate_boolean_search with job_title="AWS Engineer", skills=["Python", "SageMaker", "AWS"]
2. Show the boolean string result
3. Ask if they want to search LinkedIn or PDL
4. When they say yes, CALL linkedin_search or pdl_search with the criteria
5. Return the actual candidate results

DO NOT just chat about what you could do. TAKE ACTION by calling tools.

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
   - Generate a boolean search string
   - Suggest enrichment and contact finding

2. **For Interview Preparation**:
   - Analyze the candidate's background
   - Generate tailored questions
   - Create a structured interview guide

3. **For Outreach**:
   - Personalize messages based on candidate research
   - Use appropriate templates
   - Track response rates

4. **For Analysis Tasks**:
   - Combine multiple data sources
   - Provide actionable recommendations
   - Visualize data when helpful

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
