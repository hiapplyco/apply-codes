# Firestore Schema Design

## Overview
This document outlines the complete Firestore schema for migrating from Supabase PostgreSQL to Firebase Firestore.

## Design Principles
1. **Document-oriented**: Leverage Firestore's document model
2. **Denormalization**: Optimize for read performance
3. **Subcollections**: Use for 1-to-many relationships
4. **Security**: Implement user-based access control
5. **Scalability**: Design for horizontal scaling

## Collection Structure

### 1. Users Collection
```typescript
/users/{userId}
{
  // Profile Information
  id: string (userId),
  email: string,
  fullName: string,
  avatarUrl?: string,
  phoneNumber?: string,

  // Subscription Info (denormalized for quick access)
  subscription: {
    status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired',
    tier: 'free_trial' | 'starter' | 'professional' | 'enterprise',
    trialStartDate: Timestamp,
    trialEndDate: Timestamp,
    currentPeriodStart?: Timestamp,
    currentPeriodEnd?: Timestamp,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string,
  },

  // Usage Limits (reset monthly)
  usage: {
    searchesCount: number,
    candidatesEnrichedCount: number,
    aiCallsCount: number,
    videoInterviewsCount: number,
    periodStart: Timestamp,
    periodEnd: Timestamp,
  },

  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

#### Subcollections:

##### 1.1 Saved Candidates
```typescript
/users/{userId}/savedCandidates/{candidateId}
{
  id: string,
  name: string,
  linkedinUrl?: string,
  jobTitle?: string,
  company?: string,
  location?: string,
  seniorityLevel?: string,

  // Contact Information
  workEmail?: string,
  personalEmails?: string[],
  mobilePhone?: string,

  // Profile Data
  profileSummary?: string,
  skills?: string[],
  profileCompleteness?: number,

  // Search Context
  searchString?: string,
  source: string, // 'linkedin', 'indeed', etc.

  // Metadata
  notes?: string,
  tags?: string[],
  status: 'new' | 'contacted' | 'interviewing' | 'rejected' | 'hired',

  // References
  jobId?: string,
  projectIds?: string[], // Can belong to multiple projects

  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

##### 1.2 Search History
```typescript
/users/{userId}/searchHistory/{searchId}
{
  id: string,
  searchQuery: string,
  booleanQuery?: string,
  platform: 'linkedin' | 'indeed' | 'google',
  resultsCount: number,
  searchParams: Map<string, any>,
  isFavorite: boolean,
  tags?: string[],
  projectId?: string,
  createdAt: Timestamp,
}
```

##### 1.3 Google Accounts
```typescript
/users/{userId}/googleAccounts/{accountId}
{
  id: string,
  email: string,
  accessToken: string,
  refreshToken: string,
  tokenExpiresAt: Timestamp,
  scope: string,
  isActive: boolean,
  lastUsed: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### 2. Projects Collection
```typescript
/projects/{projectId}
{
  id: string,
  userId: string, // Owner
  members: string[], // Array of userIds with access
  name: string,
  description?: string,
  color: string, // Hex color
  icon: string, // Icon name
  candidatesCount: number,
  isArchived: boolean,
  metadata: Map<string, any>,
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

#### Subcollections:

##### 2.1 Project Candidates
```typescript
/projects/{projectId}/candidates/{candidateId}
{
  candidateRef: string, // Reference to /users/{userId}/savedCandidates/{candidateId}
  addedBy: string, // userId
  addedAt: Timestamp,
  notes?: string,
  tags?: string[],
}
```

##### 2.2 Project Scraped Data
```typescript
/projects/{projectId}/scrapedData/{dataId}
{
  id: string,
  url: string,
  title: string,
  content: string,
  metadata: Map<string, any>,
  scrapedAt: Timestamp,
  addedBy: string,
}
```

### 3. Jobs Collection
```typescript
/jobs/{jobId}
{
  id: string,
  userId: string,
  title: string,
  company: string,
  description: string,
  requirements?: string[],
  niceToHave?: string[],
  location?: string,
  remote?: boolean,
  salaryMin?: number,
  salaryMax?: number,
  status: 'draft' | 'active' | 'closed',
  candidatesCount: number,
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### 4. Subscriptions Collection
```typescript
/subscriptions/{userId}
{
  userId: string,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string,
  stripePriceId?: string,
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired',
  tier: 'free_trial' | 'starter' | 'professional' | 'enterprise',
  trialStartDate: Timestamp,
  trialEndDate: Timestamp,
  currentPeriodStart?: Timestamp,
  currentPeriodEnd?: Timestamp,
  canceledAt?: Timestamp,
  cancelAtPeriodEnd: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### 5. Billing History Collection
```typescript
/billingHistory/{billId}
{
  id: string,
  userId: string,
  subscriptionId?: string,
  stripeInvoiceId?: string,
  stripePaymentIntentId?: string,
  stripeChargeId?: string,
  amountPaid: number, // In cents
  currency: string,
  description?: string,
  status: 'paid' | 'pending' | 'failed',
  failureReason?: string,
  paidAt?: Timestamp,
  invoicePdfUrl?: string,
  receiptUrl?: string,
  createdAt: Timestamp,
}
```

### 6. Chat Messages Collection
```typescript
/chatMessages/{messageId}
{
  id: string,
  userId: string,
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: Map<string, any>,
  createdAt: Timestamp,
}
```

### 7. Context Items Collection
```typescript
/contextItems/{itemId}
{
  id: string,
  userId: string,
  type: 'document' | 'url' | 'text',
  title: string,
  content: string,
  url?: string,
  metadata?: Map<string, any>,
  tags?: string[],
  projectId?: string,
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### 8. Agent Outputs Collection
```typescript
/agentOutputs/{outputId}
{
  id: string,
  userId: string,
  agentType: string,
  input: Map<string, any>,
  output: Map<string, any>,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  error?: string,
  executionTime?: number,
  createdAt: Timestamp,
  completedAt?: Timestamp,
}
```

## Migration Mapping

### PostgreSQL to Firestore Mapping

| PostgreSQL Table | Firestore Collection | Notes |
|-----------------|---------------------|--------|
| auth.users + profiles | /users/{userId} | Merged into single document |
| saved_candidates | /users/{userId}/savedCandidates | Subcollection under user |
| projects | /projects/{projectId} | Top-level collection |
| project_candidates | /projects/{projectId}/candidates | Subcollection |
| search_history | /users/{userId}/searchHistory | Subcollection |
| jobs | /jobs/{jobId} | Top-level collection |
| subscriptions | /subscriptions/{userId} | Keyed by userId |
| billing_history | /billingHistory/{billId} | Top-level collection |
| usage_tracking | Embedded in /users/{userId}.usage | Denormalized |
| chat_messages | /chatMessages/{messageId} | Top-level collection |
| context_items | /contextItems/{itemId} | Top-level collection |
| google_accounts | /users/{userId}/googleAccounts | Subcollection |

## Indexing Strategy

### Composite Indexes Required

1. **Projects by user and status**
   - Collection: projects
   - Fields: userId (ASC), isArchived (ASC), createdAt (DESC)

2. **Jobs by user and status**
   - Collection: jobs
   - Fields: userId (ASC), status (ASC), createdAt (DESC)

3. **Chat messages by conversation**
   - Collection: chatMessages
   - Fields: userId (ASC), conversationId (ASC), createdAt (ASC)

4. **Billing history by user**
   - Collection: billingHistory
   - Fields: userId (ASC), createdAt (DESC)

5. **Saved candidates by status**
   - Collection: savedCandidates (subcollection)
   - Fields: status (ASC), createdAt (DESC)

## Real-time Subscriptions

### Collections Supporting Real-time Updates
1. Chat messages - For live chat
2. Projects - For collaboration
3. Agent outputs - For processing status
4. Saved candidates - For team updates

## Data Consistency Strategies

### Denormalization Points
1. **User subscription in profile**: Quick access without joins
2. **Usage limits in profile**: Avoid separate queries
3. **Candidates count in projects**: Avoid counting queries
4. **Project references in candidates**: Enable multi-project association

### Transaction Requirements
1. Adding candidate to project (update count)
2. Creating subscription (update user profile)
3. Recording usage (check limits, update counts)
4. Billing operations (update subscription, create history)

## Migration Considerations

### Data Transformation Rules
1. **Timestamps**: Convert PostgreSQL timestamps to Firestore Timestamps
2. **Arrays**: PostgreSQL arrays map directly to Firestore arrays
3. **JSON/JSONB**: Convert to Firestore Maps
4. **Foreign Keys**: Convert to document references or embedded IDs
5. **Enums**: Convert to string literals

### Batch Operations
- Use batch writes (max 500 operations per batch)
- Implement progress tracking
- Handle partial failures with retry logic
- Maintain audit log of migration

## Performance Optimizations

### Query Patterns
1. **User dashboard**: Single read from /users/{userId}
2. **Project candidates**: Subcollection query with pagination
3. **Search history**: Subcollection query with filters
4. **Billing info**: Indexed query on userId

### Caching Strategy
1. Cache user profile in session storage
2. Cache project list for 5 minutes
3. Cache subscription status for 10 minutes
4. Invalidate on updates

## Security Considerations

### Field-level Security
- Sensitive fields (tokens, stripe IDs) only readable by owner
- System fields (usage counts) only writable by Cloud Functions
- Audit fields (createdAt, updatedAt) set by triggers

### Data Validation
- Enforce required fields in security rules
- Validate data types and formats
- Prevent unauthorized field modifications
- Rate limiting through Cloud Functions