/** Common Google API types - errors, clients, responses */

// ================== ERROR TYPES ==================

export interface GoogleApiError {
  code: number;
  message: string;
  status: string;
  details?: Array<{
    '@type': string;
    [key: string]: unknown;
  }>;
}

export interface GoogleApiErrorResponse {
  error: GoogleApiError;
}

// ================== HELPER TYPES FOR COMMON PATTERNS ==================

export interface GoogleApiClientOptions {
  accessToken?: string;
  apiKey?: string;
  scopes?: string[];
  serviceAccountCredentials?: Record<string, unknown>;
}

export interface GoogleApiRequestOptions {
  fields?: string;
  pageToken?: string;
  pageSize?: number;
  timeout?: number;
  retries?: number;
}

export interface GoogleApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: { [key: string]: string };
  config: unknown;
}

export interface GoogleApiListResponse<T> {
  items: T[];
  nextPageToken?: string;
  kind: string;
}

export interface GoogleApiOperation {
  id: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
  progress?: number;
  error?: GoogleApiError;
  response?: unknown;
  metadata?: unknown;
}

export interface GoogleApiQuota {
  limit: number;
  usage: number;
  remaining: number;
  resetTime?: string;
}

export interface GoogleApiRateLimit {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

export interface GoogleApiUsage {
  quota: GoogleApiQuota;
  rateLimit: GoogleApiRateLimit;
  billing?: {
    enabled: boolean;
    costPerRequest: number;
    currency: string;
  };
}
