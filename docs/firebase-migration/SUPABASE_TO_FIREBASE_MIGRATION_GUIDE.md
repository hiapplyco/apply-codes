# Supabase to Firebase Migration Guide

## Overview

This guide walks you through migrating Firebase Cloud Functions from Supabase to Firebase, based on our successful migration of the `perplexity-search` function. Follow these steps for each remaining Supabase-dependent function.

## Remaining Functions to Migrate

The following functions are currently disabled and need migration:

1. ✅ ~~perplexity-search~~ (COMPLETE)
2. ⏳ handle-interview
3. ⏳ github-profile
4. ⏳ process-text-extraction
5. ⏳ generate-dashboard-metrics

## Migration Strategy

### Phase 1: Identify Dependencies
### Phase 2: Update Cloud Function Code
### Phase 3: Update Firestore Security Rules
### Phase 4: Test & Deploy

---

## Phase 1: Identify Dependencies

Before modifying any code, identify what Supabase services the function uses.

### Step 1.1: Check for Supabase Imports

```bash
cd /Users/jms/Development/apply-codes/functions
grep -n "@supabase/supabase-js" <function-name>.js
```

**Example from perplexity-search.js:**
```javascript
// BEFORE:
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);
```

### Step 1.2: Identify Supabase Services Used

Search the function file for common Supabase patterns:

| Supabase Pattern | Firebase Equivalent | Migration Complexity |
|-----------------|---------------------|---------------------|
| `supabase.from('table').select()` | `firestore().collection('table').get()` | Medium |
| `supabase.from('table').insert()` | `firestore().collection('table').add()` | Medium |
| `supabase.from('table').update()` | `firestore().doc('id').update()` | Medium |
| `supabase.storage.from('bucket')` | `storage().bucket()` | High |
| `supabase.auth.getUser()` | `auth().verifyIdToken()` | High |

**Command to find all Supabase calls:**
```bash
grep -n "supabase\." <function-name>.js
```

### Step 1.3: Document Current Behavior

Before changing anything, document:
- What database tables/collections does it read from?
- What database tables/collections does it write to?
- What fields does it expect in the data?
- Does it use Storage? If so, which buckets?
- Does it check authentication?

---

## Phase 2: Update Cloud Function Code

### Step 2.1: Update Imports

**Remove Supabase imports:**
```javascript
// ❌ REMOVE:
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
```

**Add Firebase imports:**
```javascript
// ✅ ADD:
const admin = require('firebase-admin');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}
```

### Step 2.2: Update Function Declaration

Ensure you're using Firebase Functions v2 format:

```javascript
// ✅ CORRECT (v2):
const { onRequest } = require('firebase-functions/v2/https');

exports.functionName = onRequest({
  cors: true,
  maxInstances: 10,
  invoker: 'public',  // Required for CORS to work
}, async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Your function logic here
});
```

**❌ AVOID v1 format:**
```javascript
// Old v1 format - DO NOT USE
const functions = require('firebase-functions');
exports.functionName = functions.https.onRequest((req, res) => { ... });
```

### Step 2.3: Update Authentication

**Supabase Auth → Firebase Auth:**

```javascript
// ❌ BEFORE (Supabase):
const { data: { user }, error } = await supabase.auth.getUser(token);
if (error || !user) {
  return res.status(401).json({ error: 'Unauthorized' });
}
const userId = user.id;

// ✅ AFTER (Firebase):
const authHeader = req.headers.authorization;
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  res.status(401).json({ error: 'Unauthorized - No token provided' });
  return;
}

const token = authHeader.replace('Bearer ', '');

try {
  const decodedToken = await admin.auth().verifyIdToken(token);
  const userId = decodedToken.uid;

  // Continue with authenticated logic
} catch (authError) {
  console.error('Auth error:', authError);
  res.status(401).json({ error: 'Unauthorized - Invalid token' });
  return;
}
```

### Step 2.4: Update Database Operations

#### Reading Data

```javascript
// ❌ BEFORE (Supabase):
const { data, error } = await supabase
  .from('searches')
  .select('*')
  .eq('userId', userId);

if (error) throw error;

// ✅ AFTER (Firebase):
const snapshot = await admin.firestore()
  .collection('searches')
  .where('userId', '==', userId)
  .get();

const data = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

#### Writing Data

```javascript
// ❌ BEFORE (Supabase):
const { data, error } = await supabase
  .from('searches')
  .insert({
    userId: userId,
    query: query,
    results: results,
    created_at: new Date().toISOString()
  });

if (error) throw error;

// ✅ AFTER (Firebase):
const searchRecord = {
  userId: userId,
  query: query,
  results: results,
  createdAt: admin.firestore.FieldValue.serverTimestamp()
};

const docRef = await admin.firestore()
  .collection('searches')
  .add(searchRecord);

console.log('Search record saved with ID:', docRef.id);
```

#### Updating Data

```javascript
// ❌ BEFORE (Supabase):
const { error } = await supabase
  .from('searches')
  .update({ status: 'completed' })
  .eq('id', searchId);

// ✅ AFTER (Firebase):
await admin.firestore()
  .collection('searches')
  .doc(searchId)
  .update({ status: 'completed' });
```

### Step 2.5: Update Storage Operations

```javascript
// ❌ BEFORE (Supabase Storage):
const { data, error } = await supabase.storage
  .from('docs')
  .upload(`${userId}/${fileName}`, file.buffer, {
    contentType: file.mimetype,
    upsert: true
  });

if (error) throw error;

// ✅ AFTER (Firebase Storage):
const bucket = admin.storage().bucket();
const fileRef = bucket.file(`docs/${userId}/${fileName}`);

await fileRef.save(file.buffer, {
  metadata: {
    contentType: file.mimetype,
    metadata: {
      originalName: file.originalname,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString()
    }
  }
});

console.log('File uploaded to Firebase Storage successfully');
```

### Step 2.6: Field Name Conventions

**Important:** Firestore uses camelCase, Supabase often uses snake_case.

| Supabase Field | Firebase Field |
|---------------|---------------|
| `user_id` | `userId` |
| `created_at` | `createdAt` |
| `updated_at` | `updatedAt` |
| `project_id` | `projectId` |

**Update all field references:**
```javascript
// ❌ BEFORE:
resource.data.user_id
resource.data.created_at

// ✅ AFTER:
resource.data.userId
resource.data.createdAt
```

### Step 2.7: Update exports in index.js

After migrating a function, ensure it's exported in `/functions/index.js`:

```javascript
// Add import at top
const { yourFunctionName } = require('./your-function-name');

// Add export at bottom
exports.yourFunctionName = yourFunctionName;
```

---

## Phase 3: Update Firestore Security Rules

Every time you migrate a function that writes to Firestore, you MUST update security rules.

### Step 3.1: Understand Resource vs Request Resource

**Critical distinction:**

| Rule Type | Use `resource.data` | Use `request.resource.data` |
|-----------|-------------------|---------------------------|
| `read` | ✅ YES - document exists | ❌ NO |
| `create` | ❌ NO - document doesn't exist yet | ✅ YES |
| `update` | ✅ YES for existing fields | ✅ YES for new/changed fields |
| `delete` | ✅ YES - document exists | ❌ NO |

### Step 3.2: Common Rule Pattern

For most collections where users can only access their own data:

```javascript
match /collectionName/{docId} {
  // Read existing documents
  allow read: if isAuthenticated() &&
    resource.data.userId == request.auth.uid;

  // Create new documents - use request.resource.data
  allow create: if isAuthenticated() &&
    request.resource.data.userId == request.auth.uid;

  // Update/delete existing documents - use resource.data
  allow update, delete: if isAuthenticated() &&
    resource.data.userId == request.auth.uid;
}
```

### Step 3.3: Update firestore.rules File

Edit `/Users/jms/Development/apply-codes/firebase/firestore.rules`:

**Example from perplexity-search migration:**

```javascript
// ✅ CORRECT:
match /contextItems/{itemId} {
  allow read: if isAuthenticated() &&
    resource.data.user_id == request.auth.uid;
  allow create: if isAuthenticated() &&
    request.resource.data.userId == request.auth.uid;
  allow update, delete: if isAuthenticated() &&
    resource.data.userId == request.auth.uid;
}

match /searches/{searchId} {
  allow read: if isAuthenticated() &&
    resource.data.userId == request.auth.uid;
  allow create: if isAuthenticated() &&
    request.resource.data.userId == request.auth.uid;
  allow update, delete: if isAuthenticated() &&
    resource.data.userId == request.auth.uid;
}
```

**❌ WRONG - This will fail on creates:**
```javascript
match /contextItems/{itemId} {
  allow read, write: if isAuthenticated() &&
    resource.data.user_id == request.auth.uid;  // ❌ resource.data doesn't exist on create!
}
```

### Step 3.4: Deploy Rules

After updating `firestore.rules`, deploy them:

```bash
cd /Users/jms/Development/apply-codes
firebase deploy --only firestore:rules
```

**Expected output:**
```
✔  cloud.firestore: rules file firebase/firestore.rules compiled successfully
✔  firestore: released rules firebase/firestore.rules to cloud.firestore
✔  Deploy complete!
```

---

## Phase 4: Test & Deploy

### Step 4.1: Test Locally (Optional)

```bash
cd /Users/jms/Development/apply-codes/functions
npm run serve
```

This starts the Firebase emulator for local testing.

### Step 4.2: Deploy the Function

```bash
cd /Users/jms/Development/apply-codes
firebase deploy --only functions:<functionName>
```

**Example:**
```bash
firebase deploy --only functions:perplexitySearch
```

### Step 4.3: Set Permissions (First Time Only)

After first deployment, you MUST set Cloud Run Invoker permissions:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Cloud Run** (not Cloud Functions)
3. Find your function (e.g., `perplexitysearch`)
4. Click **Permissions** tab
5. Click **Grant Access**
6. Principal: `allUsers`
7. Role: **Cloud Run Invoker**
8. Save

**Without this step, you'll get CORS 403 errors.**

### Step 4.4: Add Environment Variables

If your function needs API keys or secrets:

1. Add to `/functions/.env`:
   ```
   YOUR_API_KEY=your-key-here
   ```

2. Redeploy the function:
   ```bash
   firebase deploy --only functions:<functionName>
   ```

3. Access in code:
   ```javascript
   const apiKey = process.env.YOUR_API_KEY;
   ```

### Step 4.5: Test End-to-End

1. Open your app in the browser
2. Trigger the function from the UI
3. Check browser console for errors
4. Check Firebase Console → Functions → Logs for server-side logs
5. Check Firestore to verify data was written correctly

---

## Common Errors & Solutions

### Error: "ArrayBufferView is not defined"

**Cause:** Using `instanceof ArrayBufferView` in client code

**Solution:**
```javascript
// ❌ WRONG:
if (body instanceof ArrayBufferView) { ... }

// ✅ CORRECT:
if (ArrayBuffer.isView(body)) { ... }
```

**Location:** Check `src/lib/function-bridge.ts`

---

### Error: "Missing or insufficient permissions"

**Cause:** Firestore security rules are wrong or not deployed

**Solutions:**

1. **Check rule syntax:**
   - Use `request.resource.data` for creates
   - Use `resource.data` for reads/updates/deletes

2. **⚠️ CRITICAL: Check collection AND field names match exactly:**

   **Common mismatch:** Your client code might use snake_case but your rules use camelCase (or vice versa).

   **How to find the correct names:**
   ```bash
   # Search your client code to find what collection name is used
   grep -r "from('.*')" src/
   grep -r "collection('.*')" src/

   # Example output:
   # src/components/MinimalSearchForm.tsx:  .from<ContextItem>('context_items')
   #                                                    ^^^^^^^^^^^^^^
   #                                                    This is the actual collection name!
   ```

   **Then check what field names the client sends:**
   ```bash
   # Look at the insert/create calls
   grep -A5 "from('context_items')" src/components/MinimalSearchForm.tsx

   # Example output:
   # .insert({
   #   ...item,
   #   user_id: userId,  ← This is snake_case!
   #   project_id: selectedProject?.id,
   #   created_at: new Date().toISOString()
   # });
   ```

   **Update Firestore rules to match EXACTLY:**
   ```javascript
   // ❌ WRONG - Doesn't match client code:
   match /contextItems/{itemId} {  // Client uses 'context_items'
     allow create: if request.resource.data.userId == request.auth.uid;  // Client sends 'user_id'
   }

   // ✅ CORRECT - Matches client code exactly:
   match /context_items/{itemId} {  // Matches client's 'context_items'
     allow read: if isAuthenticated() &&
       resource.data.user_id == request.auth.uid;  // Matches 'user_id'
     allow create: if isAuthenticated() &&
       request.resource.data.user_id == request.auth.uid;  // Matches 'user_id'
     allow update, delete: if isAuthenticated() &&
       resource.data.user_id == request.auth.uid;  // Matches 'user_id'
   }
   ```

3. **Deploy rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

4. **Check Firebase Console:**
   - Go to Firestore → Rules
   - Verify your rules are deployed
   - Check the timestamp

**Pro tip:** When in doubt, check your actual Firestore database in the Firebase Console to see what collection names and field names already exist!

---

### Error: "CORS policy: Response to preflight request doesn't pass"

**Cause:** Function not publicly invocable

**Solutions:**

1. **Add `invoker: 'public'` to function options:**
   ```javascript
   exports.functionName = onRequest({
     cors: true,
     invoker: 'public',  // ← Add this
   }, async (req, res) => { ... });
   ```

2. **Set Cloud Run permissions:**
   - Google Cloud Console → Cloud Run → your-function → Permissions
   - Grant `Cloud Run Invoker` role to `allUsers`

3. **Add CORS headers:**
   ```javascript
   res.set('Access-Control-Allow-Origin', '*');
   res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
   res.set('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

   if (req.method === 'OPTIONS') {
     res.status(204).send('');
     return;
   }
   ```

---

### Error: "Cannot find module '@supabase/supabase-js'"

**Cause:** Function still importing Supabase

**Solution:** Remove all Supabase imports and replace with Firebase Admin SDK

```javascript
// ❌ REMOVE:
const { createClient } = require('@supabase/supabase-js');

// ✅ ADD:
const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp();
}
```

---

### Error: "npm ci can only install packages when your package.json and package-lock.json are in sync"

**Cause:** Package versions changed but lock file not updated

**Solution:**
```bash
cd /Users/jms/Development/apply-codes/functions
npm install
git add package-lock.json
git commit -m "chore: update package-lock.json"
```

---

### Error: "CPU configuration conflict... because they are GCF gen 1"

**Cause:** Mixing Firebase Functions v1 and v2

**Solution:** Ensure ALL functions use v2 format:

```javascript
// ✅ Use this:
const { onRequest } = require('firebase-functions/v2/https');

exports.functionName = onRequest({
  cors: true,
  maxInstances: 10,
  invoker: 'public',
}, async (req, res) => { ... });
```

---

## Migration Checklist Template

Use this checklist for each function migration:

### Function: `_________________`

#### Pre-Migration
- [ ] Read and understand current function code
- [ ] Document what Supabase services it uses (Database, Storage, Auth)
- [ ] Document what tables/collections it reads/writes
- [ ] Document expected input/output format
- [ ] Identify all Supabase imports and calls

#### Code Migration
- [ ] Remove Supabase imports
- [ ] Add Firebase Admin imports
- [ ] Initialize Firebase Admin
- [ ] Update function declaration to v2 format
- [ ] Add CORS headers and OPTIONS handling
- [ ] Add `invoker: 'public'` to options
- [ ] Update authentication logic
- [ ] Update database read operations
- [ ] Update database write operations
- [ ] Update storage operations (if any)
- [ ] Convert snake_case fields to camelCase
- [ ] Update timestamps (use `admin.firestore.FieldValue.serverTimestamp()`)
- [ ] Update exports in `functions/index.js`
- [ ] Remove function from "disabled" comments in index.js

#### Firestore Rules
- [ ] Identify all collections the function writes to
- [ ] Update `firebase/firestore.rules` for each collection
- [ ] Separate create/read/update/delete rules
- [ ] Use `request.resource.data` for creates
- [ ] Use `resource.data` for reads/updates/deletes
- [ ] Use camelCase field names
- [ ] Deploy rules: `firebase deploy --only firestore:rules`
- [ ] Verify rules in Firebase Console

#### Deployment
- [ ] Test locally with emulator (optional)
- [ ] Add any required environment variables to `.env`
- [ ] Deploy function: `firebase deploy --only functions:<name>`
- [ ] Set Cloud Run Invoker permissions to `allUsers`
- [ ] Check deployment logs for errors
- [ ] Verify function appears in Firebase Console

#### Testing
- [ ] Test function from UI
- [ ] Check browser console for errors
- [ ] Check Firebase Functions logs
- [ ] Verify data written to Firestore correctly
- [ ] Verify auth token is validated
- [ ] Test error cases (missing params, invalid auth, etc.)

#### Documentation
- [ ] Update function comments
- [ ] Update API documentation (if any)
- [ ] Mark function as ✅ migrated in this guide
- [ ] Note any gotchas or special considerations

---

## Function-Specific Notes

### perplexity-search ✅ COMPLETE

**Collections written:**
- `searches` - Stores Perplexity API responses
- (Client also writes to `contextItems`)

**Special considerations:**
- Perplexity API key required in `.env`
- Returns Perplexity response directly to client
- Client is responsible for saving to contextItems

**Status:** Fully migrated and tested

---

### handle-interview ⏳ TODO

**Expected Supabase usage:**
- Database: Likely reads/writes interview records
- Auth: Validates user

**Migration priority:** Medium

**Estimated complexity:** Medium

---

### github-profile ⏳ TODO

**Expected Supabase usage:**
- Database: Stores GitHub profile data
- Possible external API calls to GitHub

**Migration priority:** Low

**Estimated complexity:** Medium

---

### process-text-extraction ⏳ TODO

**Expected Supabase usage:**
- Database: Stores extracted text
- Storage: May read uploaded documents

**Migration priority:** High (if used for document processing)

**Estimated complexity:** High

---

### generate-dashboard-metrics ⏳ TODO

**Expected Supabase usage:**
- Database: Reads multiple tables to calculate metrics
- Complex queries likely

**Migration priority:** High (dashboard feature)

**Estimated complexity:** High

---

## Quick Reference: Supabase → Firebase Cheat Sheet

| Operation | Supabase | Firebase |
|-----------|----------|----------|
| **Initialize** | `createClient(url, key)` | `admin.initializeApp()` |
| **Auth - Verify** | `supabase.auth.getUser(token)` | `admin.auth().verifyIdToken(token)` |
| **Auth - Get UID** | `user.id` | `decodedToken.uid` |
| **DB - Collection** | `supabase.from('table')` | `admin.firestore().collection('table')` |
| **DB - Read All** | `.select('*')` | `.get()` |
| **DB - Filter** | `.eq('field', value)` | `.where('field', '==', value)` |
| **DB - Insert** | `.insert(data)` | `.add(data)` |
| **DB - Update** | `.update(data).eq('id', id)` | `.doc(id).update(data)` |
| **DB - Delete** | `.delete().eq('id', id)` | `.doc(id).delete()` |
| **DB - Timestamp** | `new Date().toISOString()` | `admin.firestore.FieldValue.serverTimestamp()` |
| **Storage - Upload** | `supabase.storage.from('bucket').upload()` | `admin.storage().bucket().file().save()` |
| **Storage - Download** | `supabase.storage.from('bucket').download()` | `admin.storage().bucket().file().download()` |

---

## Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Functions v2 Documentation](https://firebase.google.com/docs/functions/beta/http-events)
- [Cloud Run Invoker Permissions](https://cloud.google.com/run/docs/authenticating/public)

---

## Adding New API Integrations

When integrating external APIs (like Perplexity, OpenAI, etc.) with Firebase Functions, follow this pattern:

### 1. Create the Cloud Function

**Location:** `/functions/<api-name>.js`

**Template:**
```javascript
const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const axios = require('axios');

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.apiName = onRequest({
  cors: true,
  maxInstances: 10,
  invoker: 'public',
}, async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // 1. Authenticate user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // 2. Get API key from environment
    const apiKey = process.env.YOUR_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'API key not configured' });
      return;
    }

    // 3. Parse request body
    const { query, projectId } = req.body || {};
    if (!query) {
      res.status(400).json({ error: 'Query required' });
      return;
    }

    // 4. Call external API
    const apiResponse = await axios.post(
      'https://api.example.com/endpoint',
      { query },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // 5. Store result in Firestore
    const searchRecord = {
      userId: userId,
      projectId: projectId || null,
      query: query,
      response: apiResponse.data,
      answerText: apiResponse.data.result || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await admin.firestore()
      .collection('searches')
      .add(searchRecord);

    // 6. Return response
    res.status(200).json({
      ...apiResponse.data,
      searchId: docRef.id
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      details: error.message
    });
  }
});
```

### 2. Add to functions/index.js

```javascript
// Import
const { yourApiName } = require('./your-api-name');

// Export
exports.yourApiName = yourApiName;
```

### 3. Add Environment Variable

In `/functions/.env`:
```
YOUR_API_KEY=your-actual-key-here
```

### 4. Deploy

```bash
firebase deploy --only functions:yourApiName
```

### 5. Set Cloud Run Permissions

1. Go to Google Cloud Console → Cloud Run
2. Find your function
3. Permissions → Grant Access
4. Principal: `allUsers`
5. Role: **Cloud Run Invoker**

### 6. Update Firestore Rules

If storing results in a new collection:

```javascript
match /your_collection/{docId} {
  allow read: if isAuthenticated() &&
    resource.data.userId == request.auth.uid;
  allow create: if isAuthenticated() &&
    request.resource.data.userId == request.auth.uid;
  allow update, delete: if isAuthenticated() &&
    resource.data.userId == request.auth.uid;
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

### 7. Create Client-Side Component

**Beautiful Results Display Example (Perplexity):**

Create `/src/components/<api>/ResultComponent.tsx`:

```typescript
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ExternalLink, Sparkles } from 'lucide-react';

interface ResultProps {
  content: string;
  citations?: string[];
  query?: string;
}

export function ApiResult({ content, citations, query }: ResultProps) {
  return (
    <div className="space-y-4">
      {query && (
        <div className="flex items-start gap-2 pb-3 border-b">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <p className="text-sm text-gray-700 italic">"{query}"</p>
        </div>
      )}

      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          components={{
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 underline"
              >
                {children}
                <ExternalLink className="w-3 h-3 inline ml-1" />
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {citations && citations.length > 0 && (
        <div className="pt-3 border-t">
          <h4 className="text-xs font-semibold mb-2">
            Sources ({citations.length})
          </h4>
          <div className="space-y-1">
            {citations.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-600 hover:text-purple-700 flex items-center gap-2"
              >
                <span className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center text-xs">
                  {i + 1}
                </span>
                {url}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 8. Common Pitfalls

✅ **DO:**
- Use Firebase Functions v2 (`firebase-functions/v2/https`)
- Add `invoker: 'public'` for CORS
- Set Cloud Run Invoker permissions
- Store API keys in `.env` file
- Match collection/field names EXACTLY between rules and client code
- Extract and store relevant metadata (citations, sources, etc.)

❌ **DON'T:**
- Use Functions v1 format
- Forget to handle OPTIONS preflight requests
- Hardcode API keys in code
- Assume camelCase/snake_case - always verify
- Return raw markdown without rendering
- Skip Firestore rules deployment

---

## Migration Status

Last updated: 2025-10-12

| Function | Status | Migrated By | Date | Notes |
|----------|--------|-------------|------|-------|
| perplexity-search | ✅ Complete | Claude | 2025-10-12 | Fully tested |
| handle-interview | ⏳ Pending | - | - | Temporarily disabled |
| github-profile | ⏳ Pending | - | - | Temporarily disabled |
| process-text-extraction | ⏳ Pending | - | - | Temporarily disabled |
| generate-dashboard-metrics | ⏳ Pending | - | - | Temporarily disabled |

---

## Questions?

If you encounter issues not covered in this guide:

1. Check Firebase Functions logs: `firebase functions:log`
2. Check browser console for client-side errors
3. Check Firestore rules are deployed: Firebase Console → Firestore → Rules
4. Verify Cloud Run permissions: Google Cloud Console → Cloud Run → [function] → Permissions

**Common gotchas:**
- Forgot to deploy Firestore rules
- Using `resource.data` instead of `request.resource.data` for creates
- Forgot to set Cloud Run Invoker permissions
- Using snake_case instead of camelCase field names
- Missing environment variables in `.env` file
