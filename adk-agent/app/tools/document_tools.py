"""Document processing tools for the ADK agent."""
from typing import Optional
from app.tools.base import call_firebase_function, call_firebase_function_with_form
async def parse_document(
    document_url: Optional[str] = None,
    document_text: Optional[str] = None,
    document_type: str = "auto",
    extract_tables: bool = True,
    preserve_formatting: bool = False,
) -> dict:
    """
    Parse and extract content from various document types.

    This tool processes documents (PDFs, Word docs, etc.) and extracts
    structured content including text, tables, and metadata.

    Args:
        document_url: URL of the document to parse
        document_text: Raw text content if already extracted
        document_type: Document type ("auto", "pdf", "docx", "txt", "html")
        extract_tables: Whether to extract tables
        preserve_formatting: Whether to preserve text formatting

    Returns:
        A dictionary containing:
        - text: Extracted text content
        - tables: Extracted tables as structured data
        - metadata: Document metadata (author, date, etc.)
        - sections: Identified document sections
        - word_count: Total word count

    Example:
        >>> result = await parse_document(
        ...     document_url="https://example.com/resume.pdf",
        ...     document_type="pdf",
        ...     extract_tables=True
        ... )
    """
    payload = {
        "documentType": document_type,
        "extractTables": extract_tables,
        "preserveFormatting": preserve_formatting
    }
    if document_url:
        payload["documentUrl"] = document_url
    if document_text:
        payload["documentText"] = document_text

    return await call_firebase_function("parseDocument", payload)
async def analyze_resume(
    resume_text: Optional[str] = None,
    resume_url: Optional[str] = None,
    job_description: Optional[str] = None,
    extract_contact: bool = True,
    score_fit: bool = True,
) -> dict:
    """
    Analyze a resume and extract structured information.

    This tool provides comprehensive resume analysis including
    skill extraction, experience parsing, and job fit scoring.

    Args:
        resume_text: Plain text content of the resume
        resume_url: URL to resume file (PDF, DOCX)
        job_description: Job description to score against
        extract_contact: Extract contact information
        score_fit: Calculate fit score against job description

    Returns:
        A dictionary containing:
        - contact_info: Extracted contact details
        - summary: Professional summary
        - experience: Parsed work experience
        - education: Educational background
        - skills: Identified skills
        - certifications: Professional certifications
        - fit_score: Score against job description (if provided)
        - fit_analysis: Detailed fit analysis
        - keywords: Important keywords found

    Example:
        >>> result = await analyze_resume(
        ...     resume_text="John Doe\\nSenior Software Engineer...",
        ...     job_description="Looking for a Senior Engineer with Python experience...",
        ...     score_fit=True
        ... )
    """
    payload = {
        "extractContact": extract_contact,
        "scoreFit": score_fit
    }
    if resume_text:
        payload["resumeText"] = resume_text
    if resume_url:
        payload["resumeUrl"] = resume_url
    if job_description:
        payload["jobDescription"] = job_description

    return await call_firebase_function("analyzeResume", payload)
async def process_text_extraction(
    document_url: Optional[str] = None,
    document_text: Optional[str] = None,
    extraction_type: str = "full",
    ocr_enabled: bool = True,
    language: str = "en",
    output_format: str = "text",
) -> dict:
    """
    Extract and process text from documents with OCR support.

    This tool provides advanced text extraction capabilities including
    OCR for images and scanned documents.

    Args:
        document_url: URL of the document to process
        document_text: Pre-extracted text to process
        extraction_type: Type of extraction:
            - "full": Complete text extraction
            - "summary": Summarized content
            - "key_points": Key points only
            - "tables": Tables and structured data
        ocr_enabled: Enable OCR for scanned documents
        language: Primary language of the document
        output_format: Output format ("text", "json", "markdown")

    Returns:
        A dictionary containing:
        - extracted_text: The extracted text content
        - confidence: OCR confidence score (if applicable)
        - language_detected: Detected language
        - page_count: Number of pages processed
        - processing_time: Time taken for extraction

    Example:
        >>> result = await process_text_extraction(
        ...     document_url="https://example.com/scanned_resume.pdf",
        ...     extraction_type="full",
        ...     ocr_enabled=True
        ... )
    """
    payload = {
        "extractionType": extraction_type,
        "ocrEnabled": ocr_enabled,
        "language": language,
        "outputFormat": output_format
    }
    if document_url:
        payload["documentUrl"] = document_url
    if document_text:
        payload["documentText"] = document_text

    return await call_firebase_function("processTextExtraction", payload)
async def firecrawl_url(
    url: str,
    scrape_full_page: bool = True,
    extract_links: bool = False,
    extract_images: bool = False,
    wait_for_js: bool = True,
    timeout_seconds: int = 30,
) -> dict:
    """
    Scrape and extract content from a web page using Firecrawl.

    This tool fetches web pages and extracts clean, structured content
    while handling JavaScript-rendered pages.

    Args:
        url: URL of the web page to scrape
        scrape_full_page: Get complete page content vs just main content
        extract_links: Extract all links from the page
        extract_images: Extract image URLs
        wait_for_js: Wait for JavaScript to render
        timeout_seconds: Maximum time to wait for page load

    Returns:
        A dictionary containing:
        - content: Extracted page content (markdown format)
        - title: Page title
        - description: Meta description
        - links: Extracted links (if requested)
        - images: Extracted images (if requested)
        - metadata: Page metadata

    Example:
        >>> result = await firecrawl_url(
        ...     url="https://www.linkedin.com/jobs/view/123456",
        ...     scrape_full_page=True,
        ...     wait_for_js=True
        ... )
    """
    return await call_firebase_function(
        "firecrawlUrl",
        {
            "url": url,
            "scrapeFullPage": scrape_full_page,
            "extractLinks": extract_links,
            "extractImages": extract_images,
            "waitForJs": wait_for_js,
            "timeoutSeconds": timeout_seconds
        }
    )
