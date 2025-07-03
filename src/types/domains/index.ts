/**
 * Domain type exports
 * Central export for all domain-specific types
 */

export * from './recruitment';
export * from './meeting';
export * from './chat';
export * from './user';

// Re-export common types from the generated file
export type { Json, Database } from '@/integrations/supabase/types';