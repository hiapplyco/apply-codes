"""Base utilities for ADK tool implementations."""

import httpx
import asyncio
from typing import Any, Optional
from functools import wraps
import logging

from app.config import settings

logger = logging.getLogger(__name__)

# Thread-local storage for user context
_user_context: dict[str, Any] = {}


def set_user_context(user_id: str, token: str, project_id: Optional[str] = None):
    """Set the current user context for tool calls."""
    _user_context["user_id"] = user_id
    _user_context["token"] = token
    _user_context["project_id"] = project_id


def get_user_context() -> dict[str, Any]:
    """Get the current user context."""
    return _user_context.copy()


def clear_user_context():
    """Clear the user context."""
    _user_context.clear()


async def call_firebase_function(
    function_name: str,
    payload: dict,
    timeout: float = 60.0,
    retries: int = 3,
    is_callable: bool = True,  # Default to True for backward compatibility
) -> dict[str, Any]:
    """
    Call a Firebase Function with authentication and retry logic.
    
    Supports both Callable functions (wrapped in {"data": ...}) and 
    standard HTTP functions (raw payload).

    Args:
        function_name: Name of the Firebase function to call
        payload: JSON payload to send
        timeout: Request timeout in seconds
        retries: Number of retry attempts
        is_callable: True if it's a Firebase Callable function (needs data wrapper),
                    False if it's a standard HTTP function

    Returns:
        JSON response from the function
    """
    headers = {
        "Content-Type": "application/json"
    }

    # Add auth token if available
    token = _user_context.get("token")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    url = f"{settings.firebase_functions_url}/{function_name}"

    # Prepare payload based on function type
    request_json = {"data": payload} if is_callable else payload

    last_error = None
    for attempt in range(retries):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json=request_json,
                    headers=headers,
                    timeout=timeout
                )
                response.raise_for_status()
                result = response.json()
                
                # Handle Callable response format (unwrap "result")
                if is_callable and isinstance(result, dict) and "result" in result:
                    return result["result"]
                
                return result

        except httpx.TimeoutException as e:
            last_error = e
            logger.warning(f"Timeout calling {function_name}, attempt {attempt + 1}/{retries}")
            if attempt < retries - 1:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff

        except httpx.HTTPStatusError as e:
            last_error = e
            # Don't retry on client errors (4xx)
            if 400 <= e.response.status_code < 500:
                logger.error(f"Client error calling {function_name}: {e.response.text}")
                raise
            logger.warning(f"Server error calling {function_name}, attempt {attempt + 1}/{retries}")
            if attempt < retries - 1:
                await asyncio.sleep(2 ** attempt)

        except Exception as e:
            last_error = e
            logger.error(f"Unexpected error calling {function_name}: {e}")
            raise

    # All retries exhausted
    raise last_error or Exception(f"Failed to call {function_name} after {retries} attempts")


async def call_firebase_function_with_form(
    function_name: str,
    form_data: dict,
    files: Optional[dict] = None,
    timeout: float = 120.0,
) -> dict[str, Any]:
    """
    Call a Firebase Cloud Function with form data and optional file upload.

    Args:
        function_name: Name of the Firebase function to call
        form_data: Form fields to send
        files: Optional dictionary of files to upload {field_name: (filename, content, content_type)}
        timeout: Request timeout in seconds

    Returns:
        JSON response from the function
    """
    headers = {}

    # Add auth token if available
    token = _user_context.get("token")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    url = f"{settings.firebase_functions_url}/{function_name}"

    async with httpx.AsyncClient() as client:
        response = await client.post(
            url,
            data=form_data,
            files=files,
            headers=headers,
            timeout=timeout
        )
        response.raise_for_status()
        return response.json()


def requires_confirmation(func):
    """
    Decorator to mark a tool as requiring user confirmation before execution.

    Tools decorated with this will have a `requires_confirmation` attribute set to True.
    """
    func.requires_confirmation = True
    return func


def tool_metadata(**kwargs):
    """
    Decorator to add metadata to a tool function.

    Example:
        @tool_metadata(category="email", risk_level="high")
        async def send_email(...):
            ...
    """
    def decorator(func):
        for key, value in kwargs.items():
            setattr(func, f"tool_{key}", value)
        return func
    return decorator
