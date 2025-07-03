# Google OAuth 2.0 Integration Guide

## Overview

This guide documents the complete Google OAuth 2.0 integration for Apply, which enables users to connect their Google accounts for Drive and Docs access. The integration follows OAuth 2.0 best practices with security measures and robust error handling.

## Architecture

### Core Components

1. **GoogleAccountManager** - React component for managing Google account connections
2. **useGoogleAuth** - React hook for authentication state management
3. **GoogleTokenManager** - Service class for token lifecycle management
4. **GoogleSessionMonitor** - Component for monitoring session health
5. **Edge Functions** - Supabase functions for secure token operations

### Flow Diagram

```
User Initiates Connection
        ↓
Generate Secure Nonce
        ↓
Redirect to Google OAuth
        ↓
User Grants Permissions
        ↓
Receive Authorization Code
        ↓
Exchange Code for Tokens
        ↓
Store Encrypted Tokens
        ↓
Connection Complete
```

## Security Features

### 1. CSRF Protection
- Secure nonce generation using crypto.getRandomValues()
- State parameter validation
- Origin verification

### 2. Token Security
- Encrypted token storage
- Automatic token refresh
- Secure token revocation
- Row Level Security (RLS) policies

### 3. Permission Scoping
- Minimal required permissions
- Scope validation and verification
- Granular access control

## Implementation Details

### Environment Variables

Required in `.env.local`:
```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
VITE_GOOGLE_DRIVE_API_KEY=your_google_drive_api_key
VITE_GOOGLE_DOCS_API_KEY=your_google_docs_api_key
```

### Database Schema

The integration uses a dedicated `google_accounts` table:

```sql
CREATE TABLE google_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    google_id TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    picture TEXT,
    access_token TEXT,
    refresh_token TEXT,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    token_expiry TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used TIMESTAMPTZ,
    
    UNIQUE(user_id, google_id),
    UNIQUE(user_id, email)
);
```

### API Endpoints

#### 1. Token Exchange
**Endpoint**: `/functions/v1/exchange-google-token`
**Method**: POST
**Purpose**: Exchange authorization code for access/refresh tokens

**Request Body**:
```json
{
  "code": "authorization_code",
  "redirectUri": "https://app.apply.codes/oauth/google/callback",
  "scopes": ["https://www.googleapis.com/auth/drive"]
}
```

**Response**:
```json
{
  "access_token": "ya29.a0...",
  "refresh_token": "1//04...",
  "expires_at": "2024-01-01T12:00:00Z",
  "scope": "https://www.googleapis.com/auth/drive",
  "token_type": "Bearer"
}
```

#### 2. Token Refresh
**Endpoint**: `/functions/v1/refresh-google-token`
**Method**: POST
**Purpose**: Refresh expired access tokens

**Request Body**:
```json
{
  "accountId": "uuid"
}
```

#### 3. Token Revocation
**Endpoint**: `/functions/v1/revoke-google-token`
**Method**: POST
**Purpose**: Revoke and delete Google account connection

## Integration Guide

### Step 1: Setup OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable Google Drive API and Google Docs API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://yourdomain.com/oauth/google/callback`
   - `http://localhost:3000/oauth/google/callback` (for development)

### Step 2: Configure Environment

Add the required environment variables to your `.env.local` file.

### Step 3: Run Database Migration

```bash
supabase db reset
# or
supabase migration up
```

### Step 4: Deploy Edge Functions

```bash
supabase functions deploy exchange-google-token
supabase functions deploy refresh-google-token
supabase functions deploy revoke-google-token
```

### Step 5: Add Routes

Add the OAuth callback route to your router:

```tsx
// In your router configuration
import GoogleOAuthCallback from '@/pages/GoogleOAuthCallback';

{
  path: '/oauth/google/callback',
  element: <GoogleOAuthCallback />
}
```

### Step 6: Implement in Components

#### Basic Usage

```tsx
import { GoogleAccountManager } from '@/components/integrations/GoogleAccountManager';
import { GOOGLE_API_SCOPES } from '@/lib/google-api-config';

function SettingsPage() {
  return (
    <GoogleAccountManager
      requiredScopes={[
        GOOGLE_API_SCOPES.DRIVE.FULL_ACCESS,
        GOOGLE_API_SCOPES.DOCS.FULL_ACCESS
      ]}
      onAccountConnected={(account) => {
        console.log('Connected:', account.email);
      }}
      onAccountDisconnected={(accountId) => {
        console.log('Disconnected:', accountId);
      }}
    />
  );
}
```

#### Using the Hook

```tsx
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

function MyComponent() {
  const { 
    accounts, 
    currentAccount, 
    isLoading, 
    connectAccount, 
    refreshToken 
  } = useGoogleAuth();

  const handleConnect = async () => {
    await connectAccount([
      GOOGLE_API_SCOPES.DRIVE.FULL_ACCESS,
      GOOGLE_API_SCOPES.DOCS.FULL_ACCESS
    ]);
  };

  return (
    <div>
      <p>Connected accounts: {accounts.length}</p>
      <button onClick={handleConnect}>Connect Google</button>
    </div>
  );
}
```

#### Session Monitoring

```tsx
import { GoogleSessionMonitor } from '@/components/integrations/GoogleSessionMonitor';

function Dashboard() {
  return (
    <div>
      {/* Compact status indicator */}
      <GoogleSessionMonitor 
        showDetailedView={false}
        className="fixed top-4 right-4"
      />
      
      {/* Detailed monitoring panel */}
      <GoogleSessionMonitor 
        showDetailedView={true}
        autoRefresh={true}
        showNotifications={true}
        onSessionChange={(isValid) => {
          console.log('Session validity changed:', isValid);
        }}
      />
    </div>
  );
}
```

#### Token Management

```tsx
import { googleTokenManager } from '@/lib/google-token-manager';

// Get a valid access token
const token = await googleTokenManager.getValidAccessToken();

// Validate session
const session = await googleTokenManager.validateSession();
if (!session.isValid) {
  console.log('Session invalid:', session.error);
}

// Check permissions
const hasAccess = await googleTokenManager.hasRequiredScopes([
  GOOGLE_API_SCOPES.DRIVE.FULL_ACCESS
]);
```

## Best Practices

### 1. Error Handling

Always handle potential errors in OAuth flows:

```tsx
try {
  await connectAccount(scopes);
} catch (error) {
  if (error.message.includes('access_denied')) {
    // User denied permission
    showError('Please grant necessary permissions to continue');
  } else if (error.message.includes('network')) {
    // Network error
    showError('Please check your internet connection');
  } else {
    // Generic error
    showError('Failed to connect Google account');
  }
}
```

### 2. Token Refresh

Implement automatic token refresh:

```tsx
useEffect(() => {
  const interval = setInterval(async () => {
    await googleTokenManager.refreshExpiredTokens();
  }, 5 * 60 * 1000); // Every 5 minutes

  return () => clearInterval(interval);
}, []);
```

### 3. Scope Management

Request minimal required scopes:

```tsx
const requiredScopes = [
  GOOGLE_API_SCOPES.DRIVE.FILE_ACCESS, // Only files created by app
  GOOGLE_API_SCOPES.DOCS.FULL_ACCESS   // For document editing
];
```

### 4. Security Considerations

- Always validate state parameters
- Use HTTPS in production
- Implement proper CORS policies
- Regularly audit permissions
- Monitor for suspicious activity

## Troubleshooting

### Common Issues

#### 1. "Invalid redirect URI"
- Verify redirect URI in Google Cloud Console
- Check for exact match including protocol and path

#### 2. "Access blocked"
- Ensure OAuth consent screen is configured
- Add test users if app is in testing mode

#### 3. "Token refresh failed"
- Check if refresh token exists
- Verify client credentials
- User may need to reconnect

#### 4. "Insufficient permissions"
- Verify required scopes are granted
- Check scope validation logic

### Debug Mode

Enable debug logging:

```tsx
// Add to development environment
if (process.env.NODE_ENV === 'development') {
  window.googleAuthDebug = true;
}
```

### Testing

Run the test suite:

```bash
npm test src/test/google-oauth-integration.test.ts
```

## Monitoring and Analytics

### Session Health Metrics

Monitor these key metrics:

- **Active Sessions**: Number of valid, non-expired tokens
- **Token Refresh Rate**: Frequency of automatic refreshes
- **Error Rate**: Failed authentication attempts
- **Scope Coverage**: Percentage of users with required permissions

### Database Queries

```sql
-- Active Google accounts
SELECT COUNT(*) FROM google_accounts 
WHERE status = 'active' 
AND (token_expiry IS NULL OR token_expiry > NOW());

-- Accounts needing attention
SELECT COUNT(*) FROM google_accounts 
WHERE status = 'needs_reconnection' 
OR token_expiry < NOW();

-- Scope distribution
SELECT unnest(scopes) as scope, COUNT(*) 
FROM google_accounts 
GROUP BY scope 
ORDER BY count DESC;
```

## Security Checklist

- [ ] OAuth client properly configured
- [ ] Redirect URIs restricted to your domains
- [ ] Environment variables secured
- [ ] Database RLS policies enabled
- [ ] Token encryption implemented
- [ ] CSRF protection active
- [ ] Error handling comprehensive
- [ ] Audit logging enabled
- [ ] Regular security reviews scheduled

## Support and Resources

### Documentation
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Drive API Reference](https://developers.google.com/drive/api/v3/reference)
- [Google Docs API Reference](https://developers.google.com/docs/api/reference/rest)

### Common OAuth Scopes
```
https://www.googleapis.com/auth/drive              # Full Drive access
https://www.googleapis.com/auth/drive.readonly     # Read-only Drive access
https://www.googleapis.com/auth/drive.file         # Per-file Drive access
https://www.googleapis.com/auth/documents          # Full Docs access
https://www.googleapis.com/auth/documents.readonly # Read-only Docs access
https://www.googleapis.com/auth/userinfo.email     # User email
https://www.googleapis.com/auth/userinfo.profile   # User profile
```

### Rate Limits
- **Queries per day**: 1,000,000,000
- **Queries per user per 100 seconds**: 1,000
- **Queries per 100 seconds**: 10,000

### Error Codes
- `400`: Bad Request - Invalid parameters
- `401`: Unauthorized - Invalid or expired token
- `403`: Forbidden - Insufficient permissions
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Google server issue

---

**Last Updated**: January 2025
**Version**: 1.0.0