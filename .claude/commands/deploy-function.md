# Deploy Function Command

Deploy a Supabase edge function with automated testing and validation.

## Usage
```
/project:deploy-function <function-name>
```

## Pre-Deployment Checks

1. **Code Validation**
   - TypeScript compilation
   - Linting passes
   - No hardcoded secrets

2. **Dependencies**
   - Verify Deno imports
   - Check for missing dependencies
   - Validate CORS configuration

3. **Testing**
   - Run unit tests if available
   - Validate request/response format
   - Check error handling

## Deployment Process

1. **Build Function**
   ```bash
   cd supabase/functions/<function-name>
   ```

2. **Set Secrets** (if needed)
   ```bash
   npx supabase secrets set KEY_NAME=value
   ```

3. **Deploy**
   ```bash
   npx supabase functions deploy <function-name>
   ```

4. **Verify Deployment**
   - Check function logs
   - Test endpoint with curl
   - Monitor for errors

## Post-Deployment

1. **Update Documentation**
   - Add to function registry
   - Update API documentation
   - Note in CLAUDE.md if pattern change

2. **Update MCP Server** (if applicable)
   - Add tool wrapper if user-facing
   - Update tool descriptions
   - Rebuild MCP server

3. **Test Integration**
   - Verify frontend integration
   - Check error handling
   - Test rate limiting

## Common Functions

- `generate-boolean-search` - AI search generation
- `enrich-profile` - Candidate enrichment
- `analyze-candidate` - AI evaluation
- `process-job-requirements-v2` - Job parsing

## Troubleshooting

### CORS Errors
Ensure function returns proper headers:
```typescript
import { corsHeaders } from '../_shared/cors.ts'
```

### Authentication Issues
Check Supabase RLS policies and JWT verification

### Performance Problems
- Implement caching
- Optimize database queries
- Consider streaming responses