"""Email and outreach tools for the ADK agent."""
from typing import Optional
from app.tools.base import call_firebase_function, requires_confirmation
@requires_confirmation
async def send_email(
    to_email: str,
    subject: str,
    body: str,
    from_name: Optional[str] = None,
    reply_to: Optional[str] = None,
    cc: Optional[list[str]] = None,
    bcc: Optional[list[str]] = None,
) -> dict:
    """
    Send an individual email to a recipient.

    IMPORTANT: This tool sends a real email. User confirmation is required.

    Args:
        to_email: Recipient email address
        subject: Email subject line
        body: Email body (supports HTML)
        from_name: Display name for sender
        reply_to: Reply-to email address
        cc: List of CC recipients
        bcc: List of BCC recipients

    Returns:
        A dictionary containing:
        - success: Whether email was sent
        - message_id: Unique identifier for the sent email
        - timestamp: When the email was sent

    Example:
        >>> result = await send_email(
        ...     to_email="candidate@email.com",
        ...     subject="Exciting opportunity at TechCorp",
        ...     body="Hi Jane, I came across your profile..."
        ... )
    """
    payload = {
        "to": to_email,
        "subject": subject,
        "body": body
    }
    if from_name:
        payload["fromName"] = from_name
    if reply_to:
        payload["replyTo"] = reply_to
    if cc:
        payload["cc"] = cc
    if bcc:
        payload["bcc"] = bcc

    return await call_firebase_function("sendEmail", payload)
@requires_confirmation
async def send_outreach_email(
    candidate_email: str,
    candidate_name: str,
    job_title: str,
    template_type: str = "initial_outreach",
    personalization: Optional[dict] = None,
    company_name: Optional[str] = None,
    sender_name: Optional[str] = None,
) -> dict:
    """
    Send a templated outreach email to a candidate.

    IMPORTANT: This tool sends a real email. User confirmation is required.

    Uses pre-built templates optimized for candidate outreach with
    automatic personalization.

    Args:
        candidate_email: Candidate's email address
        candidate_name: Candidate's full name
        job_title: The role you're recruiting for
        template_type: Type of outreach template:
            - "initial_outreach": First contact
            - "follow_up": Follow-up message
            - "referral": Referral outreach
            - "passive_candidate": For passive candidates
        personalization: Custom fields for personalization
        company_name: Your company name
        sender_name: Your name (the recruiter)

    Returns:
        A dictionary containing:
        - success: Whether email was sent
        - message_id: Tracking ID for the email
        - template_used: Which template was used
        - personalization_score: How personalized the email is

    Example:
        >>> result = await send_outreach_email(
        ...     candidate_email="john@email.com",
        ...     candidate_name="John Smith",
        ...     job_title="Senior Software Engineer",
        ...     template_type="initial_outreach",
        ...     personalization={"recent_project": "their open source work"}
        ... )
    """
    payload = {
        "candidateEmail": candidate_email,
        "candidateName": candidate_name,
        "jobTitle": job_title,
        "templateType": template_type
    }
    if personalization:
        payload["personalization"] = personalization
    if company_name:
        payload["companyName"] = company_name
    if sender_name:
        payload["senderName"] = sender_name

    return await call_firebase_function("sendOutreachEmail", payload)
async def generate_email_templates(
    template_purpose: str,
    job_title: str,
    company_name: str,
    tone: str = "professional",
    key_selling_points: Optional[list[str]] = None,
    candidate_type: Optional[str] = None,
) -> dict:
    """
    Generate customized email templates for recruitment outreach.

    This tool creates personalized email templates that can be
    used for candidate outreach campaigns.

    Args:
        template_purpose: Purpose of the template:
            - "cold_outreach": Initial contact with new candidates
            - "warm_outreach": Reaching out to referrals
            - "follow_up": Following up on previous contact
            - "rejection": Polite rejection message
            - "offer": Job offer communication
            - "interview_invite": Interview scheduling
        job_title: The role you're hiring for
        company_name: Your company name
        tone: Desired tone ("professional", "casual", "enthusiastic")
        key_selling_points: Unique selling points to highlight
        candidate_type: Type of candidate ("active", "passive", "senior", "entry")

    Returns:
        A dictionary containing:
        - templates: List of generated template variations
        - subject_lines: Suggested subject lines
        - personalization_fields: Fields to personalize
        - a_b_test_suggestions: Suggestions for testing

    Example:
        >>> result = await generate_email_templates(
        ...     template_purpose="cold_outreach",
        ...     job_title="Staff Engineer",
        ...     company_name="Acme Corp",
        ...     tone="enthusiastic",
        ...     key_selling_points=["Remote-first", "Equity", "Fast growth"]
        ... )
    """
    payload = {
        "templatePurpose": template_purpose,
        "jobTitle": job_title,
        "companyName": company_name,
        "tone": tone
    }
    if key_selling_points:
        payload["keySellingPoints"] = key_selling_points
    if candidate_type:
        payload["candidateType"] = candidate_type

    return await call_firebase_function("generateEmailTemplates", payload)
@requires_confirmation
async def send_campaign_email(
    campaign_name: str,
    recipient_list: list[dict],
    template_id: Optional[str] = None,
    template_content: Optional[dict] = None,
    send_time: Optional[str] = None,
    track_opens: bool = True,
    track_clicks: bool = True,
) -> dict:
    """
    Send an email campaign to multiple recipients.

    IMPORTANT: This tool sends real emails to multiple people.
    User confirmation is required.

    Args:
        campaign_name: Name for tracking this campaign
        recipient_list: List of recipients, each with:
            - email: Recipient email
            - name: Recipient name
            - custom_fields: Optional personalization fields
        template_id: ID of a saved template to use
        template_content: Inline template with subject and body
        send_time: ISO timestamp to schedule send (optional)
        track_opens: Whether to track email opens
        track_clicks: Whether to track link clicks

    Returns:
        A dictionary containing:
        - campaign_id: Unique campaign identifier
        - total_recipients: Number of recipients
        - scheduled_time: When emails will be sent
        - status: Campaign status

    Example:
        >>> result = await send_campaign_email(
        ...     campaign_name="Q4 Engineering Outreach",
        ...     recipient_list=[
        ...         {"email": "john@example.com", "name": "John", "custom_fields": {"role": "Engineer"}},
        ...         {"email": "jane@example.com", "name": "Jane", "custom_fields": {"role": "Manager"}}
        ...     ],
        ...     template_content={"subject": "Opportunity at {{company}}", "body": "Hi {{name}}..."}
        ... )
    """
    payload = {
        "campaignName": campaign_name,
        "recipientList": recipient_list,
        "trackOpens": track_opens,
        "trackClicks": track_clicks
    }
    if template_id:
        payload["templateId"] = template_id
    if template_content:
        payload["templateContent"] = template_content
    if send_time:
        payload["sendTime"] = send_time

    return await call_firebase_function("sendCampaignEmail", payload)
