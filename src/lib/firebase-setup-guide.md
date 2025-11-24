# Firebase Setup and Migration Guide

## Overview

This guide explains the complete Firebase configuration and authentication setup for the Apply.codes platform. The setup includes Firebase Auth, Firestore, Cloud Functions, Storage, and Analytics integration.

## Architecture

The application uses a hybrid approach during migration:
- **Firebase**: Primary auth provider + cloud functions
- **Supabase**: Database only (PostgreSQL)
- **Bridge Pattern**: Seamless switching between providers

## File Structure

```
src/
├── lib/
│   ├── firebase.ts              # Core Firebase configuration
│   ├── auth-bridge.ts           # Auth provider bridge (existing)
│   └── function-bridge.ts       # Cloud functions bridge (existing)
├── hooks/
│   ├── useFirebaseAuth.ts       # Firebase auth state hook
│   └── useAuthSession.ts        # Supabase auth hook (existing)
├── context/
│   ├── FirebaseAuthContext.tsx  # Firebase auth context
│   ├── AuthContext.tsx          # Supabase auth context (existing)
│   └── UnifiedAuthContext.tsx   # Unified auth provider
```

## Configuration

### Environment Variables

Add these to your `.env.local`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_firebase_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id_here
```

### Firebase Project Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication with Email/Password
3. Enable Firestore Database
4. Enable Cloud Functions
5. Enable Storage
6. Copy configuration values to environment variables

## Usage

### Basic Firebase Integration

```typescript
import {
  auth,
  db,
  functions,
  storage,
  isFirebaseConfigured,
  getCurrentUser,
  firebaseSignIn,
  firebaseSignUp,
  firebaseSignOut
} from '@/lib/firebase';

// Check if Firebase is configured
if (isFirebaseConfigured()) {
  // Use Firebase services
  const user = getCurrentUser();
}
```

### Using Firebase Auth Hook

```typescript
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

const MyComponent = () => {
  const { user, isAuthenticated, isLoading, error, clearError } = useFirebaseAuth();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.email}!</p>
      ) : (
        <p>Please sign in</p>
      )}
    </div>
  );
};
```

### Using Firebase Auth Context

```typescript
import { useFirebaseAuthContext } from '@/context/FirebaseAuthContext';

const AuthComponent = () => {
  const {
    user,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    isConfigured
  } = useFirebaseAuthContext();

  const handleSignIn = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    if (error) {
      console.error('Sign in failed:', error.message);
    }
  };

  if (!isConfigured) {
    return <div>Firebase not configured</div>;
  }

  return (
    <div>
      {/* Your auth UI */}
    </div>
  );
};
```

### Using Unified Auth Context (Recommended)

For seamless migration between Supabase and Firebase:

```typescript
import { useUnifiedAuth } from '@/context/UnifiedAuthContext';

const App = () => {
  const {
    user,
    isAuthenticated,
    provider,
    enableFirebase,
    disableFirebase
  } = useUnifiedAuth();

  return (
    <div>
      <p>Current provider: {provider}</p>
      {user && (
        <p>User: {user.email} (from {user.provider})</p>
      )}

      <button onClick={enableFirebase}>
        Switch to Firebase
      </button>
      <button onClick={disableFirebase}>
        Switch to Supabase
      </button>
    </div>
  );
};
```

### Error Handling

```typescript
import { handleFirebaseError } from '@/lib/firebase';

try {
  await firebaseSignIn(email, password);
} catch (error) {
  const friendlyMessage = handleFirebaseError(error);
  setErrorMessage(friendlyMessage);
}
```

### Configuration Validation

```typescript
import { validateFirebaseConfig } from '@/lib/firebase';

const { isValid, missingKeys } = validateFirebaseConfig();

if (!isValid) {
  console.warn('Missing Firebase config keys:', missingKeys);
}
```

## Provider Setup

### App Root Setup

```typescript
// App.tsx
import { UnifiedAuthProvider } from '@/context/UnifiedAuthContext';
import { FirebaseAuthProvider } from '@/context/FirebaseAuthContext';
import { AuthProvider } from '@/context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <FirebaseAuthProvider>
        <UnifiedAuthProvider>
          {/* Your app components */}
        </UnifiedAuthProvider>
      </FirebaseAuthProvider>
    </AuthProvider>
  );
}
```

### Migration Strategy

1. **Phase 1**: Keep both providers active
2. **Phase 2**: Gradually switch users to Firebase
3. **Phase 3**: Remove Supabase auth (keep database)

```typescript
// Gradual migration example
const { enableFirebase, provider } = useUnifiedAuth();

useEffect(() => {
  // Enable Firebase for new users
  if (isNewUser) {
    enableFirebase();
  }
}, [isNewUser]);
```

## Cloud Functions Integration

The existing `function-bridge.ts` handles all Firebase Cloud Functions. Example usage:

```typescript
import { functionBridge } from '@/lib/function-bridge';

// Generate boolean search
const result = await functionBridge.generateBooleanSearch({
  description: 'Senior React Developer',
  jobTitle: 'Frontend Engineer'
});

// Enrich profile
const enrichedData = await functionBridge.enrichProfile({
  linkedin_url: 'https://linkedin.com/in/example'
});
```

## Security Considerations

1. **Environment Variables**: Never commit Firebase config to git
2. **Auth Validation**: Always validate authentication on both client and server
3. **Security Rules**: Configure Firestore security rules properly
4. **CORS**: Configure Cloud Functions CORS for your domain

## Testing

```typescript
// Test Firebase configuration
import { isFirebaseConfigured, validateFirebaseConfig } from '@/lib/firebase';

describe('Firebase Configuration', () => {
  it('should be properly configured', () => {
    expect(isFirebaseConfigured()).toBe(true);

    const { isValid, missingKeys } = validateFirebaseConfig();
    expect(isValid).toBe(true);
    expect(missingKeys).toHaveLength(0);
  });
});
```

## Migration Checklist

- [ ] Firebase project created and configured
- [ ] Environment variables added to `.env.local`
- [ ] Firebase Auth enabled with Email/Password
- [ ] Firestore Database enabled
- [ ] Cloud Functions deployed
- [ ] Storage bucket created
- [ ] Analytics configured (optional)
- [ ] Security rules configured
- [ ] CORS configured for Cloud Functions
- [ ] Test authentication flow
- [ ] Test function calls
- [ ] Gradual user migration planned

## Troubleshooting

### Common Issues

1. **"Firebase not configured"**: Check environment variables
2. **CORS errors**: Verify Cloud Functions CORS settings
3. **Auth persistence**: Check localStorage/sessionStorage
4. **Function timeouts**: Increase Cloud Function timeout limits

### Debug Commands

```typescript
// Check configuration
console.log('Firebase configured:', isFirebaseConfigured());
console.log('Current user:', getCurrentUser());
console.log('Auth state:', auth?.currentUser);

// Validate config
const { isValid, missingKeys } = validateFirebaseConfig();
console.log('Config valid:', isValid);
console.log('Missing keys:', missingKeys);
```

## Next Steps

1. **Deploy Cloud Functions**: Migrate existing Supabase Edge Functions
2. **Configure Security Rules**: Set up Firestore security rules
3. **Enable Analytics**: Track user behavior and performance
4. **Optimize Performance**: Implement caching and optimization
5. **Monitor**: Set up logging and error tracking

---

This setup provides a complete Firebase integration with seamless migration capabilities from Supabase authentication to Firebase Auth while maintaining database operations on Supabase PostgreSQL.