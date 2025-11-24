/**
 * Rate Limiter for Apply MCP Server
 *
 * Implements per-session rate limiting to prevent abuse.
 * Follows 2025 MCP best practices for server protection.
 */

import { RateLimitError } from '../types/mcp.js';

export interface RateLimitConfig {
  enabled: boolean;
  maxRequests: number;
  windowMs: number;
  maxRequestsPerTool: Record<string, number>;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
  toolCounts: Map<string, number>;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private limits: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.config = this.loadConfig();
    this.startCleanup();
  }

  private loadConfig(): RateLimitConfig {
    const enabled = process.env.MCP_RATE_LIMIT_ENABLED !== 'false'; // Enabled by default
    const maxRequests = parseInt(process.env.MCP_RATE_LIMIT_MAX || '100', 10);
    const windowMs = parseInt(process.env.MCP_RATE_LIMIT_WINDOW_MS || '3600000', 10); // 1 hour default

    // Per-tool limits (expensive operations)
    const maxRequestsPerTool: Record<string, number> = {
      'boolean_search': 20,           // Search operations
      'search_candidates': 20,
      'parse_resume': 30,              // Document processing
      'enhance_job_description': 30,
      'generate_interview_questions': 50,
      'execute_recruitment_workflow': 10,  // Very expensive
      'get_market_intelligence': 15,
    };

    return {
      enabled,
      maxRequests,
      windowMs,
      maxRequestsPerTool,
    };
  }

  /**
   * Check if request is within rate limits
   *
   * @param sessionId - Session identifier
   * @param toolName - Name of tool being called
   * @throws RateLimitError if limit exceeded
   */
  public checkLimit(sessionId: string, toolName?: string): void {
    if (!this.config.enabled) {
      return;
    }

    const now = Date.now();
    let record = this.limits.get(sessionId);

    // Create or reset record if expired
    if (!record || now > record.resetAt) {
      record = {
        count: 0,
        resetAt: now + this.config.windowMs,
        toolCounts: new Map(),
      };
      this.limits.set(sessionId, record);
    }

    // Check global limit
    if (record.count >= this.config.maxRequests) {
      const resetInSeconds = Math.ceil((record.resetAt - now) / 1000);
      throw new RateLimitError(
        `Rate limit exceeded. Maximum ${this.config.maxRequests} requests per hour. ` +
        `Try again in ${resetInSeconds} seconds.`
      );
    }

    // Check per-tool limit if specified
    if (toolName && this.config.maxRequestsPerTool[toolName]) {
      const toolCount = record.toolCounts.get(toolName) || 0;
      const toolLimit = this.config.maxRequestsPerTool[toolName];

      if (toolCount >= toolLimit) {
        const resetInSeconds = Math.ceil((record.resetAt - now) / 1000);
        throw new RateLimitError(
          `Rate limit exceeded for tool "${toolName}". ` +
          `Maximum ${toolLimit} requests per hour. ` +
          `Try again in ${resetInSeconds} seconds.`
        );
      }

      record.toolCounts.set(toolName, toolCount + 1);
    }

    // Increment global count
    record.count++;
  }

  /**
   * Get current rate limit status for a session
   */
  public getStatus(sessionId: string) {
    const record = this.limits.get(sessionId);

    if (!record || Date.now() > record.resetAt) {
      return {
        count: 0,
        remaining: this.config.maxRequests,
        resetAt: Date.now() + this.config.windowMs,
        toolCounts: {},
      };
    }

    const toolCounts: Record<string, { used: number; limit: number }> = {};
    for (const [tool, count] of record.toolCounts.entries()) {
      toolCounts[tool] = {
        used: count,
        limit: this.config.maxRequestsPerTool[tool] || this.config.maxRequests,
      };
    }

    return {
      count: record.count,
      remaining: this.config.maxRequests - record.count,
      resetAt: record.resetAt,
      toolCounts,
    };
  }

  /**
   * Cleanup expired records periodically
   */
  private startCleanup(): void {
    // Clean up every 15 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [sessionId, record] of this.limits.entries()) {
        if (now > record.resetAt) {
          this.limits.delete(sessionId);
        }
      }
    }, 15 * 60 * 1000);
  }

  /**
   * Stop cleanup interval (for shutdown)
   */
  public stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get rate limiter configuration
   */
  public getConfig() {
    return {
      enabled: this.config.enabled,
      maxRequests: this.config.maxRequests,
      windowMs: this.config.windowMs,
      windowHours: this.config.windowMs / (60 * 60 * 1000),
      perToolLimits: this.config.maxRequestsPerTool,
    };
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();
