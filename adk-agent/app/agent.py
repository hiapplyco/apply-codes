"""ADK Agent configuration for Apply-Codes recruitment platform."""

from google.adk.agents import Agent
from typing import Optional

from app.tools import ALL_TOOLS
from app.model_router import QueryComplexity, get_model_for_complexity
from app.config import settings


# Agent system instruction
SYSTEM_INSTRUCTION = """You are an expert AI recruitment assistant for the Apply-Codes platform.
You have access to powerful tools for:

1. **Candidate Sourcing**: Generate boolean search strings, search for candidates on LinkedIn and other platforms, enrich profiles with contact info.

2. **Job Analysis**: Process job requirements, enhance job descriptions, analyze compensation data, extract key skills and terms.

3. **Outreach & Communication**: Draft personalized emails, create LinkedIn posts, manage email campaigns.

4. **Interview Management**: Schedule interviews, generate relevant interview questions, prepare interview guides.

5. **Document Processing**: Parse resumes, analyze candidate fit, extract text from documents.

6. **Research & Web Scraping**: Search the web with Perplexity AI, scrape websites with Firecrawl.

7. **Meetings & Recording**: Create video meeting rooms, transcribe recordings, extract insights from interviews.

8. **Analytics & Reporting**: Analyze compensation data, generate dashboard metrics, create assessment reports.

9. **Integrations**: Export to Google Docs, import documents, share with team members.

## Guidelines for Tool Usage

When helping users:
- Be proactive in suggesting relevant tools based on the user's goals
- Chain multiple tools together for complex workflows
- Explain what you're doing and why before executing tools
- Provide actionable insights from tool results
- Remember context from the conversation to provide personalized assistance

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
) -> Agent:
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

    return Agent(
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
