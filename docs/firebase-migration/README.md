# Firebase Migration Documentation

This directory contains guides and resources for migrating from Supabase to Firebase.

## Quick Links

- **[Complete Migration Guide](./SUPABASE_TO_FIREBASE_MIGRATION_GUIDE.md)** - Comprehensive step-by-step guide for migrating Cloud Functions

## Migration Status

### Completed ✅
- `perplexity-search` - Fully migrated and tested (2025-10-12)

### Pending ⏳
- `handle-interview` - Temporarily disabled in functions/index.js
- `github-profile` - Temporarily disabled in functions/index.js
- `process-text-extraction` - Temporarily disabled in functions/index.js
- `generate-dashboard-metrics` - Temporarily disabled in functions/index.js

## Quick Start

To migrate a function:

1. Read the [Complete Migration Guide](./SUPABASE_TO_FIREBASE_MIGRATION_GUIDE.md)
2. Use the checklist template provided in the guide
3. Test thoroughly before enabling in production
4. Update the migration status table in the guide

## Common Commands

```bash
# Deploy a single function
firebase deploy --only functions:functionName

# Deploy Firestore rules
firebase deploy --only firestore:rules

# View function logs
firebase functions:log

# Test locally
cd functions && npm run serve
```

## Support

For issues not covered in the documentation:
1. Check Firebase Functions logs
2. Check browser console
3. Verify Firestore rules are deployed
4. Check Cloud Run permissions in Google Cloud Console
