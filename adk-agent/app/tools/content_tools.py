"""Content generation tools for the ADK agent."""
from typing import Optional
from app.tools.base import call_firebase_function
async def generate_content(
    prompt: str,
    content_type: str = "general",
    tone: str = "professional",
    max_length: Optional[int] = None,
) -> dict:
    """
    Generate various types of content using AI.

    This tool creates recruitment-related content such as job posts,
    outreach messages, interview summaries, and more.

    Args:
        prompt: The content generation prompt with instructions
        content_type: Type of content ("job_post", "outreach", "summary", "general")
        tone: Desired tone ("professional", "casual", "formal", "friendly")
        max_length: Maximum length in characters (optional)

    Returns:
        A dictionary containing:
        - content: The generated content
        - word_count: Number of words generated
        - suggestions: Improvement suggestions

    Example:
        >>> result = await generate_content(
        ...     prompt="Write a compelling job post for a Senior React Developer at a fintech startup",
        ...     content_type="job_post",
        ...     tone="friendly"
        ... )
    """
    payload = {
        "prompt": prompt,
        "contentType": content_type,
        "tone": tone
    }
    if max_length:
        payload["maxLength"] = max_length

    return await call_firebase_function("generateContent", payload)
async def enhance_job_description(
    job_description: str,
    company_info: Optional[str] = None,
    target_audience: Optional[str] = None,
    improvements: Optional[list[str]] = None,
) -> dict:
    """
    Enhance and improve a job description for better candidate attraction.

    This tool analyzes and rewrites job descriptions to be more compelling,
    inclusive, and effective at attracting qualified candidates.

    Args:
        job_description: The original job description text
        company_info: Additional context about the company culture
        target_audience: Who the ideal candidate is
        improvements: Specific areas to improve ("clarity", "inclusivity", "benefits", "requirements")

    Returns:
        A dictionary containing:
        - enhanced_description: The improved job description
        - changes_made: Summary of improvements
        - inclusivity_score: Score for inclusive language
        - readability_score: Reading ease score
        - suggestions: Additional improvement suggestions

    Example:
        >>> result = await enhance_job_description(
        ...     job_description="We need a rockstar developer...",
        ...     target_audience="mid-senior engineers",
        ...     improvements=["inclusivity", "clarity"]
        ... )
    """
    payload = {
        "content": job_description
    }
    if company_info:
        payload["companyInfo"] = company_info
    if target_audience:
        payload["targetAudience"] = target_audience
    if improvements:
        payload["improvements"] = improvements

    return await call_firebase_function("enhanceJobDescription", payload)
async def summarize_job(
    job_content: str,
    summary_type: str = "brief",
) -> dict:
    """
    Create a summary of a job posting or requirements document.

    This tool extracts key information from job descriptions and
    creates concise summaries for different purposes.

    Args:
        job_content: The full job description or requirements document
        summary_type: Type of summary ("brief", "detailed", "bullet_points", "candidate_facing")

    Returns:
        A dictionary containing:
        - summary: The generated summary
        - key_requirements: Top requirements identified
        - nice_to_haves: Optional qualifications
        - salary_info: Compensation details if found
        - company_highlights: Notable company information

    Example:
        >>> result = await summarize_job(
        ...     job_content="Senior Software Engineer at Stripe...",
        ...     summary_type="bullet_points"
        ... )
    """
    return await call_firebase_function(
        "summarizeJob",
        {
            "content": job_content,
            "summaryType": summary_type
        }
    )
async def process_job_requirements(
    job_content: str,
    extract_skills: bool = True,
    extract_experience: bool = True,
    extract_education: bool = True,
) -> dict:
    """
    Extract and structure requirements from a job description.

    This tool parses job descriptions to extract structured requirements
    that can be used for candidate matching and boolean search generation.

    Args:
        job_content: The job description or requirements text
        extract_skills: Whether to extract technical skills
        extract_experience: Whether to extract experience requirements
        extract_education: Whether to extract education requirements

    Returns:
        A dictionary containing:
        - required_skills: Must-have skills
        - preferred_skills: Nice-to-have skills
        - experience_level: Required experience level
        - education: Education requirements
        - certifications: Required certifications
        - responsibilities: Key job responsibilities
        - structured_data: Full structured extraction

    Example:
        >>> result = await process_job_requirements(
        ...     job_content="We're looking for a Senior Engineer with 5+ years..."
        ... )
    """
    return await call_firebase_function(
        "processJobRequirements",
        {
            "content": job_content,
            "extractSkills": extract_skills,
            "extractExperience": extract_experience,
            "extractEducation": extract_education
        }
    )
async def process_job_requirements_v2(
    job_content: str,
    company_name: Optional[str] = None,
    industry: Optional[str] = None,
) -> dict:
    """
    Enhanced job requirements processing with additional analysis.

    This is an improved version of job requirements processing that
    provides deeper analysis and market context.

    Args:
        job_content: The job description or requirements text
        company_name: Company name for additional context
        industry: Industry for market comparison

    Returns:
        A dictionary containing:
        - requirements: Structured requirements
        - skills_taxonomy: Categorized skills
        - seniority_indicators: Signals of expected level
        - market_comparison: How requirements compare to market
        - search_strategy: Suggested sourcing approach
        - boolean_components: Components for boolean search

    Example:
        >>> result = await process_job_requirements_v2(
        ...     job_content="Staff Engineer role at a Series B startup...",
        ...     company_name="Figma",
        ...     industry="Design Tech"
        ... )
    """
    payload = {"content": job_content}
    if company_name:
        payload["companyName"] = company_name
    if industry:
        payload["industry"] = industry

    return await call_firebase_function("processJobRequirementsV2", payload)
async def extract_nlp_terms(
    text: str,
    extract_skills: bool = True,
    extract_titles: bool = True,
    extract_companies: bool = True,
    extract_locations: bool = True,
) -> dict:
    """
    Extract key terms and entities from text using NLP.

    This tool uses natural language processing to identify and
    extract important terms from resumes, job descriptions, or other text.

    Args:
        text: The text to analyze
        extract_skills: Extract technical and soft skills
        extract_titles: Extract job titles
        extract_companies: Extract company names
        extract_locations: Extract geographic locations

    Returns:
        A dictionary containing:
        - skills: Identified skills
        - job_titles: Job titles found
        - companies: Company names
        - locations: Geographic locations
        - keywords: Other important keywords
        - entities: Named entities with types

    Example:
        >>> result = await extract_nlp_terms(
        ...     text="I have 5 years of Python experience at Google in Mountain View...",
        ...     extract_skills=True,
        ...     extract_companies=True
        ... )
    """
    return await call_firebase_function(
        "extractNlpTerms",
        {
            "text": text,
            "extractSkills": extract_skills,
            "extractTitles": extract_titles,
            "extractCompanies": extract_companies,
            "extractLocations": extract_locations
        }
    )
async def generate_linkedin_analysis(
    linkedin_url: Optional[str] = None,
    profile_data: Optional[dict] = None,
    job_context: Optional[str] = None,
) -> dict:
    """
    Generate a detailed analysis of a LinkedIn profile.

    This tool provides comprehensive analysis of a candidate's
    LinkedIn profile for sourcing and evaluation purposes.

    Args:
        linkedin_url: LinkedIn profile URL to analyze
        profile_data: Pre-fetched profile data (if available)
        job_context: Job requirements to analyze against

    Returns:
        A dictionary containing:
        - summary: Executive summary of the profile
        - career_trajectory: Career path analysis
        - skills_assessment: Skills evaluation
        - experience_highlights: Notable achievements
        - fit_analysis: Fit analysis if job context provided
        - outreach_suggestions: Personalization suggestions

    Example:
        >>> result = await generate_linkedin_analysis(
        ...     linkedin_url="https://linkedin.com/in/candidate",
        ...     job_context="Senior ML Engineer at AI startup"
        ... )
    """
    payload = {}
    if linkedin_url:
        payload["linkedinUrl"] = linkedin_url
    if profile_data:
        payload["profileData"] = profile_data
    if job_context:
        payload["jobContext"] = job_context

    return await call_firebase_function("generateLinkedinAnalysis", payload)
async def create_linkedin_post(
    topic: str,
    key_points: Optional[list[str]] = None,
    tone: str = "professional",
    include_hashtags: bool = True,
    call_to_action: Optional[str] = None,
) -> dict:
    """
    Generate a LinkedIn post for employer branding or job promotion.

    This tool creates engaging LinkedIn posts optimized for visibility
    and engagement on the platform.

    Args:
        topic: Main topic or theme of the post
        key_points: Specific points to include
        tone: Post tone ("professional", "casual", "inspiring", "informative")
        include_hashtags: Whether to include relevant hashtags
        call_to_action: Desired action from readers

    Returns:
        A dictionary containing:
        - post_content: The generated post text
        - hashtags: Suggested hashtags
        - best_time: Suggested posting time
        - engagement_tips: Tips to boost engagement

    Example:
        >>> result = await create_linkedin_post(
        ...     topic="We're hiring engineers!",
        ...     key_points=["Remote-first", "Great benefits", "Interesting problems"],
        ...     tone="casual",
        ...     call_to_action="Apply now or refer a friend"
        ... )
    """
    payload = {
        "topic": topic,
        "tone": tone,
        "includeHashtags": include_hashtags
    }
    if key_points:
        payload["keyPoints"] = key_points
    if call_to_action:
        payload["callToAction"] = call_to_action

    return await call_firebase_function("createLinkedinPost", payload)
