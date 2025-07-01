# Google OAuth Authentication Setup Guide

This guide documents the implementation of Google Sign-In using Google Identity Services (One Tap) with Supabase Auth, providing a seamless authentication experience.

## Overview

We've implemented Google Sign-In using the modern Google Identity Services approach, which provides:
- One-tap sign-in capability
- No redirects required (popup-based flow)
- Enhanced security with nonce implementation
- Compatibility with Chrome's third-party cookie phase-out (FedCM)
- Beautiful integration with existing email/password auth

## Architecture

### Components Structure

```
src/components/auth/
├── GoogleSignIn.tsx      # Core Google Sign-In component with nonce security
├── SocialAuthButtons.tsx # Container for social auth providers
├── AuthForm.tsx         # Combined auth form (social + email/password)
└── CustomPasswordReset.tsx # Existing password reset component
```

### Key Features

1. **Security-First Design**
   - Cryptographic nonce generation for token validation
   - SHA-256 hashing for Google's requirements
   - Secure token handling with Supabase

2. **User Experience**
   - Seamless popup-based authentication
   - No page redirects
   - Automatic session management
   - Loading states and error handling

3. **Future-Proof**
   - FedCM support for Chrome's cookie phase-out
   - Modular design for adding more providers
   - TypeScript for type safety

## Setup Instructions

### 1. Google Cloud Console Configuration

1. **Create or Select a Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one

2. **Enable Google Identity Service**
   - Navigate to "APIs & Services" > "Enabled APIs"
   - Search for "Google Identity Toolkit API"
   - Enable the API

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application" as the application type
   - Configure the following:

   **Authorized JavaScript origins:**
   ```
   http://localhost:5173
   https://www.apply.codes
   https://apply.codes
   ```

   **Authorized redirect URIs:**
   ```
   https://kxghaajojntkqrmvsngn.supabase.co/auth/v1/callback
   ```

4. **Copy the Client ID**
   - After creation, copy the Client ID (not the secret)
   - You'll need this for both frontend and Supabase configuration

### 2. Supabase Dashboard Configuration

1. **Navigate to Authentication Settings**
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to Authentication > Providers

2. **Configure Google Provider**
   - Find Google in the providers list
   - Toggle it ON
   - Add your Google Client ID to the "Client ID (for OAuth)" field
   - **Important**: Leave the "Client Secret" field EMPTY
   - This tells Supabase to expect ID tokens instead of OAuth flow

3. **Verify Redirect URLs**
   - Go to Authentication > URL Configuration
   - Ensure these are in your Redirect URLs:
   ```
   http://localhost:5173/*
   https://www.apply.codes/*
   ```

### 3. Environment Configuration

Add the Google Client ID to your `.env.local`:

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=1049016281061-p9fpgnd9tks77nehfdk6qb82fhd3461s.apps.googleusercontent.com
```

**Note**: This is a public client ID, safe to expose in frontend code.

**Current Configuration Status**:
- ✅ Client ID created in Google Cloud Console
- ✅ Authorized JavaScript origins configured:
  - `http://localhost:5173`
  - `https://www.apply.codes`
  - `https://apply.codes`
- ✅ Authorized redirect URI: `https://kxghaajojntkqrmvsngn.supabase.co/auth/v1/callback`
- ✅ Environment variable added to `.env.local`
- ✅ Environment variable added to Vercel

### 4. Vercel Deployment Configuration

Add the environment variable in Vercel:
1. Go to your project settings
2. Navigate to Environment Variables
3. Add `VITE_GOOGLE_CLIENT_ID` with your Client ID
4. Redeploy to apply changes

## Implementation Details

### GoogleSignIn Component

The `GoogleSignIn.tsx` component handles:
- Dynamic script loading
- Nonce generation for security
- Google Identity Services initialization
- Token exchange with Supabase
- Error handling and loading states

```typescript
// Key security feature - nonce generation
const nonceValue = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
const hashedNonce = // SHA-256 hash for Google

// Token exchange with Supabase
await supabase.auth.signInWithIdToken({
  provider: 'google',
  token: response.credential,
  nonce: nonceValue,
});
```

### Integration Points

1. **AuthForm Component**
   - Combines social auth with email/password
   - Maintains consistent styling
   - Provides unified auth experience

2. **Landing Page**
   - Simple integration: `<AuthForm redirectTo="/dashboard" />`
   - Automatic session detection and redirect

3. **AuthContext**
   - No changes needed - works with existing auth state
   - Session management handled automatically

## User Flow

1. **Sign In Process**
   ```mermaid
   graph TD
     A[User clicks Google Sign-In] --> B[Google popup appears]
     B --> C[User authenticates with Google]
     C --> D[Google returns ID token]
     D --> E[Token sent to Supabase]
     E --> F[Supabase validates & creates session]
     F --> G[User redirected to dashboard]
   ```

2. **Security Flow**
   - Frontend generates nonce
   - Nonce hashed and sent to Google
   - Google includes nonce in ID token
   - Supabase validates nonce match
   - Session created only if valid

## Customization Options

### 1. Button Styling

Modify button appearance in `GoogleSignIn.tsx`:
```typescript
window.google.accounts.id.renderButton(buttonRef.current, {
  type: 'standard',      // or 'icon'
  shape: 'pill',         // or 'rectangular', 'circle'
  theme: 'outline',      // or 'filled_blue', 'filled_black'
  text: 'signin_with',   // or 'signup_with', 'continue_with'
  size: 'large',         // or 'medium', 'small'
  logo_alignment: 'left' // or 'center'
});
```

### 2. One-Tap Sign-In

Enable One-Tap by uncommenting in `GoogleSignIn.tsx`:
```typescript
// Enable One Tap
window.google.accounts.id.prompt();
```

### 3. Adding More Providers

Add new providers in `SocialAuthButtons.tsx`:
```typescript
<div className="space-y-3">
  <GoogleSignIn onSuccess={onSuccess} redirectTo={redirectTo} />
  <GitHubSignIn onSuccess={onSuccess} redirectTo={redirectTo} />
  <LinkedInSignIn onSuccess={onSuccess} redirectTo={redirectTo} />
</div>
```

## Testing

### Local Development

1. Ensure `VITE_GOOGLE_CLIENT_ID` is set in `.env.local`
2. Run `npm run dev`
3. Navigate to http://localhost:5173
4. Click "Continue with Google"
5. Complete authentication
6. Verify redirect to dashboard

### Production Testing

1. Deploy to Vercel with environment variable
2. Test on https://www.apply.codes
3. Verify popup doesn't get blocked
4. Check session creation in Supabase dashboard

## Troubleshooting

### Common Issues

1. **"Invalid Client" Error**
   - Verify Client ID is correct
   - Check authorized origins in Google Console
   - Ensure domain matches exactly (with/without www)

2. **Popup Blocked**
   - Button click must be user-initiated
   - Check browser popup settings
   - Try different browsers

3. **Session Not Created**
   - Verify Supabase Google provider is enabled
   - Check Client ID in Supabase matches Google
   - Ensure redirect URLs are whitelisted

4. **Nonce Mismatch**
   - Don't reuse nonce values
   - Generate fresh nonce for each sign-in
   - Check console for detailed errors

### Debug Mode

Enable detailed logging:
```typescript
// In GoogleSignIn.tsx
console.log('Nonce:', nonce, hashedNonce);
console.log('Google response:', response);
console.log('Supabase result:', data, error);
```

## Security Considerations

1. **Client ID Exposure**
   - Client IDs are public by design
   - Security comes from domain restrictions
   - Never expose Client Secret

2. **Nonce Implementation**
   - Prevents replay attacks
   - Single-use tokens
   - Cryptographically secure generation

3. **Domain Restrictions**
   - Configure authorized origins carefully
   - Use exact domain matches
   - Remove localhost in production

4. **Token Handling**
   - Tokens handled by Supabase
   - Never store tokens in localStorage
   - Automatic token refresh

## Best Practices

1. **UX Guidelines**
   - Show loading states during auth
   - Handle errors gracefully
   - Provide fallback options

2. **Performance**
   - Load Google script asynchronously
   - Clean up on component unmount
   - Minimize re-renders

3. **Accessibility**
   - Ensure keyboard navigation works
   - Provide alternative auth methods
   - Test with screen readers

## Future Enhancements

1. **Additional Providers**
   - GitHub OAuth
   - LinkedIn OAuth
   - Microsoft OAuth

2. **Enhanced Features**
   - Account linking
   - Email verification skip for OAuth
   - Profile data extraction

3. **Advanced Security**
   - Multi-factor authentication
   - Device fingerprinting
   - Suspicious login detection

## Related Documentation

- [Google Identity Services Guide](https://developers.google.com/identity/gsi/web/guides/overview)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Password Reset Workflow](./password-reset-workflow.md)
- [Authentication Flow](../AUTH_FLOW.md)

---

Last Updated: January 2025
Version: 1.0