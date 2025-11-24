import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  WhereFilterOp,
  DocumentSnapshot,
  QueryConstraint,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail,
  updateProfile
} from 'firebase/auth';
import { db, auth } from './firebase';

// Define Session type locally to remove Supabase dependency
export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: SupabaseUser;
}

// Types for compatibility with Supabase
export interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface SupabaseAuthResponse {
  data: {
    user: SupabaseUser | null;
    session: Session | null;
  };
  error: Error | null;
}

export interface SupabaseUser {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
}

export interface PostgrestBuilder<T> {
  select(columns?: string): PostgrestBuilder<T>;
  insert(values: Partial<T> | Partial<T>[]): PostgrestBuilder<T>;
  update(values: Partial<T>): PostgrestBuilder<T>;
  delete(): PostgrestBuilder<T>;
  eq(column: string, value: any): PostgrestBuilder<T>;
  neq(column: string, value: any): PostgrestBuilder<T>;
  gt(column: string, value: any): PostgrestBuilder<T>;
  gte(column: string, value: any): PostgrestBuilder<T>;
  lt(column: string, value: any): PostgrestBuilder<T>;
  lte(column: string, value: any): PostgrestBuilder<T>;
  like(column: string, pattern: string): PostgrestBuilder<T>;
  ilike(column: string, pattern: string): PostgrestBuilder<T>;
  is(column: string, value: any): PostgrestBuilder<T>;
  in(column: string, values: any[]): PostgrestBuilder<T>;
  contains(column: string, value: any): PostgrestBuilder<T>;
  containedBy(column: string, value: any): PostgrestBuilder<T>;
  rangeGt(column: string, value: any): PostgrestBuilder<T>;
  rangeGte(column: string, value: any): PostgrestBuilder<T>;
  rangeLt(column: string, value: any): PostgrestBuilder<T>;
  rangeLte(column: string, value: any): PostgrestBuilder<T>;
  rangeAdjacent(column: string, value: any): PostgrestBuilder<T>;
  overlaps(column: string, value: any): PostgrestBuilder<T>;
  textSearch(column: string, query: string): PostgrestBuilder<T>;
  not(column: string, operator: string, value: any): PostgrestBuilder<T>;
  or(filters: string): PostgrestBuilder<T>;
  filter(column: string, operator: string, value: any): PostgrestBuilder<T>;
  match(query: Record<string, any>): PostgrestBuilder<T>;
  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): PostgrestBuilder<T>;
  limit(count: number): PostgrestBuilder<T>;
  range(from: number, to: number): PostgrestBuilder<T>;
  single(): PostgrestBuilder<T>;
  maybeSingle(): PostgrestBuilder<T>;
  csv(): PostgrestBuilder<string>;
  explain(options?: { analyze?: boolean; verbose?: boolean; settings?: boolean; buffers?: boolean; wal?: boolean; format?: 'json' | 'xml' | 'yaml' | 'text' }): PostgrestBuilder<T>;
  then<TResult1 = T[], TResult2 = never>(onfulfilled?: ((value: SupabaseResponse<T[]>) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
}

interface FirebaseQueryBuilder<T> {
  collectionName: string;
  queryConstraints: QueryConstraint[];
  selectFields?: string[];
  operation: 'select' | 'insert' | 'update' | 'delete';
  insertData?: Partial<T> | Partial<T>[];
  updateData?: Partial<T>;
  shouldReturnSingle?: boolean;
  shouldReturnMaybeSingle?: boolean;
}

class FirebasePostgrestBuilder<T> implements PostgrestBuilder<T> {
  private queryBuilder: FirebaseQueryBuilder<T>;

  constructor(collectionName: string) {
    this.queryBuilder = {
      collectionName,
      queryConstraints: [],
      operation: 'select'
    };
  }

  select(columns?: string): PostgrestBuilder<T> {
    this.queryBuilder.operation = 'select';
    if (columns && columns !== '*') {
      this.queryBuilder.selectFields = columns.split(',').map(col => col.trim());
    }
    return this;
  }

  insert(values: Partial<T> | Partial<T>[]): PostgrestBuilder<T> {
    this.queryBuilder.operation = 'insert';
    this.queryBuilder.insertData = values;
    return this;
  }

  update(values: Partial<T>): PostgrestBuilder<T> {
    this.queryBuilder.operation = 'update';
    this.queryBuilder.updateData = values;
    return this;
  }

  delete(): PostgrestBuilder<T> {
    this.queryBuilder.operation = 'delete';
    return this;
  }

  eq(column: string, value: any): PostgrestBuilder<T> {
    this.queryBuilder.queryConstraints.push(where(column, '==', value));
    return this;
  }

  neq(column: string, value: any): PostgrestBuilder<T> {
    this.queryBuilder.queryConstraints.push(where(column, '!=', value));
    return this;
  }

  gt(column: string, value: any): PostgrestBuilder<T> {
    this.queryBuilder.queryConstraints.push(where(column, '>', value));
    return this;
  }

  gte(column: string, value: any): PostgrestBuilder<T> {
    this.queryBuilder.queryConstraints.push(where(column, '>=', value));
    return this;
  }

  lt(column: string, value: any): PostgrestBuilder<T> {
    this.queryBuilder.queryConstraints.push(where(column, '<', value));
    return this;
  }

  lte(column: string, value: any): PostgrestBuilder<T> {
    this.queryBuilder.queryConstraints.push(where(column, '<=', value));
    return this;
  }

  like(column: string, pattern: string): PostgrestBuilder<T> {
    // Firebase doesn't have exact SQL LIKE, so we'll use array-contains for partial matches
    console.warn('LIKE operator not fully supported in Firebase, using contains approximation');
    const searchValue = pattern.replace(/%/g, '').toLowerCase();
    this.queryBuilder.queryConstraints.push(where(column, 'array-contains', searchValue));
    return this;
  }

  ilike(column: string, pattern: string): PostgrestBuilder<T> {
    // Case-insensitive like - similar limitation as like()
    console.warn('ILIKE operator not fully supported in Firebase, using contains approximation');
    const searchValue = pattern.replace(/%/g, '').toLowerCase();
    this.queryBuilder.queryConstraints.push(where(column, 'array-contains', searchValue));
    return this;
  }

  is(column: string, value: any): PostgrestBuilder<T> {
    this.queryBuilder.queryConstraints.push(where(column, '==', value));
    return this;
  }

  in(column: string, values: any[]): PostgrestBuilder<T> {
    this.queryBuilder.queryConstraints.push(where(column, 'in', values));
    return this;
  }

  contains(column: string, value: any): PostgrestBuilder<T> {
    this.queryBuilder.queryConstraints.push(where(column, 'array-contains', value));
    return this;
  }

  containedBy(column: string, value: any): PostgrestBuilder<T> {
    this.queryBuilder.queryConstraints.push(where(column, 'array-contains-any', Array.isArray(value) ? value : [value]));
    return this;
  }

  // Range operators - Firebase doesn't have exact equivalents, using approximations
  rangeGt(column: string, value: any): PostgrestBuilder<T> {
    console.warn('Range operators not fully supported in Firebase, using > approximation');
    return this.gt(column, value);
  }

  rangeGte(column: string, value: any): PostgrestBuilder<T> {
    console.warn('Range operators not fully supported in Firebase, using >= approximation');
    return this.gte(column, value);
  }

  rangeLt(column: string, value: any): PostgrestBuilder<T> {
    console.warn('Range operators not fully supported in Firebase, using < approximation');
    return this.lt(column, value);
  }

  rangeLte(column: string, value: any): PostgrestBuilder<T> {
    console.warn('Range operators not fully supported in Firebase, using <= approximation');
    return this.lte(column, value);
  }

  rangeAdjacent(column: string, value: any): PostgrestBuilder<T> {
    console.warn('Range adjacent operator not supported in Firebase');
    return this;
  }

  overlaps(column: string, value: any): PostgrestBuilder<T> {
    console.warn('Overlaps operator not fully supported in Firebase, using array-contains-any approximation');
    this.queryBuilder.queryConstraints.push(where(column, 'array-contains-any', Array.isArray(value) ? value : [value]));
    return this;
  }

  textSearch(column: string, query: string): PostgrestBuilder<T> {
    console.warn('Full text search not supported in Firebase, using contains approximation');
    this.queryBuilder.queryConstraints.push(where(column, 'array-contains', query.toLowerCase()));
    return this;
  }

  not(column: string, operator: string, value: any): PostgrestBuilder<T> {
    console.warn('NOT operator limited in Firebase, using != approximation');
    this.queryBuilder.queryConstraints.push(where(column, '!=', value));
    return this;
  }

  or(filters: string): PostgrestBuilder<T> {
    console.warn('OR operator not directly supported in Firebase queries');
    return this;
  }

  filter(column: string, operator: string, value: any): PostgrestBuilder<T> {
    const firestoreOp = this.mapOperatorToFirestore(operator);
    if (firestoreOp) {
      this.queryBuilder.queryConstraints.push(where(column, firestoreOp, value));
    }
    return this;
  }

  match(query: Record<string, any>): PostgrestBuilder<T> {
    Object.entries(query).forEach(([column, value]) => {
      this.queryBuilder.queryConstraints.push(where(column, '==', value));
    });
    return this;
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): PostgrestBuilder<T> {
    const direction = options?.ascending !== false ? 'asc' : 'desc';
    this.queryBuilder.queryConstraints.push(orderBy(column, direction));
    return this;
  }

  limit(count: number): PostgrestBuilder<T> {
    this.queryBuilder.queryConstraints.push(limit(count));
    return this;
  }

  range(from: number, to: number): PostgrestBuilder<T> {
    const count = to - from + 1;
    this.queryBuilder.queryConstraints.push(limit(count));
    // Note: Firebase doesn't have direct offset, would need to implement pagination differently
    if (from > 0) {
      console.warn('Range with offset not perfectly supported in Firebase, use pagination patterns instead');
    }
    return this;
  }

  single(): PostgrestBuilder<T> {
    this.queryBuilder.shouldReturnSingle = true;
    return this;
  }

  maybeSingle(): PostgrestBuilder<T> {
    this.queryBuilder.shouldReturnMaybeSingle = true;
    return this;
  }

  csv(): PostgrestBuilder<string> {
    console.warn('CSV export not supported in Firebase adapter');
    return this as any;
  }

  explain(options?: any): PostgrestBuilder<T> {
    console.warn('EXPLAIN not supported in Firebase adapter');
    return this;
  }

  private mapOperatorToFirestore(operator: string): WhereFilterOp | null {
    const operatorMap: Record<string, WhereFilterOp> = {
      'eq': '==',
      'neq': '!=',
      'gt': '>',
      'gte': '>=',
      'lt': '<',
      'lte': '<=',
      'in': 'in',
      'contains': 'array-contains',
      'containedBy': 'array-contains-any'
    };
    return operatorMap[operator] || null;
  }

  private async executeQuery(): Promise<SupabaseResponse<T[]>> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const collectionRef = collection(db, this.queryBuilder.collectionName);

      switch (this.queryBuilder.operation) {
        case 'select':
          return await this.executeSelect(collectionRef);
        case 'insert':
          return await this.executeInsert(collectionRef);
        case 'update':
          return await this.executeUpdate(collectionRef);
        case 'delete':
          return await this.executeDelete(collectionRef);
        default:
          throw new Error(`Unsupported operation: ${this.queryBuilder.operation}`);
      }
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  private async executeSelect(collectionRef: any): Promise<SupabaseResponse<T[]>> {
    const q = query(collectionRef, ...this.queryBuilder.queryConstraints);
    const querySnapshot = await getDocs(q);

    let data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];

    // Apply field selection if specified
    if (this.queryBuilder.selectFields) {
      data = data.map(item => {
        const selected: any = {};
        this.queryBuilder.selectFields!.forEach(field => {
          if (field in (item as any)) {
            selected[field] = (item as any)[field];
          }
        });
        return selected;
      });
    }

    // Handle single/maybeSingle
    if (this.queryBuilder.shouldReturnSingle) {
      if (data.length === 0) {
        throw new Error('No rows returned');
      }
      if (data.length > 1) {
        throw new Error('Multiple rows returned');
      }
      return { data: data[0] as any, error: null };
    }

    if (this.queryBuilder.shouldReturnMaybeSingle) {
      if (data.length > 1) {
        throw new Error('Multiple rows returned');
      }
      return { data: data[0] || null as any, error: null };
    }

    return { data, error: null };
  }

  private async executeInsert(collectionRef: any): Promise<SupabaseResponse<T[]>> {
    const insertData = this.queryBuilder.insertData;
    if (!insertData) {
      throw new Error('No data to insert');
    }

    if (Array.isArray(insertData)) {
      // Batch insert
      const results = [];
      for (const item of insertData) {
        const docRef = await addDoc(collectionRef, item);
        const docSnap = await getDoc(docRef);
        results.push({ id: docRef.id, ...docSnap.data() } as T);
      }
      return { data: results, error: null };
    } else {
      // Single insert
      const docRef = await addDoc(collectionRef, insertData);
      const docSnap = await getDoc(docRef);
      const result = { id: docRef.id, ...docSnap.data() } as T;

      if (this.queryBuilder.shouldReturnSingle || this.queryBuilder.shouldReturnMaybeSingle) {
        return { data: result as any, error: null };
      }

      return { data: [result], error: null };
    }
  }

  private async executeUpdate(collectionRef: any): Promise<SupabaseResponse<T[]>> {
    const updateData = this.queryBuilder.updateData;
    if (!updateData) {
      throw new Error('No data to update');
    }

    // Firebase requires knowing the document ID for updates
    // This is a limitation - we'll need the document ID in the where clause
    const idConstraint = this.queryBuilder.queryConstraints.find(constraint =>
      constraint.toString().includes('__name__') || constraint.toString().includes('id')
    );

    if (!idConstraint) {
      throw new Error('Update operations in Firebase require document ID in where clause');
    }

    // For now, we'll implement a simplified version
    // In real usage, you'd need to query first, then update
    const q = query(collectionRef, ...this.queryBuilder.queryConstraints);
    const querySnapshot = await getDocs(q);

    const results = [];
    for (const docSnap of querySnapshot.docs) {
      await updateDoc(docSnap.ref, updateData as any);
      const updatedDoc = await getDoc(docSnap.ref);
      results.push({ id: docSnap.id, ...updatedDoc.data() } as T);
    }

    return { data: results, error: null };
  }

  private async executeDelete(collectionRef: any): Promise<SupabaseResponse<T[]>> {
    const q = query(collectionRef, ...this.queryBuilder.queryConstraints);
    const querySnapshot = await getDocs(q);

    const deletedDocs = [];
    for (const docSnap of querySnapshot.docs) {
      const docData = { id: docSnap.id, ...docSnap.data() } as T;
      await deleteDoc(docSnap.ref);
      deletedDocs.push(docData);
    }

    return { data: deletedDocs, error: null };
  }

  then<TResult1 = T[], TResult2 = never>(
    onfulfilled?: ((value: SupabaseResponse<T[]>) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.executeQuery().then(onfulfilled, onrejected);
  }
}

// Auth adapter
class FirebaseAuthAdapter {
  async getSession(): Promise<SupabaseAuthResponse> {
    try {
      if (!auth?.currentUser) {
        return {
          data: { user: null, session: null },
          error: null
        };
      }

      const user = this.mapFirebaseUserToSupabase(auth.currentUser);
      const session = this.createMockSession(auth.currentUser);

      return {
        data: { user, session },
        error: null
      };
    } catch (error) {
      return {
        data: { user: null, session: null },
        error: error as Error
      };
    }
  }

  async getUser(): Promise<SupabaseAuthResponse> {
    return this.getSession();
  }

  async signInWithPassword(credentials: { email: string; password: string }): Promise<SupabaseAuthResponse> {
    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      const user = this.mapFirebaseUserToSupabase(userCredential.user);
      const session = this.createMockSession(userCredential.user);

      return {
        data: { user, session },
        error: null
      };
    } catch (error) {
      return {
        data: { user: null, session: null },
        error: error as Error
      };
    }
  }

  async signUp(credentials: { email: string; password: string }): Promise<SupabaseAuthResponse> {
    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
      const user = this.mapFirebaseUserToSupabase(userCredential.user);
      const session = this.createMockSession(userCredential.user);

      return {
        data: { user, session },
        error: null
      };
    } catch (error) {
      return {
        data: { user: null, session: null },
        error: error as Error
      };
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

      await signOut(auth);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async resetPasswordForEmail(email: string, options?: { redirectTo?: string }): Promise<{ error: Error | null }> {
    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

      await sendPasswordResetEmail(auth, email, {
        url: options?.redirectTo || window.location.origin
      });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async updateUser(attributes: { password?: string; email?: string; data?: object }): Promise<{ error: Error | null }> {
    try {
      if (!auth?.currentUser) {
        throw new Error('No authenticated user');
      }

      if (attributes.password) {
        await updatePassword(auth.currentUser, attributes.password);
      }

      if (attributes.email) {
        await updateEmail(auth.currentUser, attributes.email);
      }

      if (attributes.data) {
        await updateProfile(auth.currentUser, attributes.data as any);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void): { data: { subscription: { unsubscribe: () => void } } } {
    if (!auth) {
      console.warn('Firebase Auth not initialized');
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const session = this.createMockSession(firebaseUser);
        callback('SIGNED_IN', session);
      } else {
        callback('SIGNED_OUT', null);
      }
    });

    return {
      data: {
        subscription: {
          unsubscribe
        }
      }
    };
  }

  private mapFirebaseUserToSupabase(firebaseUser: FirebaseUser): SupabaseUser {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || undefined,
      created_at: firebaseUser.metadata.creationTime,
      last_sign_in_at: firebaseUser.metadata.lastSignInTime,
      user_metadata: {},
      app_metadata: {}
    };
  }

  private createMockSession(firebaseUser: FirebaseUser): Session {
    return {
      access_token: 'firebase-token',
      refresh_token: 'firebase-refresh-token',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: this.mapFirebaseUserToSupabase(firebaseUser)
    } as Session;
  }
}

// Main adapter class
export class FirebaseSupabaseAdapter {
  auth: FirebaseAuthAdapter;

  constructor() {
    this.auth = new FirebaseAuthAdapter();
  }

  from<T>(table: string): PostgrestBuilder<T> {
    return new FirebasePostgrestBuilder<T>(table);
  }

  // Real-time subscriptions with Firebase Firestore
  channel(name: string) {
    const subscriptions: Map<string, Unsubscribe> = new Map();

    return {
      on: (event: string, config: any, callback: (payload: any) => void) => {
        // Parse Supabase-style config for Firebase
        if (config.event && config.table) {
          let unsubscribe: Unsubscribe;

          // Create Firebase listener based on table and filter
          if (config.filter) {
            // Parse filter like "user_id=eq.{userId}"
            const filterMatch = config.filter.match(/([^=]+)=eq\.(.+)/);
            if (filterMatch) {
              const [, field, value] = filterMatch;
              const collectionRef = collection(db!, config.table);
              const q = query(collectionRef, where(field, '==', value));

              unsubscribe = onSnapshot(q, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                  if (change.type === 'added' || change.type === 'modified' || change.type === 'removed') {
                    callback({
                      eventType: change.type.toUpperCase(),
                      new: change.type !== 'removed' ? { id: change.doc.id, ...change.doc.data() } : null,
                      old: change.type !== 'added' ? { id: change.doc.id, ...change.doc.data() } : null,
                      table: config.table,
                      schema: config.schema
                    });
                  }
                });
              });
            }
          } else {
            // Listen to entire collection
            const collectionRef = collection(db!, config.table);
            unsubscribe = onSnapshot(collectionRef, (snapshot) => {
              snapshot.docChanges().forEach((change) => {
                if (change.type === 'added' || change.type === 'modified' || change.type === 'removed') {
                  callback({
                    eventType: change.type.toUpperCase(),
                    new: change.type !== 'removed' ? { id: change.doc.id, ...change.doc.data() } : null,
                    old: change.type !== 'added' ? { id: change.doc.id, ...change.doc.data() } : null,
                    table: config.table,
                    schema: config.schema
                  });
                }
              });
            });
          }

          // Store unsubscribe function
          if (unsubscribe!) {
            subscriptions.set(`${config.table}-${config.filter || 'all'}`, unsubscribe);
          }
        }

        return this;
      },
      subscribe: () => {
        // Firebase listeners are automatically subscribed when created
        return Promise.resolve({ error: null });
      },
      unsubscribe: () => {
        // Unsubscribe all listeners for this channel
        subscriptions.forEach((unsubscribe) => {
          unsubscribe();
        });
        subscriptions.clear();
        return Promise.resolve({ error: null });
      }
    };
  }
}

// Export singleton instance
export const firebaseSupabaseAdapter = new FirebaseSupabaseAdapter();

// Export a factory function that returns either the real Supabase client or the Firebase adapter
export function createSupabaseCompatibleClient() {
  // For now, always return the Firebase adapter when this function is called
  // You can add logic here to determine which client to use based on environment variables
  return firebaseSupabaseAdapter;
}