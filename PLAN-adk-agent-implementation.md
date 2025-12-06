# ADK Smart Agent Implementation Plan

## Executive Summary

Deploy a Google ADK (Agent Development Kit) powered smart chat agent that exposes all 50+ Firebase Cloud Functions as agentic tools. The agent will use the existing FloatingChatBot UI with project context selector while providing intelligent, autonomous task execution capabilities.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         React Frontend                               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  FloatingChatBot.tsx (existing) + Project Context Selector   │    │
│  │  - Keeps current UI/UX                                       │    │
│  │  - Sends messages to /api/chat endpoint                      │    │
│  │  - Streams responses for real-time feedback                  │    │
│  └─────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────┬─┘
                                                                    │
                            Firebase Hosting (proxy)                 │
                            /api/** → Cloud Run                      │
                                                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ADK Agent Backend (Cloud Run)                     │
│  ┌──────────────────────┐  ┌─────────────────────────────────────┐  │
│  │  FastAPI Server      │  │  Google ADK Agent                    │  │
│  │  - /api/chat         │→ │  - LLM Agent (Gemini 2.5)           │  │
│  │  - /api/stream       │  │  - 50+ Tool Definitions             │  │
│  │  - Auth middleware   │  │  - Session Management               │  │
│  └──────────────────────┘  └─────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┬─┘
                                                                    │
                                                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Firebase Cloud Functions (Existing Tools)               │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────────────────┐  │
│  │ Boolean Search│ │ Profile Enrich│ │ Candidate Analysis        │  │
│  │ Perplexity    │ │ Firecrawl     │ │ Resume Parsing            │  │
│  │ Email Outreach│ │ LinkedIn      │ │ Interview Scheduling      │  │
│  │ ... 45+ more  │ └───────────────┘ └───────────────────────────┘  │
│  └───────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: ADK Backend Setup

### 1.1 Create Python ADK Project Structure

Create a new `adk-agent/` directory at the project root:

```
adk-agent/
├── Dockerfile
├── requirements.txt
├── main.py                    # FastAPI entry point
├── app/
│   ├── __init__.py
│   ├── agent.py               # ADK Agent configuration
│   ├── api.py                 # API routes
│   ├── auth.py                # Firebase Auth verification
│   ├── config.py              # Environment configuration
│   └── tools/
│       ├── __init__.py
│       ├── base.py            # Base tool class with auth
│       ├── search_tools.py    # Boolean search, perplexity, contacts
│       ├── profile_tools.py   # Profile enrichment, LinkedIn, GitHub
│       ├── content_tools.py   # Job description, content generation
│       ├── email_tools.py     # Email sending, templates
│       ├── interview_tools.py # Scheduling, questions, screening
│       ├── document_tools.py  # Resume parsing, document extraction
│       ├── meeting_tools.py   # Daily rooms, recordings
│       ├── analytics_tools.py # Compensation, metrics
│       └── integration_tools.py # Google Docs, webhooks
├── tests/
│   ├── __init__.py
│   ├── test_agent.py
│   └── test_tools.py
└── cloudbuild.yaml            # Cloud Build config for deployment
```

### 1.2 Core Dependencies (requirements.txt)

```
google-adk>=0.3.0
google-generativeai>=0.8.0
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
python-multipart>=0.0.6
firebase-admin>=6.4.0
httpx>=0.26.0
pydantic>=2.5.0
python-dotenv>=1.0.0
```

### 1.3 ADK Agent Configuration (app/agent.py)

```python
from google.adk import Agent
from google.adk.tools import tool

from app.tools import (
    search_tools,
    profile_tools,
    content_tools,
    email_tools,
    interview_tools,
    document_tools,
    meeting_tools,
    analytics_tools,
    integration_tools
)

# Combine all tool functions
ALL_TOOLS = [
    # Search & Discovery
    search_tools.generate_boolean_search,
    search_tools.explain_boolean_search,
    search_tools.perplexity_search,
    search_tools.search_contacts,
    search_tools.get_contact_info,

    # Profile & Candidate
    profile_tools.enrich_profile,
    profile_tools.analyze_candidate,
    profile_tools.linkedin_search,
    profile_tools.pdl_search,
    profile_tools.clearbit_enrichment,
    profile_tools.hunter_io_search,
    profile_tools.github_profile,

    # Content Generation
    content_tools.generate_content,
    content_tools.enhance_job_description,
    content_tools.summarize_job,
    content_tools.process_job_requirements,
    content_tools.process_job_requirements_v2,
    content_tools.extract_nlp_terms,
    content_tools.generate_linkedin_analysis,
    content_tools.create_linkedin_post,

    # Email & Outreach
    email_tools.send_email,
    email_tools.send_outreach_email,
    email_tools.generate_email_templates,
    email_tools.send_campaign_email,

    # Interview & Screening
    interview_tools.schedule_interview,
    interview_tools.generate_interview_questions,
    interview_tools.prepare_interview,

    # Document Processing
    document_tools.parse_document,
    document_tools.analyze_resume,
    document_tools.process_text_extraction,
    document_tools.firecrawl_url,

    # Meetings & Recording
    meeting_tools.create_daily_room,
    meeting_tools.process_recording,
    meeting_tools.transcribe_audio,

    # Analytics
    analytics_tools.analyze_compensation,
    analytics_tools.generate_dashboard_metrics,
    analytics_tools.generate_clarvida_report,

    # Integrations
    integration_tools.export_to_google_docs,
    integration_tools.import_from_google_docs,
    integration_tools.get_drive_folders,
    integration_tools.share_google_doc,
]

# Agent system instruction
SYSTEM_INSTRUCTION = """You are an expert AI recruitment assistant for the Apply-Codes platform.
You have access to powerful tools for:

1. **Candidate Sourcing**: Generate boolean search strings, search for candidates on LinkedIn and other platforms, enrich profiles with contact info.

2. **Job Analysis**: Process job requirements, enhance job descriptions, analyze compensation data, extract key skills and terms.

3. **Outreach & Communication**: Draft personalized emails, create LinkedIn posts, manage email campaigns.

4. **Interview Management**: Schedule interviews, generate relevant interview questions, prepare interview guides.

5. **Document Processing**: Parse resumes, analyze candidate fit, extract text from documents.

6. **Research & Web Scraping**: Search the web with Perplexity AI, scrape websites with Firecrawl.

When helping users:
- Be proactive in suggesting relevant tools based on the user's goals
- Chain multiple tools together for complex workflows
- Explain what you're doing and why
- Provide actionable insights from tool results
- Remember context from the conversation to provide personalized assistance

Current project context will be provided when available. Use it to make your responses more relevant.
"""

def create_agent(project_context: dict | None = None) -> Agent:
    """Create an ADK agent with all recruitment tools."""

    # Enhance system instruction with project context
    instruction = SYSTEM_INSTRUCTION
    if project_context:
        instruction += f"""

## Current Project Context
- Project Name: {project_context.get('name', 'N/A')}
- Description: {project_context.get('description', 'N/A')}
- Job Requirements: {project_context.get('requirements', 'N/A')}
- Target Candidates: {project_context.get('target_candidates', 'N/A')}
- Saved Candidates: {project_context.get('candidate_count', 0)} candidates saved
"""

    return Agent(
        name="apply_codes_agent",
        model="gemini-2.5-flash",
        description="Expert AI recruitment assistant with access to sourcing, outreach, and interview tools",
        instruction=instruction,
        tools=ALL_TOOLS,
    )
```

### 1.4 Tool Implementation Pattern (app/tools/base.py)

```python
import httpx
from functools import wraps
from typing import Any, Callable
import firebase_admin
from firebase_admin import auth

# Configuration
FIREBASE_FUNCTIONS_URL = "https://us-central1-apply-codes-prod.cloudfunctions.net"

async def call_firebase_function(
    function_name: str,
    payload: dict,
    user_token: str | None = None
) -> dict[str, Any]:
    """Call a Firebase Cloud Function with authentication."""

    headers = {
        "Content-Type": "application/json"
    }

    if user_token:
        headers["Authorization"] = f"Bearer {user_token}"

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{FIREBASE_FUNCTIONS_URL}/{function_name}",
            json=payload,
            headers=headers,
            timeout=60.0
        )
        response.raise_for_status()
        return response.json()
```

### 1.5 Example Tool Implementation (app/tools/search_tools.py)

```python
from google.adk.tools import tool
from app.tools.base import call_firebase_function

@tool
async def generate_boolean_search(
    job_title: str,
    skills: list[str],
    experience_years: int | None = None,
    location: str | None = None,
    company_type: str | None = None
) -> dict:
    """
    Generate a LinkedIn boolean search string for finding candidates.

    Args:
        job_title: The target job title or role
        skills: List of required technical skills
        experience_years: Minimum years of experience required
        location: Target location or region
        company_type: Type of companies (startup, enterprise, etc.)

    Returns:
        A dictionary containing the boolean search string and explanation
    """
    return await call_firebase_function(
        "generateBooleanSearch",
        {
            "description": f"Looking for {job_title} with skills: {', '.join(skills)}",
            "jobTitle": job_title,
            "contextItems": [
                {"type": "skills", "content": skills},
                {"type": "experience", "content": experience_years},
                {"type": "location", "content": location},
                {"type": "companyType", "content": company_type}
            ]
        }
    )

@tool
async def perplexity_search(
    query: str,
    focus: str = "general"
) -> dict:
    """
    Search the web using Perplexity AI for up-to-date information.

    Args:
        query: The search query or question
        focus: Search focus - 'general', 'academic', 'writing', or 'wolfram'

    Returns:
        Search results with sources and a synthesized answer
    """
    return await call_firebase_function(
        "perplexitySearch",
        {"query": query, "focus": focus}
    )

@tool
async def search_contacts(
    name: str | None = None,
    company: str | None = None,
    title: str | None = None,
    email_domain: str | None = None
) -> dict:
    """
    Search for contact information using various data sources.

    Args:
        name: Person's name to search for
        company: Company name to filter by
        title: Job title to filter by
        email_domain: Email domain to search within

    Returns:
        Contact search results with email addresses and other info
    """
    return await call_firebase_function(
        "searchContacts",
        {
            "query": name,
            "filters": {
                "company": company,
                "title": title,
                "emailDomain": email_domain
            }
        }
    )
```

---

## Phase 2: API Server Implementation

### 2.1 FastAPI Server (main.py)

```python
import os
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import firebase_admin
from firebase_admin import auth, credentials, firestore

from app.agent import create_agent
from app.config import settings

# Initialize Firebase Admin
cred = credentials.ApplicationDefault()
firebase_admin.initialize_app(cred)
db = firestore.client()

app = FastAPI(title="Apply-Codes ADK Agent", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

async def verify_firebase_token(authorization: str = Header(...)):
    """Verify Firebase ID token from Authorization header."""
    try:
        token = authorization.replace("Bearer ", "")
        decoded = auth.verify_id_token(token)
        return decoded
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

async def get_project_context(project_id: str, user_id: str) -> dict | None:
    """Fetch project context from Firestore."""
    if not project_id:
        return None

    try:
        doc = db.collection("projects").document(project_id).get()
        if doc.exists:
            data = doc.to_dict()
            if data.get("user_id") == user_id:
                # Get candidate count
                candidates = db.collection("candidates")\
                    .where("project_id", "==", project_id)\
                    .count().get()
                data["candidate_count"] = candidates[0][0].value
                return data
    except Exception as e:
        print(f"Error fetching project context: {e}")
    return None

@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    user: dict = Depends(verify_firebase_token)
):
    """Main chat endpoint for the ADK agent."""

    user_id = user["uid"]

    # Get project context if provided
    project_context = None
    if request.project_id:
        project_context = await get_project_context(request.project_id, user_id)

    # Create agent with context
    agent = create_agent(project_context)

    # Generate session ID if not provided
    session_id = request.session_id or f"session_{user_id}_{os.urandom(4).hex()}"

    # Run the agent
    try:
        result = await agent.run(
            message=request.message,
            session_id=session_id,
            context={
                "user_id": user_id,
                "project_id": request.project_id,
                "history": request.history or []
            }
        )

        # Store conversation in Firestore
        await store_conversation(
            session_id=session_id,
            user_id=user_id,
            project_id=request.project_id,
            user_message=request.message,
            agent_response=result
        )

        return ChatResponse(
            response=result.content,
            tool_calls=result.tool_calls if hasattr(result, 'tool_calls') else None,
            session_id=session_id,
            metadata={
                "model": "gemini-2.5-flash",
                "tools_used": [tc.name for tc in (result.tool_calls or [])],
                "project_id": request.project_id
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def store_conversation(
    session_id: str,
    user_id: str,
    project_id: str | None,
    user_message: str,
    agent_response
):
    """Store conversation history in Firestore."""
    try:
        db.collection("chat_sessions").document(session_id).set({
            "user_id": user_id,
            "project_id": project_id,
            "updated_at": firestore.SERVER_TIMESTAMP
        }, merge=True)

        db.collection("chat_messages").add({
            "session_id": session_id,
            "role": "user",
            "content": user_message,
            "created_at": firestore.SERVER_TIMESTAMP
        })

        db.collection("chat_messages").add({
            "session_id": session_id,
            "role": "assistant",
            "content": agent_response.content,
            "tool_calls": [tc.dict() for tc in (agent_response.tool_calls or [])],
            "created_at": firestore.SERVER_TIMESTAMP
        })
    except Exception as e:
        print(f"Error storing conversation: {e}")

@app.get("/api/health")
async def health():
    return {"status": "healthy", "service": "adk-agent"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
```

---

## Phase 3: Deployment Configuration

### 3.1 Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### 3.2 Cloud Build Configuration (cloudbuild.yaml)

```yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/adk-agent:$COMMIT_SHA', '.']

  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/adk-agent:$COMMIT_SHA']

  # Deploy container image to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'adk-agent'
      - '--image'
      - 'gcr.io/$PROJECT_ID/adk-agent:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--memory'
      - '2Gi'
      - '--cpu'
      - '2'
      - '--timeout'
      - '300'
      - '--set-env-vars'
      - 'GOOGLE_CLOUD_PROJECT=$PROJECT_ID'

images:
  - 'gcr.io/$PROJECT_ID/adk-agent:$COMMIT_SHA'
```

### 3.3 Firebase Hosting Rewrite (firebase.json update)

```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "/api/**",
        "run": {
          "serviceId": "adk-agent",
          "region": "us-central1"
        }
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

## Phase 4: Frontend Integration

### 4.1 Update FloatingChatBot.tsx

Minimal changes needed - just update the API endpoint:

```typescript
// In FloatingChatBot.tsx handleSubmit function

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!input.trim() || isLoading) return;

  // ... existing usage limit check ...

  const userMessage: Message = {
    id: `user-${Date.now()}`,
    role: 'user',
    content: input,
    timestamp: new Date()
  };

  setMessages(prev => [...prev, userMessage]);
  setInput('');
  setIsLoading(true);

  try {
    // Get Firebase ID token
    const token = await auth.currentUser?.getIdToken();

    // Call ADK agent API
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: input,
        session_id: sessionId,
        project_id: selectedProjectId,
        history: messages.slice(-10).map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get response');
    }

    const data = await response.json();

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: data.response,
      timestamp: new Date(),
      metadata: {
        toolCalls: data.tool_calls,
        ...data.metadata
      }
    };

    setMessages(prev => [...prev, assistantMessage]);
    setSessionId(data.session_id);

    // Increment AI calls usage
    incrementUsage('ai_calls').catch(console.error);
  } catch (error) {
    console.error('Chat error:', error);
    toast.error('Failed to send message');

    setMessages(prev => [...prev, {
      id: `error-${Date.now()}`,
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again.',
      timestamp: new Date()
    }]);
  } finally {
    setIsLoading(false);
  }
};
```

### 4.2 Add Session Management Hook

Create `src/hooks/useAgentSession.ts`:

```typescript
import { useState, useEffect } from 'react';
import { useNewAuth } from '@/context/NewAuthContext';

export function useAgentSession(projectId?: string | null) {
  const { user } = useNewAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Create new session when project changes
    if (user?.id) {
      const newSessionId = `session_${user.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      setSessionId(newSessionId);
    }
  }, [user?.id, projectId]);

  return { sessionId, setSessionId };
}
```

---

## Phase 5: Tool Definitions (Complete List)

### 5.1 Search & Discovery Tools

| Tool Name | Firebase Function | Description |
|-----------|------------------|-------------|
| `generate_boolean_search` | generateBooleanSearch | Generate LinkedIn boolean search strings |
| `explain_boolean_search` | explainBoolean | Explain what a boolean search does |
| `perplexity_search` | perplexitySearch | Web search via Perplexity AI |
| `search_contacts` | searchContacts | Search for contact information |
| `get_contact_info` | getContactInfo | Get detailed contact info |

### 5.2 Profile & Candidate Tools

| Tool Name | Firebase Function | Description |
|-----------|------------------|-------------|
| `enrich_profile` | enrichProfile | Enrich candidate profiles |
| `analyze_candidate` | analyzeCandidate | Analyze candidate fit |
| `linkedin_search` | linkedinSearch | Search LinkedIn profiles |
| `pdl_search` | pdlSearch | Search People Data Labs |
| `clearbit_enrichment` | clearbitEnrichment | Clearbit company/person data |
| `hunter_io_search` | hunterIoSearch | Find emails via Hunter.io |
| `github_profile` | githubProfile | Fetch GitHub profile data |

### 5.3 Content Generation Tools

| Tool Name | Firebase Function | Description |
|-----------|------------------|-------------|
| `generate_content` | generateContent | General content generation |
| `enhance_job_description` | enhanceJobDescription | Improve job descriptions |
| `summarize_job` | summarizeJob | Summarize job postings |
| `process_job_requirements` | processJobRequirements | Extract job requirements |
| `process_job_requirements_v2` | processJobRequirementsV2 | Enhanced requirements extraction |
| `extract_nlp_terms` | extractNlpTerms | Extract key terms via NLP |
| `generate_linkedin_analysis` | generateLinkedinAnalysis | Analyze LinkedIn profiles |
| `create_linkedin_post` | createLinkedinPost | Generate LinkedIn posts |

### 5.4 Email & Outreach Tools

| Tool Name | Firebase Function | Description |
|-----------|------------------|-------------|
| `send_email` | sendEmail | Send individual emails |
| `send_outreach_email` | sendOutreachEmail | Send templated outreach |
| `generate_email_templates` | generateEmailTemplates | Create email templates |
| `send_campaign_email` | sendCampaignEmail | Send campaign emails |

### 5.5 Interview & Screening Tools

| Tool Name | Firebase Function | Description |
|-----------|------------------|-------------|
| `schedule_interview` | scheduleInterview | Schedule interviews |
| `generate_interview_questions` | generateInterviewQuestions | Generate interview questions |
| `prepare_interview` | prepareInterview | Create interview prep guides |

### 5.6 Document Processing Tools

| Tool Name | Firebase Function | Description |
|-----------|------------------|-------------|
| `parse_document` | parseDocument | Parse uploaded documents |
| `analyze_resume` | analyzeResume | Analyze resumes for fit |
| `process_text_extraction` | processTextExtraction | OCR and text extraction |
| `firecrawl_url` | firecrawlUrl | Scrape web pages |

### 5.7 Meeting & Recording Tools

| Tool Name | Firebase Function | Description |
|-----------|------------------|-------------|
| `create_daily_room` | createDailyRoom | Create video meeting rooms |
| `process_recording` | processRecording | Process meeting recordings |
| `transcribe_audio` | transcribeAudio | Transcribe audio files |

### 5.8 Analytics Tools

| Tool Name | Firebase Function | Description |
|-----------|------------------|-------------|
| `analyze_compensation` | analyzeCompensation | Analyze salary data |
| `generate_dashboard_metrics` | generateDashboardMetrics | Generate dashboard stats |
| `generate_clarvida_report` | generateClarvidaReport | Generate Clarvida reports |

### 5.9 Integration Tools

| Tool Name | Firebase Function | Description |
|-----------|------------------|-------------|
| `export_to_google_docs` | exportToGoogleDocs | Export to Google Docs |
| `import_from_google_docs` | importFromGoogleDocs | Import from Google Docs |
| `get_drive_folders` | getDriveFolders | List Google Drive folders |
| `share_google_doc` | shareGoogleDoc | Share Google Documents |

---

## Phase 6: Testing Strategy

### 6.1 Local Development

1. Run ADK agent locally:
```bash
cd adk-agent
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

2. Test with ADK dev UI:
```bash
adk web
```

3. Run frontend with proxy to local agent:
```bash
# In package.json, add proxy or use VITE_API_URL
npm run dev
```

### 6.2 Integration Tests

Create tests for each tool category:
- Unit tests for tool implementations
- Integration tests for Firebase function calls
- End-to-end tests for full chat workflows

### 6.3 Load Testing

- Use k6 or locust for load testing
- Target: 100 concurrent users
- Response time: < 5s for simple queries, < 30s for complex tool chains

---

## Phase 7: Monitoring & Observability

### 7.1 Cloud Run Metrics

- Request latency
- Error rates
- Memory/CPU usage
- Instance count

### 7.2 Custom Metrics

Log to Cloud Logging:
- Tool execution times
- Tool success/failure rates
- User session durations
- Most used tools

### 7.3 Alerting

Set up alerts for:
- Error rate > 5%
- P95 latency > 10s
- Memory usage > 80%

---

## Implementation Checklist

### Phase 1: Backend Setup
- [ ] Create `adk-agent/` directory structure
- [ ] Set up Python virtual environment
- [ ] Install ADK and dependencies
- [ ] Implement base tool class with Firebase auth
- [ ] Implement all 50+ tool definitions
- [ ] Create agent configuration

### Phase 2: API Server
- [ ] Set up FastAPI application
- [ ] Implement Firebase auth middleware
- [ ] Create `/api/chat` endpoint
- [ ] Add session management
- [ ] Implement Firestore persistence

### Phase 3: Deployment
- [ ] Create Dockerfile
- [ ] Set up Cloud Build
- [ ] Deploy to Cloud Run
- [ ] Update Firebase Hosting rewrites
- [ ] Configure environment variables

### Phase 4: Frontend Integration
- [ ] Update FloatingChatBot to use new API
- [ ] Add session management hook
- [ ] Test with project context
- [ ] Update error handling

### Phase 5: Testing
- [ ] Unit tests for tools
- [ ] Integration tests
- [ ] End-to-end tests
- [ ] Load testing

### Phase 6: Launch
- [ ] Deploy to production
- [ ] Monitor metrics
- [ ] Gather user feedback
- [ ] Iterate on prompts and tools

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| ADK version compatibility | Pin versions, test upgrades |
| Firebase function timeouts | Implement retries, increase timeouts |
| Cold start latency | Keep minimum instances, optimize imports |
| Cost overruns | Set budget alerts, optimize model usage |
| Security vulnerabilities | Validate all inputs, use Firebase Auth |

---

## Success Metrics

1. **User Engagement**: 50% increase in chat interactions
2. **Task Completion**: 80% of tool-based requests complete successfully
3. **Response Time**: P95 < 5s for simple queries
4. **User Satisfaction**: Net Promoter Score > 50

---

## Timeline Estimate

| Phase | Description |
|-------|-------------|
| Phase 1 | Backend setup and tool implementation |
| Phase 2 | API server and auth |
| Phase 3 | Deployment configuration |
| Phase 4 | Frontend integration |
| Phase 5 | Testing and QA |
| Phase 6 | Production launch and monitoring |

---

## User Preferences (Confirmed)

1. **Streaming**: YES - Tokens appear progressively as generated for better UX
2. **Tool Confirmation**: YES - Agent asks for confirmation before executing high-impact tools (email, scheduling)
3. **Architecture**: Single unified agent (not multi-agent)
4. **Model Selection**: Adaptive - Gemini Flash for simple queries, Pro for complex reasoning

---

## Additional Implementation: Streaming Support

### Server-Side Streaming (main.py addition)

```python
from fastapi.responses import StreamingResponse
import asyncio

@app.post("/api/chat/stream")
async def chat_stream(
    request: ChatRequest,
    user: dict = Depends(verify_firebase_token)
):
    """Streaming chat endpoint for real-time token generation."""

    async def generate():
        agent = create_agent(project_context)

        async for chunk in agent.stream(
            message=request.message,
            session_id=session_id,
            context=context
        ):
            if chunk.content:
                yield f"data: {json.dumps({'type': 'token', 'content': chunk.content})}\n\n"
            if chunk.tool_call:
                yield f"data: {json.dumps({'type': 'tool_call', 'tool': chunk.tool_call.name})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )
```

### Frontend Streaming Handler

```typescript
// In FloatingChatBot.tsx

const handleStreamingSubmit = async (input: string) => {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message: input, session_id: sessionId, project_id: selectedProjectId })
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let assistantContent = '';

  // Add empty assistant message
  const assistantMsgId = `assistant-${Date.now()}`;
  setMessages(prev => [...prev, {
    id: assistantMsgId,
    role: 'assistant',
    content: '',
    timestamp: new Date()
  }]);

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

    for (const line of lines) {
      const data = JSON.parse(line.slice(6));

      if (data.type === 'token') {
        assistantContent += data.content;
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId ? { ...m, content: assistantContent } : m
        ));
      } else if (data.type === 'tool_call') {
        // Show tool execution indicator
        toast.info(`Using tool: ${data.tool}`);
      }
    }
  }
};
```

---

## Additional Implementation: Tool Confirmation

### Confirmation Dialog Component

```typescript
// src/components/chat/ToolConfirmationDialog.tsx

interface ToolConfirmation {
  tool: string;
  description: string;
  params: Record<string, any>;
  onConfirm: () => void;
  onCancel: () => void;
}

const HIGH_IMPACT_TOOLS = [
  'send_email',
  'send_outreach_email',
  'send_campaign_email',
  'schedule_interview',
  'share_google_doc'
];

export function ToolConfirmationDialog({ tool, description, params, onConfirm, onCancel }: ToolConfirmation) {
  return (
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Action: {tool}</DialogTitle>
        </DialogHeader>
        <p>{description}</p>
        <pre className="bg-gray-100 p-2 rounded text-sm">
          {JSON.stringify(params, null, 2)}
        </pre>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Backend Confirmation Flow

```python
# Tools that require user confirmation
HIGH_IMPACT_TOOLS = {
    'send_email',
    'send_outreach_email',
    'send_campaign_email',
    'schedule_interview',
    'share_google_doc'
}

# Modified agent response includes confirmation requests
class ToolConfirmationRequest(BaseModel):
    tool_name: str
    description: str
    parameters: dict
    confirmation_id: str

@app.post("/api/chat/confirm/{confirmation_id}")
async def confirm_tool_execution(
    confirmation_id: str,
    approved: bool,
    user: dict = Depends(verify_firebase_token)
):
    """User confirms or rejects a high-impact tool execution."""
    if approved:
        # Execute the pending tool
        result = await execute_pending_tool(confirmation_id)
        return {"status": "executed", "result": result}
    else:
        return {"status": "cancelled"}
```

---

## Additional Implementation: Adaptive Model Selection

### Model Router (app/model_router.py)

```python
from enum import Enum
from typing import Tuple

class QueryComplexity(Enum):
    SIMPLE = "simple"      # Direct questions, single tool
    MODERATE = "moderate"  # 2-3 tools, some reasoning
    COMPLEX = "complex"    # Multi-step, analysis, many tools

def classify_query_complexity(message: str, history: list) -> QueryComplexity:
    """Classify query complexity to route to appropriate model."""

    # Simple heuristics (can be enhanced with ML classifier)
    complex_indicators = [
        "analyze", "compare", "evaluate", "recommend",
        "strategy", "plan", "multiple", "all", "comprehensive"
    ]

    simple_indicators = [
        "what is", "how do", "can you", "show me",
        "find", "search", "get"
    ]

    message_lower = message.lower()

    # Check for complexity indicators
    complex_count = sum(1 for ind in complex_indicators if ind in message_lower)
    simple_count = sum(1 for ind in simple_indicators if ind in message_lower)

    # Consider conversation history length
    history_factor = len(history) > 5

    if complex_count >= 2 or (complex_count >= 1 and history_factor):
        return QueryComplexity.COMPLEX
    elif simple_count >= 1 and complex_count == 0:
        return QueryComplexity.SIMPLE
    else:
        return QueryComplexity.MODERATE

def get_model_for_complexity(complexity: QueryComplexity) -> str:
    """Return appropriate model based on complexity."""
    model_map = {
        QueryComplexity.SIMPLE: "gemini-2.0-flash",
        QueryComplexity.MODERATE: "gemini-2.0-flash",
        QueryComplexity.COMPLEX: "gemini-2.5-pro"
    }
    return model_map[complexity]
```

### Updated Agent Creation

```python
def create_agent(
    project_context: dict | None = None,
    complexity: QueryComplexity = QueryComplexity.MODERATE
) -> Agent:
    """Create an ADK agent with complexity-based model selection."""

    model = get_model_for_complexity(complexity)

    return Agent(
        name="apply_codes_agent",
        model=model,
        description="Expert AI recruitment assistant",
        instruction=SYSTEM_INSTRUCTION,
        tools=ALL_TOOLS,
    )
```
