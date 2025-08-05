# Apply.codes AI Recruitment Platform - CLAUDE.md

## 🎯 Mission Statement
<mission>
You are the AI assistant for Apply.codes, an AI-powered recruitment platform. Your primary role is to help developers build, maintain, and enhance this recruitment technology platform while ensuring code quality, security, and optimal AI agent orchestration.
</mission>

## 📋 Contract First Approach
<contract>
Before implementing any changes:
1. **Clarify Intent**: Understand the exact requirement and success criteria
2. **Identify Gaps**: List missing information needed for implementation
3. **Echo Check**: Confirm understanding with a crisp summary
4. **Execute**: Only proceed after alignment
</contract>

## 🏗️ Project Structure

### Core Technologies
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Supabase Edge Functions (Deno) + PostgreSQL
- **AI Services**: Google Gemini, OpenAI, Perplexity
- **MCP Server**: Model Context Protocol for Claude integration
- **Integrations**: 20+ recruitment tools (Nymeria, Hunter.io, etc.)

### Directory Layout
```
apply-codes/
├── src/                    # React frontend
│   ├── components/        # UI components (100+ files)
│   ├── pages/            # Route pages
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Services and utilities
├── supabase/
│   └── functions/        # 35+ Edge functions
├── mcp-server/           # MCP recruitment tools
│   ├── src/controllers/  # Boolean search, document tools
│   └── prompts/         # System prompts
└── docs/                # Architecture and guides
```

## 🔧 Development Workflow

### Before Making Changes
```bash
# Always check current state
git status
npm run typecheck
npm run lint

# Read relevant files explicitly
# NEVER assume implementations - always read first
```

### Testing Commands
```bash
npm test                  # Run unit tests
npm run test:e2e         # End-to-end tests
npm run lint             # ESLint
npm run typecheck        # TypeScript checks
```

### Local Development
```bash
npm run dev              # Start Vite dev server (port 5173)
npx supabase start       # Start local Supabase
npm run mcp:dev          # Start MCP server
```

## 🤖 AI Agent Architecture

### MCP Server Tools
The project includes an MCP server with specialized recruitment tools:
- **boolean_search**: AI-powered boolean query generation
- **analyze_job_requirements**: Extract structured job data
- **parse_resume**: Process resume documents
- **compare_documents**: Match resumes to job requirements

### Edge Function Agents
Key AI-powered edge functions:
- `generate-boolean-search`: Generate complex search queries
- `enrich-profile`: Enhance candidate profiles with external data
- `analyze-candidate`: AI-driven candidate evaluation
- `process-job-requirements-v2`: Extract and structure job requirements

## 🔍 Critical Patterns

### Component Structure
```typescript
// Always follow existing patterns in src/components/
// Check neighboring files for conventions
// Use existing UI components from src/components/ui/
```

### Edge Function Pattern
```typescript
// Standard CORS and error handling
import { corsHeaders } from '../_shared/cors.ts'
// Always return proper CORS headers
// Use try-catch with detailed error messages
```

### State Management
- Context API for auth and projects
- Custom hooks for business logic
- Supabase real-time subscriptions

## 🚨 Security Requirements

### API Keys
- **NEVER** commit secrets to repository
- Use environment variables via `.env.local`
- Reference `.env.example` for required vars
- Supabase secrets via `npx supabase secrets set`

### Authentication
- Supabase Auth for user management
- Row Level Security (RLS) on all tables
- JWT tokens for API calls

## 📝 Code Style Rules

### TypeScript
- Strict mode enabled
- Explicit return types for functions
- Interface over type when possible
- No `any` types without justification

### React Components
- Functional components with hooks
- Props interfaces defined
- Memoization for expensive operations
- Error boundaries for robustness

### Comments
- **NO COMMENTS** unless explicitly requested
- Self-documenting code preferred
- JSDoc only for public APIs

## 🎯 Common Tasks

### Adding New Search Feature
1. Update `mcp-server/src/controllers/sourcing-tools.ts`
2. Add edge function if needed in `supabase/functions/`
3. Create React component in `src/components/search/`
4. Add types to `src/types/`

### Implementing AI Agent
1. Create edge function in `supabase/functions/`
2. Add to MCP server if user-facing
3. Implement React UI in appropriate component
4. Update orchestration in `src/lib/orchestration/`

### Database Changes
1. Create migration in `supabase/migrations/`
2. Update types in `src/integrations/supabase/types.ts`
3. Test with `npx supabase db reset`

## 🔄 Git Workflow

### Branch Naming
```bash
feature/description   # New features
fix/issue-description # Bug fixes
refactor/component   # Code improvements
```

### Commit Messages
```
feat: add boolean search to MCP server
fix: resolve PDF parsing memory leak
refactor: optimize profile enrichment flow
```

## 🚀 Deployment

### Vercel (Frontend)
```bash
npm run build
vercel deploy
```

### Supabase (Backend)
```bash
npx supabase functions deploy function-name
npx supabase db push  # Apply migrations
```

## 📊 Performance Considerations

### Frontend Optimization
- Lazy load routes and heavy components
- Use React.memo for expensive renders
- Implement virtual scrolling for large lists
- Optimize bundle size with code splitting

### Backend Optimization
- Use database indexes on search columns
- Implement caching for expensive operations
- Batch API calls when possible
- Stream large responses

## 🐛 Debugging

### Common Issues
1. **CORS errors**: Check edge function cors headers
2. **Type errors**: Run `npm run typecheck`
3. **Auth issues**: Verify Supabase RLS policies
4. **MCP connection**: Check claude_desktop_config.json

### Debug Commands
```bash
npx supabase functions logs function-name
npm run dev -- --debug
```

## 📚 Key Resources

### Internal Docs
- `/docs/MASTER_TRACKING_DOCUMENT.md` - Feature roadmap
- `/mcp-server/README.md` - MCP server setup
- `/docs/integrations/` - Third-party service guides

### External Services
- Supabase Dashboard: https://app.supabase.com
- Vercel Dashboard: https://vercel.com
- Google Cloud Console: For Gemini API

## ⚡ Quick Commands

### Search Operations
```bash
# Test boolean search
node mcp-server/test-boolean-direct.js

# Test Gemini integration
node test-gemini-direct.js
```

### Database Operations
```bash
npx supabase status
npx supabase db diff
npx supabase gen types typescript
```

## 🎭 Context Management

### When Switching Tasks
1. Save current work: `git stash`
2. Read relevant files explicitly
3. Check for running services
4. Verify environment variables

### File Reading Priority
1. **Always read before modifying**
2. Check imports to understand dependencies
3. Look at tests for expected behavior
4. Review nearby files for patterns

## 🔐 Environment Variables

### Required for Development
```env
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Google Services
VITE_GOOGLE_CLIENT_ID=
GEMINI_API_KEY=

# MCP Server
MCP_SERVER_PORT=3000
```

### Edge Function Secrets
```bash
npx supabase secrets set GEMINI_API_KEY=xxx
npx supabase secrets set NYMERIA_API_KEY=xxx
npx supabase secrets set SENDGRID_API_KEY=xxx
```

## 🚦 Status Checks

### Before Starting Work
- [ ] Git repository clean or changes stashed
- [ ] Dependencies up to date (`npm install`)
- [ ] Environment variables configured
- [ ] Supabase running (`npx supabase status`)
- [ ] No failing tests from previous session

### Before Committing
- [ ] All tests passing
- [ ] Linting clean (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] No console.logs or debugger statements
- [ ] No hardcoded secrets

## 💡 Pro Tips

1. **Use MCP tools**: Leverage the MCP server for complex searches
2. **Batch operations**: Group similar database operations
3. **Cache aggressively**: Use React Query for API calls
4. **Monitor performance**: Check Supabase dashboard for slow queries
5. **Test edge cases**: Especially for AI-generated content

## 🆘 Emergency Procedures

### If Build Fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### If Supabase Errors
```bash
npx supabase stop
npx supabase start
npx supabase db reset
```

### If MCP Disconnects
1. Check `claude_desktop_config.json`
2. Rebuild MCP server: `cd mcp-server && npm run build`
3. Restart Claude Desktop

---

**Project initialized**: 2025-01-29
**Primary focus**: AI-powered recruitment automation
**Optimization target**: Developer productivity and code quality