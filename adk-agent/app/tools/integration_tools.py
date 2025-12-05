"""Integration tools for Google Docs and other services."""
from typing import Optional
from app.tools.base import call_firebase_function, requires_confirmation
async def export_to_google_docs(
    content: str,
    title: str,
    folder_id: Optional[str] = None,
    template_id: Optional[str] = None,
    format_type: str = "document",
) -> dict:
    """
    Export content to a Google Doc.

    This tool creates a new Google Doc with the specified content,
    optionally using a template and placing it in a specific folder.

    Args:
        content: Content to export (supports markdown)
        title: Title for the new document
        folder_id: Google Drive folder ID to save in
        template_id: Google Doc template ID to use
        format_type: Type of document ("document", "spreadsheet", "presentation")

    Returns:
        A dictionary containing:
        - doc_id: ID of the created document
        - doc_url: URL to access the document
        - title: Document title
        - folder: Folder where document was saved

    Example:
        >>> result = await export_to_google_docs(
        ...     content="# Interview Summary\\n\\n## Candidate: John Doe...",
        ...     title="Interview Summary - John Doe - 2024-01-15",
        ...     folder_id="1abc123xyz"
        ... )
    """
    payload = {
        "content": content,
        "title": title,
        "formatType": format_type
    }
    if folder_id:
        payload["folderId"] = folder_id
    if template_id:
        payload["templateId"] = template_id

    return await call_firebase_function("exportToGoogleDocs", payload)
async def import_from_google_docs(
    doc_id: Optional[str] = None,
    doc_url: Optional[str] = None,
    export_format: str = "text",
) -> dict:
    """
    Import content from a Google Doc.

    This tool retrieves content from an existing Google Doc
    in various formats.

    Args:
        doc_id: Google Doc ID
        doc_url: Full URL to the Google Doc
        export_format: Desired format ("text", "markdown", "html", "pdf")

    Returns:
        A dictionary containing:
        - content: Document content in requested format
        - title: Document title
        - last_modified: Last modification timestamp
        - author: Document author
        - comments: Document comments (if any)

    Example:
        >>> result = await import_from_google_docs(
        ...     doc_url="https://docs.google.com/document/d/abc123/edit",
        ...     export_format="markdown"
        ... )
    """
    payload = {
        "exportFormat": export_format
    }
    if doc_id:
        payload["docId"] = doc_id
    if doc_url:
        payload["docUrl"] = doc_url

    return await call_firebase_function("importFromGoogleDocs", payload)
async def get_drive_folders(
    parent_folder_id: Optional[str] = None,
    search_query: Optional[str] = None,
    include_shared: bool = True,
) -> dict:
    """
    List Google Drive folders for organizing documents.

    This tool retrieves available Google Drive folders that can
    be used for saving exported documents.

    Args:
        parent_folder_id: ID of parent folder to list contents
        search_query: Search query to filter folders
        include_shared: Include shared folders in results

    Returns:
        A dictionary containing:
        - folders: List of folders with id, name, and path
        - total_count: Total number of folders
        - has_more: Whether there are more results

    Example:
        >>> result = await get_drive_folders(
        ...     search_query="Recruiting",
        ...     include_shared=True
        ... )
    """
    payload = {
        "includeShared": include_shared
    }
    if parent_folder_id:
        payload["parentFolderId"] = parent_folder_id
    if search_query:
        payload["searchQuery"] = search_query

    return await call_firebase_function("getDriveFolders", payload)
@requires_confirmation
async def share_google_doc(
    doc_id: str,
    share_with: list[str],
    permission_type: str = "reader",
    send_notification: bool = True,
    message: Optional[str] = None,
) -> dict:
    """
    Share a Google Doc with specified users.

    IMPORTANT: This tool shares a document with others.
    User confirmation is required.

    Args:
        doc_id: ID of the document to share
        share_with: List of email addresses to share with
        permission_type: Permission level ("reader", "commenter", "writer")
        send_notification: Send email notification to recipients
        message: Custom message to include in notification

    Returns:
        A dictionary containing:
        - success: Whether sharing was successful
        - shared_with: List of users the doc was shared with
        - permissions: Applied permissions
        - doc_url: URL to the shared document

    Example:
        >>> result = await share_google_doc(
        ...     doc_id="abc123",
        ...     share_with=["hiring-manager@company.com", "hr@company.com"],
        ...     permission_type="commenter",
        ...     message="Here's the interview summary for your review"
        ... )
    """
    payload = {
        "docId": doc_id,
        "shareWith": share_with,
        "permissionType": permission_type,
        "sendNotification": send_notification
    }
    if message:
        payload["message"] = message

    return await call_firebase_function("shareGoogleDoc", payload)
