# Apply (Blind Nut) - AI Assistant Guide

## Quick Start

**Apply** is an AI-driven recruitment platform that helps recruiters find qualified candidates through intelligent search, boolean query generation, and candidate enrichment.

**Primary Directive**: Provide concise development assistance for AI-powered recruitment features, focusing on code quality, security, and user experience.

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
- **AI**: Google Gemini 2.0 Flash
- **Deployment**: Vercel (Frontend), Supabase (Backend)

### Key Features
- 🤖 AI-powered boolean search generation
- 🔍 Contact enrichment (Nymeria API)
- 💬 AI chat assistant
- 📁 Project management for candidates
- 📊 Analytics and reporting
- 🎯 Multi-platform search

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

## Architecture Overview

```
apply-codes/
├── src/
│   ├── components/      # React components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript types
│   │   └── domains/    # Domain-specific types
│   ├── lib/            # Utilities and helpers
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

## Integrations

### Active Integrations
1. **Nymeria API** - Contact enrichment (implemented)
2. **Google Gemini** - All AI operations
3. **SendGrid** - Email delivery (partial)

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

### Database Tables
- `profiles` - User profiles
- `saved_candidates` - Stored candidates
- `search_history` - Search tracking
- `projects` - Candidate organization
- `agent_outputs` - AI results

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

---

**Remember**:
- ALWAYS use TodoWrite/TodoRead for task management
- Use Task agents for research and parallel work
- Run quality checks before marking todos complete
- Keep users in-app (no external redirects)
- Test with rate limits in mind

**Version**: 4.0 (Enhanced Tools)
**Updated**: January 2025