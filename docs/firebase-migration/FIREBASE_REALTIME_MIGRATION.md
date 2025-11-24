# Firebase Real-time Migration Documentation

## Overview

This document describes the migration from Supabase Realtime subscriptions to Firebase Firestore real-time listeners across the Apply.codes platform. The migration affects three core hooks that handle real-time functionality.

## Migration Summary

### Files Migrated
- `src/hooks/useCollaboration.ts` - Presence tracking
- `src/hooks/useChat.ts` - Chat message updates
- `src/hooks/useSubscription.ts` - Subscription changes

### Migration Status: ✅ COMPLETED

## Key Implementation Differences

### 1. useCollaboration.ts - Presence Tracking

#### Supabase Implementation (Before)
```typescript
// Used Supabase Presence channels for real-time collaboration
const channel = supabase
  .channel(`${presenceChannel}:${documentId}`)
  .on('presence', { event: 'sync' }, handlePresenceSync)
  .on('presence', { event: 'join' }, handleUserJoin)
  .on('presence', { event: 'leave' }, handleUserLeave)
  .subscribe();

// Real-time presence tracking with automatic sync
await channel.track({
  user_id: user.id,
  name: user.user_metadata?.full_name,
  cursor: { x, y },
  last_seen: new Date().toISOString()
});
```

#### Firebase Implementation (After)
```typescript
// Custom presence implementation using Firestore documents
const presenceDocRef = doc(db, 'presence', `${user.id}_${documentId}`);

// Manual presence tracking with heartbeat
await setDoc(presenceDocRef, {
  userId: user.id,
  documentId,
  name: user.email,
  lastSeen: serverTimestamp(),
  isOnline: true,
  cursor: null
});

// Real-time listener for all presence documents
const presenceQuery = query(
  collection(db, 'presence'),
  where('documentId', '==', documentId),
  where('isOnline', '==', true)
);

onSnapshot(presenceQuery, (snapshot) => {
  // Process presence updates
});
```

#### Key Differences:
- **No built-in presence**: Firebase doesn't have native presence channels, requires custom implementation
- **Manual heartbeat**: 30-second interval to update `lastSeen` timestamp
- **Cleanup handling**: Manual cleanup on page visibility change and beforeunload
- **Offline detection**: Uses timestamp comparison (2-minute threshold) to determine if users are still online
- **Document-based**: Each user-document combination gets its own Firestore document

### 2. useChat.ts - Message Updates

#### Supabase Implementation (Before)
```typescript
// Direct database table subscriptions
const subscription = supabase
  .channel('chat_messages')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'chat_messages',
    filter: `session_id=eq.${sessionId}`
  }, handleMessageUpdate)
  .subscribe();

// Edge function calls
await supabase.functions.invoke('process-chat-message', {
  body: { message, sessionId, history }
});
```

#### Firebase Implementation (After)
```typescript
// Firestore real-time queries
const messagesQuery = query(
  collection(db, 'chat_messages'),
  where('sessionId', '==', callId),
  orderBy('timestamp', 'asc')
);

onSnapshot(messagesQuery, (snapshot) => {
  const messages = [];
  snapshot.forEach((doc) => {
    messages.push({ id: doc.id, ...doc.data() });
  });
  setMessages(messages);
});

// Firebase Cloud Functions
const response = await fetch(`${functionUrl}/process-chat-message`, {
  method: 'POST',
  body: JSON.stringify({ message, sessionId, history })
});
```

#### Key Differences:
- **Collection-based**: Uses Firestore collections instead of PostgreSQL tables
- **Manual ordering**: Explicit `orderBy('timestamp', 'asc')` required
- **HTTP functions**: Cloud Functions use HTTP endpoints instead of RPC calls
- **Document IDs**: Firestore auto-generates document IDs vs. PostgreSQL sequences
- **Real-time queries**: Uses `where()` clauses instead of RLS filters

### 3. useSubscription.ts - Subscription Changes

#### Supabase Implementation (Before)
```typescript
// Postgres changes subscription with RLS filter
const subscription = supabaseClient
  .channel('subscription_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'user_subscription_details',
    filter: `user_id=eq.${user.id}`
  }, () => fetchSubscription())
  .subscribe();
```

#### Firebase Implementation (After)
```typescript
// Document-specific listener
const subscriptionDocRef = doc(db, 'user_subscription_details', user.id);

onSnapshot(subscriptionDocRef, (doc) => {
  if (doc.exists()) {
    processSubscriptionData(doc.data());
  } else {
    createDefaultSubscription();
  }
});
```

#### Key Differences:
- **Document-centric**: One document per user instead of table rows
- **User ID as document ID**: Direct document access vs. query filtering
- **Field naming**: camelCase fields (`searchesLimit`) vs. snake_case (`searches_limit`)
- **Timestamp handling**: Firebase `serverTimestamp()` vs. PostgreSQL `now()`

## Firebase Firestore Patterns Used

### 1. Real-time Listeners
```typescript
// Single document listener
const unsubscribe = onSnapshot(docRef, (doc) => {
  if (doc.exists()) {
    handleDataUpdate(doc.data());
  }
});

// Collection query listener
const unsubscribe = onSnapshot(query, (snapshot) => {
  snapshot.forEach((doc) => {
    handleDocumentChange(doc.id, doc.data());
  });
});
```

### 2. Cleanup Pattern
```typescript
useEffect(() => {
  let unsubscribe: (() => void) | undefined;

  const setupListener = () => {
    unsubscribe = onSnapshot(ref, callback);
  };

  setupListener();

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}, [dependencies]);
```

### 3. Error Handling
```typescript
onSnapshot(
  query,
  (snapshot) => {
    // Success callback
  },
  (error) => {
    console.error('Firestore listener error:', error);
    // Handle error state
  }
);
```

## Performance Considerations

### Advantages of Firebase Implementation
- **Real-time updates**: Immediate propagation of changes
- **Offline support**: Firestore provides automatic offline caching
- **Scalability**: Firestore scales automatically with usage
- **Security**: Document-level security rules

### Potential Concerns
- **Manual presence management**: Requires custom heartbeat and cleanup logic
- **Connection costs**: Each real-time listener counts as a connection
- **Query complexity**: More complex querying compared to SQL
- **Document size limits**: 1MB per document limit in Firestore

## Testing Strategy

### Manual Testing Required
Since Firebase requires actual Firebase connections, manual testing is recommended:

1. **Presence Testing**:
   - Open multiple browser tabs
   - Verify users appear/disappear in real-time
   - Test cursor position updates
   - Verify cleanup on tab close

2. **Chat Testing**:
   - Send messages between users
   - Verify real-time message delivery
   - Test message ordering
   - Verify session persistence

3. **Subscription Testing**:
   - Update subscription in Firebase console
   - Verify real-time updates in UI
   - Test usage limit updates
   - Verify feature access changes

### Required Environment Variables
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_FUNCTIONS_URL=
```

## Firestore Collections Structure

### presence
```typescript
{
  userId: string;
  documentId: string;
  name: string;
  avatar?: string;
  lastSeen: Timestamp;
  isOnline: boolean;
  cursor?: { x: number; y: number };
}
```

### chat_messages
```typescript
{
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: string[];
  timestamp: Timestamp;
  userId: string;
}
```

### user_subscription_details
```typescript
{
  userId: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
  tier: 'free_trial' | 'starter' | 'professional' | 'enterprise';
  trialStartDate: string;
  trialEndDate: string;
  currentPeriodEnd?: string;
  canceledAt?: string;
  cancelAtPeriodEnd: boolean;
  // Limits
  searchesLimit: number;
  candidatesEnrichedLimit: number;
  aiCallsLimit: number;
  videoInterviewsLimit: number;
  projectsLimit: number;
  teamMembersLimit: number;
  // Usage counts
  searchesCount: number;
  candidatesEnrichedCount: number;
  aiCallsCount: number;
  videoInterviewsCount: number;
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Security Rules Required

The following Firestore security rules should be implemented:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Presence documents - users can read/write their own and read others
    match /presence/{presenceId} {
      allow read: if true; // Allow reading all presence for collaboration
      allow write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
      allow delete: if request.auth != null &&
        request.auth.uid == resource.data.userId;
    }

    // Chat messages - users can read/write messages in their sessions
    match /chat_messages/{messageId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
    }

    // User subscriptions - users can only access their own
    match /user_subscription_details/{userId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == userId;
    }
  }
}
```

## Migration Verification Checklist

- [x] useCollaboration.ts migrated to Firebase
- [x] useChat.ts migrated to Firebase
- [x] useSubscription.ts migrated to Firebase
- [x] Proper cleanup of all listeners
- [x] Error handling implemented
- [x] TypeScript types updated
- [ ] Manual testing completed
- [ ] Security rules deployed
- [ ] Performance monitoring setup

## Known Limitations

1. **Presence Accuracy**: Custom presence detection may be less accurate than Supabase's native implementation
2. **Offline Handling**: Requires additional logic for robust offline presence management
3. **Real-time Costs**: Firebase charges per listener connection and document reads
4. **Complex Queries**: Some SQL queries may need restructuring for Firestore

## Future Improvements

1. **Enhanced Presence**: Implement Firebase Realtime Database for more accurate presence
2. **Optimistic Updates**: Add optimistic UI updates for better perceived performance
3. **Connection Pooling**: Optimize listener connections to reduce costs
4. **Advanced Querying**: Consider compound indexes for complex queries

---

**Migration Completed**: 2025-01-29
**Migrated By**: Claude Code Assistant
**Status**: Ready for Manual Testing