"""ADK Tool definitions for Apply-Codes recruitment platform."""

from app.tools.search_tools import (
    generate_boolean_search,
    explain_boolean_search,
    perplexity_search,
    search_contacts,
    get_contact_info,
)

from app.tools.profile_tools import (
    enrich_profile,
    analyze_candidate,
    linkedin_search,
    pdl_search,
    clearbit_enrichment,
    hunter_io_search,
    github_profile,
)

from app.tools.content_tools import (
    generate_content,
    enhance_job_description,
    summarize_job,
    process_job_requirements,
    process_job_requirements_v2,
    extract_nlp_terms,
    generate_linkedin_analysis,
    create_linkedin_post,
)

from app.tools.email_tools import (
    send_email,
    send_outreach_email,
    generate_email_templates,
    send_campaign_email,
)

from app.tools.interview_tools import (
    schedule_interview,
    generate_interview_questions,
    prepare_interview,
)

from app.tools.document_tools import (
    parse_document,
    analyze_resume,
    process_text_extraction,
    firecrawl_url,
)

from app.tools.meeting_tools import (
    create_daily_room,
    process_recording,
    transcribe_audio,
)

from app.tools.analytics_tools import (
    analyze_compensation,
    generate_dashboard_metrics,
    generate_clarvida_report,
)

from app.tools.integration_tools import (
    export_to_google_docs,
    import_from_google_docs,
    get_drive_folders,
    share_google_doc,
)

# All tools list for agent registration
ALL_TOOLS = [
    # Search & Discovery
    generate_boolean_search,
    explain_boolean_search,
    perplexity_search,
    search_contacts,
    get_contact_info,
    # Profile & Candidate
    enrich_profile,
    analyze_candidate,
    linkedin_search,
    pdl_search,
    clearbit_enrichment,
    hunter_io_search,
    github_profile,
    # Content Generation
    generate_content,
    enhance_job_description,
    summarize_job,
    process_job_requirements,
    process_job_requirements_v2,
    extract_nlp_terms,
    generate_linkedin_analysis,
    create_linkedin_post,
    # Email & Outreach
    send_email,
    send_outreach_email,
    generate_email_templates,
    send_campaign_email,
    # Interview & Screening
    schedule_interview,
    generate_interview_questions,
    prepare_interview,
    # Document Processing
    parse_document,
    analyze_resume,
    process_text_extraction,
    firecrawl_url,
    # Meetings & Recording
    create_daily_room,
    process_recording,
    transcribe_audio,
    # Analytics
    analyze_compensation,
    generate_dashboard_metrics,
    generate_clarvida_report,
    # Integrations
    export_to_google_docs,
    import_from_google_docs,
    get_drive_folders,
    share_google_doc,
]

__all__ = ["ALL_TOOLS"] + [tool.__name__ for tool in ALL_TOOLS]
