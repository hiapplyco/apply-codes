/**
 * Authentication Manager for Apply MCP Server
 *
 * Implements API key-based authentication for production security.
 * Follows 2025 MCP best practices for server authentication.
 */

import { AuthenticationError } from '../types/mcp.js';

export interface AuthConfig {
  enabled: boolean;
  apiKeys: string[];
  requireAuth: boolean;
}

export class AuthManager {
  private config: AuthConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AuthConfig {
    const enabled = process.env.NODE_ENV === 'production' || process.env.MCP_AUTH_ENABLED === 'true';
    const apiKeysEnv = process.env.MCP_API_KEYS || '';
    const apiKeys = apiKeysEnv.split(',').filter(key => key.length > 0);

    if (enabled && apiKeys.length === 0) {
      console.error('⚠️  WARNING: Authentication enabled but no API keys configured!');
      console.error('⚠️  Set MCP_API_KEYS environment variable with comma-separated keys');
      console.error('⚠️  Example: MCP_API_KEYS=key1,key2,key3');
    }

    return {
      enabled,
      apiKeys,
      requireAuth: enabled && apiKeys.length > 0,
    };
  }

  /**
   * Validate API key from request metadata
   *
   * @param request - MCP request object
   * @throws AuthenticationError if validation fails
   */
  public validateRequest(request: any): void {
    // Skip auth if not enabled
    if (!this.config.enabled) {
      return;
    }

    // Extract API key from request metadata
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new AuthenticationError('API key required. Include in request metadata as "x-api-key"');
    }

    if (!this.isValidApiKey(apiKey)) {
      throw new AuthenticationError('Invalid API key');
    }
  }

  /**
   * Extract API key from request
   *
   * Supports multiple locations:
   * 1. request.meta['x-api-key']
   * 2. request.params.meta['x-api-key']
   * 3. process.env.MCP_CLIENT_API_KEY (for testing)
   */
  private extractApiKey(request: any): string | undefined {
    // Check request.meta
    if (request.meta && request.meta['x-api-key']) {
      return request.meta['x-api-key'];
    }

    // Check request.params.meta
    if (request.params && request.params.meta && request.params.meta['x-api-key']) {
      return request.params.meta['x-api-key'];
    }

    // Check headers (for SSE transport)
    if (request.headers && request.headers['x-api-key']) {
      return request.headers['x-api-key'];
    }

    // Allow environment variable for local testing
    if (process.env.MCP_CLIENT_API_KEY) {
      return process.env.MCP_CLIENT_API_KEY;
    }

    return undefined;
  }

  /**
   * Check if API key is valid
   */
  private isValidApiKey(apiKey: string): boolean {
    return this.config.apiKeys.includes(apiKey);
  }

  /**
   * Get authentication status
   */
  public getStatus() {
    return {
      enabled: this.config.enabled,
      configured: this.config.requireAuth,
      keyCount: this.config.apiKeys.length,
    };
  }

  /**
   * Generate a new API key (helper for setup)
   */
  public static generateApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 32;
    let result = 'mcp_';

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }
}

// Singleton instance
export const authManager = new AuthManager();
