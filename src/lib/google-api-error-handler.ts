import { GoogleApiError, GoogleApiErrorResponse } from '@/types/google-api';

/**
 * Google API Error Handling Utilities
 * 
 * This module provides comprehensive error handling patterns for Google API calls
 * including retry logic, rate limiting, and user-friendly error messages.
 */

// Common Google API error codes
export const GOOGLE_API_ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  INVALID_CREDENTIALS: 401,
  
  // Resource errors
  NOT_FOUND: 404,
  ALREADY_EXISTS: 409,
  PRECONDITION_FAILED: 412,
  
  // Rate limiting and quota errors
  TOO_MANY_REQUESTS: 429,
  QUOTA_EXCEEDED: 429,
  RATE_LIMIT_EXCEEDED: 429,
  
  // Server errors
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  
  // Client errors
  BAD_REQUEST: 400,
  INVALID_ARGUMENT: 400,
  FAILED_PRECONDITION: 400,
  OUT_OF_RANGE: 400,
  UNIMPLEMENTED: 501,
  UNAVAILABLE: 503,
  DEADLINE_EXCEEDED: 504,
} as const;

// Error categories for different handling strategies
export enum GoogleApiErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rate_limit',
  QUOTA = 'quota',
  RESOURCE = 'resource',
  NETWORK = 'network',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown',
}

// Retry strategies
export enum RetryStrategy {
  NONE = 'none',
  EXPONENTIAL_BACKOFF = 'exponential_backoff',
  LINEAR_BACKOFF = 'linear_backoff',
  IMMEDIATE = 'immediate',
}

// Error classification interface
export interface GoogleApiErrorClassification {
  category: GoogleApiErrorCategory;
  isRetryable: boolean;
  retryStrategy: RetryStrategy;
  userMessage: string;
  technicalMessage: string;
  suggestedAction: string;
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: number[];
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    GOOGLE_API_ERROR_CODES.TOO_MANY_REQUESTS,
    GOOGLE_API_ERROR_CODES.QUOTA_EXCEEDED,
    GOOGLE_API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
    GOOGLE_API_ERROR_CODES.INTERNAL_SERVER_ERROR,
    GOOGLE_API_ERROR_CODES.SERVICE_UNAVAILABLE,
    GOOGLE_API_ERROR_CODES.GATEWAY_TIMEOUT,
  ],
};

// Enhanced error class for Google API errors
export class GoogleApiErrorHandler extends Error {
  public readonly originalError: unknown;
  public readonly classification: GoogleApiErrorClassification;
  public readonly requestId?: string;
  public readonly timestamp: Date;
  public readonly retryCount: number;

  constructor(
    error: unknown,
    classification: GoogleApiErrorClassification,
    requestId?: string,
    retryCount: number = 0
  ) {
    super(classification.userMessage);
    this.name = 'GoogleApiErrorHandler';
    this.originalError = error;
    this.classification = classification;
    this.requestId = requestId;
    this.timestamp = new Date();
    this.retryCount = retryCount;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      classification: this.classification,
      originalError: this.originalError,
      requestId: this.requestId,
      timestamp: this.timestamp,
      retryCount: this.retryCount,
      stack: this.stack,
    };
  }
}

// Classify Google API errors
export function classifyGoogleApiError(error: unknown): GoogleApiErrorClassification {
  const errorCode = extractErrorCode(error);
  const errorMessage = extractErrorMessage(error);
  const status = extractErrorStatus(error);

  switch (errorCode) {
    case GOOGLE_API_ERROR_CODES.UNAUTHORIZED:
      return {
        category: GoogleApiErrorCategory.AUTHENTICATION,
        isRetryable: false,
        retryStrategy: RetryStrategy.NONE,
        userMessage: 'Authentication failed. Please log in again.',
        technicalMessage: `Authentication error: ${errorMessage}`,
        suggestedAction: 'Re-authenticate with Google services',
      };

    case GOOGLE_API_ERROR_CODES.FORBIDDEN:
      return {
        category: GoogleApiErrorCategory.AUTHORIZATION,
        isRetryable: false,
        retryStrategy: RetryStrategy.NONE,
        userMessage: 'Access denied. You don\'t have permission to perform this action.',
        technicalMessage: `Authorization error: ${errorMessage}`,
        suggestedAction: 'Check your permissions or contact an administrator',
      };

    case GOOGLE_API_ERROR_CODES.NOT_FOUND:
      return {
        category: GoogleApiErrorCategory.RESOURCE,
        isRetryable: false,
        retryStrategy: RetryStrategy.NONE,
        userMessage: 'The requested resource was not found.',
        technicalMessage: `Resource not found: ${errorMessage}`,
        suggestedAction: 'Verify the resource exists and you have access to it',
      };

    case GOOGLE_API_ERROR_CODES.TOO_MANY_REQUESTS:
    case GOOGLE_API_ERROR_CODES.QUOTA_EXCEEDED:
    case GOOGLE_API_ERROR_CODES.RATE_LIMIT_EXCEEDED:
      return {
        category: GoogleApiErrorCategory.RATE_LIMIT,
        isRetryable: true,
        retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        userMessage: 'Too many requests. Please wait a moment and try again.',
        technicalMessage: `Rate limit exceeded: ${errorMessage}`,
        suggestedAction: 'Wait before retrying or reduce request frequency',
      };

    case GOOGLE_API_ERROR_CODES.INTERNAL_SERVER_ERROR:
    case GOOGLE_API_ERROR_CODES.SERVICE_UNAVAILABLE:
    case GOOGLE_API_ERROR_CODES.GATEWAY_TIMEOUT:
      return {
        category: GoogleApiErrorCategory.SERVER,
        isRetryable: true,
        retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        userMessage: 'Google services are temporarily unavailable. Please try again later.',
        technicalMessage: `Server error: ${errorMessage}`,
        suggestedAction: 'Wait and retry, or check Google service status',
      };

    case GOOGLE_API_ERROR_CODES.BAD_REQUEST:
    case GOOGLE_API_ERROR_CODES.INVALID_ARGUMENT:
    case GOOGLE_API_ERROR_CODES.FAILED_PRECONDITION:
      return {
        category: GoogleApiErrorCategory.CLIENT,
        isRetryable: false,
        retryStrategy: RetryStrategy.NONE,
        userMessage: 'Invalid request. Please check your input and try again.',
        technicalMessage: `Client error: ${errorMessage}`,
        suggestedAction: 'Review request parameters and format',
      };

    case GOOGLE_API_ERROR_CODES.ALREADY_EXISTS:
      return {
        category: GoogleApiErrorCategory.RESOURCE,
        isRetryable: false,
        retryStrategy: RetryStrategy.NONE,
        userMessage: 'A resource with this name already exists.',
        technicalMessage: `Resource already exists: ${errorMessage}`,
        suggestedAction: 'Choose a different name or update the existing resource',
      };

    default:
      // Handle network errors
      if (isNetworkError(error)) {
        return {
          category: GoogleApiErrorCategory.NETWORK,
          isRetryable: true,
          retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
          userMessage: 'Network connection error. Please check your internet connection.',
          technicalMessage: `Network error: ${errorMessage}`,
          suggestedAction: 'Check internet connection and retry',
        };
      }

      return {
        category: GoogleApiErrorCategory.UNKNOWN,
        isRetryable: false,
        retryStrategy: RetryStrategy.NONE,
        userMessage: 'An unexpected error occurred. Please try again.',
        technicalMessage: `Unknown error: ${errorMessage}`,
        suggestedAction: 'Contact support if the issue persists',
      };
  }
}

// Extract error code from various error formats
function extractErrorCode(error: unknown): number {
  if (error?.response?.status) return error.response.status;
  if (error?.status) return error.status;
  if (error?.code) return error.code;
  if (error?.error?.code) return error.error.code;
  return 0;
}

// Extract error message from various error formats
function extractErrorMessage(error: unknown): string {
  if (error?.response?.data?.error?.message) return error.response.data.error.message;
  if (error?.error?.message) return error.error.message;
  if (error?.message) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error occurred';
}

// Extract error status from various error formats
function extractErrorStatus(error: unknown): string {
  if (error?.response?.data?.error?.status) return error.response.data.error.status;
  if (error?.error?.status) return error.error.status;
  if (error?.status) return error.status;
  return 'UNKNOWN';
}

// Check if error is a network error
function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  
  const networkErrorMessages = [
    'Network Error',
    'NETWORK_ERROR',
    'Connection refused',
    'Connection timeout',
    'DNS resolution failed',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
    'ERR_CONNECTION_REFUSED',
    'ERR_CONNECTION_TIMED_OUT',
  ];

  const errorMessage = extractErrorMessage(error).toLowerCase();
  return networkErrorMessages.some(msg => errorMessage.includes(msg.toLowerCase()));
}

// Retry with exponential backoff
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: unknown;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      const errorCode = extractErrorCode(error);
      const isRetryable = config.retryableErrors.includes(errorCode);
      
      if (attempt === config.maxRetries || !isRetryable) {
        throw new GoogleApiErrorHandler(
          error,
          classifyGoogleApiError(error),
          extractRequestId(error),
          attempt
        );
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }

  throw lastError;
}

// Extract request ID from error for debugging
function extractRequestId(error: unknown): string | undefined {
  if (error?.response?.headers?.['x-request-id']) return error.response.headers['x-request-id'];
  if (error?.headers?.['x-request-id']) return error.headers['x-request-id'];
  return undefined;
}

// Wrapper function for Google API calls with error handling
export async function handleGoogleApiCall<T>(
  operation: () => Promise<T>,
  config: {
    retryConfig?: RetryConfig;
    context?: string;
    suppressErrors?: boolean;
  } = {}
): Promise<T> {
  const {
    retryConfig = DEFAULT_RETRY_CONFIG,
    context = 'Google API call',
    suppressErrors = false,
  } = config;

  try {
    return await retryWithBackoff(operation, retryConfig);
  } catch (error) {
    console.error(`${context} failed:`, error);
    
    if (!suppressErrors) {
      throw error;
    }
    
    throw new GoogleApiErrorHandler(
      error,
      classifyGoogleApiError(error),
      extractRequestId(error)
    );
  }
}

// Rate limiting utility
export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly timeWindow: number;

  constructor(maxRequests: number, timeWindowMs: number) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      // Wait until the oldest request falls outside the window
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.acquire();
    }
    
    this.requests.push(now);
  }

  getRemainingRequests(): number {
    const now = Date.now();
    const recentRequests = this.requests.filter(time => now - time < this.timeWindow);
    return Math.max(0, this.maxRequests - recentRequests.length);
  }

  getResetTime(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = this.requests[0];
    return oldestRequest + this.timeWindow;
  }
}

// Circuit breaker pattern for Google API calls
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000, // 1 minute
    private readonly monitoringPeriod: number = 10000 // 10 seconds
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new GoogleApiErrorHandler(
          new Error('Circuit breaker is OPEN'),
          {
            category: GoogleApiErrorCategory.SERVER,
            isRetryable: true,
            retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
            userMessage: 'Service temporarily unavailable due to repeated failures',
            technicalMessage: 'Circuit breaker is in OPEN state',
            suggestedAction: 'Wait for the service to recover',
          }
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failures;
  }

  reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }
}

// Logging utility for Google API errors
export interface GoogleApiErrorLog {
  timestamp: Date;
  error: GoogleApiErrorHandler;
  context: string;
  userId?: string;
  requestId?: string;
  retryCount: number;
}

export class GoogleApiErrorLogger {
  private static logs: GoogleApiErrorLog[] = [];
  private static maxLogs = 1000;

  static log(error: GoogleApiErrorHandler, context: string, userId?: string): void {
    const logEntry: GoogleApiErrorLog = {
      timestamp: new Date(),
      error,
      context,
      userId,
      requestId: error.requestId,
      retryCount: error.retryCount,
    };

    this.logs.push(logEntry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`Google API Error [${context}]:`, {
        message: error.message,
        classification: error.classification,
        retryCount: error.retryCount,
        timestamp: logEntry.timestamp,
      });
    }
  }

  static getLogs(filter?: {
    category?: GoogleApiErrorCategory;
    userId?: string;
    since?: Date;
    limit?: number;
  }): GoogleApiErrorLog[] {
    let filtered = this.logs;

    if (filter?.category) {
      filtered = filtered.filter(log => log.error.classification.category === filter.category);
    }

    if (filter?.userId) {
      filtered = filtered.filter(log => log.userId === filter.userId);
    }

    if (filter?.since) {
      filtered = filtered.filter(log => log.timestamp >= filter.since!);
    }

    if (filter?.limit) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered;
  }

  static getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<GoogleApiErrorCategory, number>;
    errorsByHour: Record<string, number>;
    mostCommonErrors: Array<{ message: string; count: number }>;
  } {
    const stats = {
      totalErrors: this.logs.length,
      errorsByCategory: {} as Record<GoogleApiErrorCategory, number>,
      errorsByHour: {} as Record<string, number>,
      mostCommonErrors: [] as Array<{ message: string; count: number }>,
    };

    // Initialize category counts
    Object.values(GoogleApiErrorCategory).forEach(category => {
      stats.errorsByCategory[category] = 0;
    });

    // Count errors by category and hour
    const errorMessages: Record<string, number> = {};
    
    this.logs.forEach(log => {
      const category = log.error.classification.category;
      stats.errorsByCategory[category]++;

      const hour = log.timestamp.toISOString().slice(0, 13);
      stats.errorsByHour[hour] = (stats.errorsByHour[hour] || 0) + 1;

      const message = log.error.message;
      errorMessages[message] = (errorMessages[message] || 0) + 1;
    });

    // Get most common errors
    stats.mostCommonErrors = Object.entries(errorMessages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));

    return stats;
  }

  static clear(): void {
    this.logs = [];
  }
}

// Utility function to create user-friendly error messages
export function createUserFriendlyErrorMessage(error: GoogleApiErrorHandler): string {
  const { classification } = error;
  
  let message = classification.userMessage;
  
  if (classification.category === GoogleApiErrorCategory.RATE_LIMIT) {
    message += ' This usually resolves within a few minutes.';
  } else if (classification.category === GoogleApiErrorCategory.AUTHENTICATION) {
    message += ' Please try logging out and logging back in.';
  } else if (classification.category === GoogleApiErrorCategory.NETWORK) {
    message += ' Please check your internet connection.';
  }

  return message;
}

// Helper function to determine if an error should be shown to the user
export function shouldShowErrorToUser(error: GoogleApiErrorHandler): boolean {
  const { classification } = error;
  
  // Don't show technical errors to users
  if (classification.category === GoogleApiErrorCategory.UNKNOWN) {
    return false;
  }

  // Always show authentication and authorization errors
  if (classification.category === GoogleApiErrorCategory.AUTHENTICATION ||
      classification.category === GoogleApiErrorCategory.AUTHORIZATION) {
    return true;
  }

  // Show rate limit errors with friendly message
  if (classification.category === GoogleApiErrorCategory.RATE_LIMIT) {
    return true;
  }

  // Show resource errors
  if (classification.category === GoogleApiErrorCategory.RESOURCE) {
    return true;
  }

  // Show client errors
  if (classification.category === GoogleApiErrorCategory.CLIENT) {
    return true;
  }

  // Don't show server errors (these should be logged for debugging)
  return false;
}