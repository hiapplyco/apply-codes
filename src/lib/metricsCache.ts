interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class MetricsCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt
    });

    // Cleanup expired entries periodically
    this.cleanup();
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): {
    size: number;
    entries: Array<{
      key: string;
      timestamp: number;
      expiresAt: number;
      isExpired: boolean;
    }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      timestamp: entry.timestamp,
      expiresAt: entry.expiresAt,
      isExpired: now > entry.expiresAt
    }));

    return {
      size: this.cache.size,
      entries
    };
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Dashboard-specific cache keys
  getDashboardMetricsKey(jobId: string): string {
    return `dashboard:metrics:${jobId}`;
  }

  getChartDataKey(jobId: string, chartType: string): string {
    return `dashboard:chart:${jobId}:${chartType}`;
  }

  getAnalysisKey(jobId: string): string {
    return `analysis:${jobId}`;
  }

  // Invalidate all cache entries for a specific job
  invalidateJobCache(jobId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(jobId)
    );
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Export singleton instance
export const metricsCache = new MetricsCache();

// Cache configuration constants
export const CACHE_DURATIONS = {
  DASHBOARD_METRICS: 5 * 60 * 1000,  // 5 minutes
  CHART_DATA: 3 * 60 * 1000,         // 3 minutes
  ANALYSIS_DATA: 10 * 60 * 1000,     // 10 minutes
  AGENT_OUTPUTS: 15 * 60 * 1000,     // 15 minutes
} as const;