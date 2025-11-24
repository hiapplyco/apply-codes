/**
 * Firestore Adapter
 * Provides a Supabase-like API for Firestore to ease migration
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryConstraint,
  Timestamp,
  onSnapshot,
  addDoc,
  serverTimestamp,
  writeBatch,
  Query,
  DocumentReference,
  CollectionReference,
  WhereFilterOp,
  OrderByDirection,
  FieldValue
} from 'firebase/firestore';
import { db, auth } from './firebase';

// Type definitions for compatibility
interface FilterCondition {
  field: string;
  operator: WhereFilterOp;
  value: any;
}

interface OrderByCondition {
  field: string;
  direction: OrderByDirection;
}

interface QueryBuilder {
  tableName: string;
  filters: FilterCondition[];
  orderByConditions: OrderByCondition[];
  limitCount?: number;
  startAfterDoc?: any;
  selectFields?: string[];
}

/**
 * Firestore Query Builder
 * Mimics Supabase's query builder pattern
 */
class FirestoreQueryBuilder {
  private queryConfig: QueryBuilder;

  constructor(tableName: string) {
    this.queryConfig = {
      tableName,
      filters: [],
      orderByConditions: [],
    };
  }

  /**
   * Select fields (Note: Firestore doesn't support field selection like SQL)
   * This is kept for API compatibility but doesn't affect the query
   */
  select(fields: string = '*') {
    if (fields !== '*') {
      this.queryConfig.selectFields = fields.split(',').map(f => f.trim());
    }
    return this;
  }

  /**
   * Add equality filter
   */
  eq(field: string, value: any) {
    this.queryConfig.filters.push({
      field,
      operator: '==',
      value
    });
    return this;
  }

  /**
   * Add not equal filter
   */
  neq(field: string, value: any) {
    this.queryConfig.filters.push({
      field,
      operator: '!=',
      value
    });
    return this;
  }

  /**
   * Add greater than filter
   */
  gt(field: string, value: any) {
    this.queryConfig.filters.push({
      field,
      operator: '>',
      value
    });
    return this;
  }

  /**
   * Add greater than or equal filter
   */
  gte(field: string, value: any) {
    this.queryConfig.filters.push({
      field,
      operator: '>=',
      value
    });
    return this;
  }

  /**
   * Add less than filter
   */
  lt(field: string, value: any) {
    this.queryConfig.filters.push({
      field,
      operator: '<',
      value
    });
    return this;
  }

  /**
   * Add less than or equal filter
   */
  lte(field: string, value: any) {
    this.queryConfig.filters.push({
      field,
      operator: '<=',
      value
    });
    return this;
  }

  /**
   * Add IN filter
   */
  in(field: string, values: any[]) {
    this.queryConfig.filters.push({
      field,
      operator: 'in',
      value: values
    });
    return this;
  }

  /**
   * Add array-contains filter
   */
  contains(field: string, value: any) {
    this.queryConfig.filters.push({
      field,
      operator: 'array-contains',
      value
    });
    return this;
  }

  /**
   * Add array-contains-any filter
   */
  containsAny(field: string, values: any[]) {
    this.queryConfig.filters.push({
      field,
      operator: 'array-contains-any',
      value: values
    });
    return this;
  }

  /**
   * Order by field
   */
  order(field: string, options?: { ascending?: boolean }) {
    this.queryConfig.orderByConditions.push({
      field,
      direction: options?.ascending === false ? 'desc' : 'asc'
    });
    return this;
  }

  /**
   * Limit results
   */
  limit(count: number) {
    this.queryConfig.limitCount = count;
    return this;
  }

  /**
   * Pagination - start after document
   */
  startAfter(doc: any) {
    this.queryConfig.startAfterDoc = doc;
    return this;
  }

  /**
   * Range query (for pagination)
   */
  range(from: number, to: number) {
    // Firestore doesn't support offset-based pagination
    // This would need to be implemented with cursor-based pagination
    this.queryConfig.limitCount = to - from + 1;
    console.warn('Range query uses limit only - offset not supported in Firestore');
    return this;
  }

  /**
   * Execute the query
   */
  async execute(): Promise<{ data: any[] | null; error: any }> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser && this.requiresAuth()) {
        return { data: null, error: new Error('Not authenticated') };
      }

      const collectionRef = this.getCollectionRef();
      const constraints = this.buildConstraints(currentUser?.uid);
      const q = query(collectionRef as any, ...constraints);
      const querySnapshot = await getDocs(q);

      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { data, error: null };
    } catch (error) {
      console.error('Firestore query error:', error);
      return { data: null, error };
    }
  }

  /**
   * Get single record
   */
  async single(): Promise<{ data: any; error: any }> {
    this.queryConfig.limitCount = 1;
    const result = await this.execute();

    if (result.error) {
      return { data: null, error: result.error };
    }

    return {
      data: result.data && result.data.length > 0 ? result.data[0] : null,
      error: null
    };
  }

  /**
   * Insert data
   */
  async insert(data: any | any[]): Promise<{ data: any; error: any }> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser && this.requiresAuth()) {
        return { data: null, error: new Error('Not authenticated') };
      }

      const collectionRef = this.getCollectionRef(currentUser?.uid);

      if (Array.isArray(data)) {
        // Batch insert
        const batch = writeBatch(db);
        const results = [];

        for (const item of data) {
          const docData = this.prepareDocData(item, currentUser?.uid);
          const docRef = item.id ? doc(collectionRef, item.id) : doc(collectionRef);
          batch.set(docRef, docData);
          results.push({ id: docRef.id, ...docData });
        }

        await batch.commit();
        return { data: results, error: null };
      } else {
        // Single insert
        const docData = this.prepareDocData(data, currentUser?.uid);
        const docRef = data.id ? doc(collectionRef, data.id) : doc(collectionRef);
        await setDoc(docRef, docData);
        return { data: { id: docRef.id, ...docData }, error: null };
      }
    } catch (error) {
      console.error('Firestore insert error:', error);
      return { data: null, error };
    }
  }

  /**
   * Update data
   */
  async update(updates: any): Promise<{ data: any; error: any }> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser && this.requiresAuth()) {
        return { data: null, error: new Error('Not authenticated') };
      }

      // Execute query to find documents to update
      const { data: docs, error: queryError } = await this.execute();

      if (queryError) {
        return { data: null, error: queryError };
      }

      if (!docs || docs.length === 0) {
        return { data: [], error: null };
      }

      // Batch update
      const batch = writeBatch(db);
      const collectionRef = this.getCollectionRef(currentUser?.uid);

      for (const doc of docs) {
        const docRef = doc.id ?
          (collectionRef instanceof CollectionReference ?
            doc(collectionRef, doc.id) :
            doc.ref) : null;

        if (docRef) {
          batch.update(docRef as DocumentReference, {
            ...updates,
            updatedAt: serverTimestamp()
          });
        }
      }

      await batch.commit();
      return { data: docs, error: null };
    } catch (error) {
      console.error('Firestore update error:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete data
   */
  async delete(): Promise<{ data: any; error: any }> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser && this.requiresAuth()) {
        return { data: null, error: new Error('Not authenticated') };
      }

      // Execute query to find documents to delete
      const { data: docs, error: queryError } = await this.execute();

      if (queryError) {
        return { data: null, error: queryError };
      }

      if (!docs || docs.length === 0) {
        return { data: [], error: null };
      }

      // Batch delete
      const batch = writeBatch(db);
      const collectionRef = this.getCollectionRef(currentUser?.uid);

      for (const doc of docs) {
        const docRef = doc.id ?
          (collectionRef instanceof CollectionReference ?
            doc(collectionRef, doc.id) :
            doc.ref) : null;

        if (docRef) {
          batch.delete(docRef as DocumentReference);
        }
      }

      await batch.commit();
      return { data: docs, error: null };
    } catch (error) {
      console.error('Firestore delete error:', error);
      return { data: null, error };
    }
  }

  /**
   * Upsert (insert or update)
   */
  async upsert(data: any | any[]): Promise<{ data: any; error: any }> {
    // In Firestore, set with merge option acts as upsert
    try {
      const currentUser = auth.currentUser;
      if (!currentUser && this.requiresAuth()) {
        return { data: null, error: new Error('Not authenticated') };
      }

      const collectionRef = this.getCollectionRef(currentUser?.uid);

      if (Array.isArray(data)) {
        const batch = writeBatch(db);
        const results = [];

        for (const item of data) {
          const docData = this.prepareDocData(item, currentUser?.uid);
          const docRef = item.id ? doc(collectionRef, item.id) : doc(collectionRef);
          batch.set(docRef, docData, { merge: true });
          results.push({ id: docRef.id, ...docData });
        }

        await batch.commit();
        return { data: results, error: null };
      } else {
        const docData = this.prepareDocData(data, currentUser?.uid);
        const docRef = data.id ? doc(collectionRef, data.id) : doc(collectionRef);
        await setDoc(docRef, docData, { merge: true });
        return { data: { id: docRef.id, ...docData }, error: null };
      }
    } catch (error) {
      console.error('Firestore upsert error:', error);
      return { data: null, error };
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (data: any) => void): () => void {
    try {
      const currentUser = auth.currentUser;
      const collectionRef = this.getCollectionRef(currentUser?.uid);
      const constraints = this.buildConstraints(currentUser?.uid);
      const q = query(collectionRef as any, ...constraints);

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(data);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Firestore subscription error:', error);
      return () => {};
    }
  }

  // Helper methods

  private getCollectionRef(userId?: string): CollectionReference | Query {
    const { tableName } = this.queryConfig;

    // Handle subcollections
    if (tableName.includes('/')) {
      const parts = tableName.split('/');

      // User subcollections
      if (parts[0] === 'users' && parts.length === 3) {
        const uid = userId || auth.currentUser?.uid;
        if (!uid) throw new Error('User ID required for user subcollections');
        return collection(db, 'users', uid, parts[2]);
      }

      // Project subcollections
      if (parts[0] === 'projects' && parts.length === 3) {
        return collection(db, 'projects', parts[1], parts[2]);
      }
    }

    // Top-level collections
    return collection(db, tableName);
  }

  private buildConstraints(userId?: string): QueryConstraint[] {
    const constraints: QueryConstraint[] = [];

    // Add user filter for user-owned collections
    if (this.shouldAddUserFilter() && userId) {
      constraints.push(where('userId', '==', userId));
    }

    // Add custom filters
    for (const filter of this.queryConfig.filters) {
      constraints.push(where(filter.field, filter.operator, filter.value));
    }

    // Add order by
    for (const orderCondition of this.queryConfig.orderByConditions) {
      constraints.push(orderBy(orderCondition.field, orderCondition.direction));
    }

    // Add limit
    if (this.queryConfig.limitCount) {
      constraints.push(limit(this.queryConfig.limitCount));
    }

    // Add pagination
    if (this.queryConfig.startAfterDoc) {
      constraints.push(startAfter(this.queryConfig.startAfterDoc));
    }

    return constraints;
  }

  private requiresAuth(): boolean {
    const publicTables = [''];
    return !publicTables.includes(this.queryConfig.tableName);
  }

  private shouldAddUserFilter(): boolean {
    const userOwnedTables = [
      'projects', 'jobs', 'savedCandidates', 'searchHistory',
      'contextItems', 'chatMessages', 'agentOutputs'
    ];
    return userOwnedTables.includes(this.queryConfig.tableName);
  }

  private prepareDocData(data: any, userId?: string): any {
    const docData = { ...data };

    // Remove id field (it's stored as document ID)
    delete docData.id;

    // Add userId for user-owned collections
    if (this.shouldAddUserFilter() && userId) {
      docData.userId = userId;
    }

    // Convert dates to Firestore timestamps
    for (const [key, value] of Object.entries(docData)) {
      if (value instanceof Date) {
        docData[key] = Timestamp.fromDate(value);
      } else if (typeof value === 'string' && this.isISODate(value)) {
        docData[key] = Timestamp.fromDate(new Date(value));
      }
    }

    // Add timestamps
    if (!docData.createdAt) {
      docData.createdAt = serverTimestamp();
    }
    if (!docData.updatedAt) {
      docData.updatedAt = serverTimestamp();
    }

    return docData;
  }

  private isISODate(str: string): boolean {
    return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str);
  }
}

/**
 * Main Firestore Adapter
 * Provides Supabase-like API
 */
export class FirestoreAdapter {
  /**
   * Create a query builder for a table/collection
   */
  from(tableName: string) {
    return new FirestoreQueryBuilder(tableName);
  }

  /**
   * Get authenticated user
   */
  get auth() {
    return {
      getUser: () => ({
        data: {
          user: auth.currentUser ? {
            id: auth.currentUser.uid,
            email: auth.currentUser.email,
            email_verified: auth.currentUser.emailVerified,
          } : null
        },
        error: null
      }),

      getSession: () => ({
        data: {
          session: auth.currentUser ? {
            user: {
              id: auth.currentUser.uid,
              email: auth.currentUser.email,
            },
            access_token: auth.currentUser.refreshToken,
          } : null
        },
        error: null
      }),

      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        return auth.onAuthStateChanged((user) => {
          if (user) {
            callback('SIGNED_IN', {
              user: {
                id: user.uid,
                email: user.email,
              }
            });
          } else {
            callback('SIGNED_OUT', null);
          }
        });
      }
    };
  }

  /**
   * Storage operations (placeholder for migration)
   */
  get storage() {
    return {
      from: (bucket: string) => ({
        upload: async (path: string, file: File) => {
          // TODO: Implement Firebase Storage upload
          console.warn('Storage upload not yet implemented in Firestore adapter');
          return { data: null, error: new Error('Not implemented') };
        },
        download: async (path: string) => {
          // TODO: Implement Firebase Storage download
          console.warn('Storage download not yet implemented in Firestore adapter');
          return { data: null, error: new Error('Not implemented') };
        },
        remove: async (paths: string[]) => {
          // TODO: Implement Firebase Storage delete
          console.warn('Storage remove not yet implemented in Firestore adapter');
          return { data: null, error: new Error('Not implemented') };
        },
        list: async (path?: string) => {
          // TODO: Implement Firebase Storage list
          console.warn('Storage list not yet implemented in Firestore adapter');
          return { data: null, error: new Error('Not implemented') };
        },
        getPublicUrl: (path: string) => {
          // TODO: Implement Firebase Storage public URL
          console.warn('Storage getPublicUrl not yet implemented in Firestore adapter');
          return { data: { publicUrl: '' } };
        }
      })
    };
  }
}

// Create singleton instance
export const firestoreAdapter = new FirestoreAdapter();

// Export for migration compatibility
export const firestore = firestoreAdapter;