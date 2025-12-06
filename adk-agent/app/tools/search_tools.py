"""Search and discovery tools for the ADK agent."""

from typing import Optional
from app.tools.base import call_firebase_function


async def generate_boolean_search(
    job_title: str,
    skills: list[str],
    experience_years: Optional[int] = None,
    location: Optional[str] = None,
    company_type: Optional[str] = None,
    exclude_companies: Optional[list[str]] = None,
) -> dict:
    """
    Generate a LinkedIn boolean search string for finding candidates.

    This tool creates optimized boolean search queries that can be used
    directly in LinkedIn Recruiter or LinkedIn search to find candidates
    matching specific criteria.

    Args:
        job_title: The target job title or role (e.g., "Senior Software Engineer")
        skills: List of required technical skills (e.g., ["Python", "React", "AWS"])
        experience_years: Minimum years of experience required (optional)
        location: Target location or region (e.g., "San Francisco Bay Area")
        company_type: Type of companies to target (e.g., "startup", "enterprise", "FAANG")
        exclude_companies: List of companies to exclude from search

    Returns:
        A dictionary containing:
        - searchString: The boolean search string ready for LinkedIn
        - explanation: Explanation of how the search works
        - tips: Additional tips for refining the search

    Example:
        >>> result = await generate_boolean_search(
        ...     job_title="Senior Backend Engineer",
        ...     skills=["Python", "Django", "PostgreSQL"],
        ...     location="Remote",
        ...     experience_years=5
        ... )
    """
    # Build context items for the function
    context_items = []

    if skills:
        context_items.append({"type": "skills", "content": skills})
    if experience_years:
        context_items.append({"type": "experience", "content": str(experience_years)})
    if location:
        context_items.append({"type": "location", "content": location})
    if company_type:
        context_items.append({"type": "companyType", "content": company_type})
    if exclude_companies:
        context_items.append({"type": "excludeCompanies", "content": exclude_companies})

    description = f"Looking for {job_title}"
    if skills:
        description += f" with skills: {', '.join(skills)}"
    if experience_years:
        description += f" with {experience_years}+ years experience"
    if location:
        description += f" in {location}"

    return await call_firebase_function(
        "generateBooleanSearch",
        {
            "description": description,
            "jobTitle": job_title,
            "contextItems": context_items
        }
    )


async def explain_boolean_search(
    boolean_string: str,
    job_requirements: Optional[str] = None,
) -> dict:
    """
    Explain what a boolean search string does and how it works.

    This tool breaks down complex boolean search strings to help users
    understand the search logic and make modifications.

    Args:
        boolean_string: The boolean search string to explain
        job_requirements: Optional job requirements context for better explanation

    Returns:
        A dictionary containing:
        - explanation: Plain English explanation of the search
        - components: Breakdown of each part of the search
        - suggestions: Suggestions for improving the search

    Example:
        >>> result = await explain_boolean_search(
        ...     boolean_string='("software engineer" OR "developer") AND (Python OR Java) -recruiter',
        ...     job_requirements="Senior backend role at a startup"
        ... )
    """
    return await call_firebase_function(
        "explainBoolean",
        {
            "booleanString": boolean_string,
            "requirements": job_requirements or ""
        }
    )


async def perplexity_search(
    query: str,
    focus: str = "general",
) -> dict:
    """
    Search the web using Perplexity AI for up-to-date information.

    This tool leverages Perplexity's AI-powered search to find current
    information about companies, market trends, salary data, and more.

    Args:
        query: The search query or question to research
        focus: Search focus mode:
            - "general": Default web search
            - "academic": Academic and research papers
            - "writing": Writing assistance and content
            - "wolfram": Math and computation

    Returns:
        A dictionary containing:
        - answer: Synthesized answer to the query
        - sources: List of source URLs
        - followup_questions: Suggested follow-up questions

    Example:
        >>> result = await perplexity_search(
        ...     query="What is the average salary for Senior Software Engineers in San Francisco 2024?",
        ...     focus="general"
        ... )
    """
    return await call_firebase_function(
        "perplexitySearch",
        {
            "query": query,
            "focus": focus
        }
    )


async def search_contacts(
    name: Optional[str] = None,
    company: Optional[str] = None,
    title: Optional[str] = None,
    email_domain: Optional[str] = None,
    location: Optional[str] = None,
) -> dict:
    """
    Search for professional contact information using various data sources.

    This tool searches multiple databases to find contact information
    for professionals based on various criteria.

    Args:
        name: Person's full name to search for
        company: Company name to filter by
        title: Job title to filter by
        email_domain: Email domain to search within (e.g., "google.com")
        location: Geographic location to filter by

    Returns:
        A dictionary containing:
        - contacts: List of matching contacts with available info
        - total_count: Total number of matches found
        - sources: Data sources used for the search

    Example:
        >>> result = await search_contacts(
        ...     company="Stripe",
        ...     title="Engineering Manager"
        ... )
    """
    filters = {}
    if company:
        filters["company"] = company
    if title:
        filters["title"] = title
    if email_domain:
        filters["emailDomain"] = email_domain
    if location:
        filters["location"] = location

    return await call_firebase_function(
        "searchContacts",
        {
            "query": name or "",
            "filters": filters
        }
    )


async def get_contact_info(
    email: Optional[str] = None,
    linkedin_url: Optional[str] = None,
    name: Optional[str] = None,
    company: Optional[str] = None,
) -> dict:
    """
    Get detailed contact information for a specific person.

    This tool retrieves comprehensive contact details including email,
    phone, social profiles, and company information.

    Args:
        email: Email address to look up
        linkedin_url: LinkedIn profile URL
        name: Person's name (works best with company)
        company: Company name (improves accuracy with name)

    Returns:
        A dictionary containing:
        - email: Verified email address
        - phone: Phone number if available
        - linkedin: LinkedIn profile URL
        - company_info: Current company details
        - social_profiles: Other social media profiles
        - confidence_score: Data accuracy confidence

    Example:
        >>> result = await get_contact_info(
        ...     linkedin_url="https://linkedin.com/in/johndoe"
        ... )
    """
    payload = {}
    if email:
        payload["email"] = email
    if linkedin_url:
        payload["linkedinUrl"] = linkedin_url
    if name:
        payload["name"] = name
    if company:
        payload["company"] = company

    return await call_firebase_function(
        "getContactInfo",
        payload
    )


async def search_location(
    query: str,
) -> dict:
    """
    Search for a geographic location to get precise details.

    This tool validates and retrieves location details including formatted address,
    coordinates, and place ID. Use this to verify locations before running
    searches that require precise location data.

    Args:
        query: Location search query (e.g., "San Francisco", "Austin TX", "90210")

    Returns:
        A dictionary containing:
        - locations: List of matching locations with details
        - success: Boolean indicating if search was successful

    Example:
        >>> result = await search_location(
        ...     query="San Francisco Bay Area"
        ... )
    """
    return await call_firebase_function(
        "locationSearch",
        {"query": query},
        is_callable=False  # It's an HTTP function
    )
