"""Interview and screening tools for the ADK agent."""
from typing import Optional
from app.tools.base import call_firebase_function, requires_confirmation
@requires_confirmation
async def schedule_interview(
    candidate_email: str,
    candidate_name: str,
    interview_type: str,
    duration_minutes: int = 60,
    interviewers: Optional[list[str]] = None,
    proposed_times: Optional[list[str]] = None,
    meeting_link: Optional[str] = None,
    notes: Optional[str] = None,
    send_calendar_invite: bool = True,
) -> dict:
    """
    Schedule an interview with a candidate.

    IMPORTANT: This tool sends calendar invites and notifications.
    User confirmation is required.

    Args:
        candidate_email: Candidate's email address
        candidate_name: Candidate's full name
        interview_type: Type of interview:
            - "phone_screen": Initial phone screening
            - "technical": Technical interview
            - "behavioral": Behavioral interview
            - "onsite": Full onsite loop
            - "final": Final round interview
        duration_minutes: Interview length in minutes
        interviewers: List of interviewer emails
        proposed_times: List of proposed times (ISO format)
        meeting_link: Video meeting link (auto-generated if not provided)
        notes: Notes to include in the invite
        send_calendar_invite: Whether to send calendar invites

    Returns:
        A dictionary containing:
        - interview_id: Unique interview identifier
        - scheduled_time: Confirmed interview time
        - meeting_link: Video meeting link
        - calendar_events_created: List of created events
        - status: Scheduling status

    Example:
        >>> result = await schedule_interview(
        ...     candidate_email="candidate@email.com",
        ...     candidate_name="Jane Doe",
        ...     interview_type="technical",
        ...     duration_minutes=60,
        ...     interviewers=["interviewer@company.com"],
        ...     proposed_times=["2024-01-15T10:00:00Z", "2024-01-16T14:00:00Z"]
        ... )
    """
    payload = {
        "candidateEmail": candidate_email,
        "candidateName": candidate_name,
        "interviewType": interview_type,
        "durationMinutes": duration_minutes,
        "sendCalendarInvite": send_calendar_invite
    }
    if interviewers:
        payload["interviewers"] = interviewers
    if proposed_times:
        payload["proposedTimes"] = proposed_times
    if meeting_link:
        payload["meetingLink"] = meeting_link
    if notes:
        payload["notes"] = notes

    return await call_firebase_function("scheduleInterview", payload)
async def generate_interview_questions(
    job_title: str,
    job_requirements: Optional[str] = None,
    interview_type: str = "technical",
    candidate_background: Optional[str] = None,
    difficulty_level: str = "medium",
    num_questions: int = 10,
    focus_areas: Optional[list[str]] = None,
) -> dict:
    """
    Generate tailored interview questions for a specific role.

    This tool creates relevant interview questions based on the job
    requirements and interview type.

    Args:
        job_title: The role being interviewed for
        job_requirements: Detailed job requirements or description
        interview_type: Type of interview:
            - "technical": Technical/coding questions
            - "behavioral": Behavioral/STAR questions
            - "system_design": System design questions
            - "cultural_fit": Culture fit questions
            - "leadership": Leadership questions
            - "mixed": Combination of types
        candidate_background: Candidate's background for personalization
        difficulty_level: Question difficulty ("easy", "medium", "hard")
        num_questions: Number of questions to generate
        focus_areas: Specific areas to focus on

    Returns:
        A dictionary containing:
        - questions: List of generated questions
        - evaluation_criteria: How to evaluate answers
        - follow_up_questions: Suggested follow-ups
        - time_allocation: Suggested time per question
        - difficulty_breakdown: Questions by difficulty

    Example:
        >>> result = await generate_interview_questions(
        ...     job_title="Senior Backend Engineer",
        ...     interview_type="technical",
        ...     focus_areas=["Python", "System Design", "Databases"],
        ...     difficulty_level="hard",
        ...     num_questions=8
        ... )
    """
    payload = {
        "jobTitle": job_title,
        "interviewType": interview_type,
        "difficultyLevel": difficulty_level,
        "numQuestions": num_questions
    }
    if job_requirements:
        payload["jobRequirements"] = job_requirements
    if candidate_background:
        payload["candidateBackground"] = candidate_background
    if focus_areas:
        payload["focusAreas"] = focus_areas

    return await call_firebase_function("generateInterviewQuestions", payload)
async def prepare_interview(
    candidate_name: str,
    candidate_resume: Optional[str] = None,
    candidate_linkedin: Optional[str] = None,
    job_title: str = "",
    job_requirements: Optional[str] = None,
    interview_type: str = "general",
    include_questions: bool = True,
    include_talking_points: bool = True,
) -> dict:
    """
    Generate a comprehensive interview preparation guide.

    This tool creates everything an interviewer needs to prepare
    for interviewing a specific candidate.

    Args:
        candidate_name: Name of the candidate
        candidate_resume: Candidate's resume text
        candidate_linkedin: LinkedIn URL for additional context
        job_title: Role being interviewed for
        job_requirements: Job requirements or description
        interview_type: Type of interview
        include_questions: Include tailored questions
        include_talking_points: Include discussion points

    Returns:
        A dictionary containing:
        - candidate_summary: Brief overview of candidate
        - key_discussion_points: Topics to explore
        - tailored_questions: Questions based on candidate background
        - red_flags: Potential concerns to probe
        - highlights: Strengths to validate
        - comparison_to_requirements: Gap analysis
        - interview_structure: Suggested interview flow

    Example:
        >>> result = await prepare_interview(
        ...     candidate_name="John Smith",
        ...     candidate_resume="John Smith\\nSenior Engineer at Google...",
        ...     job_title="Staff Engineer",
        ...     interview_type="technical"
        ... )
    """
    payload = {
        "candidateName": candidate_name,
        "interviewType": interview_type,
        "includeQuestions": include_questions,
        "includeTalkingPoints": include_talking_points
    }
    if candidate_resume:
        payload["candidateResume"] = candidate_resume
    if candidate_linkedin:
        payload["candidateLinkedin"] = candidate_linkedin
    if job_title:
        payload["jobTitle"] = job_title
    if job_requirements:
        payload["jobRequirements"] = job_requirements

    return await call_firebase_function("prepareInterview", payload)
