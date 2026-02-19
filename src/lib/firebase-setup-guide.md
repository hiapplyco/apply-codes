# Firebase Setup Guide

## Overview

Apply.codes uses Firebase as the primary backend platform:
- **Firebase Auth**: Authentication (Email/Password, Google)
- **Firestore**: Primary database
- **Cloud Functions**: Backend API endpoints
- **Firebase Storage**: File uploads

Some legacy Cloud Functions still use Supabase PostgreSQL for specific data operations (interview handling, GitHub profiles, dashboard metrics). These are candidates for future Firestore migration.

## Environment Variables

Add these to your `.env.local`:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Key Files

```
src/lib/
  firebase.ts              # Core Firebase config and exports
  auth-bridge.ts           # Auth abstraction layer
  database-bridge.ts       # Firestore abstraction layer
  firebase-adapter.ts      # Supabase-compatible API adapter
  firebase-storage.ts      # Storage upload helpers
  function-bridge.ts       # Cloud Functions caller
```

## Usage

```typescript
import { auth, db, functions, storage, isFirebaseConfigured } from '@/lib/firebase';
import { useUnifiedAuth } from '@/context/UnifiedAuthContext';
import { functionBridge } from '@/lib/function-bridge';

// Auth
const { user, isAuthenticated } = useUnifiedAuth();

// Cloud Functions
const result = await functionBridge.generateBooleanSearch({ description, jobTitle });
```

## Cloud Functions

Deployed via `firebase deploy --only functions`. All functions use structured logging via `firebase-functions/v2` logger.

## Security

- Never commit `.env` or service account keys
- Configure Firestore security rules for production
- All Cloud Functions use CORS and auth validation
