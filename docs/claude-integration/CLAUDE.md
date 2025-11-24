# Apply.codes AI Recruitment Platform - CLAUDE.md

**Strictly follow the rules in ../../AGENTS.md**

## 🎯 Mission Statement
<mission>
You are the AI assistant for Apply.codes, an AI-powered recruitment platform. Your primary role is to help developers build, maintain, and enhance this recruitment technology platform while ensuring code quality, security, and optimal AI agent orchestration.

**PLATFORM STATUS**: Complete migration to Firebase (2025-09-28). All authentication, database, storage, and cloud functions now run exclusively on Firebase. Supabase has been fully deprecated and removed.
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
- **Backend**: Firebase Cloud Functions (46 active functions)
- **Database**: Firestore (NoSQL document database)
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
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
├── functions/            # Firebase Cloud Functions
│   ├── src/             # Function source code
│   └── lib/             # Shared utilities
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
firebase emulators:start # Start Firebase emulators
npm run mcp:dev          # Start MCP server
```

## 🤖 AI Agent Architecture

### MCP Server Tools
The project includes an MCP server with specialized recruitment tools:
- **boolean_search**: AI-powered boolean query generation
- **analyze_job_requirements**: Extract structured job data
- **parse_resume**: Process resume documents
- **compare_documents**: Match resumes to job requirements

### Firebase Cloud Functions
Key AI-powered cloud functions:
- `generateBooleanSearch`: Generate complex search queries
- `enrichProfile`: Enhance candidate profiles with external data
- `analyzeCandidate`: AI-driven candidate evaluation
- `processJobRequirements`: Extract and structure job requirements
- `chatAssistant`: AI chat interface
- `analyzeResume`: Resume parsing and analysis

## 🔍 Critical Patterns

### Component Structure
```typescript
// Always follow existing patterns in src/components/
// Check neighboring files for conventions
// Use existing UI components from src/components/ui/
```

### Cloud Function Pattern
```typescript
// Firebase Cloud Functions pattern
const functions = require('firebase-functions');
exports.functionName = functions.https.onCall(async (data, context) => {
  // Function implementation
  // Use try-catch with detailed error messages
});
```

### State Management
- Context API for auth and projects
- Custom hooks for business logic
- Firestore real-time listeners

## 🚨 Security Requirements

### API Keys
- **NEVER** commit secrets to repository
- Use environment variables via `.env.local`
- Reference `.env.example` and `.env.firebase.example` for required vars
- Firebase functions use environment variables set in Firebase Console

### Authentication
- Firebase Auth for user management
- Firestore Security Rules for access control
- Firebase ID tokens for API calls

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
2. Add Firebase Cloud Function in `functions/src/`
3. Create React component in `src/components/search/`
4. Add types to `src/types/`

### Implementing AI Agent
1. Create Firebase Cloud Function in `functions/src/`
2. Add to MCP server if user-facing
3. Implement React UI in appropriate component
4. Update orchestration in `src/lib/orchestration/`

### Database Changes
1. Update Firestore collections and documents
2. Update types in `src/types/`
3. Test with Firebase emulators

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

### Firebase (Cloud Functions)
```bash
firebase deploy --only functions
# Or specific function:
firebase deploy --only functions:functionName
```

### Firebase (Database)
```bash
firebase deploy --only firestore:rules  # Deploy Firestore rules
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
1. **CORS errors**: Check Firebase function CORS configuration
2. **Type errors**: Run `npm run typecheck`
3. **Auth issues**: Verify Firebase Security Rules
4. **MCP connection**: Check claude_desktop_config.json
5. **Function errors**: Check Firebase Console logs

### Debug Commands
```bash
firebase functions:log
firebase emulators:start --only functions
npm run dev -- --debug
```

## 📚 Key Resources

### Internal Docs
- `/docs/MASTER_TRACKING_DOCUMENT.md` - Feature roadmap
- `/mcp-server/README.md` - MCP server setup
- `/docs/integrations/` - Third-party service guides
- `FIREBASE_MIGRATION_COMPLETE.md` - Migration completion details

### External Services
- Firebase Console: https://console.firebase.google.com
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
firebase firestore:delete --all-collections  # Clear all data (careful!)
firebase emulators:export ./data            # Export emulator data
firebase emulators:start --import=./data    # Import emulator data
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
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

# Google Services
VITE_GOOGLE_CLIENT_ID=
GEMINI_API_KEY=

# MCP Server
MCP_SERVER_PORT=3000
```

### Firebase Function Config
```bash
# Set environment variables for Firebase Functions
firebase functions:config:set gemini.key="xxx"
firebase functions:config:set nymeria.key="xxx"
firebase functions:config:set sendgrid.key="xxx"
# View current config
firebase functions:config:get
```

## 🚦 Status Checks

### Before Starting Work
- [ ] Git repository clean or changes stashed
- [ ] Dependencies up to date (`npm install`)
- [ ] Environment variables configured
- [ ] Firebase emulators running (if needed)
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

### If Firebase Errors
```bash
firebase emulators:kill
firebase emulators:start --clear
firebase deploy --only functions
```

### If MCP Disconnects
1. Check `claude_desktop_config.json`
2. Rebuild MCP server: `cd mcp-server && npm run build`
3. Restart Claude Desktop

---

**Project initialized**: 2025-01-29
**Primary focus**: AI-powered recruitment automation
**Optimization target**: Developer productivity and code quality