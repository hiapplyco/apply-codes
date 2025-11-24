# Complete Supabase to Firebase Migration Guide

## Overview
This guide documents the complete migration from Supabase (PostgreSQL + Auth) to Firebase (Firestore + Auth), eliminating all Supabase dependencies.

## Migration Status: Phase 1 Complete ✅

### Completed Items
- ✅ Firestore schema design document created
- ✅ Firestore security rules configured
- ✅ PostgreSQL to JSON export tool built
- ✅ Firestore data import script created
- ✅ Firebase configuration updated with Firestore
- ✅ Firebase data service adapter created (Supabase-compatible API)
- ✅ Migration scripts ready for execution

## Quick Start

### 1. Export Data from Supabase
```bash
# Set your Supabase service key
export SUPABASE_SERVICE_ROLE_KEY="your-service-key"

# Run the export
node scripts/supabase-export.js

# Data will be saved to migration-data/[date]/
```

### 2. Prepare Firebase
```bash
# Download Firebase service account key from Console
# Save as firebase-service-account.json in project root

# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Initialize Firestore indexes
firebase deploy --only firestore:indexes
```

### 3. Import Data to Firebase
```bash
# Set the input directory (if different from default)
export INPUT_DIR="migration-data/2025-01-27"

# Run the import
node scripts/firestore-import.js
```

### 4. Send Password Reset Emails
Since passwords cannot be migrated, users need to reset:
```bash
# This script will send password reset emails to all users
node scripts/send-password-resets.js
```

## Code Migration

### Replace Supabase Client
Replace all imports of Supabase client:

```typescript
// OLD - Supabase
import { supabase } from '@/integrations/supabase/client';

// NEW - Firestore Adapter (Phase 1)
import { firestoreAdapter as supabase } from '@/lib/firestore-adapter';

// NEW - Direct Firestore (Phase 2)
import { db } from '@/lib/firebase';
```

### Database Queries

The Firestore adapter maintains Supabase-like syntax initially:

```typescript
// These patterns work with the adapter
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

const { data, error } = await supabase
  .from('saved_candidates')
  .insert({ name: 'John Doe' });

const { data, error } = await supabase
  .from('projects')
  .update({ name: 'New Name' })
  .eq('id', projectId);
```

### Authentication

Update auth imports and methods:

```typescript
// OLD - Supabase Auth
import { supabase } from '@/integrations/supabase/client';
await supabase.auth.signInWithPassword({ email, password });

// NEW - Firebase Auth
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
await signInWithEmailAndPassword(auth, email, password);
```

## Schema Mapping

| Supabase (PostgreSQL) | Firebase (Firestore) |
|----------------------|---------------------|
| `auth.users` + `profiles` | `/users/{userId}` |
| `saved_candidates` | `/users/{userId}/savedCandidates` |
| `projects` | `/projects/{projectId}` |
| `project_candidates` | `/projects/{projectId}/candidates` |
| `search_history` | `/users/{userId}/searchHistory` |
| `jobs` | `/jobs/{jobId}` |
| `subscriptions` | `/subscriptions/{userId}` |
| `billing_history` | `/billingHistory/{billId}` |
| `chat_messages` | `/chatMessages/{messageId}` |
| `context_items` | `/contextItems/{itemId}` |

## File Structure

```
apply-codes/
├── scripts/
│   ├── supabase-export.js         # Export from Supabase
│   ├── firestore-import.js        # Import to Firestore
│   └── send-password-resets.js    # Send reset emails
├── src/lib/
│   ├── firebase.ts                # Firebase config
│   ├── firestore-adapter.ts       # Supabase-like API
│   └── auth-bridge.ts             # Auth migration helper
├── docs/
│   └── FIRESTORE_SCHEMA.md        # Complete schema design
├── firestore.rules                # Security rules
└── firestore.indexes.json         # Composite indexes
```

## Migration Phases

### Phase 1: Infrastructure Setup ✅ COMPLETE
- Export/Import tools created
- Firestore schema designed
- Security rules configured
- Data adapter built

### Phase 2: Data Migration (Next)
1. Run export script
2. Verify exported JSON
3. Run import script
4. Validate imported data

### Phase 3: Code Migration
1. Replace Supabase imports with adapter
2. Update auth implementations
3. Test all features
4. Monitor for errors

### Phase 4: Optimization
1. Replace adapter with direct Firestore
2. Optimize queries with indexes
3. Implement caching
4. Remove Supabase dependencies

## Testing Checklist

### Before Migration
- [ ] Full backup of Supabase data
- [ ] Test export script with sample data
- [ ] Test import script in dev environment
- [ ] Review security rules

### During Migration
- [ ] Export production data
- [ ] Import to Firebase
- [ ] Verify data integrity
- [ ] Test authentication flow
- [ ] Test all CRUD operations

### After Migration
- [ ] All features working
- [ ] Performance acceptable
- [ ] No console errors
- [ ] Security rules effective
- [ ] Remove Supabase dependencies

## Rollback Plan

If issues arise:

1. **Keep Supabase Active**: Don't delete Supabase project immediately
2. **Feature Flags**: Use flags to switch between Supabase/Firebase
3. **Parallel Run**: Run both systems for validation period
4. **Quick Switch**: auth-bridge.ts allows quick switching

```typescript
// In auth-bridge.ts
const USE_FIREBASE = false; // Quick rollback switch
```

## Common Issues & Solutions

### Issue: Users can't log in
**Solution**: Users must reset passwords. Send password reset emails.

### Issue: Missing data after import
**Solution**: Check export logs, verify JSON files, re-run import for specific collections.

### Issue: Permission denied errors
**Solution**: Review Firestore security rules, ensure userId fields are set correctly.

### Issue: Real-time subscriptions not working
**Solution**: Use Firestore's onSnapshot instead of Supabase subscriptions.

### Issue: File uploads failing
**Solution**: Migrate to Firebase Storage, update upload logic.

## Performance Optimization

### Firestore Indexes
Create composite indexes for common queries:
```json
{
  "indexes": [
    {
      "collectionGroup": "projects",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Caching Strategy
```typescript
// Implement local caching
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedOrFetch(key: string, fetcher: () => Promise<any>) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

## Cost Considerations

### Firestore Pricing
- **Reads**: $0.06 per 100,000 documents
- **Writes**: $0.18 per 100,000 documents
- **Storage**: $0.18 per GB per month

### Optimization Tips
1. Use subcollections to reduce reads
2. Implement pagination (limit queries)
3. Cache frequently accessed data
4. Use batch operations
5. Enable offline persistence

## Final Steps

1. **Remove Supabase Dependencies**
```bash
npm uninstall @supabase/supabase-js @supabase/auth-helpers-react
```

2. **Update Environment Variables**
```env
# Remove
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Keep only for reference
SUPABASE_DB_URL= # If needed for final export
```

3. **Delete Supabase Project** (After 30-day validation)

## Support & Troubleshooting

### Logs & Monitoring
- Firebase Console: Functions logs
- Firestore: Usage metrics
- Auth: User activity

### Debug Mode
```typescript
// Enable debug logging
if (process.env.NODE_ENV === 'development') {
  window.FIREBASE_DEBUG = true;
}
```

---

**Migration Started**: 2025-01-27
**Estimated Completion**: 4 weeks
**Current Phase**: 1 (Infrastructure) ✅ COMPLETE
**Next Phase**: 2 (Data Migration)