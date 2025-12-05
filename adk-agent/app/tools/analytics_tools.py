"""Analytics and reporting tools for the ADK agent."""
from typing import Optional
from app.tools.base import call_firebase_function
async def analyze_compensation(
    job_title: str,
    location: str,
    experience_level: Optional[str] = None,
    company_size: Optional[str] = None,
    industry: Optional[str] = None,
    skills: Optional[list[str]] = None,
) -> dict:
    """
    Analyze compensation data for a specific role and location.

    This tool provides market compensation analysis including salary
    ranges, bonus structures, and equity data.

    Args:
        job_title: Job title to analyze
        location: Geographic location for salary data
        experience_level: Experience level ("junior", "mid", "senior", "staff", "principal")
        company_size: Company size filter ("startup", "mid-size", "enterprise")
        industry: Industry filter
        skills: Specific skills that affect compensation

    Returns:
        A dictionary containing:
        - salary_range: Min, median, max salary
        - percentiles: 25th, 50th, 75th, 90th percentile salaries
        - bonus_data: Typical bonus ranges
        - equity_data: Equity/stock compensation data
        - benefits_value: Estimated benefits value
        - total_compensation: Total comp breakdown
        - market_demand: Current demand for the role
        - trends: Compensation trends over time
        - comparables: Similar roles for comparison

    Example:
        >>> result = await analyze_compensation(
        ...     job_title="Senior Software Engineer",
        ...     location="San Francisco, CA",
        ...     experience_level="senior",
        ...     skills=["Python", "Kubernetes", "AWS"]
        ... )
    """
    payload = {
        "jobTitle": job_title,
        "location": location
    }
    if experience_level:
        payload["experienceLevel"] = experience_level
    if company_size:
        payload["companySize"] = company_size
    if industry:
        payload["industry"] = industry
    if skills:
        payload["skills"] = skills

    return await call_firebase_function("analyzeCompensation", payload)
async def generate_dashboard_metrics(
    metric_type: str,
    date_range: str = "last_30_days",
    project_id: Optional[str] = None,
    breakdown_by: Optional[str] = None,
) -> dict:
    """
    Generate recruitment dashboard metrics and analytics.

    This tool provides recruitment performance metrics for tracking
    and optimizing the hiring process.

    Args:
        metric_type: Type of metrics to generate:
            - "pipeline": Pipeline and funnel metrics
            - "sourcing": Sourcing channel effectiveness
            - "response_rates": Outreach response rates
            - "time_to_hire": Time-based metrics
            - "quality": Candidate quality metrics
            - "diversity": Diversity metrics
            - "all": All available metrics
        date_range: Time period ("last_7_days", "last_30_days", "last_90_days", "ytd", "all_time")
        project_id: Specific project to analyze
        breakdown_by: How to segment data ("source", "role", "recruiter", "stage")

    Returns:
        A dictionary containing:
        - metrics: Calculated metrics based on type
        - trends: Trend data over time
        - comparisons: Comparisons to previous periods
        - benchmarks: Industry benchmarks
        - insights: AI-generated insights
        - recommendations: Suggested improvements

    Example:
        >>> result = await generate_dashboard_metrics(
        ...     metric_type="pipeline",
        ...     date_range="last_30_days",
        ...     breakdown_by="source"
        ... )
    """
    payload = {
        "metricType": metric_type,
        "dateRange": date_range
    }
    if project_id:
        payload["projectId"] = project_id
    if breakdown_by:
        payload["breakdownBy"] = breakdown_by

    return await call_firebase_function("generateDashboardMetrics", payload)
async def generate_clarvida_report(
    report_type: str,
    candidate_data: Optional[dict] = None,
    job_requirements: Optional[str] = None,
    include_recommendations: bool = True,
    report_format: str = "detailed",
) -> dict:
    """
    Generate a Clarvida-style comprehensive assessment report.

    This tool creates detailed assessment reports for candidates
    including competency analysis and recommendations.

    Args:
        report_type: Type of report to generate:
            - "candidate_assessment": Full candidate evaluation
            - "competency_mapping": Skills and competency analysis
            - "cultural_fit": Culture fit assessment
            - "leadership_potential": Leadership assessment
            - "technical_depth": Technical skills deep-dive
        candidate_data: Candidate information for assessment
        job_requirements: Job requirements for comparison
        include_recommendations: Include hiring recommendations
        report_format: Report detail level ("brief", "standard", "detailed")

    Returns:
        A dictionary containing:
        - report: The generated report
        - scores: Assessment scores
        - strengths: Identified strengths
        - development_areas: Areas for improvement
        - recommendations: Hiring recommendations
        - interview_focus: Suggested interview focus areas
        - risk_factors: Potential concerns

    Example:
        >>> result = await generate_clarvida_report(
        ...     report_type="candidate_assessment",
        ...     candidate_data={"name": "John Doe", "resume": "...", "interview_notes": "..."},
        ...     job_requirements="Senior Engineering Manager role...",
        ...     report_format="detailed"
        ... )
    """
    payload = {
        "reportType": report_type,
        "includeRecommendations": include_recommendations,
        "reportFormat": report_format
    }
    if candidate_data:
        payload["candidateData"] = candidate_data
    if job_requirements:
        payload["jobRequirements"] = job_requirements

    return await call_firebase_function("generateClarvidaReport", payload)
