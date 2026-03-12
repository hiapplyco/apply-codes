# Remediation Plan — Mass Testing Results (March 11, 2026)

## Test Summary

| Category | Total | Pass | Fail |
|----------|-------|------|------|
| Frontend Routes | 24 | 24 | 0 |
| Cloud Functions | 77 | 73 | 4 |
| **Overall** | **101** | **97** | **4** |

All frontend routes return HTTP 200 with valid HTML.
All 77 Cloud Functions are deployed and responding.
56 functions correctly return 401 (auth required), 12 return 400 (missing params) — both expected.

---

## Issues Requiring Action (4)

### 1. `locationSearch` — 403 Forbidden
**Severity:** High (blocks feature)
**Symptom:** Returns `"Your client does not have permission to get URL /locationSearch from this server."`
**Root Cause:** Cloud Function invoker IAM policy not set to allow unauthenticated access (unlike other onRequest functions).
**Fix:**
```bash
CLOUDSDK_ACTIVE_CONFIG_NAME=hiapply \
gcloud functions add-invoker-policy-binding locationSearch \
  --region=us-central1 \
  --project=applycodes-2683f \
  --member="allUsers"
```
**Alternatively**, if this should require auth, verify the frontend is passing the Firebase ID token in the Authorization header.

---

### 2. `checkTrialExpirations` — 500 Missing Firestore Index
**Severity:** Medium (scheduled job, not user-facing)
**Symptom:** `FAILED_PRECONDITION: The query requires an index`
**Root Cause:** A composite Firestore index is needed for the query in this function.
**Fix:**
1. Check the Cloud Functions logs for the direct Firebase Console link to create the index:
```bash
CLOUDSDK_ACTIVE_CONFIG_NAME=hiapply \
gcloud functions logs read checkTrialExpirations \
  --region=us-central1 \
  --project=applycodes-2683f \
  --limit=10
```
2. Click the link in the error to auto-create the index, OR add it to `firebase/firestore.indexes.json` and deploy:
```bash
CLOUDSDK_ACTIVE_CONFIG_NAME=hiapply \
firebase deploy --only firestore:indexes --project applycodes-2683f
```

---

### 3. `grantProAccess` — 500 Admin Key Not Configured
**Severity:** Low (admin-only function)
**Symptom:** `Admin key not configured`
**Root Cause:** The function expects an admin secret key in environment/secrets config.
**Fix:**
1. Set the admin key in Firebase Functions config or Secret Manager:
```bash
# Option A: Firebase Functions config
CLOUDSDK_ACTIVE_CONFIG_NAME=hiapply \
firebase functions:config:set admin.key="YOUR_ADMIN_KEY" --project applycodes-2683f

# Option B: Secret Manager (preferred for v2 functions)
echo -n "YOUR_ADMIN_KEY" | CLOUDSDK_ACTIVE_CONFIG_NAME=hiapply \
gcloud secrets create ADMIN_KEY --data-file=- --project=applycodes-2683f
```
2. Redeploy the function after configuring.

---

### 4. `perplexitySearch` — 503 API Key Not Configured
**Severity:** Medium (affects AI search feature)
**Symptom:** `Perplexity API key not configured`
**Root Cause:** The Perplexity API key is not provisioned in the function's runtime secrets.
**Fix:**
1. Add the key to Secret Manager:
```bash
echo -n "YOUR_PERPLEXITY_API_KEY" | CLOUDSDK_ACTIVE_CONFIG_NAME=hiapply \
gcloud secrets create PERPLEXITY_API_KEY --data-file=- --project=applycodes-2683f
```
2. Grant the function's service account access to the secret.
3. Redeploy the function:
```bash
CLOUDSDK_ACTIVE_CONFIG_NAME=hiapply \
firebase deploy --only functions:perplexitySearch --project applycodes-2683f
```

---

## Additional Notes

- **GitHub Dependabot:** 58 vulnerabilities flagged (2 critical, 38 high, 15 moderate, 3 low). Review at: https://github.com/hiapplyco/apply-codes/security/dependabot
- **Auth fix deployed:** MainLayout now waits for Firebase auth to load before redirecting — login flow should work correctly.
- **Env vars populated:** `NEXT_PUBLIC_GEMINI_API_KEY`, `NEXT_PUBLIC_GOOGLE_API_KEY`, and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` are now set in `.env.local`.
- **gcloud configs isolated:** `hiapply` and `slamsports` configs with `.envrc` auto-switching — no more cross-contamination risk.
