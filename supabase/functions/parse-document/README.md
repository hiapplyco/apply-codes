# Parse Document Function

This Supabase Edge Function handles document parsing using Google's Gemini AI model.

## Files

- `index.ts` - Main entry point that serves the HTTP handler
- `handler.ts` - Core logic extracted for testing
- `index.test.ts` - Comprehensive test suite
- `test-utils.ts` - Testing utilities and mock implementations
- `test-fixtures.ts` - Test data and expected results

## Running Tests

```bash
# Run all tests
deno test --allow-env --allow-net

# Run with coverage
deno test --allow-env --allow-net --coverage=coverage

# Run specific test file
deno test index.test.ts --allow-env --allow-net

# Run with verbose output
deno test --allow-env --allow-net --reporter=verbose
```

## Test Coverage

The test suite covers:

### Unit Tests
- Prompt generation for different file types (PDF, Word, Excel, text)
- File type detection and routing
- Error message formatting
- CORS header generation

### Integration Tests
- Complete file upload flow
- Text file direct processing
- PDF processing with Gemini
- Word document processing
- Excel spreadsheet processing
- File state polling mechanism
- Cleanup after processing

### Error Handling
- Missing file/userId validation
- Gemini upload failures
- File processing timeouts
- File state failures
- Supabase storage failures (graceful degradation)
- Large file handling
- Unsupported file types

### Performance Tests
- Processing time limits
- Polling attempt limits
- Concurrent request handling

### Security Tests
- CORS headers on all responses
- Sensitive data sanitization in errors
- File path validation (prevent directory traversal)

## Architecture

The function has been refactored to support dependency injection for testing:

1. `index.ts` - Minimal entry point that calls the handler
2. `handler.ts` - Contains all business logic with optional dependency injection
3. Mock implementations allow testing without external services

## Deployment

For production deployment:

```bash
# Deploy via Supabase CLI
supabase functions deploy parse-document

# Or deploy via Dashboard
# Navigate to Supabase Dashboard > Functions > parse-document
```

## Environment Variables

Required:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

## File Processing Flow

1. Receive file via multipart form data
2. Validate file and userId presence
3. For text files: Return content directly
4. For other files:
   - Upload to Supabase storage (optional)
   - Upload to Gemini File API
   - Poll for file activation
   - Generate content with file-specific prompts
   - Clean up temporary files
5. Return extracted text or error

## Error Handling

The function provides user-friendly error messages for common scenarios:
- File too large
- Processing timeout
- Upload failures
- AI processing errors
- Storage errors

All errors include both a user-friendly message and technical details for debugging.