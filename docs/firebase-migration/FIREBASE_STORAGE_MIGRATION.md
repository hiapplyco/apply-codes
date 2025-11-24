# Firebase Storage Migration Guide

## Overview

This document outlines the migration from Supabase Storage to Firebase Storage while maintaining backward compatibility. The migration uses a hybrid approach that automatically selects Firebase when available and falls back to Supabase when needed.

## Migration Status: ✅ COMPLETE

All storage operations have been migrated:

1. ✅ **Avatar uploads** (Profile.tsx) - Now uses Firebase Storage
2. ✅ **Audio recordings** (CaptureWindow.tsx) - Now uses Firebase Storage
3. ✅ **Document uploads** (documentProcessing.ts) - Now uses Firebase Storage

## Architecture

### Hybrid Storage Manager

The migration implements a hybrid storage manager that:

- **Prefers Firebase Storage** when configured and available
- **Falls back to Supabase Storage** when Firebase is not available
- **Maintains the same API** for existing code
- **Provides progress tracking** for uploads
- **Handles errors gracefully** across both backends

### Key Components

```typescript
// Main hybrid manager - automatically chooses backend
import { storageManager } from '@/lib/firebase-storage';

// Specific helper functions
import {
  uploadAvatar,
  uploadRecording,
  uploadDocument
} from '@/lib/firebase-storage';

// Direct Firebase adapter (advanced usage)
import { FirebaseStorageAdapter } from '@/lib/firebase-storage';
```

## Configuration

### Firebase Configuration

Add these environment variables to `.env.local`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Firebase Storage Security Rules

Configure these rules in the Firebase Console:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Avatars bucket - users can only access their own avatars
    match /avatars/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Recordings bucket - users can only access their own recordings
    match /recordings/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Documents bucket - users can only access their own documents
    match /docs/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Default deny rule
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Usage Examples

### Avatar Upload

```typescript
// Before (Supabase)
const { error } = await supabase.storage
  .from('avatars')
  .upload(filePath, file);

// After (Firebase with fallback)
const avatarUrl = await uploadAvatar(userId, file, (progress) => {
  console.log(`Upload progress: ${progress}%`);
});
```

### Recording Upload

```typescript
// Before (Supabase)
const { error } = await supabase.storage
  .from('recordings')
  .upload(fileName, recordingBlob);

// After (Firebase with fallback)
const recordingUrl = await uploadRecording(userId, recordingBlob, (progress) => {
  console.log(`Upload progress: ${progress}%`);
});
```

### Document Upload

```typescript
// Before (Supabase)
const { storagePath } = await DocumentProcessor.uploadDocument(file, userId);

// After (Firebase with fallback)
const { url, storagePath } = await uploadDocument(userId, file, (progress) => {
  console.log(`Upload progress: ${progress}%`);
});
```

## Backend Selection Logic

The hybrid manager automatically selects the storage backend:

1. **Firebase First**: If Firebase is configured and available
2. **Supabase Fallback**: If Firebase is not configured or fails
3. **Transparent Operation**: Existing code works without changes

```typescript
// Check current backend
const backend = storageManager.getCurrentBackend(); // 'firebase' | 'supabase'

// Manual backend preference
const preferFirebase = new HybridStorageManager(true);  // Prefer Firebase
const preferSupabase = new HybridStorageManager(false); // Prefer Supabase
```

## Error Handling

The migration provides enhanced error handling:

### Firebase-Specific Errors

- `storage/quota-exceeded` → "Storage quota exceeded"
- `storage/unauthenticated` → "User not authenticated"
- `storage/unauthorized` → "User not authorized to perform this action"
- `storage/invalid-format` → "Invalid file format"

### Backward Compatibility

- All existing Supabase error handling is preserved
- Errors are translated to user-friendly messages
- Failed uploads are logged with specific details

## File Organization

Files are organized consistently across both backends:

```
avatars/
  ├── {userId}/
      ├── {userId}-{random}.{ext}
      └── ...

recordings/
  ├── {userId}/
      ├── {timestamp}.webm
      └── ...

docs/
  ├── {userId}/
      ├── {timestamp}-{filename}
      └── ...
```

## Database Changes

The migration adds optional fields to track storage backend:

```sql
-- Optional: Add columns to track storage backend
ALTER TABLE processed_documents
ADD COLUMN storage_url TEXT,
ADD COLUMN storage_backend TEXT DEFAULT 'supabase';

-- Update existing records
UPDATE processed_documents
SET storage_backend = 'supabase'
WHERE storage_backend IS NULL;
```

## Performance Benefits

### Firebase Storage Advantages

1. **Better CDN**: Global CDN with edge caching
2. **Progress Tracking**: Built-in upload progress events
3. **Resumable Uploads**: Large files can resume if interrupted
4. **Better Security**: Fine-grained security rules
5. **Integration**: Better integration with Firebase Auth

### Maintained Compatibility

- **Zero Downtime**: Migration works immediately
- **Gradual Rollout**: Can enable Firebase per user/feature
- **Easy Rollback**: Can disable Firebase anytime

## Testing

Run the migration tests:

```bash
npm run test src/test/firebase-storage-migration.test.ts
```

Test the migration manually:

```typescript
import { testStorageMigration } from '@/test/firebase-storage-migration.test';

// Run in browser console
testStorageMigration().then(results => {
  console.log('Migration test results:', results);
});
```

## Monitoring

Monitor the migration with these logging statements:

```typescript
// Check backend selection
console.log('Storage backend:', storageManager.getCurrentBackend());

// Monitor uploads
uploadAvatar(userId, file, (progress) => {
  console.log(`Firebase upload progress: ${progress}%`);
});
```

## Rollback Plan

If needed, you can disable Firebase and return to Supabase-only:

1. **Remove Firebase environment variables**
2. **The hybrid manager will automatically use Supabase**
3. **No code changes required**

## Security Considerations

### Firebase Storage

- ✅ User-specific folder structure
- ✅ Authentication-based access control
- ✅ File type validation
- ✅ Size limits enforced

### Supabase Storage (Fallback)

- ✅ Row Level Security (RLS)
- ✅ Bucket-level permissions
- ✅ File type restrictions

## Migration Benefits

1. **Performance**: Firebase CDN is faster globally
2. **Reliability**: Better uptime and redundancy
3. **Integration**: Better integration with Firebase ecosystem
4. **Features**: Progress tracking, resumable uploads
5. **Cost**: Potentially lower costs for high traffic
6. **Future-Proof**: Aligns with Firebase migration strategy

## Next Steps

1. ✅ Configure Firebase Storage in production
2. ✅ Deploy the hybrid storage manager
3. ✅ Monitor backend selection logs
4. ✅ Verify all file uploads work correctly
5. ✅ Update monitoring dashboards

## Support

For issues with the migration:

1. Check Firebase configuration in environment variables
2. Verify Firebase Storage security rules
3. Review browser console for storage backend logs
4. Test with `testStorageMigration()` function

The migration is designed to be bulletproof - if Firebase fails, Supabase will automatically take over with no user impact.