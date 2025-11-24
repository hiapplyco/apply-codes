# Phase 2 - Data Migration Execution Guide

## Prerequisites Checklist

### 1. Supabase Credentials
```bash
# Get your service role key from Supabase Dashboard
# Settings > API > Service Role Key
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJI..."
```

### 2. Firebase Service Account
1. Go to Firebase Console
2. Project Settings > Service Accounts
3. Click "Generate new private key"
4. Save as `firebase-service-account.json` in project root

### 3. Install Dependencies
```bash
# Install Firebase Admin SDK if not already installed
npm install firebase-admin
```

## Step-by-Step Migration

### Step 1: Export Data from Supabase
```bash
# Set your Supabase service key
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Run the export
node scripts/supabase-export.js

# Output will be in migration-data/[today's-date]/
# Example: migration-data/2025-01-27/
```

Expected output:
```
============================================================
Supabase Data Export Tool
============================================================
Output directory: /path/to/migration-data/2025-01-27

Exporting auth.users...
  Found 150 auth users
  Saved to migration-data/2025-01-27/auth_users.json

Exporting profiles...
  Found 150 records
  Saved to migration-data/2025-01-27/profiles.json

... (continues for all tables)

Export completed successfully!
Total records exported: 3,245
```

### Step 2: Verify Exported Data
```bash
# Check the export directory
ls -la migration-data/$(date +%Y-%m-%d)/

# View export summary
cat migration-data/$(date +%Y-%m-%d)/export_summary.json
```

Verify you have these files:
- `auth_users.json` - User authentication data
- `profiles_with_auth.json` - Merged profile data
- `saved_candidates.json` - Candidate records
- `projects.json` - Project data
- `subscriptions.json` - Subscription info
- Other table exports...

### Step 3: Import Data to Firebase

```bash
# Optional: specify input directory if different
export INPUT_DIR="migration-data/2025-01-27"

# Run the import
node scripts/firestore-import.js
```

Expected output:
```
============================================================
Firestore Data Import Tool
============================================================
Input directory: migration-data/2025-01-27

Importing auth users to Firebase Auth...
  ✓ Imported user: john@example.com
  ✓ Imported user: jane@example.com
  → User already exists: admin@example.com
  Imported 148 users, 0 errors

Importing user profiles...
  Imported 150 profiles...
  ✓ Imported 150 user profiles

... (continues for all collections)

Import completed successfully!
Collections imported: 9
Users imported: 148

⚠️  IMPORTANT: User passwords cannot be migrated directly.
Users will need to reset their passwords via email.
```

### Step 4: Send Password Reset Emails

#### Test First (Dry Run)
```bash
# Test without actually sending emails
export DRY_RUN=true
node scripts/send-password-resets.js
```

#### Send Actual Emails
```bash
# Optional: set custom reset URL
export PASSWORD_RESET_URL="https://apply.codes/reset-password"

# Send the emails
node scripts/send-password-resets.js
```

Expected output:
```
============================================================
Password Reset Email Sender
============================================================

Fetching all users from Firebase Auth...
Found 148 users

145 users need password reset

Processing batch 1 of 15
✓ Reset link generated for: john@example.com
✓ Reset link generated for: jane@example.com
  Waiting 2000ms before next batch...

... (continues)

Summary
============================================================
✓ Success: 145
✗ Errors: 0
```

### Step 5: Validate Migration

```bash
# Run validation script
node scripts/validate-migration.js
```

Expected output:
```
============================================================
Firebase Migration Validator
============================================================

📊 Record Counts:
------------------------------------------------------------

User Profiles:
  Supabase (profiles): 150
  Firestore (users): 150

Saved Candidates:
  Supabase (saved_candidates): 523
  Firestore (savedCandidates): 523

... (continues for all collections)

👤 User Validation:
  Auth Users:
    Supabase profiles: 150
    Firebase Auth: 148
    Firestore profiles: 148

============================================================
Validation Summary
============================================================
✅ No critical issues found!

⚠️  Warnings:
  ⚠️  User Profiles: Minor difference (2 records)

📄 Full report saved to: migration-data/validation-report.json

📋 Recommendations:
  - Investigate warnings to ensure data integrity
  - Small differences may be due to timing or filters
```

## Troubleshooting

### Issue: Export fails with authentication error
```bash
Error: Invalid API key
```
**Solution**: Ensure you're using the Service Role key, not the anon key

### Issue: Import fails with permission denied
```bash
Error: Missing or insufficient permissions
```
**Solution**: Ensure your Firebase service account has proper permissions

### Issue: Users can't reset passwords
```bash
Error: auth/user-not-found
```
**Solution**: Verify users were imported successfully, check Firebase Auth console

### Issue: Data count mismatch
**Solution**:
1. Check if filters are applied in Supabase (RLS policies)
2. Some records may have failed import (check import logs)
3. Re-run import for specific collections

### Issue: Rate limiting on password resets
**Solution**:
1. Increase `DELAY_BETWEEN_BATCHES` in the script
2. Reduce `BATCH_SIZE` to send fewer emails at once

## Post-Migration Verification

### 1. Check Firebase Console
- Go to Firebase Console > Authentication > Users
- Verify user count matches expectations
- Check Firestore Database > Data
- Browse collections to verify structure

### 2. Test User Login
After users reset passwords, test:
1. Password reset flow works
2. Users can log in with new password
3. User data is accessible
4. Permissions work correctly

### 3. Application Testing
1. Update environment variables:
```env
# Add Firebase config
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-domain
VITE_FIREBASE_PROJECT_ID=your-project-id

# Keep Supabase for now (fallback)
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key
```

2. Test critical paths:
- User registration (new users)
- User login (migrated users)
- Data operations (CRUD)
- Real-time features

## Rollback Plan

If issues occur:

### 1. Quick Rollback
```javascript
// In src/lib/auth-bridge.ts
const USE_FIREBASE = false; // Switch back to Supabase
```

### 2. Keep Both Systems Running
- Don't delete Supabase data immediately
- Run both systems in parallel for validation
- Monitor for issues for at least 7 days

### 3. Re-Migration
If needed, you can re-run the migration:
1. Delete Firebase Auth users
2. Clear Firestore collections
3. Re-run import scripts

## Next Steps

After successful migration:

### Phase 3: Code Migration
1. Update all Supabase imports to use adapter
2. Test all features thoroughly
3. Update authentication flows
4. Fix any compatibility issues

### Phase 4: Optimization
1. Replace adapter with direct Firestore calls
2. Optimize queries with indexes
3. Implement caching
4. Remove Supabase dependencies

## Support

### Logs Location
- Export logs: `migration-data/[date]/export_summary.json`
- Import logs: `migration-data/[date]/import_summary.json`
- Validation report: `migration-data/validation-report.json`
- Password reset errors: `migration-data/password-reset-errors.json`

### Firebase Support
- Console: https://console.firebase.google.com
- Documentation: https://firebase.google.com/docs
- Status: https://status.firebase.google.com

### Critical Metrics to Monitor
- User login success rate
- API error rates
- Database read/write operations
- Authentication failures
- Performance metrics

---

**Migration Date**: ___________
**Executed By**: ___________
**Total Records Migrated**: ___________
**Issues Encountered**: ___________
**Resolution**: ___________