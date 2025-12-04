# Admin: Grant Pro Access

This document explains how to grant free Pro access to users without requiring payment.

## Quick Start

Grant 1 year of Pro access to a user by email:

```bash
curl -X POST https://us-central1-applycodes-2683f.cloudfunctions.net/grantProAccess \
  -H "Content-Type: application/json" \
  -H "x-admin-key: apply-admin-2024" \
  -d '{"email": "user@example.com", "days": 365}'
```

## API Reference

### Endpoint

```
POST https://us-central1-applycodes-2683f.cloudfunctions.net/grantProAccess
```

### Headers

| Header | Required | Value |
|--------|----------|-------|
| `Content-Type` | Yes | `application/json` |
| `x-admin-key` | Yes | `apply-admin-2024` |

### Request Body

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `email` | string | Yes* | - | User's email address |
| `uid` | string | Yes* | - | User's Firebase UID |
| `days` | number | No | 365 | Duration of Pro access in days |

> *Either `email` or `uid` is required. If both are provided, `uid` takes precedence.

### Response

**Success (200)**
```json
{
  "success": true,
  "message": "Pro access granted to user@example.com",
  "userId": "abc123xyz",
  "email": "user@example.com",
  "tier": "pro",
  "status": "active",
  "expiresAt": "2026-12-04T05:29:05.578Z",
  "days": 365
}
```

**Error (401) - Invalid admin key**
```json
{
  "error": "Invalid admin key"
}
```

**Error (400) - Missing parameters**
```json
{
  "error": "Must provide email or uid"
}
```

**Error (500) - User not found or server error**
```json
{
  "error": "There is no user record corresponding to the provided identifier."
}
```

## Examples

### Grant 1 Year Pro Access (Default)

```bash
curl -X POST https://us-central1-applycodes-2683f.cloudfunctions.net/grantProAccess \
  -H "Content-Type: application/json" \
  -H "x-admin-key: apply-admin-2024" \
  -d '{"email": "john@example.com"}'
```

### Grant 30 Days Pro Access

```bash
curl -X POST https://us-central1-applycodes-2683f.cloudfunctions.net/grantProAccess \
  -H "Content-Type: application/json" \
  -H "x-admin-key: apply-admin-2024" \
  -d '{"email": "john@example.com", "days": 30}'
```

### Grant Access by User UID

```bash
curl -X POST https://us-central1-applycodes-2683f.cloudfunctions.net/grantProAccess \
  -H "Content-Type: application/json" \
  -H "x-admin-key: apply-admin-2024" \
  -d '{"uid": "BgVPjtaYIXVWYlGBwqPuxfsOQwJ3", "days": 365}'
```

### Grant Lifetime Access (10 years)

```bash
curl -X POST https://us-central1-applycodes-2683f.cloudfunctions.net/grantProAccess \
  -H "Content-Type: application/json" \
  -H "x-admin-key: apply-admin-2024" \
  -d '{"email": "vip@example.com", "days": 3650}'
```

## What Pro Access Includes

When Pro access is granted, the user receives:

| Feature | Limit |
|---------|-------|
| Boolean Searches | Unlimited |
| Candidate Enrichment | Unlimited |
| AI Calls | Unlimited |
| Video Interviews | Unlimited |
| Projects | 25 |
| Team Members | 5 |

## Finding User Information

### Export All Users

```bash
firebase auth:export users.json --format=json
```

### Search for a User

```bash
cat users.json | grep -i "searchterm"
```

### Get User Details by Email

```bash
cat users.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
email = 'user@example.com'
users = [u for u in data['users'] if u.get('email') == email]
print(json.dumps(users, indent=2))
"
```

## Security

### Changing the Admin Key

The admin key is set in the Firebase function. To change it:

1. Edit `functions/.env`:
   ```
   ADMIN_SECRET_KEY=your-new-secret-key
   ```

2. Redeploy the function:
   ```bash
   firebase deploy --only functions:grantProAccess
   ```

### Authorized Admins (Callable Function)

The `adminGrantPro` callable function (for use within the app) restricts access to these admin emails:

- `james@hiapply.co`
- `jamesschlauch@gmail.com`
- `james@hiapply.com`

To add more admins, edit `functions/admin-grant-pro.js` and update the `adminEmails` array.

## Troubleshooting

### "User not found" Error

The email address doesn't exist in Firebase Auth. Verify the email:

```bash
firebase auth:export users.json --format=json
cat users.json | grep -i "the-email"
```

### "Invalid admin key" Error

Ensure you're using the correct admin key in the `x-admin-key` header.

### Access Not Showing for User

1. Have the user refresh their browser
2. Check the Firestore document directly:
   - Go to [Firebase Console](https://console.firebase.google.com/project/applycodes-2683f/firestore)
   - Navigate to `user_subscription_details` → User's UID
   - Verify `status: "active"` and `tier: "pro"`

## Manual Firestore Update

If the API isn't working, you can update directly in Firebase Console:

1. Go to [Firestore](https://console.firebase.google.com/project/applycodes-2683f/firestore)
2. Navigate to `user_subscription_details` collection
3. Find or create document with user's UID
4. Update these fields:
   ```
   status: "active"
   tier: "pro"
   currentPeriodEnd: "2026-12-04T00:00:00.000Z"  (future date)
   searchesLimit: null
   candidatesEnrichedLimit: null
   aiCallsLimit: null
   videoInterviewsLimit: null
   projectsLimit: 25
   teamMembersLimit: 5
   ```

## Related Files

- `functions/admin-grant-pro.js` - Cloud function implementation
- `src/hooks/useSubscription.ts` - Frontend subscription hook
- `src/components/subscription/TrialExpirationModal.tsx` - Trial expiration UI
