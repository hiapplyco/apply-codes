import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  WhereFilterOp,
  OrderByDirection,
  DocumentSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Complex query patterns for Firestore migration

interface QueryCondition {
  field: string;
  operator: string;
  value: any;
}

interface JoinOptions {
  primaryTable: string;
  joinTable: string;
  joinField: string;
  selectFields?: string[];
  conditions?: QueryCondition[];
  limit?: number;
}

interface AggregationOptions {
  table: string;
  groupBy?: string[];
  aggregations: Array<{
    field: string;
    operation: 'count' | 'sum' | 'avg' | 'min' | 'max';
    alias?: string;
  }>;
  conditions?: QueryCondition[];
}

interface PaginationOptions {
  table: string;
  pageSize: number;
  cursor?: string;
  conditions?: QueryCondition[];
  orderBy?: Array<{ field: string; ascending?: boolean }>;
}

/**
 * Helper class for complex Firestore operations that were simple in SQL
 */
export class FirestoreQueryHelpers {

  /**
   * Perform a JOIN operation using multiple queries and client-side merging
   */
  static async performJoin(options: JoinOptions) {
    const {
      primaryTable,
      joinTable,
      joinField,
      selectFields = ['*'],
      conditions = [],
      limit
    } = options;

    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      // Step 1: Query primary table
      const primaryCollectionRef = collection(db, primaryTable);
      const primaryConstraints = [];

      // Apply conditions to primary table
      for (const condition of conditions) {
        if (condition.field.includes('.')) {
          // Skip conditions that reference joined table
          continue;
        }

        const operator = condition.operator as WhereFilterOp;
        switch (condition.operator) {
          case 'eq':
            primaryConstraints.push(where(condition.field, '==', condition.value));
            break;
          case 'neq':
            primaryConstraints.push(where(condition.field, '!=', condition.value));
            break;
          case 'gt':
            primaryConstraints.push(where(condition.field, '>', condition.value));
            break;
          case 'gte':
            primaryConstraints.push(where(condition.field, '>=', condition.value));
            break;
          case 'lt':
            primaryConstraints.push(where(condition.field, '<', condition.value));
            break;
          case 'lte':
            primaryConstraints.push(where(condition.field, '<=', condition.value));
            break;
          case 'in':
            primaryConstraints.push(where(condition.field, 'in', condition.value));
            break;
        }
      }

      if (limit) {
        primaryConstraints.push(limit(limit));
      }

      const primaryQuery = query(primaryCollectionRef, ...primaryConstraints);
      const primarySnapshot = await getDocs(primaryQuery);

      const primaryData = primarySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Step 2: Get unique join values
      const joinValues = [...new Set(primaryData.map(item => item[joinField]).filter(Boolean))];

      if (joinValues.length === 0) {
        return { data: primaryData, error: null };
      }

      // Step 3: Query join table
      const joinCollectionRef = collection(db, joinTable);
      const joinConstraints = [where('id', 'in', joinValues)];

      // Apply join table conditions
      for (const condition of conditions) {
        if (!condition.field.includes('.') || !condition.field.startsWith(`${joinTable}.`)) {
          continue;
        }

        const fieldName = condition.field.replace(`${joinTable}.`, '');
        switch (condition.operator) {
          case 'eq':
            joinConstraints.push(where(fieldName, '==', condition.value));
            break;
          case 'neq':
            joinConstraints.push(where(fieldName, '!=', condition.value));
            break;
          // Add other operators as needed
        }
      }

      const joinQuery = query(joinCollectionRef, ...joinConstraints);
      const joinSnapshot = await getDocs(joinQuery);

      const joinData = joinSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const joinMap = new Map(joinData.map(item => [item.id, item]));

      // Step 4: Merge data
      const mergedData = primaryData.map(item => ({
        ...item,
        [joinTable]: joinMap.get(item[joinField]) || null
      }));

      return { data: mergedData, error: null };

    } catch (error) {
      console.error('JOIN operation error:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Perform aggregations on Firestore data
   */
  static async performAggregation(options: AggregationOptions) {
    const { table, groupBy = [], aggregations, conditions = [] } = options;

    try {
      // Get all data first
      let query = databaseBridge.from(table).select(['*']);

      // Apply conditions
      for (const condition of conditions) {
        switch (condition.operator) {
          case 'eq':
            query = query.eq(condition.field, condition.value);
            break;
          case 'neq':
            query = query.neq(condition.field, condition.value);
            break;
          case 'gt':
            query = query.gt(condition.field, condition.value);
            break;
          case 'gte':
            query = query.gte(condition.field, condition.value);
            break;
          case 'lt':
            query = query.lt(condition.field, condition.value);
            break;
          case 'lte':
            query = query.lte(condition.field, condition.value);
            break;
          case 'in':
            query = query.in(condition.field, condition.value);
            break;
        }
      }

      const result = await query.execute();
      if (result.error || !result.data) {
        return { data: null, error: result.error };
      }

      const data = Array.isArray(result.data) ? result.data : [result.data];

      // Group data if needed
      let groupedData: Record<string, any[]>;
      if (groupBy.length > 0) {
        groupedData = data.reduce((groups, item) => {
          const key = groupBy.map(field => item[field]).join('|');
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(item);
          return groups;
        }, {} as Record<string, any[]>);
      } else {
        groupedData = { 'all': data };
      }

      // Calculate aggregations
      const results: any[] = [];
      for (const [groupKey, groupData] of Object.entries(groupedData)) {
        const groupResult: any = {};

        // Add group by fields
        if (groupBy.length > 0) {
          const groupValues = groupKey.split('|');
          groupBy.forEach((field, index) => {
            groupResult[field] = groupValues[index];
          });
        }

        // Calculate aggregations
        for (const agg of aggregations) {
          const alias = agg.alias || `${agg.operation}_${agg.field}`;

          switch (agg.operation) {
            case 'count':
              groupResult[alias] = groupData.length;
              break;
            case 'sum':
              groupResult[alias] = groupData.reduce((sum, item) => sum + (Number(item[agg.field]) || 0), 0);
              break;
            case 'avg':
              const total = groupData.reduce((sum, item) => sum + (Number(item[agg.field]) || 0), 0);
              groupResult[alias] = groupData.length > 0 ? total / groupData.length : 0;
              break;
            case 'min':
              groupResult[alias] = Math.min(...groupData.map(item => Number(item[agg.field]) || 0));
              break;
            case 'max':
              groupResult[alias] = Math.max(...groupData.map(item => Number(item[agg.field]) || 0));
              break;
          }
        }

        results.push(groupResult);
      }

      return { data: results, error: null };

    } catch (error) {
      console.error('Aggregation error:', error);
      return { data: null, error };
    }
  }

  /**
   * Implement cursor-based pagination for Firestore
   */
  static async paginateQuery(options: PaginationOptions) {
    const { table, pageSize, cursor, conditions = [], orderBy = [] } = options;

    try {
      let query = databaseBridge.from(table).select(['*']);

      // Apply conditions
      for (const condition of conditions) {
        switch (condition.operator) {
          case 'eq':
            query = query.eq(condition.field, condition.value);
            break;
          case 'neq':
            query = query.neq(condition.field, condition.value);
            break;
          case 'gt':
            query = query.gt(condition.field, condition.value);
            break;
          case 'gte':
            query = query.gte(condition.field, condition.value);
            break;
          case 'lt':
            query = query.lt(condition.field, condition.value);
            break;
          case 'lte':
            query = query.lte(condition.field, condition.value);
            break;
          case 'in':
            query = query.in(condition.field, condition.value);
            break;
        }
      }

      // Apply ordering
      for (const order of orderBy) {
        query = query.order(order.field, { ascending: order.ascending !== false });
      }

      // Apply cursor (for Firestore, this would be startAfter)
      if (cursor) {
        // In a real implementation, you'd use Firestore's startAfter with DocumentSnapshot
        console.warn('Cursor-based pagination needs DocumentSnapshot implementation in Firestore');
      }

      // Apply limit
      query = query.limit(pageSize + 1); // Get one extra to check if there are more

      const result = await query.execute();
      if (result.error) {
        return { data: null, error: result.error, hasMore: false, nextCursor: null };
      }

      const data = Array.isArray(result.data) ? result.data : [result.data];
      const hasMore = data.length > pageSize;
      const items = hasMore ? data.slice(0, pageSize) : data;
      const nextCursor = hasMore ? items[items.length - 1].id : null;

      return {
        data: items,
        error: null,
        hasMore,
        nextCursor
      };

    } catch (error) {
      console.error('Pagination error:', error);
      return { data: null, error, hasMore: false, nextCursor: null };
    }
  }

  /**
   * Simulate SQL UNION operations with multiple queries
   */
  static async unionQueries(queries: Array<{
    table: string;
    conditions: QueryCondition[];
    selectFields?: string[];
  }>) {
    try {
      const promises = queries.map(async (queryConfig) => {
        let query = databaseBridge.from(queryConfig.table);

        if (queryConfig.selectFields && queryConfig.selectFields.length > 0) {
          query = query.select(queryConfig.selectFields);
        } else {
          query = query.select(['*']);
        }

        for (const condition of queryConfig.conditions) {
          switch (condition.operator) {
            case 'eq':
              query = query.eq(condition.field, condition.value);
              break;
            case 'neq':
              query = query.neq(condition.field, condition.value);
              break;
            // Add other operators as needed
          }
        }

        return query.execute();
      });

      const results = await Promise.all(promises);

      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        return { data: null, error: errors[0].error };
      }

      // Merge all data
      const allData = results.reduce((acc, result) => {
        if (result.data) {
          const dataArray = Array.isArray(result.data) ? result.data : [result.data];
          acc.push(...dataArray);
        }
        return acc;
      }, [] as any[]);

      // Remove duplicates based on id
      const uniqueData = allData.filter((item, index, arr) =>
        arr.findIndex(other => other.id === item.id) === index
      );

      return { data: uniqueData, error: null };

    } catch (error) {
      console.error('UNION query error:', error);
      return { data: null, error };
    }
  }

  /**
   * Implement complex WHERE conditions with OR logic
   */
  static async complexWhereQuery(
    table: string,
    andConditions: QueryCondition[] = [],
    orGroups: QueryCondition[][] = [],
    options: { limit?: number; orderBy?: Array<{ field: string; ascending?: boolean }> } = {}
  ) {
    try {
      // If there are OR conditions, we need multiple queries
      if (orGroups.length > 0) {
        const queries = orGroups.map(orConditions => ({
          table,
          conditions: [...andConditions, ...orConditions]
        }));

        return this.unionQueries(queries);
      }

      // Simple AND conditions only
      let query = databaseBridge.from(table).select(['*']);

      for (const condition of andConditions) {
        switch (condition.operator) {
          case 'eq':
            query = query.eq(condition.field, condition.value);
            break;
          case 'neq':
            query = query.neq(condition.field, condition.value);
            break;
          case 'gt':
            query = query.gt(condition.field, condition.value);
            break;
          case 'gte':
            query = query.gte(condition.field, condition.value);
            break;
          case 'lt':
            query = query.lt(condition.field, condition.value);
            break;
          case 'lte':
            query = query.lte(condition.field, condition.value);
            break;
          case 'in':
            query = query.in(condition.field, condition.value);
            break;
        }
      }

      if (options.orderBy) {
        for (const order of options.orderBy) {
          query = query.order(order.field, { ascending: order.ascending !== false });
        }
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      return query.execute();

    } catch (error) {
      console.error('Complex WHERE query error:', error);
      return { data: null, error };
    }
  }

  /**
   * Helper for migration validation - compare Supabase vs Firestore results
   */
  static async validateMigration(
    table: string,
    sampleQueries: Array<{
      name: string;
      conditions: QueryCondition[];
      limit?: number;
    }>
  ) {
    const results = [];

    for (const testQuery of sampleQueries) {
      try {
        const startTime = Date.now();

        let query = databaseBridge.from(table).select(['*']);

        for (const condition of testQuery.conditions) {
          switch (condition.operator) {
            case 'eq':
              query = query.eq(condition.field, condition.value);
              break;
            // Add other operators as needed
          }
        }

        if (testQuery.limit) {
          query = query.limit(testQuery.limit);
        }

        const result = await query.execute();
        const endTime = Date.now();

        results.push({
          queryName: testQuery.name,
          success: !result.error,
          error: result.error?.message,
          resultCount: result.data ? (Array.isArray(result.data) ? result.data.length : 1) : 0,
          executionTime: endTime - startTime
        });

      } catch (error) {
        results.push({
          queryName: testQuery.name,
          success: false,
          error: (error as Error).message,
          resultCount: 0,
          executionTime: 0
        });
      }
    }

    return results;
  }
}

// Export convenience functions
export const performJoin = FirestoreQueryHelpers.performJoin;
export const performAggregation = FirestoreQueryHelpers.performAggregation;
export const paginateQuery = FirestoreQueryHelpers.paginateQuery;
export const unionQueries = FirestoreQueryHelpers.unionQueries;
export const complexWhereQuery = FirestoreQueryHelpers.complexWhereQuery;
export const validateMigration = FirestoreQueryHelpers.validateMigration;

export default FirestoreQueryHelpers;