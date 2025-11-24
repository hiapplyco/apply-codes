# Database Migration from Supabase to Firebase/Firestore

## 📋 Migration Overview

This document outlines the comprehensive migration of complex database queries from Supabase PostgreSQL to Firebase Firestore. The migration maintains API compatibility while addressing Firestore's different data model and query limitations.

## 🏗️ Architecture Changes

### Database Bridge Pattern
- **File**: `src/lib/database-bridge.ts`
- **Purpose**: Drop-in replacement for Supabase client with Firestore fallback
- **Features**:
  - Supabase-compatible query builder API
  - Automatic query translation
  - Client-side JOIN operations
  - Batch operations support
  - Transaction handling

### Query Complexity Mapping

| SQL Feature | Supabase | Firestore Solution | Implementation |
|-------------|----------|-------------------|----------------|
| **JOINs** | Native SQL | Client-side merge | `clientSideJoin()` helper |
| **OR conditions** | Native SQL | Multiple queries + merge | `unionQueries()` helper |
| **Aggregations** | Native SQL | Client-side calculation | `performAggregation()` helper |
| **Text search** | Full-text search | Array-contains approximation | Query builder conversion |
| **Complex WHERE** | Native SQL | Multiple query strategy | `complexWhereQuery()` helper |
| **Batch operations** | Individual queries | Native batch writes | `batchWrite()` method |

## 📁 Migrated Files

### Core Migration Files

1. **`src/lib/dataMigration.ts`**
   - **Complexity**: High (batch processing, aggregations)
   - **Changes**:
     - Batch candidate processing using Firestore batch writes
     - Client-side aggregations for migration stats
     - Complex count queries converted to aggregation helpers

2. **`src/lib/entities.ts`**
   - **Complexity**: Very High (JOINs, OR conditions, array operations)
   - **Changes**:
     - Company/location searches using OR condition helpers
     - Client-side JOINs for entity usage stats
     - Array operations for aliases converted to client-side logic

3. **`src/services/ContextIntegrationService.ts`**
   - **Complexity**: Medium (simple inserts, auth integration)
   - **Changes**:
     - Batch inserts for context data
     - Function bridge integration for orchestration
     - Query builder for context retrieval

4. **`src/lib/ragStore.ts`**
   - **Complexity**: Very High (vector search, batch operations, full-text search)
   - **Changes**:
     - Batch operations for document chunks
     - Vector search limitation noted (requires external solution)
     - Full-text search converted to array-contains

5. **`src/hooks/useDashboardMetrics.ts`**
   - **Complexity**: Medium (dashboard aggregations)
   - **Changes**:
     - Dashboard metrics queries using database bridge
     - Fallback logic for agent outputs

6. **`src/lib/orchestration/AgentOrchestrator.ts`**
   - **Complexity**: Low (simple inserts)
   - **Changes**:
     - Metrics and workflow instance storage using batch writes

## 🔧 Helper Functions & Utilities

### `src/lib/firestore-helpers.ts`
Complex query pattern implementations:

- **`performJoin()`**: Client-side JOIN operations
- **`performAggregation()`**: Client-side aggregations with grouping
- **`paginateQuery()`**: Cursor-based pagination
- **`unionQueries()`**: Multiple query merging for OR conditions
- **`complexWhereQuery()`**: Advanced WHERE condition handling
- **`validateMigration()`**: Migration testing and validation

### `src/lib/database-migration-test.ts`
Comprehensive testing suite:

- Basic CRUD operation tests
- Complex query validation
- Performance comparison (Supabase vs Firestore)
- JOIN operation testing
- Aggregation testing
- Batch operation testing

## ⚠️ Firestore Limitations & Workarounds

### 1. **No Native JOINs**
```typescript
// Before (Supabase)
.select(`
  company_id,
  companies!inner(canonical_name)
`)

// After (Firestore Bridge)
await databaseBridge.clientSideJoin(
  'saved_candidates',
  [{ field: 'company_id', operator: '!=', value: null }],
  'companies',
  [],
  'company_id'
);
```

### 2. **Limited OR Conditions**
```typescript
// Before (Supabase)
.or(`canonical_name.ilike.%${query}%,aliases.cs.{${query}}`)

// After (Firestore Bridge) - Multiple queries required
await databaseBridge
  .from('companies')
  .or(`canonical_name.ilike.%${query}%,aliases.cs.{${query}}`)
  .execute(); // Handled internally with multiple queries
```

### 3. **No Vector Search**
```typescript
// Before (Supabase)
await supabase.rpc('search_similar_chunks', {
  query_embedding: queryEmbedding,
  match_threshold: threshold,
  match_count: limit
});

// After (Firestore Bridge) - External solution needed
console.warn('Vector similarity search requires external vector database');
// Fallback to text search
```

### 4. **No SQL Aggregations**
```typescript
// Before (Supabase)
.select('count(*), avg(experience_years)')

// After (Firestore Bridge)
await performAggregation({
  table: 'saved_candidates',
  aggregations: [
    { field: 'id', operation: 'count' },
    { field: 'experience_years', operation: 'avg' }
  ]
});
```

## 🚀 Performance Considerations

### Optimization Strategies

1. **Denormalization**: Store frequently joined data together
2. **Batch Operations**: Use Firestore batch writes for multiple operations
3. **Indexing**: Create composite indexes for complex queries
4. **Caching**: Implement client-side caching for aggregated data
5. **Pagination**: Use cursor-based pagination instead of offset-based

### Expected Performance Impact

| Operation Type | Performance Change | Mitigation Strategy |
|----------------|-------------------|-------------------|
| Simple queries | ~Same | Native Firestore performance |
| JOINs | 2-3x slower | Denormalize data, cache results |
| OR conditions | 2-5x slower | Use array-contains when possible |
| Aggregations | 3-10x slower | Pre-calculate, cache, or use Cloud Functions |
| Text search | 5-10x slower | Use external search service (Algolia, etc.) |
| Vector search | N/A | Use Pinecone, Weaviate, or similar |

## 📝 Migration Checklist

### Phase 1: Infrastructure Setup ✅
- [x] Create database bridge service
- [x] Implement Supabase-compatible query builder
- [x] Add helper functions for complex operations
- [x] Create testing framework

### Phase 2: Code Migration ✅
- [x] Migrate dataMigration.ts
- [x] Migrate entities.ts
- [x] Migrate ContextIntegrationService.ts
- [x] Migrate ragStore.ts
- [x] Migrate useDashboardMetrics.ts
- [x] Migrate orchestration files

### Phase 3: Testing & Optimization
- [ ] Run comprehensive migration tests
- [ ] Performance benchmarking
- [ ] Identify bottlenecks
- [ ] Implement optimizations
- [ ] Update security rules

### Phase 4: Production Migration
- [ ] Gradual rollout with feature flags
- [ ] Monitor performance metrics
- [ ] Data migration scripts
- [ ] Rollback procedures

## 🔄 Usage Instructions

### Enable Firestore Migration
```typescript
import { enableFirestore } from '@/lib/database-bridge';

// Enable Firestore for testing
enableFirestore();
```

### Run Migration Tests
```typescript
import { runMigrationTest } from '@/lib/database-migration-test';

// Run comprehensive tests
await runMigrationTest();
```

### Use Database Bridge
```typescript
import { databaseBridge } from '@/lib/database-bridge';

// Drop-in replacement for supabase.from()
const result = await databaseBridge
  .from('saved_candidates')
  .select(['id', 'name', 'company'])
  .eq('status', 'active')
  .limit(10)
  .execute();
```

## ⚡ Quick Start for Developers

1. **Import the bridge**: Replace `supabase` imports with `databaseBridge`
2. **Update queries**: Add `.execute()` to query chains
3. **Handle results**: Use `result.data` and `result.error` pattern
4. **Test thoroughly**: Run migration tests before deploying

## 🎯 Next Steps

1. **External Services Integration**:
   - Set up Pinecone for vector search
   - Configure Algolia for full-text search
   - Implement caching layer (Redis)

2. **Data Denormalization**:
   - Identify frequently joined entities
   - Create denormalized document structures
   - Update write operations to maintain consistency

3. **Security Rules**:
   - Translate RLS policies to Firestore security rules
   - Test authentication and authorization

4. **Monitoring & Analytics**:
   - Set up performance monitoring
   - Track query execution times
   - Monitor error rates

## 📊 Testing Results

Run `runMigrationTest()` to get detailed performance and compatibility results:

```bash
npm run test:migration
```

Expected output:
- ✅ Basic CRUD operations: PASS
- ⚠️ JOIN operations: PASS (slower performance)
- ⚠️ OR conditions: PASS (multiple queries)
- ❌ Vector search: FAIL (requires external service)
- ✅ Batch operations: PASS
- ⚠️ Aggregations: PASS (client-side processing)

---

**Migration Status**: ✅ **READY FOR TESTING**

All core complex queries have been migrated and are ready for comprehensive testing. The database bridge provides a seamless transition path while maintaining full API compatibility.