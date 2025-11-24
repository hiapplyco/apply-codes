# AGENTS.md - Apply.codes AI Recruitment Platform

## Quick Reference

```bash
# Development
npm run dev              # Vite dev server (port 5173)
firebase emulators:start # Firebase emulators
npm run mcp:dev         # MCP server

# Quality
npm run lint            # ESLint
npm run typecheck       # TypeScript check
npm test                # Unit tests
npm run test:e2e        # E2E tests

# Firebase
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase functions:log  # View logs

# MCP Testing
node mcp-server/test-boolean-direct.js
```

**Docs**: `/docs/MASTER_TRACKING_DOCUMENT.md`, `mcp-server/README.md`
**Stack**: React 18 + TypeScript + Vite + Firebase + Gemini AI

## Project Structure

```
apply-codes/
├── src/                    # React frontend
│   ├── components/        # UI components (100+)
│   ├── pages/            # Route pages
│   ├── hooks/            # Custom hooks
│   └── lib/              # Services/utilities
├── functions/            # Firebase Cloud Functions (46)
│   ├── src/             # Function source
│   └── lib/             # Shared utilities
├── mcp-server/           # Model Context Protocol
│   ├── src/controllers/  # Boolean search, documents
│   └── prompts/         # System prompts
├── docs/                # Architecture docs
├── sql/                 # Database scripts
└── scripts/            # Build/deploy scripts
```

**Key files**:
- `firebase.json` - Firebase config
- `vite.config.ts` - Vite config
- `mcp-server/src/index.ts` - MCP entry point
- `functions/src/index.ts` - Cloud Functions entry

## Code Conventions

### TypeScript
- Strict mode enabled
- Explicit return types
- Interface over type
- No `any` without justification

### React Components
- Functional components + hooks
- Props interfaces defined
- Use existing UI components from `src/components/ui/`
- React.memo for expensive renders

### Firebase Functions
```typescript
const functions = require('firebase-functions');

exports.functionName = functions.https.onCall(async (data, context) => {
  // Validate auth: context.auth
  // Validate input: data
  try {
    // Implementation
    return { success: true, result };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

### Comments
- **NO COMMENTS** unless explicitly requested
- Self-documenting code preferred
- JSDoc for public APIs only

## File-Level Commands

**Read before editing**:
- Always read files before modifying
- Check imports for dependencies
- Review tests for behavior
- Look at neighboring files for patterns

**Creating components**:
1. Check `src/components/` for existing patterns
2. Use Shadcn/UI components from `src/components/ui/`
3. Define Props interface
4. Export from appropriate index

**Adding Cloud Function**:
1. Create in `functions/src/<category>.ts`
2. Export in `functions/src/index.ts`
3. Test with emulator
4. Deploy: `firebase deploy --only functions:<name>`

**MCP Tools**:
1. Add to `mcp-server/src/controllers/`
2. Register in `mcp-server/src/index.ts`
3. Test with test scripts

## Common Tasks

### Add Search Feature
1. Update `mcp-server/src/controllers/sourcing-tools.ts`
2. Add Cloud Function in `functions/src/`
3. Create UI in `src/components/search/`
4. Add types to `src/types/`

### Implement AI Agent
1. Create Cloud Function in `functions/src/`
2. Add to MCP if user-facing
3. Build UI component
4. Update orchestration in `src/lib/orchestration/`

### Database Changes
1. Update Firestore collections/documents
2. Update types in `src/types/`
3. Test with Firebase emulators
4. Update security rules if needed

### Debug Cloud Function
```bash
# View logs
firebase functions:log

# Test locally
firebase emulators:start
# Then call function from app or curl
```

## Security Notes

- **Never commit secrets** - use `.env.local`
- Check `.env.example` and `.env.firebase.example` for required vars
- Firebase Auth for user management
- Firestore Security Rules for access control
- Validate all user inputs
- Use Firebase ID tokens for API calls

## Performance

### Frontend
- Lazy load routes: `React.lazy()`
- Code splitting via dynamic imports
- Virtual scrolling for large lists
- Optimize bundle size
- Memoize expensive components

### Backend
- Database indexes on search columns
- Cache expensive operations
- Batch API calls
- Stream large responses
- Monitor Firebase quotas

## Environment Variables

```bash
# Frontend (.env.local)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GOOGLE_CLIENT_ID=
GEMINI_API_KEY=
MCP_SERVER_PORT=3000

# Firebase Functions
firebase functions:config:set gemini.key="xxx"
firebase functions:config:set nymeria.key="xxx"
firebase functions:config:get  # View config
```

See `.env.example` and `.env.firebase.example`.

## Migration Status

**COMPLETE**: Full migration to Firebase (2025-09-28)
- Supabase fully deprecated and removed
- All auth, database, storage on Firebase
- 46 active Cloud Functions
- MCP server for Claude integration

## Debug Common Issues

1. **CORS errors**: Check Firebase function CORS config
2. **Type errors**: Run `npm run typecheck`
3. **Auth issues**: Verify Firestore Security Rules
4. **MCP connection**: Check `claude_desktop_config.json`
5. **Function errors**: Check Firebase Console logs

## Workflow

1. **Read before editing**: Always read files first
2. **Test changes**: Run tests after modifications
3. **Commit often**: Small, focused commits with clear messages
4. **Document decisions**: Update docs for architectural changes
5. **Check status**: `git status`, `npm run typecheck`, `npm run lint`
