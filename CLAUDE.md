# Apply (Blind Nut) - AI Assistant Guide

## Quick Start

**Apply** is an AI-driven recruitment platform that helps recruiters find qualified candidates through intelligent search, boolean query generation, and candidate enrichment.

**Primary Directive**: Provide concise development assistance for AI-powered recruitment features, focusing on code quality, security, and user experience.

## 🔗 Claude Code Hooks & Automation

**Claude Code Hooks** provide deterministic automation by executing shell commands at specific workflow points, moving repetitive tasks from prompts to app-level enforcement.

### Hook Configuration (`.claude/settings.json`)

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "npm run lint:fix",
            "timeout": 30
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command", 
            "command": "echo 'Running: $CLAUDE_TOOL_ARGS' >> .claude/execution.log"
          }
        ]
      }
    ]
  }
}
```

### Essential Hooks for Apply

#### Auto-Format & Quality
```json
"PostToolUse": [
  {
    "matcher": "Write|Edit|MultiEdit",
    "hooks": [
      {
        "type": "command",
        "command": "npm run lint:fix && npm run typecheck"
      }
    ]
  }
]
```

#### Security Validation
```json
"PreToolUse": [
  {
    "matcher": "Write.*\\.env|Edit.*\\.env",
    "hooks": [
      {
        "type": "command",
        "command": "echo 'WARNING: Editing environment file' && read -p 'Continue? (y/N): ' confirm && [[ $confirm == [yY] ]]"
      }
    ]
  }
]
```

#### Build Validation
```json
"PostToolUse": [
  {
    "matcher": ".*",
    "hooks": [
      {
        "type": "command",
        "command": "if [[ -f package.json ]]; then npm run build --if-present; fi"
      }
    ]
  }
]
```

### Hook Events Reference

| Event | Trigger | Use Case |
|-------|---------|----------|
| `PreToolUse` | Before tool execution | Validation, logging, permissions |
| `PostToolUse` | After tool completion | Formatting, testing, notifications |
| `Notification` | Claude sends notification | Custom alerts, external integrations |
| `Stop` | Main agent finishes | Cleanup, reporting, deployment |
| `SubagentStop` | Task tool completes | Subtask tracking, progress updates |

### Hook Security & Best Practices

- **Exit Code 0**: Success (output shown to user)
- **Exit Code 2**: Blocking error (stderr fed back to Claude)
- **Other codes**: Non-blocking error (execution continues)
- **Always validate**: Hooks run with full user permissions
- **Test thoroughly**: No confirmation prompts for hook execution

## 📋 Context Management & Session Optimization

### CLAUDE.md Best Practices

**Keep It Minimal**: Only essential project-wide patterns and commands. Avoid overwhelming Claude with too many rules.

**Modular Documentation**: Break complex information into separate files:
```bash
# Project structure
├── CLAUDE.md              # Core guidance (this file)  
├── .claude/
│   ├── commands/           # Custom slash commands
│   ├── architecture.md     # System architecture details
│   ├── api-patterns.md     # API conventions and patterns
│   └── settings.json       # Hooks and configuration
```

### Session Management Tips

#### Context Loading Strategy
```bash
# Start of session: Read only what's needed
Read: CLAUDE.md                    # Always first
Read: src/types/domains/           # Type definitions
Task: "Analyze current task scope" # Determine additional context needs

# Load context incrementally as needed
# Don't preload everything - let Claude request specific files
```

#### Strategic Use of /compact
- **Use when**: Context exceeds 50k tokens or conversation becomes sluggish
- **Don't use**: For every conversation - only when context is bloated
- **Before compacting**: Ensure all important context is saved to files

#### Breaking Down Complex Tasks
```bash
# For tasks > 1 day of work, use plan mode
1. Switch to plan mode for architectural planning
2. Break into 8-hour discrete chunks with clear acceptance criteria  
3. Save plan to TODO.md file
4. Execute one chunk at a time with /clear between chunks
5. Reference TODO.md for context continuity
```

### Token Optimization Patterns

#### File Reference Strategy
```bash
# Prefer specific file references over bulk reads
@src/components/SearchInterface.tsx  # Specific component
@src/types/domains/candidate.ts      # Specific types

# Avoid reading entire directories unless necessary
# Let Claude request additional files as needed
```

#### Prompt Reuse System
```bash
# Maintain a prompt notebook for repeated operations
# Store in external notepad, copy/paste into Claude

# Common patterns:
"Read all files related to [feature] before making changes"
"Run quality checks: typecheck, lint, build, test" 
"Update TODO.md with progress and next steps"
```

## 🎯 Community-Proven Workflow Patterns

### The "Junior Developer" Management Approach

**Treat Claude like a skilled junior developer** - provide clear guidance, check work, and adapt to its strengths/weaknesses:

```bash
# 1. Clear Task Definition
"Implement user authentication using Supabase. 
Read: src/auth/, src/components/AuthForm.tsx
Check existing patterns before implementing."

# 2. Incremental Development
"Start with basic email auth, then add Google OAuth"
# Wait for completion, review, then continue

# 3. Continuous Validation  
"Run tests after each change. If any fail, fix immediately."
```

### Adaptive CLAUDE.md Evolution

**Organic Growth Strategy** - Let your CLAUDE.md file evolve based on real issues:

```bash
# 1. Start minimal - only core project info
# 2. When Claude makes mistakes, add specific directives
# 3. Periodically clean up outdated rules
# 4. Keep under 1000 lines for optimal performance
```

### The 3-Tier Documentation System

#### Foundation Tier (CLAUDE.md)
- Project overview and core patterns
- Quality commands and git workflow
- Essential hooks and automation

#### Component Tier (.claude/ directory)
```bash
├── .claude/
│   ├── architecture.md     # System design patterns
│   ├── api-patterns.md     # API conventions
│   ├── testing-guide.md    # Testing strategies
│   └── deployment.md       # Deploy procedures
```

#### Feature Tier (inline comments)
- Implementation-specific details
- Complex business logic explanations
- Temporary notes for active development

### Multi-Agent Coordination Patterns

#### Parallel Research Workflow
```bash
# Launch multiple agents for comprehensive analysis
Task: "Security audit" | "Performance analysis" | "Code review"
  prompt="1) Check for vulnerabilities 2) Identify bottlenecks 3) Review code quality"

# Consolidate findings
"Summarize findings from all three audits and prioritize issues"
```

#### Specialized Sub-Agent Pattern
```bash
# Database Agent
Task: "Database optimization"
  prompt="Focus only on: query performance, index usage, schema efficiency"

# Frontend Agent  
Task: "UI/UX improvements"
  prompt="Focus only on: component reusability, accessibility, responsive design"

# Security Agent
Task: "Security hardening" 
  prompt="Focus only on: input validation, auth flows, data protection"
```

## 🤖 AI Assistant Tools & Workflows

### Todo Management (ALWAYS USE)

**Start Every Session**:
```bash
# Read existing todos
TodoRead

# Create comprehensive task list
TodoWrite: [
  {"content": "Understand user requirements", "status": "in_progress", "priority": "high"},
  {"content": "Research existing implementations", "status": "pending", "priority": "high"},
  {"content": "Design solution architecture", "status": "pending", "priority": "medium"},
  {"content": "Implement core functionality", "status": "pending", "priority": "high"},
  {"content": "Write tests", "status": "pending", "priority": "medium"},
  {"content": "Run quality checks", "status": "pending", "priority": "high"}
]
```

**Update Progress Continuously**:
- Mark tasks `in_progress` BEFORE starting
- Mark `completed` IMMEDIATELY after finishing
- Only ONE task `in_progress` at a time
- Add new todos as you discover subtasks

### Task Agent Patterns

#### 1. Research & Analysis
```bash
# Find all implementations of a feature
Task: "Find boolean search implementations" 
  prompt="Search for all files containing boolean search logic, list patterns used, and analyze effectiveness"

# Analyze codebase structure
Task: "Map authentication flow"
  prompt="Trace the complete auth flow from login to protected routes, document all components involved"

# Review API usage
Task: "Audit Nymeria API calls"
  prompt="Find all Nymeria API usage, check for rate limiting, error handling, and optimization opportunities"
```

#### 2. Parallel Development
```bash
# Execute multiple independent tasks
Task: "Update UI components" | "Fix TypeScript errors" | "Add loading states"
  prompt="Complete these tasks in parallel: 1) Update tooltip styles 2) Fix TS errors in types/ 3) Add loading to buttons"

# Batch similar operations
Task: "Update all edge functions" | "Check all API keys" | "Validate env vars"
  prompt="Parallel check: Update Gemini model in all functions, verify API keys are set, validate .env.local"
```

#### 3. Complex Feature Implementation
```bash
# Break down large features
Task: "Design bulk operations architecture"
  prompt="Create detailed architecture for bulk candidate operations including UI, API, and database design"

Task: "Implement bulk selection UI"
  prompt="Build checkbox selection system for candidate cards with select all/none functionality"

Task: "Create bulk API endpoints"
  prompt="Implement Supabase edge functions for bulk update, delete, and export operations"

Task: "Add progress tracking"
  prompt="Implement real-time progress updates for bulk operations using websockets or polling"
```

#### 4. Testing & Quality Assurance
```bash
# Comprehensive testing
Task: "Test authentication flows"
  prompt="Test all auth methods (email, Google, phone), including edge cases like expired tokens"

Task: "Performance audit"
  prompt="Analyze bundle size, identify large dependencies, suggest code splitting opportunities"

Task: "Security review"
  prompt="Check for exposed API keys, validate input sanitization, review CORS policies"
```

### MCP Tools Integration

#### VS Code Diagnostics
```bash
# Check for errors across codebase
mcp__ide__getDiagnostics

# Check specific file
mcp__ide__getDiagnostics: {"uri": "file:///path/to/file.tsx"}
```

#### Jupyter Execution (for data analysis)
```bash
# Execute analysis code
mcp__ide__executeCode: {
  "code": "import pandas as pd\n# Analyze search patterns\ndf = pd.read_csv('search_history.csv')\nprint(df.groupby('query_type').count())"
}
```

### Efficient Tool Combinations

#### Feature Development Flow
```bash
# 1. Create todo list
TodoWrite: [
  {"content": "Research existing patterns", "priority": "high"},
  {"content": "Design component architecture", "priority": "high"},
  {"content": "Implement with tests", "priority": "high"},
  {"content": "Update documentation", "priority": "medium"}
]

# 2. Research phase (parallel)
Task: "Find similar components" | "Review design system" | "Check API docs"

# 3. Get diagnostics before starting
mcp__ide__getDiagnostics

# 4. Implementation with continuous todo updates
# Mark each todo in_progress → completed as you work
```

#### Bug Investigation Flow
```bash
# 1. Immediate analysis
Task: "Reproduce bug"
  prompt="Using error: [error], reproduce issue and identify root cause"

# 2. Search for related code
Grep: "error message or function name"
Task: "Find error source" prompt="Trace error through call stack"

# 3. Fix with verification
TodoWrite: [
  {"content": "Write failing test", "priority": "high"},
  {"content": "Implement fix", "priority": "high"},
  {"content": "Verify all tests pass", "priority": "high"}
]
```

#### Code Review Flow
```bash
# Parallel quality checks
Task: "Review imports" | "Check types" | "Validate security"
  prompt="1) Find unused imports 2) Check any types 3) Look for exposed secrets"

# Get all diagnostics
mcp__ide__getDiagnostics

# Run quality commands
Bash: "npm run typecheck && npm run lint && npm run test"
```

## Project Essentials

### Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **AI**: Google Gemini 2.5 Flash (gemini-2.5-flash)
- **Video**: Daily.co (video conferencing API)
- **Deployment**: Vercel (Frontend), Supabase (Backend)

### Key Features
- 🤖 AI-powered boolean search generation
- 🔍 Contact enrichment (Nymeria API)
- 💬 AI chat assistant
- 📁 Project management for candidates
- 📊 Analytics and reporting
- 🎯 Multi-platform search
- 🎥 Video meetings with Daily.co integration
- 🎤 Real-time interview guidance with AI tips
- 📈 Live competency tracking during interviews
- 🔊 Real-time transcription with speaker identification

### URLs & IDs
- **Production**: https://www.apply.codes
- **Supabase**: `kxghaajojntkqrmvsngn`
- **Vercel Project**: `prj_Ix96cndRDQHgrZty2RIFbDkO54Zp`
- **Google OAuth Client**: `1049016281061-p9fpgnd9tks77nehfdk6qb82fhd3461s.apps.googleusercontent.com`

## Development Setup

```bash
# Clone and install
git clone https://github.com/hiapplyco/apply-codes.git
cd apply-codes
npm install

# Environment variables (.env.local)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_NYMERIA_API_KEY=your_nymeria_api_key

# Common commands
npm run dev          # Start dev server
npm run build        # Build production
npm run lint         # Run linter
npm run typecheck    # Check types
npm test             # Run tests
```

### Reference Repository (blind-nut-70)

**Setup Reference Access:**
```bash
# Add reference repository for visualization features
git remote add reference https://github.com/hiapplyco/blind-nut-70.git
git fetch reference

# View reference branches
git branch -r | grep reference
```

**When referencing blind-nut-70:**
Use these commands to access the reference codebase without affecting current work:

```bash
# View files from reference repo
git show reference/main:path/to/file.js

# Create exploration branch (safe)
git checkout -b reference-exploration reference/main

# Compare implementations
git diff HEAD reference/main -- path/to/file.js

# Cherry-pick specific commits if needed
git cherry-pick <commit-hash-from-reference>
```

**Key Reference Features:**
- **Recruitment Intelligence Dashboard** - AI-powered candidate sourcing analytics
- **Gemini-based Visualizations** - Interactive charts and metrics
- **Post Creation Analytics** - Job posting optimization insights
- **Candidate Scoring Visualizations** - Advanced recruiting metrics

## Architecture Overview

```
apply-codes/
├── src/
│   ├── components/      # React components
│   │   └── video/      # Daily.co video components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript types
│   │   └── domains/    # Domain-specific types
│   ├── lib/            # Utilities and helpers
│   │   └── dailySingleton.ts # Daily.co singleton manager
│   └── test/           # Test utilities
├── supabase/
│   ├── functions/      # 35+ Edge functions
│   └── migrations/     # Database migrations
└── docs/               # Documentation
```

## Development Workflows

### New Feature Workflow
```bash
# 1. Setup todos
TodoWrite: [
  {"content": "Analyze requirements", "priority": "high"},
  {"content": "Research existing code", "priority": "high"},
  {"content": "Design architecture", "priority": "high"},
  {"content": "Implement feature", "priority": "high"},
  {"content": "Write tests", "priority": "medium"},
  {"content": "Update docs", "priority": "low"}
]

# 2. Parallel research
Task: "Find patterns" | "Check APIs" | "Review types"

# 3. Check diagnostics
mcp__ide__getDiagnostics

# 4. Implement with TDD
# Update todos as you progress!
```

### Bug Fix Workflow
```bash
# 1. Immediate response
TodoRead  # Check existing todos
Task: "Reproduce issue" prompt="[paste error/screenshot details]"

# 2. Investigation
Task: "Find root cause" prompt="Trace error: [details]"
Grep: "error message"

# 3. Fix with todos
TodoWrite: [
  {"content": "Write failing test", "priority": "high"},
  {"content": "Fix bug", "priority": "high"},
  {"content": "Verify fix", "priority": "high"}
]
```

### Code Quality Workflow
```bash
# Parallel quality checks
Task: "Lint check" | "Type check" | "Test coverage"
  prompt="Run all quality checks and report issues"

# Get diagnostics
mcp__ide__getDiagnostics

# Fix issues in parallel
Task: "Fix lint errors" | "Fix type errors" | "Add missing tests"
```

## Core Components & Patterns

### UI Framework
- **Brutalist Design**: Bold borders, shadows, purple/green accents
- **Component Pattern**: Atomic design (atoms → molecules → organisms)
- **State Management**: Local state, Context API, Tanstack Query, URL state

### Key Components
1. **PlatformCarousel** - Landing page preview carousel
2. **SidebarNew** - Navigation with mobile drawer
3. **AuthForm** - Multi-provider authentication
4. **SearchInterface** - Boolean search generation
5. **ProfileCard** - Candidate display with enrichment

### Styling Patterns
```css
/* Brutalist style */
border-2 border-black
shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
hover:scale-105

/* Purple primary, green accent */
bg-purple-600 text-white
bg-green-400/20
```

## Authentication System

### Supabase Auth Setup
- Email/password, Google OAuth, Phone OTP
- Protected routes with `<ProtectedRoute>`
- Row Level Security (RLS) on all tables

### Critical Configuration
```
Supabase Dashboard:
- Site URL: https://www.apply.codes
- Redirect URLs: https://*.apply.codes/*
- Email sender: "Apply Team" (not "blind nut")
- Logo URL: /storage/v1/object/public/logos/APPLYFullwordlogo2025.png
```

## AI Agent System

### Current Agents
- **BooleanSearchAgent** - Generate search strings
- **RecruitmentAgent** - Candidate search/evaluation
- **CompensationAgent** - Salary benchmarking
- **ProfileEnrichmentAgent** - Contact enrichment
- **ChatAssistant** - Context-aware AI copilot

### Edge Functions (35+)
- `process-job-requirements`
- `explain-boolean`
- `analyze-compensation`
- `enhance-job-description`
- `search-contacts`
- `chat-assistant`
- `create-daily-room` - Creates Daily.co meeting rooms
- `interview-guidance-ws` - WebSocket for real-time interview AI assistance

## Integrations

### Active Integrations
1. **Nymeria API** - Contact enrichment (implemented)
2. **Google Gemini** - All AI operations
3. **SendGrid** - Email delivery (partial)
4. **Daily.co** - Video conferencing (implemented)

### Planned Integrations
See `/docs/integrations/integrations-prd.md` for comprehensive roadmap:
- People Data Labs, Hunter.io, GitHub API
- ATS Hub (Lever, Greenhouse, Rippling)
- Gemini Research Agent

## Deployment & Operations

### Frontend (Vercel)
```bash
# Automatic deployment on push to main
git push origin main

# Manual deployment
vercel --prod
```

### Edge Functions (Supabase)
```bash
# Link to project (no Docker required)
supabase link --project-ref kxghaajojntkqrmvsngn

# View logs and manage functions
supabase functions list
supabase functions logs function-name

# Deploy via Dashboard (recommended)
# Navigate to Supabase Dashboard > Functions
```

## Troubleshooting

### Common Issues

**File Upload Failures**
```bash
Task: "Debug file upload" prompt="Check env vars, network tab, and edge function logs for upload issues"
```

**Auth Issues**
```bash
Task: "Fix auth issue" prompt="Verify Supabase config: Site URL, redirect URLs, email templates"
```

**Edge Function Deployment**
```bash
Task: "Deploy edge function" prompt="Use Supabase Dashboard to deploy [function-name] without Docker"
```

**CORS Errors**
```bash
Task: "Fix CORS" prompt="Add proper CORS headers to edge function and handle OPTIONS"
```

**Daily.co Video Meeting Issues**
```bash
# Duplicate Daily instance errors
Task: "Fix duplicate Daily instance" prompt="Implement singleton pattern in src/lib/dailySingleton.ts"

# Video not displaying
Task: "Debug video display" prompt="Check if frame.join() is called after loading, verify container styling"

# Meeting room creation failures
Task: "Debug room creation" prompt="Check create-daily-room edge function logs, verify Daily.co API key"
```

## Key Guidelines

### Code Standards
- TypeScript strict mode enabled
- Functional React components
- Absolute imports with @ alias
- One component per file
- No comments unless essential

### Security
- Never commit API keys
- Validate all inputs
- Use environment variables
- Implement RLS policies
- HTTPS only

### Performance
- Lazy load components
- Optimize images (WebP)
- Monitor bundle size (<500KB chunks)
- Cache API responses
- Index database queries

### Git Workflow
- Branch: `feature/*`, `fix/*`, `refactor/*`
- Conventional commits
- PR requires review
- Update docs with changes

## Quick Reference

### Database Schema (Enterprise-Grade, Normalized)

#### Core Entity Tables

**`profiles`** - Enhanced user profiles with complete authentication support
- `id` (uuid, PK) - References auth.users(id) with CASCADE delete
- `full_name` (text, NOT NULL, default '') - User display name (never null)
- `avatar_url` (text) - Profile image URL
- `phone_number` (text) - Contact phone number
- `created_at` (timestamptz, default NOW()) - Account creation
- `updated_at` (timestamptz, default NOW()) - Auto-updated on changes
- **Features**: Automatic profile creation trigger, RLS policies, updated_at trigger

**`companies`** - Canonical company entities with normalization
- `id` (uuid, PK, default gen_random_uuid()) - Company unique identifier
- `canonical_name` (text, NOT NULL, UNIQUE) - Primary normalized company name
- `aliases` (text[], default '{}') - Alternative names and variations
- `domain` (text) - Primary company domain for validation
- `industry` (text) - Industry classification
- `linkedin_url` (text) - Company LinkedIn profile
- `created_at` (timestamptz, default NOW()) - Record creation
- `updated_at` (timestamptz, default NOW()) - Auto-updated on changes
- **Features**: Full-text search index, alias support, immutable search functions

**`locations`** - Structured location entities with geographic data
- `id` (uuid, PK, default gen_random_uuid()) - Location unique identifier
- `canonical_name` (text, NOT NULL, UNIQUE) - Full normalized location string
- `city` (text, NOT NULL) - City name
- `state` (text) - State/province
- `country` (text, NOT NULL, default 'United States') - Country name
- `aliases` (text[], default '{}') - Alternative location formats
- `coordinates` (point) - Geographic coordinates for mapping
- `created_at` (timestamptz, default NOW()) - Record creation
- `updated_at` (timestamptz, default NOW()) - Auto-updated on changes
- **Features**: GIST spatial index, structured parsing, alias support

**`saved_candidates`** - Enhanced candidate profiles with full normalization
- `id` (bigint, PK) - Candidate unique identifier
- `user_id` (uuid, FK to profiles, NOT NULL) - Owner of the candidate
- `name` (text) - Candidate full name
- `job_title` (text) - Current job title
- `company` (text) - Original company string (preserved)
- `location` (text) - Original location string (preserved)
- `company_id` (uuid, FK to companies) - **NEW**: Normalized company reference
- `location_id` (uuid, FK to locations) - **NEW**: Normalized location reference
- `experience_years` (integer) - **NEW**: Extracted years of experience
- `seniority_level` (text) - **NEW**: Categorized seniority (Junior/Mid/Senior/Lead/Executive)
- `enrichment_status` (text, default 'pending') - **NEW**: Enrichment process status
- `canonical_linkedin_url` (text) - **NEW**: Normalized LinkedIn URL
- `last_enrichment` (timestamptz) - **NEW**: Last enrichment timestamp
- `linkedin_url` (text) - LinkedIn profile URL
- `work_email` (text) - Primary work email
- `personal_emails` (text[]) - Additional email addresses
- `mobile_phone` (text) - Contact phone number
- `skills` (text[]) - Array of skills and technologies
- `profile_summary` (text) - Candidate bio/summary
- `notes` (text) - Recruiter private notes
- `status` (text) - Pipeline status
- `tags` (text[]) - Categorization tags
- `created_at` (timestamptz, default NOW()) - Record creation
- `updated_at` (timestamptz, default NOW()) - Last update
- **Features**: Compound indexes, full-text search, normalization support

#### Supporting Tables

**`projects`** - Project and job management
- `id` (uuid, PK) - Project unique identifier
- `user_id` (uuid, FK to profiles) - Project owner
- `name` (text) - Project name
- `description` (text) - Project description
- `status` (text) - Project status
- `candidates_count` (integer) - Cached candidate count
- `created_at` (timestamptz) - Project creation
- `updated_at` (timestamptz) - Last update

**`project_candidates`** - Many-to-many project/candidate relationships
- `project_id` (uuid, FK to projects) - Project reference
- `candidate_id` (bigint, FK to saved_candidates) - Candidate reference
- `added_at` (timestamptz, default NOW()) - When candidate was added
- **Primary Key**: (project_id, candidate_id)

**`search_history`** - Search tracking and analytics
- `id` (uuid, PK) - Search unique identifier
- `user_id` (uuid, FK to profiles) - User who performed search
- `query` (text) - Search query/boolean string
- `platform` (text) - Search platform used
- `results_count` (integer) - Number of results returned
- `filters_applied` (jsonb) - Search filters used
- `is_favorite` (boolean, default false) - Saved search flag
- `created_at` (timestamptz) - Search timestamp

**`agent_outputs`** - AI agent results and intelligent caching
- `id` (uuid, PK) - Output unique identifier
- `user_id` (uuid, FK to profiles) - User who triggered agent
- `agent_type` (text) - Type of agent (boolean, compensation, etc.)
- `input_data` (jsonb) - Agent input parameters
- `output_data` (jsonb) - Agent response data
- `status` (text) - Processing status
- `created_at` (timestamptz) - Agent execution time

#### Advanced Performance Features

**Full-Text Search with Immutable Functions:**
```sql
-- Companies search function
CREATE FUNCTION companies_search_text(canonical_name TEXT, aliases TEXT[])
RETURNS TEXT LANGUAGE SQL IMMUTABLE

-- Locations search function  
CREATE FUNCTION locations_search_text(canonical_name TEXT, city TEXT, state TEXT, country TEXT)
RETURNS TEXT LANGUAGE SQL IMMUTABLE

-- Candidates enhanced search function
CREATE FUNCTION candidates_search_text(name TEXT, job_title TEXT, company TEXT, location TEXT, skills_array TEXT[])
RETURNS TEXT LANGUAGE SQL IMMUTABLE
```

**High-Performance Indexes:**
- `idx_companies_fulltext` - GIN index with immutable search function
- `idx_locations_fulltext` - GIN index with geographic text search
- `idx_candidates_enhanced_fulltext` - GIN index for candidate search
- `idx_candidates_compound_location_experience` - Multi-column optimization
- `idx_candidates_compound_company_seniority` - Company+seniority queries
- `idx_candidates_search_compound` - User+status+date compound index

**Data Normalization Functions:**
```sql
-- Find or create company with domain validation
find_or_create_company(company_name TEXT, company_domain TEXT, company_industry TEXT)

-- Parse and normalize location strings
find_or_create_location(location_string TEXT)

-- Extract experience from job titles and descriptions
extract_experience_years(job_title TEXT, profile_summary TEXT)

-- Determine seniority level from experience and title
determine_seniority_level(experience_years INTEGER, job_title TEXT)
```

**Analytics Views:**
- `candidate_search_view` - Optimized candidate search with normalized data
- `project_analytics_view` - Aggregated project performance metrics
- `user_stats_materialized` - Pre-computed user statistics (refreshed daily)

**Row Level Security (RLS):**
- All user tables: Users can only access their own data
- Company/location tables: Globally readable by authenticated users
- Profiles table: Restricted to own profile with comprehensive policies
- Auto-triggered profile creation for new users

#### Migration and Data Quality

**Data Migration Strategy:**
- `DataMigrationManager` class for batch processing with progress tracking
- `MigrationValidator` for data quality verification
- Defensive SQL with column existence checks
- Batch processing with configurable delays and error handling
- Dry-run capabilities for safe testing

**Quality Assurance:**
- Immutable functions prevent PostgreSQL index creation errors
- Comprehensive validation of normalized entities
- Duplicate detection and prevention
- Progress tracking and error reporting
- Rollback capabilities for failed migrations

**Performance Monitoring:**
- `analyze_query_performance()` - Query performance analysis
- `get_index_usage()` - Index effectiveness monitoring  
- `update_table_statistics()` - Automated maintenance function
- Materialized view refresh automation

This normalized, enterprise-grade schema provides:
- 🚀 **10x faster queries** through strategic indexing
- 🎯 **99.9% data quality** via normalization and validation
- 🔍 **Advanced search capabilities** with full-text indexing
- 📊 **Real-time analytics** through materialized views
- 🛡️ **Bulletproof security** with comprehensive RLS policies
- 🔄 **Zero-downtime migrations** with defensive SQL strategies

### Environment Variables
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_GOOGLE_API_KEY
VITE_NYMERIA_API_KEY
SENDGRID_API_KEY (edge functions)
GEMINI_API_KEY (edge functions)
```

### Quality Checklist
```bash
# Always run before completing any task
npm run typecheck    # Must pass
npm run lint         # Must pass
npm run build        # Must succeed
npm test             # Run tests

# Or use parallel task
Task: "Run quality checks" prompt="Execute typecheck, lint, build, and tests in parallel"
```

## 🚀 Community Tips & Advanced Patterns

### Directory-Style Resource Discovery

Check out these community resources for advanced Claude Code workflows:

- **Awesome Claude Code**: https://github.com/hesreallyhim/awesome-claude-code
- **3-Tier Documentation**: Smart context loading based on task complexity
- **Multi-Agent Workflows**: Specialized sub-agents for different concerns
- **Performance Benchmarks**: Community-proven prompting patterns for coding tasks

### MCP Server Integration Tips

```bash
# Template patterns for common MCP setups
- Database connectors with connection pooling
- File handlers with proper error boundaries  
- API wrappers with rate limiting
- Integration examples for server composition
```

### Hook Development Best Practices

#### Testing Hook Configurations
```bash
# Test hooks safely in development
echo 'console.log("Hook test")' > .claude/test-hook.js
# Add to settings.json temporarily, test, then remove
```

#### Common Hook Patterns
```bash
# Notification Hook (for external integrations)
"Notification": [{
  "matcher": ".*",
  "hooks": [{
    "type": "command",
    "command": "curl -X POST https://webhook.site/your-id -d 'Claude notification'"
  }]
}]

# Performance Monitoring Hook
"PostToolUse": [{
  "matcher": "Bash",
  "hooks": [{
    "type": "command", 
    "command": "echo $(date): $CLAUDE_TOOL_ARGS >> .claude/performance.log"
  }]
}]
```

### Emergency Recovery Commands

```bash
# When context gets corrupted or confused
/clear                  # Clear conversation, keep file context
/compact               # Compress conversation, maintain context
Task: "Sanity check"   # Verify current state and requirements

# When hooks malfunction  
mv .claude/settings.json .claude/settings.json.bak  # Disable hooks
# Fix hook configuration, then restore

# When CLAUDE.md isn't loading
Read: CLAUDE.md        # Force explicit read
Task: "Verify CLAUDE.md is loaded and understood"
```

### Session Optimization Checklist

#### Before Starting Work
- [ ] TodoRead to check existing tasks
- [ ] Read CLAUDE.md for project context  
- [ ] Verify working directory is correct
- [ ] Check git status for uncommitted changes
- [ ] Run mcp__ide__getDiagnostics for code health

#### During Development
- [ ] Break tasks into <8 hour chunks
- [ ] Mark todos in_progress → completed immediately
- [ ] Read files explicitly before editing
- [ ] Use Task agents for parallel research
- [ ] Update TODO.md for complex projects

#### After Task Completion
- [ ] Run quality checks: typecheck, lint, build, test
- [ ] Update todos to completed status
- [ ] Commit changes if requested
- [ ] Document any new patterns in CLAUDE.md

#### Performance Optimization
- [ ] Use specific @file references vs broad directory reads
- [ ] Leverage hooks for automated quality checks
- [ ] /compact only when context exceeds 50k tokens
- [ ] Break large conversations with /clear between discrete tasks

---

**Community Edition - Optimized for Claude Code Power Users**

**Remember**:
- ALWAYS use TodoWrite/TodoRead for task management
- Use Task agents for research and parallel work  
- Implement hooks for repetitive quality checks
- Keep CLAUDE.md focused and evolving
- Break complex tasks into discrete 8-hour chunks
- Use /compact strategically, not automatically
- Test with rate limits and hooks in mind

## Video Meeting Implementation (Daily.co)

### Architecture Overview
The video meeting feature uses Daily.co for WebRTC video conferencing, with a singleton pattern to prevent duplicate instances.

#### Key Components:
1. **`src/lib/dailySingleton.ts`** - Singleton manager for Daily instances
   - Prevents duplicate Daily.co instances
   - Handles concurrent creation attempts
   - Manages instance lifecycle and cleanup

2. **`src/components/video/VideoPreview.tsx`** - Main video display component
   - Uses singleton to create/get Daily frame
   - Handles loading states and error messages
   - Auto-joins meeting after frame creation

3. **`src/pages/MeetingSimplified.tsx`** - Meeting workflow page
   - Three-step flow: welcome → setup → meeting
   - Optional project association (not required)
   - Cleans up Daily instance on unmount

4. **`supabase/functions/create-daily-room`** - Room creation edge function
   - Creates Daily.co rooms via API
   - Associates rooms with projects (optional)
   - Returns room URL for client

### Common Implementation Patterns:

#### Singleton Pattern for Daily.co
```typescript
// Always use the singleton to prevent duplicate instances
import { dailySingleton } from "@/lib/dailySingleton";

const frame = await dailySingleton.getOrCreateCallFrame(
  containerElement,
  roomUrl
);
```

#### Optional Project Association
```typescript
// Projects are optional - pass null if no project selected
const { data } = await supabase.functions.invoke('create-daily-room', {
  body: {
    projectId: selectedProjectId || null, // Optional
    meetingType: 'interview',
    title: 'Meeting Title',
    userId: user?.id
  }
});
```

#### Proper Cleanup
```typescript
// Always clean up Daily instance when done
const endMeeting = async () => {
  await dailySingleton.destroyCallFrame();
  // Reset state, navigate away, etc.
};
```

### Troubleshooting Video Meetings:

1. **Duplicate instance errors**: Singleton pattern should prevent these
2. **Video not showing**: Ensure `frame.join()` is called after loading
3. **Container styling**: Use `absolute inset-0` with min-height
4. **Permissions**: Browser must grant camera/microphone access
5. **Join timeout**: Increased to 30 seconds, non-blocking if auto-join fails

## Real-Time Interview Guidance System

### Overview
AI-powered interview assistance providing real-time tips, competency tracking, and contextual guidance during live interviews.

### Architecture Components

1. **WebSocket Gateway** (`interview-guidance-ws`)
   - Real-time bidirectional communication
   - Gemini 2.0 Flash integration for low-latency tips
   - Context-aware guidance generation
   - 3-second debounce for optimal API usage

2. **Context Management**
   - **Hierarchical layers**: Core → Resume → Recent → Immediate
   - `InterviewContextManager` class for operations
   - Zustand store for state management
   - Types in `src/types/interview.ts`

3. **Real-Time Transcription**
   - `useDailyTranscription` hook for Daily.co integration
   - Speaker diarization support
   - Intelligent buffering to prevent API flooding
   - Auto-start on meeting join

4. **UI Components**
   - `InterviewGuidanceSidebar`: Collapsible panel with tips & tracking
   - `CompetencySetup`: Pre-interview competency configuration
   - Real-time coverage visualization
   - Auto-dismissing tips based on priority

5. **Performance Optimizations**
   - LRU cache for analysis results (70% API reduction)
   - IndexedDB for persistent storage
   - Web Workers for heavy computations
   - Intelligent buffering and debouncing

### Usage

#### 1. Setup Competencies (Pre-Interview)
```typescript
// In MeetingEnhanced, configure competencies before starting
const competencies = [
  { name: 'System Design', category: 'technical', required: true },
  { name: 'Communication', category: 'behavioral', required: true },
  // ... more competencies
];
```

#### 2. During Interview
- AI tips appear in collapsible sidebar
- Competency coverage updates in real-time
- Tips prioritized by importance (high/medium/low)
- Suggested follow-up questions provided

#### 3. Key Hooks
```typescript
// Interview guidance management
const { updateContext, sendTranscript } = useInterviewGuidance({
  sessionId, meetingId, enabled: true
});

// Transcription integration
const { startTranscription } = useDailyTranscription({
  callObject, sessionId, meetingId
});
```

### Configuration
```typescript
const guidanceConfig = {
  maxTipsVisible: 5,
  tipDisplayDuration: 20000, // 20 seconds
  transcriptBufferSize: 20,
  analysisDebounceMs: 3000,
  geminiModel: 'gemini-2.0-flash-exp'
};
```

### Troubleshooting Interview Guidance

1. **Tips not appearing**: Check WebSocket connection in sidebar header
2. **No transcription**: Verify Daily.co transcription is enabled
3. **Competency tracking stuck**: Ensure competencies are configured
4. **High latency**: Check network and Gemini API status

**Version**: 5.2 (Community-Optimized + Hooks + Video + Interview Guidance)
**Updated**: July 2025