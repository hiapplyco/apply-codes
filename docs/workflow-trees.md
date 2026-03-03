# HiApply — Workflow Trees & Pipeline Documentation

> Auto-generated 2026-03-03. Documents all decision trees, state machines, and multi-step flows in the HiApply platform.

---

## Table of Contents

1. [Recruitment Orchestration Pipeline](#1-recruitment-orchestration-pipeline)
2. [Boolean Search → Candidate Pipeline (Clarvida Workflow)](#2-boolean-search--candidate-pipeline)
3. [Content Creation Flow](#3-content-creation-flow)
4. [Interview Workflow](#4-interview-workflow)
5. [MCP Chat Flow](#5-mcp-chat-flow)
6. [Contact Enrichment Waterfall](#6-contact-enrichment-waterfall)
7. [Job Posting Flow](#7-job-posting-flow)
8. [Auth & Subscription Flow](#8-auth--subscription-flow)
9. [Email Campaign Flow](#9-email-campaign-flow)
10. [Daily.co Video Meeting Pipeline](#10-dailyco-video-meeting-pipeline)

---

## 1. Recruitment Orchestration Pipeline

**Source:** `src/lib/orchestration/`, `src/types/orchestration.ts`

The orchestration system is a generic agent-based workflow engine with 5 pre-built workflow templates. Each workflow has typed steps, dependency resolution, parallel execution, and Firestore persistence.

### Architecture

```
┌─────────────────────────────────────────────────┐
│            AgentOrchestrator                     │
│  (EventEmitter, message queue, agent registry)   │
├─────────────────────────────────────────────────┤
│  Config: maxConcurrentAgents=10, timeout=5min    │
│  Agents: SourcingAgent | EnrichmentAgent |       │
│          PlanningAgent                           │
│  Storage: workflow_instances, orchestrator_metrics│
└─────────────────────────────────────────────────┘
```

### Agent Types

| Agent | Type Key | Purpose |
|-------|----------|---------|
| SourcingAgent | `sourcing` | Search candidates across platforms |
| EnrichmentAgent | `enrichment` | Enrich candidate profiles (contact, social, skills) |
| PlanningAgent | `planning` | Market analysis, strategy creation |

### Workflow Templates

#### FULL_RECRUITMENT (3 steps, sequential + parallel)
```
plan ──► source ──► enrich (parallel)
│         │          │
│         │          └─ enrichmentTypes: [contact, social, experience, skills]
│         └─ platforms: [linkedin, google_jobs, github], max: 100
└─ recruitment_plan: timeline + strategies
```

#### QUICK_SOURCE (2 steps)
```
search ──► basic-enrich (parallel)
│           │
│           └─ enrichmentTypes: [contact], no verification
└─ platforms: [linkedin, google_jobs], max: 50
```

#### DEEP_RESEARCH (3 steps, parallel fork)
```
initial-search ──┬──► full-enrich (parallel)
                 │     │
                 │     └─ [contact, experience, skills, social] + verification
                 │
                 └──► social-search (parallel)
                       │
                       └─ github, max: 20, deepSearch: true
```

#### STRATEGIC_PLANNING (3 steps, sequential)
```
market-analysis ──► strategy-plan ──► test-source
│                    │                  │
│                    │                  └─ linkedin, max: 10, testMode
│                    └─ recruitment_plan + resources + risks
└─ market analysis + competitors + salary data
```

#### BULK_ENRICHMENT (1 step)
```
batch-enrich (parallel)
│
└─ [contact, social], verification, batchSize: 50
```

### Custom Workflow Factory

`createCustomWorkflow(params)` dynamically generates workflows with optional planning → sourcing → enrichment steps.

### State Machine

```
WorkflowInstance.status:
  pending ──► running ──► completed
                 │
                 └──► failed
                 │
                 └──► cancelled (via pauseWorkflow)
                        │
                        └──► running (via resumeWorkflow)
```

---

## 2. Boolean Search → Candidate Pipeline

**Source:** `src/components/clarvida/ContextBuilder/`, `src/components/MinimalSearchForm.tsx`

This is the main search workflow. Two variants exist: **Clarvida** (enterprise, multi-step) and **Minimal** (direct search).

### Clarvida Workflow Run State Machine

```
WorkflowRunState.currentStep:
  context ──► description ──► boolean ──► search ──► complete
```

#### Step 1: Context Gathering
```
User provides:
  ├─ Scrape URL (firecrawl-url) ──► extract text
  ├─ Upload document ──► extract-document-gemini
  ├─ Perplexity search ──► perplexity-search
  ├─ Location ──► location-search
  └─ Manual text input

All → ContextItem[] → stored in WorkflowRunState.contextItems
```

#### Step 2: Job Description Generation
```
contextItems + jobTitle
  │
  ├─ extract-job-context (Gemini 3.1 Pro) ──► JobContext
  │
  └─ generate-job-description (Gemini 3.1 Pro) ──► generatedDescription
      │
      └─ optimize-job-template (Gemini 3.1 Pro) ──► ClarvidaJobTemplate
```

#### Step 3: Boolean Search Generation
```
JobContext + generatedDescription
  │
  ├─ generateSophisticatedBoolean (Gemini 3.1 Pro)
  │   │
  │   ├─ variant: strict | balanced | broad
  │   ├─ previousGenerations[] (for re-roll dedup)
  │   └─ Returns: BooleanState { current, history[], explanation }
  │
  └─ explainBoolean (optional) ──► BooleanExplanation
      │
      └─ components[], willInclude[], willExclude[], proTips[]
```

#### Step 4: Search Execution
```
Boolean string
  │
  ├─ Google CSE (via get-google-cse-key + client-side fetch)
  │   │
  │   └─ LinkedIn profiles → parsed candidates
  │
  └─ Optional: Perplexity fallback
```

#### Step 5: Enrichment (see Section 6)

### Minimal Search Flow (MinimalSearchForm.tsx)
```
User input (job title + instructions)
  │
  ├─ generateBooleanSearch (simple)
  │   OR
  └─ generateSophisticatedBoolean (advanced)
      │
      └─ Google CSE search ──► candidate list ──► enrichProfile
```

### Boolean Variant Decision Tree
```
                  ┌─ strict: Exact match, narrow results
variant ──────────┤
                  ├─ balanced: Good precision/recall tradeoff (DEFAULT)
                  │
                  └─ broad: Maximum recall, may include noise
```

---

## 3. Content Creation Flow

**Source:** `src/pages/ContentCreation.tsx`, `src/components/content/`

### Content Type Decision Tree
```
User selects content type:
  │
  ├─ LinkedIn Job Post
  ├─ Cold Outreach Email
  ├─ Job Description
  ├─ Interview Questions
  ├─ Rejection Letter
  └─ Offer Letter
```

### Generation Pipeline
```
Content Type + Context (optional)
  │
  ├─ UnifiedContentCreator path:
  │   └─ functionBridge.generateContent({
  │        prompt, type, context
  │      })
  │      │
  │      └─ generate-content.js (onCall)
  │          └─ gemini-api.js (onCall) ──► Gemini 3.1 Pro (JSON mode)
  │
  └─ ContentCreationWithGoogle path:
      └─ functionBridge.generateContent({...})
          │
          └─ Same backend pipeline
```

### Context Enrichment Options
```
Before generation, user can add context via:
  ├─ Scrape URL ──► firecrawl-url
  ├─ Upload document ──► extract-document-gemini
  ├─ AI Search ──► perplexity-search
  └─ Location data ──► location-search
```

---

## 4. Interview Workflow

**Source:** `src/pages/Meeting.tsx`, `functions/create-daily-room.js`, `functions/prepare-interview.js`

### Meeting Type Decision
```
User selects meeting type:
  │
  ├─ Interview ──► structured interview mode
  ├─ Kickoff Call ──► hiring needs assessment
  └─ General Meeting ──► open meeting
```

### Full Interview Pipeline
```
1. SETUP
   └─ create-daily-room ──► Daily.co room URL + token

2. PREPARATION (pre-interview)
   └─ prepare-interview ──► interview prep data
       ├─ generate-interview-questions ──► role-specific questions
       └─ analyze-candidate ──► candidate profile analysis

3. LIVE INTERVIEW
   ├─ initialize-daily-bot ──► AI assistant joins call
   ├─ interview-guidance-ws ──► WebSocket for real-time tips
   └─ transcribe-audio (client-side) ──► live transcription

4. POST-INTERVIEW
   ├─ process-recording ──► save recording
   ├─ MeetingDataManager.generateMeetingSummary ──► Gemini 3.1 Pro
   └─ Results saved to Firestore (meetings collection)
```

### Recording Processing Pipeline
```
Recording blob
  │
  ├─ process-recording (onCall)
  │   └─ Upload to Firebase Storage
  │
  └─ TranscriptionService (client-side)
      ├─ transcribeAudio ──► Gemini 3.1 Pro (multimodal)
      ├─ transcribeVideo ──► Gemini 3.1 Pro (multimodal)
      └─ extractKeyPoints ──► bullet point summary
```

---

## 5. MCP Chat Flow

**Source:** `functions/mcp-chat/`, `src/hooks/useMCPChat.ts`, `src/components/chat/EmbeddedChat.tsx`

### SSE Stream Architecture
```
Client (React)                    Server (Cloud Function)
    │                                    │
    ├─ POST /api/mcp-chat ──────────────►│
    │  { message, history,               │
    │    session_id, project_id }         │
    │                                    │
    │◄── SSE: session ──────────────────│ initSSE + keepalive (10s)
    │◄── SSE: text_delta ───────────────│ Gemini streaming
    │◄── SSE: tool_start ──────────────│
    │◄── SSE: tool_result ──────────────│
    │◄── SSE: pending_confirmation ─────│ (high-impact tool)
    │                                    │
    │ [User confirms/denies]             │
    │                                    │
    ├─ POST /api/mcp-chat ──────────────►│ { confirmation: { tool, approved } }
    │                                    │
    │◄── SSE: tool_result ──────────────│
    │◄── SSE: done ─────────────────────│
    │                                    │
```

### Gemini Function Calling Loop
```
orchestrate(message, history, sendEvent, options)
  │
  ├─ Load MCP tools via tool-bundler (dynamic import)
  │   └─ stripAdditionalProperties for Gemini compatibility
  │
  ├─ Build chat history + system prompt
  │
  └─ LOOP (max 5 tool calls per turn):
      │
      ├─ chat.sendMessageStream(message)
      │   │
      │   ├─ Text chunks ──► SSE text_delta events
      │   │
      │   └─ Function call ──► Check HIGH_IMPACT_TOOLS
      │       │
      │       ├─ High impact? ──► SSE pending_confirmation ──► WAIT
      │       │
      │       └─ Low impact ──► Execute tool ──► SSE tool_result
      │           │
      │           └─ Feed result back as next message ──► LOOP
      │
      └─ No more function calls ──► SSE done
```

### High-Impact Tools (Require Confirmation)
```
- send_email
- schedule_meeting
- create_job_posting
- send_outreach
```

### MCP Tool Categories
```
MCP Server Tools (11):
  ├─ Search: search_candidates, search_contacts
  ├─ Analysis: parse_resume, analyze_job_requirements, compare_documents
  ├─ Generation: generate_interview_guide, create_recruitment_plan
  ├─ Intelligence: get_market_intelligence
  ├─ Content: enhance_job_description
  └─ Communication: send_outreach_email, schedule_interview
```

---

## 6. Contact Enrichment Waterfall

**Source:** `functions/utils/enrichment-service.js`, `functions/waterfall-enrich.js`

### Waterfall Strategy
```
Input: { email?, linkedinUrl?, name?, company? }
  │
  ├─ CHECK CACHE FIRST
  │   └─ Firestore: enrichment_cache collection
  │       └─ TTL: 30 days (Timestamp comparison)
  │       └─ Cache hit? ──► Return cached data
  │
  ├─ TIER 1: Nymeria (30s timeout)
  │   ├─ enrichPerson(email/linkedin/name)
  │   ├─ Returns: email, phone, social profiles
  │   └─ Success? ──► Cache & Return
  │
  ├─ TIER 2: Hunter.io
  │   ├─ hunter-io-search (onCall)
  │   ├─ Email finder by domain + name
  │   └─ Success? ──► Cache & Return
  │
  └─ TIER 3: People Data Labs (PDL)
      ├─ pdl-search (onCall)
      ├─ Deep profile lookup
      └─ Success? ──► Cache & Return
          │
          └─ All failed? ──► Return partial/empty
```

### Usage Gating
```
Before enrichment:
  checkAndExecute('candidates_enriched', uid)
    │
    ├─ Free tier: 50 credits/month
    ├─ Pro tier: 500 credits/month
    └─ Enterprise: Unlimited
```

### Deprecated Paths (DO NOT USE)
```
✗ clearbit-enrichment.js ──► Returns 410 Gone
✗ nymeriaService.ts (frontend) ──► Removed
```

---

## 7. Job Posting Flow

**Source:** `src/pages/JobPosting.tsx`, `functions/generate-job-description.js`

### Creation Pipeline
```
User chooses input method:
  │
  ├─ SCRAPE: Paste URL
  │   └─ firecrawl-url ──► Raw HTML/text
  │       └─ extract-job-context ──► Structured JobContext
  │
  └─ MANUAL: Fill form
      └─ Title, Client, Location, Salary, Type, Level, Skills
          │
          └─ Direct to generation
```

### AI Enhancement Pipeline
```
JobContext / Manual input
  │
  ├─ enhance-job-description (Gemini 3.1 Pro)
  │   └─ Improve language, add keywords, ensure inclusivity
  │
  ├─ optimize-job-template (Gemini 3.1 Pro)
  │   └─ Structure into ClarvidaJobTemplate format
  │
  └─ generate-job-description (Gemini 3.1 Pro)
      └─ Full job description with metadata
          │
          └─ Save to Firestore: job_postings collection
```

### Job Processing V2 Pipeline
```
process-job-requirements-v2 (onCall)
  │
  ├─ Extract NLP terms ──► extract-nlp-terms
  ├─ Analyze compensation ──► analyze-compensation
  ├─ Enhance description ──► enhance-job-description
  └─ Summarize job ──► summarize-job
      │
      └─ All results aggregated ──► Dashboard metrics
```

---

## 8. Auth & Subscription Flow

**Source:** `src/context/NewAuthContext.tsx`, `functions/create-checkout-session.js`

### Authentication State Machine
```
                    ┌─────────────────┐
                    │   UNAUTHENTICATED│
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        Email/Pass     Google OAuth    Password Reset
              │              │              │
              ▼              ▼              ▼
        ┌─────────────────────────────────────┐
        │          AUTHENTICATED               │
        │  (Firebase Auth + Firestore profile) │
        └────────┬────────────────────────────┘
                 │
        ┌────────┼────────────┐
        │        │            │
      Free    Pro Trial    Pro Paid
        │        │            │
        │    7 days free      │
        │    then → Free      │
        └────────┴────────────┘
```

### Subscription Pipeline
```
Free user ──► /pricing ──► create-checkout-session ──► Stripe Checkout
  │
  └─ stripe-webhook ──► Update Firestore user doc
      ├─ subscription_status: 'active'
      ├─ plan_type: 'pro'
      └─ trial_end: Date
```

### Google Integration OAuth Flow
```
Google Calendar / Contacts:
  exchange-google-token ──► Save tokens to Firestore
  refresh-google-token ──► Refresh expired tokens
  revoke-google-token ──► Clean up on disconnect
```

---

## 9. Email Campaign Flow

**Source:** `functions/send-email.js`, `functions/send-campaign-email.js`

### Single Email
```
send-outreach-email (onCall)
  │
  ├─ Resolve candidate contact info
  │   └─ enrichProfile if no email
  │
  ├─ Generate email content (Gemini 3.1 Pro)
  │   └─ generateEmailContent(project, candidate, customText)
  │
  └─ Send via SendGrid
      └─ getSendGrid() ──► sg.send()
```

### Campaign Pipeline
```
sendCampaignEmail
  │
  ├─ Build recipient list
  │   └─ manageSubscriberList ──► Add/remove subscribers
  │
  ├─ Generate templates
  │   └─ generate-email-templates (Gemini 3.1 Pro)
  │       └─ Personalized per candidate
  │
  ├─ Send bulk
  │   └─ sendBulkEmails ──► SendGrid batch API
  │
  └─ Track analytics
      ├─ processEmailWebhook ──► SendGrid event webhooks
      ├─ getEmailEvents ──► View delivery/open/click events
      └─ getCampaignAnalytics ──► Aggregate metrics
```

### Unsubscribe Flow
```
Email link ──► handleUnsubscribe (onCall)
  │
  └─ Update Firestore: email_preferences.unsubscribed = true
```

---

## 10. Daily.co Video Meeting Pipeline

**Source:** `src/pages/Meeting.tsx`, `src/hooks/useDaily.ts`, `functions/create-daily-room.js`, `functions/get-daily-key.js`, `functions/initialize-daily-bot.js`, `functions/process-recording.js`, `functions/utils/daily.js`

### Daily Room Creation Flow

```
User opens meeting page
  │
  └─ useDaily hook ──► functionBridge.createDailyRoom({
       name, privacy, meetingType, candidateName, jobTitle
     })
       │
       └─ create-daily-room.js (onCall)
           │
           ├─ resolveDailyApiKey() ──► DAILY_API_KEY from env
           │
           ├─ sanitizeRoomProperties({
           │     privacy, enable_recording: "cloud",
           │     recording_data_outputs: [
           │       "event-json", "transcript-webvtt", "chat-webvtt"
           │     ],
           │     enable_transcription: true
           │   })
           │
           ├─ POST https://api.daily.co/v1/rooms ──► Room created
           │
           └─ generateMeetingToken(roomName, { is_owner: true })
               │
               └─ POST https://api.daily.co/v1/meeting-tokens
                   │
                   └─ Returns { room, meetingToken }
                       │
                       └─ Frontend joins with token (no raw API key exposed)
```

### Recording Processing Flow

```
Recording ends (user stops or leaves call)
  │
  └─ functionBridge.processRecording({ recordingId })
       │
       └─ process-recording.js (onCall)
           │
           ├─ resolveDailyApiKey()
           │
           ├─ GET /v1/recordings/{recordingId}
           │   └─ Recording metadata (duration, room, status)
           │
           ├─ GET /v1/recordings/{recordingId}/access-link
           │   └─ Temporary download URL
           │
           ├─ GET /v1/recordings/{recordingId}/transcript
           │   └─ Transcript data (if available)
           │
           └─ Store in Firestore: recording_analyses collection
               │
               ├─ recordingId, accessLink, transcript, duration
               ├─ analyzedAt: serverTimestamp
               └─ userId (auth context)
                   │
                   └─ Returns { success, accessLink, hasTranscript, analysis }
```

### AI Interview Coaching Flow (Pipecat Cloud)

```
Meeting starts ──► User enables AI coaching
  │
  └─ functionBridge.initializeDailyBot({ roomUrl })
       │
       └─ initialize-daily-bot.js (onCall)
           │
           ├─ resolvePipecatApiKey()
           │   │
           │   ├─ PIPECAT_API_KEY configured?
           │   │   │
           │   │   ├─ YES ──► Launch Pipecat Cloud agent
           │   │   │           │
           │   │   │           ├─ POST pipecat-cloud-api/agents
           │   │   │           │   { roomUrl, agentConfig }
           │   │   │           │
           │   │   │           └─ Agent joins room as AI participant
           │   │   │               │
           │   │   │               └─ Returns {
           │   │   │                    websocket_url, agent_id,
           │   │   │                    status: 'started'
           │   │   │                  }
           │   │   │
           │   │   └─ NO ──► Returns {
           │   │                status: 'not_configured',
           │   │                message: 'PIPECAT_API_KEY not set'
           │   │              }
           │   │
           └───┘
```

### Key Architecture Notes

- **Meeting tokens** replace raw `DAILY_API_KEY` exposure — scoped per room, time-limited
- **Rooms auto-enable** recording outputs: `event-json`, `transcript-webvtt`, `chat-webvtt`
- **Pipecat Cloud** replaces deprecated Daily Bots — requires `PIPECAT_API_KEY` env var
- **Shared utility** `functions/utils/daily.js` centralizes API helpers, token generation, and key resolution

---

## Gemini Model Usage Map

All AI calls now use `gemini-3.1-pro-preview` (upgraded 2026-03-03):

| Function | Model | Mode |
|----------|-------|------|
| `utils/gemini.js` (default) | `gemini-3.1-pro-preview` | Text / JSON |
| `chat-service.ts` | `gemini-3.1-pro-preview` | Chat (client-side) |
| `transcriptionService.ts` | `gemini-3.1-pro-preview` | Multimodal audio/video |
| `MeetingDataManager.tsx` | `gemini-3.1-pro-preview` | Meeting summary |
| `gemini-orchestrator.js` | `gemini-3.1-pro-preview` | Function calling + streaming |
| `generate-clarvida-marketing-image.js` | `gemini-3-pro-image-preview` | Image generation |
| `gemini-image.ts` | `gemini-2.5-flash-preview-05-20` | Nano banana image gen |

---

## Cloud Functions Inventory (74 deployed)

### AI / Generation (12)
| Function | Type | Auth | Purpose |
|----------|------|------|---------|
| `generateBooleanSearch` | onCall | Yes | Simple boolean string |
| `generateSophisticatedBoolean` | onCall | Yes | Advanced boolean with explanation |
| `generateContent` | onCall | Yes | Generic AI content generation |
| `generateJobDescription` | onCall | Yes | AI job descriptions |
| `generateEmailTemplates` | onCall | Yes | Personalized email drafts |
| `generateInterviewQuestions` | onCall | Yes | Role-specific interview Qs |
| `generateLinkedinAnalysis` | onCall | Yes | LinkedIn profile analysis |
| `generateClarvidaReport` | onCall | Yes | Clarvida assessment report |
| `generateClarvidaMarketingImage` | onCall | Yes | AI marketing images |
| `geminiApi` | onCall | Yes | Generic structured Gemini calls |
| `enhanceJobDescription` | onCall | Yes | AI job description enhancement |
| `chatAssistant` | onCall | Yes | AI chat responses |

### Search & Enrichment (8)
| Function | Type | Auth | Purpose |
|----------|------|------|---------|
| `enrichProfile` | onCall | Yes | Waterfall enrichment |
| `waterfallEnrich` | onCall | Yes | Direct waterfall call |
| `searchContacts` | onCall | Yes | Nymeria contact search |
| `getContactInfo` | onCall | Yes | Single contact lookup |
| `hunterIoSearch` | onCall | Yes | Hunter.io email finder |
| `pdlSearch` | onCall | Yes | People Data Labs |
| `perplexitySearch` | onCall | Yes | Web research |
| `locationSearch` | onCall | Yes | Location autocomplete |

### Document Processing (5)
| Function | Type | Auth | Purpose |
|----------|------|------|---------|
| `extractDocumentGemini` | onCall | Yes | AI document extraction |
| `processTextExtraction` | onRequest | CORS | Text extraction pipeline |
| `parseDocument` | onRequest | CORS | Document parsing |
| `analyzeResume` | onRequest | CORS | Resume analysis |
| `firecrawlUrl` | onCall | Yes | URL scraping |

### Job Processing (5)
| Function | Type | Auth | Purpose |
|----------|------|------|---------|
| `processJobRequirements` | onCall | Yes | V1 job processing |
| `processJobRequirementsV2` | onCall | Yes | V2 multi-agent pipeline |
| `extractJobContext` | onCall | Yes | Extract structured context |
| `optimizeJobTemplate` | onCall | Yes | Optimize job template |
| `summarizeJob` | onCall | Yes | Job summary generation |

### Communication (8)
| Function | Type | Auth | Purpose |
|----------|------|------|---------|
| `sendOutreachEmail` | onCall | Yes | AI-powered outreach |
| `sendEmail` | onCall | Yes | Generic email |
| `sendBulkEmails` | onCall | Yes | Batch email sending |
| `sendTemplatedEmail` | onCall | Yes | Template-based email |
| `sendCampaignEmail` | onCall | Yes | Campaign management |
| `manageSubscriberList` | onCall | Yes | Subscriber CRUD |
| `handleUnsubscribe` | onCall | Yes | Unsubscribe handling |
| `getCampaignAnalytics` | onCall | Yes | Email analytics |

### Interview / Meeting (6)
| Function | Type | Auth | Purpose |
|----------|------|------|---------|
| `createDailyRoom` | onCall | Yes | Create Daily room with recording outputs, transcription, and scoped meeting token |
| `getDailyKey` | onCall | Yes | Generate scoped meeting token for a room (no raw API key) |
| `initializeDailyBot` | onCall | Yes | Launch Pipecat Cloud agent into Daily room (requires PIPECAT_API_KEY) |
| `interviewGuidanceWs` | onCall | Yes | WebSocket guidance |
| `prepareInterview` | onCall | Yes | Interview preparation |
| `processRecording` | onCall | Yes | Fetch recording details, access link, and transcript from Daily API; store in `recording_analyses` |
| `scheduleInterview` | onCall | Yes | Calendar scheduling |

### Auth & Integration (6)
| Function | Type | Auth | Purpose |
|----------|------|------|---------|
| `exchangeGoogleToken` | onCall | Yes | Google OAuth exchange |
| `refreshGoogleToken` | onCall | Yes | Token refresh |
| `revokeGoogleToken` | onCall | Yes | Token revocation |
| `getGeminiKey` | onCall | Yes | Get API key securely |
| `getGoogleCseKey` | onCall | Yes | Get CSE key securely |
| `linkedinSearch` | onCall | Yes | LinkedIn search |

### Payments (3)
| Function | Type | Auth | Purpose |
|----------|------|------|---------|
| `createCheckoutSession` | onCall | Yes | Stripe checkout |
| `createPortalSession` | onCall | Yes | Stripe portal |
| `stripeWebhook` | onRequest | Webhook | Stripe events |

### Admin & Utility (5)
| Function | Type | Auth | Purpose |
|----------|------|------|---------|
| `adminGrantPro` | onCall | Yes | Admin pro access |
| `grantProAccess` | onCall | Yes | Grant pro access |
| `getProjects` | onCall | Yes | List user projects |
| `testOrchestration` | onCall | Yes | Test orchestration |
| `healthCheck` | onRequest | None | Health endpoint |

### Streaming (1)
| Function | Type | Auth | Purpose |
|----------|------|------|---------|
| `mcpChatStream` | onRequest | Bearer | MCP chat SSE stream |

### NLP & Analysis (3)
| Function | Type | Auth | Purpose |
|----------|------|------|---------|
| `extractNlpTerms` | onCall | Yes | NLP term extraction |
| `analyzeCompensation` | onCall | Yes | Salary analysis |
| `analyzeCandidate` | onCall | Yes | Candidate scoring |

### Email Webhooks (3)
| Function | Type | Auth | Purpose |
|----------|------|------|---------|
| `processEmailWebhook` | onCall | Yes | SendGrid webhook |
| `getEmailEvents` | onCall | Yes | Email event history |
| `getEmailAnalytics` | onCall | Yes | Email metrics |

### Subscription (2)
| Function | Type | Auth | Purpose |
|----------|------|------|---------|
| `checkTrialExpirations` | scheduled | N/A | Trial expiry check |
| `sendSubscriptionNotification` | onCall | Yes | Sub notifications |

### Deprecated (2, still in index.js)
| Function | Status | Notes |
|----------|--------|-------|
| `clearbitEnrichment` | 410 Gone | Returns deprecation notice |
| `transcribeAudio` | Active | Uses external API |

### Disabled (3, commented out in index.js)
| Function | Reason |
|----------|--------|
| `handleInterview` | Needs Supabase removal |
| `githubProfile` | Needs Supabase removal |
| `generateDashboardMetrics` | Needs Supabase removal |
