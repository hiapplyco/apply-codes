import { db as firestore } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QuerySnapshot,
  DocumentSnapshot,
  DocumentData,
  QueryConstraint,
  writeBatch,
  runTransaction,
  Timestamp,
  WhereFilterOp
} from "firebase/firestore";

interface DatabaseBridgeResult<T = any> {
  data: T | null;
  error: Error | null;
  count?: number;
}

interface WhereCondition {
  field: string;
  operator: WhereFilterOp;
  value: any;
}

class SupabaseQueryBuilder {
  private tableName: string;
  private selectFields: string[] = [];
  private whereConditions: WhereCondition[] = [];
  private orConditions: WhereCondition[][] = [];
  private orderByFields: Array<{ field: string; ascending: boolean }> = [];
  private limitCount?: number;
  private offsetCount?: number;
  private countType?: 'exact' | 'estimated' | 'planned';
  private isHeadRequest = false;
  private rangeStart?: number;
  private rangeEnd?: number;
  private bridge: DatabaseBridge;

  constructor(tableName: string, bridge: DatabaseBridge) {
    this.tableName = tableName;
    this.bridge = bridge;
  }

  select(fields: string | string[], options?: { count?: 'exact' | 'estimated' | 'planned'; head?: boolean }) {
    if (typeof fields === 'string') {
      this.selectFields = fields === '*' ? [] : [fields];
    } else {
      this.selectFields = fields;
    }
    if (options?.count) {
      this.countType = options.count;
    }
    if (options?.head) {
      this.isHeadRequest = true;
    }
    return this;
  }

  eq(field: string, value: any) {
    this.whereConditions.push({ field, operator: '==', value });
    return this;
  }

  neq(field: string, value: any) {
    this.whereConditions.push({ field, operator: '!=', value });
    return this;
  }

  gt(field: string, value: any) {
    this.whereConditions.push({ field, operator: '>', value });
    return this;
  }

  gte(field: string, value: any) {
    this.whereConditions.push({ field, operator: '>=', value });
    return this;
  }

  lt(field: string, value: any) {
    this.whereConditions.push({ field, operator: '<', value });
    return this;
  }

  lte(field: string, value: any) {
    this.whereConditions.push({ field, operator: '<=', value });
    return this;
  }

  like(field: string, pattern: string) {
    console.warn(`LIKE operator on ${field} converted to array-contains - may need manual adjustment`);
    const searchTerm = pattern.replace(/%/g, '');
    this.whereConditions.push({ field, operator: 'array-contains', value: searchTerm });
    return this;
  }

  ilike(field: string, pattern: string) {
    console.warn(`ILIKE operator on ${field} not supported in Firestore - using array-contains`);
    const searchTerm = pattern.replace(/%/g, '').toLowerCase();
    this.whereConditions.push({ field, operator: 'array-contains', value: searchTerm });
    return this;
  }

  in(field: string, values: any[]) {
    this.whereConditions.push({ field, operator: 'in', value: values });
    return this;
  }

  not(field: string, operator: string, value: any) {
    if (operator === 'is') {
      this.whereConditions.push({ field, operator: '!=', value });
    } else {
      console.warn(`NOT operator with ${operator} may need manual conversion for Firestore`);
    }
    return this;
  }

  is(field: string, value: any) {
    if (value === null) {
      console.warn(`IS NULL check on ${field} - Firestore uses different null handling`);
    }
    this.whereConditions.push({ field, operator: '==', value });
    return this;
  }

  or(conditions: string) {
    console.warn('OR conditions require client-side filtering or multiple queries in Firestore');
    const parsedConditions = this.parseOrConditions(conditions);
    this.orConditions.push(parsedConditions);
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderByFields.push({ field, ascending: options?.ascending !== false });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(start: number, end: number) {
    this.rangeStart = start;
    this.rangeEnd = end;
    return this;
  }

  single() {
    this.limitCount = 1;
    return this;
  }

  textSearch(field: string, query: string) {
    console.warn(`Text search on ${field} - Firestore requires special indexing for full-text search`);
    this.whereConditions.push({ field, operator: 'array-contains', value: query });
    return this;
  }

  async execute(): Promise<DatabaseBridgeResult> {
    return this.bridge.executeQuery(this);
  }

  private parseOrConditions(conditionsString: string): WhereCondition[] {
    const conditions: WhereCondition[] = [];
    const parts = conditionsString.split(',');

    for (const part of parts) {
      const [field, op, value] = part.split('.');
      let operator: WhereFilterOp = '==';

      switch (op) {
        case 'eq': operator = '=='; break;
        case 'neq': operator = '!='; break;
        case 'gt': operator = '>'; break;
        case 'gte': operator = '>='; break;
        case 'lt': operator = '<'; break;
        case 'lte': operator = '<='; break;
        case 'in': operator = 'in'; break;
        default: operator = '==';
      }

      conditions.push({ field, operator, value });
    }

    return conditions;
  }

  // Getters for the bridge to access query details
  get table() { return this.tableName; }
  get fields() { return this.selectFields; }
  get conditions() { return this.whereConditions; }
  get orConds() { return this.orConditions; }
  get orderFields() { return this.orderByFields; }
  get limitValue() { return this.limitCount; }
  get offsetValue() { return this.offsetCount; }
  get isHead() { return this.isHeadRequest; }
  get countMode() { return this.countType; }
}

class DatabaseBridge {
  from(tableName: string): SupabaseQueryBuilder {
    return new SupabaseQueryBuilder(tableName, this);
  }

  async executeQuery(queryBuilder: SupabaseQueryBuilder): Promise<DatabaseBridgeResult> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      const collectionRef = collection(firestore, queryBuilder.table);
      const constraints: QueryConstraint[] = [];

      // Add WHERE conditions
      for (const condition of queryBuilder.conditions) {
        constraints.push(where(condition.field, condition.operator, condition.value));
      }

      // Handle OR conditions - Firestore limitation requires multiple queries
      if (queryBuilder.orConds.length > 0) {
        console.warn('OR conditions detected - this will require multiple Firestore queries and client-side merging');
        return this.executeMultipleQueries(queryBuilder);
      }

      // Add ORDER BY
      for (const orderField of queryBuilder.orderFields) {
        constraints.push(orderBy(orderField.field, orderField.ascending ? 'asc' : 'desc'));
      }

      // Add LIMIT
      if (queryBuilder.limitValue) {
        constraints.push(limit(queryBuilder.limitValue));
      }

      const q = query(collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);

      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        data: queryBuilder.isHead ? null : (queryBuilder.limitValue === 1 ? data[0] || null : data),
        error: null,
        count: queryBuilder.countMode ? querySnapshot.docs.length : undefined
      };

    } catch (error) {
      console.error('Firestore query error:', error);
      return { data: null, error: error as Error };
    }
  }

  private async executeMultipleQueries(queryBuilder: SupabaseQueryBuilder): Promise<DatabaseBridgeResult> {
    const results: any[] = [];

    try {
      // Execute main query
      const mainQuery = { ...queryBuilder };
      mainQuery.orConds = [];
      const mainResult = await this.executeQuery(mainQuery);

      if (mainResult.data) {
        results.push(...(Array.isArray(mainResult.data) ? mainResult.data : [mainResult.data]));
      }

      // Execute OR queries
      for (const orConditions of queryBuilder.orConds) {
        const orQuery = { ...queryBuilder };
        orQuery.conditions = orConditions;
        orQuery.orConds = [];

        const orResult = await this.executeQuery(orQuery);
        if (orResult.data) {
          results.push(...(Array.isArray(orResult.data) ? orResult.data : [orResult.data]));
        }
      }

      // Remove duplicates based on id
      const uniqueResults = results.filter((item, index, arr) =>
        arr.findIndex(other => other.id === item.id) === index
      );

      return {
        data: queryBuilder.limitValue === 1 ? uniqueResults[0] || null : uniqueResults,
        error: null,
        count: uniqueResults.length
      };

    } catch (error) {
      console.error('Multiple query execution error:', error);
      return { data: null, error: error as Error };
    }
  }

  // Batch operations for Firestore
  async batchWrite(operations: Array<{
    type: 'insert' | 'update' | 'delete';
    collection: string;
    id?: string;
    data?: any;
  }>): Promise<DatabaseBridgeResult> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      const batch = writeBatch(firestore);

      for (const op of operations) {
        const collectionRef = collection(firestore, op.collection);

        switch (op.type) {
          case 'insert':
            if (op.id) {
              const docRef = doc(collectionRef, op.id);
              batch.set(docRef, op.data);
            } else {
              const docRef = doc(collectionRef);
              batch.set(docRef, op.data);
            }
            break;
          case 'update':
            if (!op.id) throw new Error('Update operation requires document ID');
            const updateDocRef = doc(collectionRef, op.id);
            batch.update(updateDocRef, op.data);
            break;
          case 'delete':
            if (!op.id) throw new Error('Delete operation requires document ID');
            const deleteDocRef = doc(collectionRef, op.id);
            batch.delete(deleteDocRef);
            break;
        }
      }

      await batch.commit();
      return { data: true, error: null };

    } catch (error) {
      console.error('Firestore batch write error:', error);
      return { data: null, error: error as Error };
    }
  }

  // Transaction support
  async runTransaction<T>(
    updateFunction: (transaction: any) => Promise<T>
  ): Promise<DatabaseBridgeResult<T>> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      const result = await runTransaction(firestore, updateFunction);
      return { data: result, error: null };
    } catch (error) {
      console.error('Firestore transaction error:', error);
      return { data: null, error: error as Error };
    }
  }

  // Helper for client-side JOINs
  async clientSideJoin(
    primaryTable: string,
    primaryConditions: WhereCondition[],
    joinTable: string,
    joinConditions: WhereCondition[],
    joinField: string
  ): Promise<DatabaseBridgeResult> {
    try {
      // First, get primary table data
      const primaryQueryBuilder = this.from(primaryTable);
      for (const condition of primaryConditions) {
        primaryQueryBuilder.eq(condition.field, condition.value);
      }

      const primaryResult = await primaryQueryBuilder.execute();
      if (primaryResult.error || !primaryResult.data) {
        return primaryResult;
      }

      const primaryData = Array.isArray(primaryResult.data) ? primaryResult.data : [primaryResult.data];

      // Extract join values
      const joinValues = primaryData.map(item => item[joinField]).filter(Boolean);

      if (joinValues.length === 0) {
        return { data: primaryData, error: null };
      }

      // Get joined data
      const joinQueryBuilder = this.from(joinTable);
      joinQueryBuilder.in('id', joinValues);

      for (const condition of joinConditions) {
        joinQueryBuilder.eq(condition.field, condition.value);
      }

      const joinResult = await joinQueryBuilder.execute();
      if (joinResult.error) {
        return joinResult;
      }

      const joinData = Array.isArray(joinResult.data) ? joinResult.data : [joinResult.data];
      const joinMap = new Map(joinData.map(item => [item.id, item]));

      // Merge the data
      const mergedData = primaryData.map(item => ({
        ...item,
        [joinTable]: joinMap.get(item[joinField]) || null
      }));

      return { data: mergedData, error: null };

    } catch (error) {
      console.error('Client-side join error:', error);
      return { data: null, error: error as Error };
    }
  }
}

export const databaseBridge = new DatabaseBridge();

// Drop-in replacement for the legacy database client
export const createSupabaseCompatibleClient = () => {
  return {
    from: (table: string) => databaseBridge.from(table),
    batchWrite: (operations: any[]) => databaseBridge.batchWrite(operations),
    runTransaction: (updateFunction: any) => databaseBridge.runTransaction(updateFunction),
    clientSideJoin: (primary: string, primaryConds: any[], join: string, joinConds: any[], joinField: string) =>
      databaseBridge.clientSideJoin(primary, primaryConds, join, joinConds, joinField),
  };
};

// Export for backward compatibility
export { databaseBridge as bridgedDatabase };

// Check if Firestore is available
export const isFirestoreAvailable = () => {
  return !!firestore;
};

if (typeof window !== 'undefined') {
  console.log('✅ Database Bridge (Firebase-only):', {
    status: 'READY',
    firestoreAvailable: !!firestore,
    features: ['complex_queries', 'client_side_joins', 'batch_operations', 'transactions']
  });
}
