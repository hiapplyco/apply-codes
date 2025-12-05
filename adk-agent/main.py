"""FastAPI server for the Apply-Codes ADK Agent."""

import os
import json
import uuid
import asyncio
from datetime import datetime
from typing import Optional, AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import firebase_admin
from firebase_admin import auth, credentials, firestore

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from app.agent import create_agent, get_agent_capabilities
from app.model_router import classify_query_complexity, get_complexity_description
from app.config import settings
from app.tools.base import set_user_context, clear_user_context


# Initialize Firebase Admin
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown."""
    # Startup
    if not firebase_admin._apps:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred)
    yield
    # Shutdown
    clear_user_context()


app = FastAPI(
    title="Apply-Codes ADK Agent",
    description="AI recruitment assistant powered by Google ADK",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get Firestore client
def get_db():
    return firestore.client()


# Request/Response Models
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    project_id: Optional[str] = None
    history: Optional[list[dict]] = None


class ChatResponse(BaseModel):
    response: str
    tool_calls: Optional[list[dict]] = None
    session_id: str
    metadata: dict


class ToolConfirmationRequest(BaseModel):
    tool_name: str
    parameters: dict
    description: str


class ToolConfirmationResponse(BaseModel):
    confirmation_id: str
    tool_name: str
    description: str
    parameters: dict
    expires_at: str


# Pending confirmations storage (in production, use Redis or Firestore)
pending_confirmations: dict[str, dict] = {}


# Authentication dependency
async def verify_firebase_token(authorization: str = Header(...)) -> dict:
    """Verify Firebase ID token from Authorization header."""
    try:
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header")

        token = authorization.replace("Bearer ", "")
        decoded = auth.verify_id_token(token)
        return decoded
    except auth.InvalidIdTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


async def get_project_context(project_id: str, user_id: str) -> Optional[dict]:
    """Fetch project context from Firestore."""
    if not project_id:
        return None

    try:
        db = get_db()
        doc = db.collection("projects").document(project_id).get()

        if doc.exists:
            data = doc.to_dict()
            if data.get("user_id") == user_id:
                # Get candidate count
                try:
                    candidates = db.collection("candidates")\
                        .where("project_id", "==", project_id)\
                        .count().get()
                    data["candidate_count"] = candidates[0][0].value
                except Exception:
                    data["candidate_count"] = 0
                return data
    except Exception as e:
        print(f"Error fetching project context: {e}")

    return None


async def store_conversation(
    db,
    session_id: str,
    user_id: str,
    project_id: Optional[str],
    user_message: str,
    agent_response: str,
    tool_calls: Optional[list] = None,
    metadata: Optional[dict] = None
):
    """Store conversation history in Firestore."""
    try:
        # Update or create session
        db.collection("chat_sessions").document(session_id).set({
            "user_id": user_id,
            "project_id": project_id,
            "updated_at": firestore.SERVER_TIMESTAMP
        }, merge=True)

        # Store user message
        db.collection("chat_messages").add({
            "session_id": session_id,
            "role": "user",
            "content": user_message,
            "created_at": firestore.SERVER_TIMESTAMP
        })

        # Store assistant response
        message_data = {
            "session_id": session_id,
            "role": "assistant",
            "content": agent_response,
            "created_at": firestore.SERVER_TIMESTAMP
        }
        if tool_calls:
            message_data["tool_calls"] = tool_calls
        if metadata:
            message_data["metadata"] = metadata

        db.collection("chat_messages").add(message_data)
    except Exception as e:
        print(f"Error storing conversation: {e}")


@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    user: dict = Depends(verify_firebase_token)
):
    """Main chat endpoint for the ADK agent."""

    user_id = user["uid"]
    user_email = user.get("email", "")

    # Set user context for tool calls
    token = user.get("token", "")
    set_user_context(user_id, token, request.project_id)

    try:
        db = get_db()

        # Get project context if provided
        project_context = None
        if request.project_id:
            project_context = await get_project_context(request.project_id, user_id)

        # Classify query complexity
        complexity = classify_query_complexity(request.message, request.history)
        complexity_desc = get_complexity_description(complexity)

        # Create agent with context
        agent = create_agent(
            project_context=project_context,
            complexity=complexity,
            user_context={"name": user_email.split("@")[0], "email": user_email}
        )

        # Generate session ID if not provided
        session_id = request.session_id or f"session_{user_id}_{uuid.uuid4().hex[:8]}"

        # Run the agent using Runner
        try:
            # Create session service and runner
            session_service = InMemorySessionService()
            runner = Runner(
                agent=agent,
                app_name="apply_codes_agent",
                session_service=session_service
            )

            # Create or get session
            session = await session_service.create_session(
                app_name="apply_codes_agent",
                user_id=user_id,
                session_id=session_id
            )

            # Run the agent
            response_content = ""
            tool_calls = []

            # Create Content object for the message
            user_content = types.Content(
                role='user',
                parts=[types.Part(text=request.message)]
            )

            async for event in runner.run_async(
                user_id=user_id,
                session_id=session_id,
                new_message=user_content
            ):
                # Extract text from event content
                if hasattr(event, 'content') and event.content:
                    if hasattr(event.content, 'parts') and event.content.parts:
                        for part in event.content.parts:
                            if hasattr(part, 'text') and part.text:
                                response_content += part.text
                    elif isinstance(event.content, str):
                        response_content += event.content
                if hasattr(event, 'tool_call') and event.tool_call:
                    tool_calls.append({
                        "name": event.tool_call.name,
                        "parameters": getattr(event.tool_call, 'parameters', {}),
                        "result": getattr(event.tool_call, 'result', None)
                    })

            # Store conversation
            await store_conversation(
                db=db,
                session_id=session_id,
                user_id=user_id,
                project_id=request.project_id,
                user_message=request.message,
                agent_response=response_content,
                tool_calls=tool_calls,
                metadata={"complexity": complexity.value}
            )

            return ChatResponse(
                response=response_content,
                tool_calls=tool_calls if tool_calls else None,
                session_id=session_id,
                metadata={
                    "model": agent.model,
                    "complexity": complexity.value,
                    "complexity_description": complexity_desc,
                    "tools_used": [tc["name"] for tc in tool_calls],
                    "project_id": request.project_id
                }
            )

        except Exception as e:
            print(f"Agent execution error: {e}")
            raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

    finally:
        clear_user_context()


@app.post("/api/chat/stream")
async def chat_stream(
    request: ChatRequest,
    user: dict = Depends(verify_firebase_token)
):
    """Streaming chat endpoint for real-time token generation."""

    user_id = user["uid"]
    user_email = user.get("email", "")

    # Set user context for tool calls
    token = user.get("token", "")
    set_user_context(user_id, token, request.project_id)

    async def generate() -> AsyncGenerator[str, None]:
        try:
            db = get_db()

            # Get project context if provided
            project_context = None
            if request.project_id:
                project_context = await get_project_context(request.project_id, user_id)

            # Classify query complexity
            complexity = classify_query_complexity(request.message, request.history)

            # Create agent with context
            agent = create_agent(
                project_context=project_context,
                complexity=complexity,
                user_context={"name": user_email.split("@")[0], "email": user_email}
            )

            # Generate session ID if not provided
            session_id = request.session_id or f"session_{user_id}_{uuid.uuid4().hex[:8]}"

            # Create session service and runner
            session_service = InMemorySessionService()
            runner = Runner(
                agent=agent,
                app_name="apply_codes_agent",
                session_service=session_service
            )

            # Create or get session
            session = await session_service.create_session(
                app_name="apply_codes_agent",
                user_id=user_id,
                session_id=session_id
            )

            # Send session info
            yield f"data: {json.dumps({'type': 'session', 'session_id': session_id, 'model': agent.model})}\n\n"

            # Stream agent response
            full_response = ""
            tool_calls = []

            # Create Content object for the message
            user_content = types.Content(
                role='user',
                parts=[types.Part(text=request.message)]
            )

            try:
                async for event in runner.run_async(
                    user_id=user_id,
                    session_id=session_id,
                    new_message=user_content
                ):
                    # Extract text from event content
                    if hasattr(event, 'content') and event.content:
                        text_content = ""
                        if hasattr(event.content, 'parts') and event.content.parts:
                            for part in event.content.parts:
                                if hasattr(part, 'text') and part.text:
                                    text_content += part.text
                        elif isinstance(event.content, str):
                            text_content = event.content

                        if text_content:
                            full_response += text_content
                            yield f"data: {json.dumps({'type': 'token', 'content': text_content})}\n\n"

                    if hasattr(event, 'tool_call') and event.tool_call:
                        tool_info = {
                            "name": event.tool_call.name,
                            "status": "executing"
                        }
                        tool_calls.append(tool_info)
                        yield f"data: {json.dumps({'type': 'tool_call', 'tool': tool_info})}\n\n"

                    if hasattr(event, 'tool_result') and event.tool_result:
                        yield f"data: {json.dumps({'type': 'tool_result', 'tool': event.tool_result.name, 'status': 'complete'})}\n\n"

            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

            # Store conversation
            await store_conversation(
                db=db,
                session_id=session_id,
                user_id=user_id,
                project_id=request.project_id,
                user_message=request.message,
                agent_response=full_response,
                tool_calls=tool_calls
            )

            # Send completion
            yield f"data: {json.dumps({'type': 'done', 'session_id': session_id})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        finally:
            clear_user_context()

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )


@app.post("/api/chat/confirm/{confirmation_id}")
async def confirm_tool_execution(
    confirmation_id: str,
    approved: bool,
    user: dict = Depends(verify_firebase_token)
):
    """Confirm or reject a high-impact tool execution."""

    if confirmation_id not in pending_confirmations:
        raise HTTPException(status_code=404, detail="Confirmation not found or expired")

    confirmation = pending_confirmations.pop(confirmation_id)

    # Verify user owns this confirmation
    if confirmation.get("user_id") != user["uid"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if approved:
        # Execute the pending tool
        # In production, this would trigger the actual tool execution
        return {
            "status": "executed",
            "tool": confirmation["tool_name"],
            "message": f"Tool '{confirmation['tool_name']}' executed successfully"
        }
    else:
        return {
            "status": "cancelled",
            "tool": confirmation["tool_name"],
            "message": f"Tool '{confirmation['tool_name']}' execution cancelled"
        }


@app.get("/api/capabilities")
async def get_capabilities():
    """Get agent capabilities for UI display."""
    return get_agent_capabilities()


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "adk-agent",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/tools")
async def list_tools():
    """List all available tools."""
    from app.tools import ALL_TOOLS

    tools = []
    for tool_func in ALL_TOOLS:
        tool_info = {
            "name": tool_func.__name__,
            "description": tool_func.__doc__.split("\n")[1].strip() if tool_func.__doc__ else "",
            "requires_confirmation": getattr(tool_func, 'requires_confirmation', False),
            "category": getattr(tool_func, 'tool_category', 'general'),
            "risk_level": getattr(tool_func, 'tool_risk_level', 'low')
        }
        tools.append(tool_info)

    return {
        "total": len(tools),
        "tools": tools
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
