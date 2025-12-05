"""Profile and candidate analysis tools for the ADK agent."""
from typing import Optional
from app.tools.base import call_firebase_function
async def enrich_profile(
    linkedin_url: Optional[str] = None,
    email: Optional[str] = None,
    name: Optional[str] = None,
    company: Optional[str] = None,
) -> dict:
    """
    Enrich a candidate profile with additional professional information.

    This tool gathers comprehensive data about a candidate from multiple
    sources to build a complete professional profile.

    Args:
        linkedin_url: LinkedIn profile URL for the candidate
        email: Email address of the candidate
        name: Full name of the candidate
        company: Current or recent company name

    Returns:
        A dictionary containing:
        - profile: Enhanced profile with all gathered data
        - work_history: Detailed work experience
        - education: Educational background
        - skills: Identified skills and technologies
        - social_presence: Other online profiles found
        - data_sources: Sources of the enriched data

    Example:
        >>> result = await enrich_profile(
        ...     linkedin_url="https://linkedin.com/in/janedoe",
        ...     email="jane@company.com"
        ... )
    """
    payload = {}
    if linkedin_url:
        payload["linkedinUrl"] = linkedin_url
    if email:
        payload["email"] = email
    if name:
        payload["name"] = name
    if company:
        payload["company"] = company

    return await call_firebase_function("enrichProfile", payload)
async def analyze_candidate(
    resume_text: Optional[str] = None,
    linkedin_url: Optional[str] = None,
    job_requirements: Optional[str] = None,
    job_title: Optional[str] = None,
) -> dict:
    """
    Analyze a candidate's fit for a specific role.

    This tool evaluates a candidate against job requirements and provides
    a detailed analysis of their qualifications, strengths, and gaps.

    Args:
        resume_text: Plain text content of the candidate's resume
        linkedin_url: LinkedIn profile URL for additional context
        job_requirements: Job description or requirements to match against
        job_title: Target job title for the analysis

    Returns:
        A dictionary containing:
        - match_score: Overall fit score (0-100)
        - strengths: Key strengths matching requirements
        - gaps: Areas where candidate may fall short
        - recommendations: Suggestions for the hiring process
        - skills_analysis: Detailed skills breakdown
        - experience_analysis: Experience relevance analysis

    Example:
        >>> result = await analyze_candidate(
        ...     resume_text="John Doe\\nSenior Engineer at Google...",
        ...     job_requirements="5+ years Python experience, ML background",
        ...     job_title="Staff ML Engineer"
        ... )
    """
    payload = {}
    if resume_text:
        payload["resume"] = resume_text
    if linkedin_url:
        payload["linkedinUrl"] = linkedin_url
    if job_requirements:
        payload["jobRequirements"] = job_requirements
    if job_title:
        payload["jobTitle"] = job_title

    return await call_firebase_function("analyzeCandidate", payload)
async def linkedin_search(
    keywords: str,
    location: Optional[str] = None,
    current_company: Optional[str] = None,
    past_company: Optional[str] = None,
    school: Optional[str] = None,
    industry: Optional[str] = None,
    title: Optional[str] = None,
    years_experience: Optional[int] = None,
) -> dict:
    """
    Search for LinkedIn profiles matching specific criteria.

    This tool searches LinkedIn to find professionals matching your
    sourcing criteria.

    Args:
        keywords: Search keywords (skills, titles, etc.)
        location: Geographic location filter
        current_company: Filter by current employer
        past_company: Filter by past employer
        school: Filter by educational institution
        industry: Industry filter
        title: Job title filter
        years_experience: Minimum years of experience

    Returns:
        A dictionary containing:
        - profiles: List of matching LinkedIn profiles
        - total_count: Total number of matches
        - facets: Available filter options

    Example:
        >>> result = await linkedin_search(
        ...     keywords="machine learning engineer",
        ...     location="San Francisco",
        ...     current_company="Meta"
        ... )
    """
    payload = {
        "keywords": keywords
    }
    if location:
        payload["location"] = location
    if current_company:
        payload["currentCompany"] = current_company
    if past_company:
        payload["pastCompany"] = past_company
    if school:
        payload["school"] = school
    if industry:
        payload["industry"] = industry
    if title:
        payload["title"] = title
    if years_experience:
        payload["yearsExperience"] = years_experience

    return await call_firebase_function("linkedinSearch", payload)
async def pdl_search(
    query: str,
    location: Optional[str] = None,
    company: Optional[str] = None,
    title: Optional[str] = None,
    skills: Optional[list[str]] = None,
    min_experience: Optional[int] = None,
    max_results: int = 25,
) -> dict:
    """
    Search People Data Labs for professional profiles.

    This tool queries the PDL database for comprehensive professional
    profile data with advanced filtering options.

    Args:
        query: Natural language search query
        location: Location filter
        company: Company filter
        title: Job title filter
        skills: List of required skills
        min_experience: Minimum years of experience
        max_results: Maximum number of results to return (default 25)

    Returns:
        A dictionary containing:
        - profiles: Detailed professional profiles
        - total_count: Total matches in database
        - credits_used: PDL credits consumed

    Example:
        >>> result = await pdl_search(
        ...     query="senior data scientist fintech",
        ...     location="New York",
        ...     skills=["Python", "SQL", "Machine Learning"],
        ...     max_results=50
        ... )
    """
    payload = {
        "query": query,
        "maxResults": max_results
    }
    if location:
        payload["location"] = location
    if company:
        payload["company"] = company
    if title:
        payload["title"] = title
    if skills:
        payload["skills"] = skills
    if min_experience:
        payload["minExperience"] = min_experience

    return await call_firebase_function("pdlSearch", payload)
async def clearbit_enrichment(
    email: Optional[str] = None,
    domain: Optional[str] = None,
    company_name: Optional[str] = None,
) -> dict:
    """
    Enrich person or company data using Clearbit.

    This tool uses Clearbit's data enrichment API to get detailed
    information about a person or company.

    Args:
        email: Email address to enrich person data
        domain: Company domain for company enrichment
        company_name: Company name for lookup

    Returns:
        A dictionary containing:
        - person: Person data if email provided
        - company: Company data
        - employment: Employment history
        - social_profiles: Social media profiles

    Example:
        >>> result = await clearbit_enrichment(
        ...     email="ceo@stripe.com",
        ...     domain="stripe.com"
        ... )
    """
    payload = {}
    if email:
        payload["email"] = email
    if domain:
        payload["domain"] = domain
    if company_name:
        payload["companyName"] = company_name

    return await call_firebase_function("clearbitEnrichment", payload)
async def hunter_io_search(
    domain: str,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    department: Optional[str] = None,
) -> dict:
    """
    Find email addresses using Hunter.io.

    This tool searches Hunter.io's database to find verified email
    addresses for professionals at a specific company.

    Args:
        domain: Company domain to search (e.g., "stripe.com")
        first_name: First name to find specific person
        last_name: Last name to find specific person
        department: Department filter (e.g., "engineering", "sales")

    Returns:
        A dictionary containing:
        - emails: List of found email addresses
        - confidence: Confidence score for each email
        - sources: Where the email was found
        - pattern: Common email pattern at company

    Example:
        >>> result = await hunter_io_search(
        ...     domain="google.com",
        ...     first_name="John",
        ...     last_name="Smith",
        ...     department="engineering"
        ... )
    """
    payload = {"domain": domain}
    if first_name:
        payload["firstName"] = first_name
    if last_name:
        payload["lastName"] = last_name
    if department:
        payload["department"] = department

    return await call_firebase_function("hunterIoSearch", payload)
async def github_profile(
    username: Optional[str] = None,
    email: Optional[str] = None,
) -> dict:
    """
    Fetch GitHub profile data for a developer.

    This tool retrieves comprehensive GitHub profile information
    including repositories, contributions, and coding activity.

    Args:
        username: GitHub username
        email: Email to search for associated GitHub account

    Returns:
        A dictionary containing:
        - profile: Basic profile information
        - repositories: List of public repositories
        - languages: Programming languages used
        - contributions: Contribution statistics
        - organizations: Organizations the user belongs to
        - activity: Recent activity summary

    Example:
        >>> result = await github_profile(username="torvalds")
    """
    payload = {}
    if username:
        payload["username"] = username
    if email:
        payload["email"] = email

    return await call_firebase_function("githubProfile", payload)
