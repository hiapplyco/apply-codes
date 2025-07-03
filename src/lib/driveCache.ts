/**
 * Google Drive Cache Management
 * 
 * Advanced caching system for Google Drive API responses with
 * intelligent invalidation, persistence, and performance optimization.
 */

import { GoogleDriveFile, GoogleDriveFileList } from '@/types/google-api';

/**
 * Cache entry structure
 */
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  etag?: string;
  lastModified?: string;
  accessCount: number;
  lastAccessed: number;
}

/**
 * Cache key structure for organized storage
 */
export interface CacheKey {
  type: 'file' | 'folder' | 'search' | 'recent' | 'starred' | 'shared' | 'user';
  id: string;
  params?: Record<string, any>;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  hits: number;
  misses: number;
  evictions: number;
  lastCleanup: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxSize: number;
  defaultTtl: number;
  maxAge: number;
  persistToDisk: boolean;
  storageKey: string;
  cleanupInterval: number;
  compressionEnabled: boolean;
}

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 1000, // Maximum number of entries
  defaultTtl: 5 * 60 * 1000, // 5 minutes default TTL
  maxAge: 24 * 60 * 60 * 1000, // 24 hours maximum age
  persistToDisk: true,
  storageKey: 'google-drive-cache',
  cleanupInterval: 10 * 60 * 1000, // 10 minutes cleanup interval
  compressionEnabled: true
};

/**
 * TTL configurations for different data types
 */
const TTL_CONFIG = {
  file: 10 * 60 * 1000,      // 10 minutes - files change frequently
  folder: 5 * 60 * 1000,     // 5 minutes - folder contents change
  search: 2 * 60 * 1000,     // 2 minutes - search results may vary
  recent: 1 * 60 * 1000,     // 1 minute - recent files change quickly
  starred: 5 * 60 * 1000,    // 5 minutes - starred status doesn't change often
  shared: 10 * 60 * 1000,    // 10 minutes - shared files are more stable
  user: 30 * 60 * 1000       // 30 minutes - user info rarely changes
};

/**
 * Main cache class
 */
export class DriveCache {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    totalEntries: 0,
    totalSize: 0,
    hitRate: 0,
    missRate: 0,
    hits: 0,
    misses: 0,
    evictions: 0,
    lastCleanup: Date.now()
  };
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeFromStorage();
    this.startCleanupTimer();
  }

  /**
   * Generate cache key from components
   */
  private generateKey(key: CacheKey): string {
    const baseKey = `${key.type}:${key.id}`;
    
    if (key.params && Object.keys(key.params).length > 0) {
      const sortedParams = Object.keys(key.params)
        .sort()
        .map(k => `${k}=${key.params![k]}`)
        .join('&');
      return `${baseKey}?${sortedParams}`;
    }
    
    return baseKey;
  }

  /**
   * Get TTL for cache type
   */
  private getTtl(type: keyof typeof TTL_CONFIG): number {
    return TTL_CONFIG[type] || this.config.defaultTtl;
  }

  /**
   * Check if cache entry is valid
   */
  private isValid(entry: CacheEntry): boolean {
    const now = Date.now();
    const age = now - entry.timestamp;
    const isExpired = age > entry.ttl;
    const isTooOld = age > this.config.maxAge;
    
    return !isExpired && !isTooOld;
  }

  /**
   * Compress data for storage
   */
  private compress(data: any): string {
    if (!this.config.compressionEnabled) {
      return JSON.stringify(data);
    }
    
    // Simple compression using JSON.stringify with replacer
    return JSON.stringify(data);
  }

  /**
   * Decompress data from storage
   */
  private decompress(compressed: string): any {
    return JSON.parse(compressed);
  }

  /**
   * Calculate entry size in bytes
   */
  private calculateSize(entry: CacheEntry): number {
    return new Blob([JSON.stringify(entry)]).size;
  }

  /**
   * Set cache entry
   */
  set<T>(key: CacheKey, data: T, options: {
    ttl?: number;
    etag?: string;
    lastModified?: string;
  } = {}): void {
    const cacheKey = this.generateKey(key);
    const ttl = options.ttl || this.getTtl(key.type);
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      etag: options.etag,
      lastModified: options.lastModified,
      accessCount: 0,
      lastAccessed: Date.now()
    };

    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastUsed();
    }

    this.cache.set(cacheKey, entry);
    this.updateStats();
    this.persistToStorage();
  }

  /**
   * Get cache entry
   */
  get<T>(key: CacheKey): T | null {
    const cacheKey = this.generateKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (!this.isValid(entry)) {
      this.cache.delete(cacheKey);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    
    return entry.data as T;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: CacheKey): boolean {
    const cacheKey = this.generateKey(key);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) return false;
    
    if (!this.isValid(entry)) {
      this.cache.delete(cacheKey);
      return false;
    }
    
    return true;
  }

  /**
   * Delete cache entry
   */
  delete(key: CacheKey): boolean {
    const cacheKey = this.generateKey(key);
    const result = this.cache.delete(cacheKey);
    
    if (result) {
      this.updateStats();
      this.persistToStorage();
    }
    
    return result;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      ...this.stats,
      totalEntries: 0,
      totalSize: 0,
      evictions: 0
    };
    this.persistToStorage();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.totalEntries = this.cache.size;
    this.stats.totalSize = Array.from(this.cache.values())
      .reduce((total, entry) => total + this.calculateSize(entry), 0);
    
    const totalRequests = this.stats.hits + this.stats.misses;
    if (totalRequests > 0) {
      this.stats.hitRate = this.stats.hits / totalRequests;
      this.stats.missRate = this.stats.misses / totalRequests;
    }
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, ...entry }))
      .sort((a, b) => {
        // Sort by access count (ascending) then by last accessed (ascending)
        if (a.accessCount !== b.accessCount) {
          return a.accessCount - b.accessCount;
        }
        return a.lastAccessed - b.lastAccessed;
      });

    // Remove oldest 10% of entries
    const toRemove = Math.max(1, Math.floor(entries.length * 0.1));
    
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i].key);
      this.stats.evictions++;
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValid(entry)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    this.stats.lastCleanup = now;
    this.updateStats();
    
    if (keysToDelete.length > 0) {
      this.persistToStorage();
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidate(pattern: {
    type?: string;
    id?: string;
    prefix?: string;
  }): number {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      let shouldDelete = false;

      if (pattern.type && key.startsWith(`${pattern.type}:`)) {
        shouldDelete = true;
      }

      if (pattern.id && key.includes(`:${pattern.id}`)) {
        shouldDelete = true;
      }

      if (pattern.prefix && key.startsWith(pattern.prefix)) {
        shouldDelete = true;
      }

      if (shouldDelete) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      this.updateStats();
      this.persistToStorage();
    }

    return keysToDelete.length;
  }

  /**
   * Initialize cache from local storage
   */
  private initializeFromStorage(): void {
    if (!this.config.persistToDisk || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const { cache, stats } = JSON.parse(stored);
        
        // Restore cache entries
        for (const [key, entry] of Object.entries(cache)) {
          if (this.isValid(entry as CacheEntry)) {
            this.cache.set(key, entry as CacheEntry);
          }
        }

        // Restore stats (but reset counters)
        this.stats = {
          ...stats,
          hits: 0,
          misses: 0,
          hitRate: 0,
          missRate: 0
        } as CacheStats;
      }
    } catch (error) {
      console.warn('Failed to restore cache from storage:', error);
    }
  }

  /**
   * Persist cache to local storage
   */
  private persistToStorage(): void {
    if (!this.config.persistToDisk || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const cacheObject = Object.fromEntries(this.cache.entries());
      const data = {
        cache: cacheObject,
        stats: this.stats,
        timestamp: Date.now()
      };

      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist cache to storage:', error);
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}

/**
 * Specialized cache methods for Google Drive data
 */
export class GoogleDriveCache extends DriveCache {
  /**
   * Cache file data
   */
  setFile(file: GoogleDriveFile): void {
    this.set({ type: 'file', id: file.id }, file, {
      etag: file.version,
      lastModified: file.modifiedTime
    });
  }

  /**
   * Get cached file data
   */
  getFile(fileId: string): GoogleDriveFile | null {
    return this.get({ type: 'file', id: fileId });
  }

  /**
   * Cache folder contents
   */
  setFolderContents(folderId: string, files: GoogleDriveFile[]): void {
    this.set({ type: 'folder', id: folderId }, files);
  }

  /**
   * Get cached folder contents
   */
  getFolderContents(folderId: string): GoogleDriveFile[] | null {
    return this.get({ type: 'folder', id: folderId });
  }

  /**
   * Cache search results
   */
  setSearchResults(query: string, params: any, results: GoogleDriveFileList): void {
    const searchKey = this.generateSearchKey(query, params);
    this.set({ type: 'search', id: searchKey }, results);
  }

  /**
   * Get cached search results
   */
  getSearchResults(query: string, params: any): GoogleDriveFileList | null {
    const searchKey = this.generateSearchKey(query, params);
    return this.get({ type: 'search', id: searchKey });
  }

  /**
   * Cache recent files
   */
  setRecentFiles(files: GoogleDriveFile[]): void {
    this.set({ type: 'recent', id: 'files' }, files);
  }

  /**
   * Get cached recent files
   */
  getRecentFiles(): GoogleDriveFile[] | null {
    return this.get({ type: 'recent', id: 'files' });
  }

  /**
   * Cache starred files
   */
  setStarredFiles(files: GoogleDriveFile[]): void {
    this.set({ type: 'starred', id: 'files' }, files);
  }

  /**
   * Get cached starred files
   */
  getStarredFiles(): GoogleDriveFile[] | null {
    return this.get({ type: 'starred', id: 'files' });
  }

  /**
   * Cache shared files
   */
  setSharedFiles(files: GoogleDriveFile[]): void {
    this.set({ type: 'shared', id: 'files' }, files);
  }

  /**
   * Get cached shared files
   */
  getSharedFiles(): GoogleDriveFile[] | null {
    return this.get({ type: 'shared', id: 'files' });
  }

  /**
   * Invalidate file-related cache
   */
  invalidateFile(fileId: string): void {
    this.delete({ type: 'file', id: fileId });
    
    // Also invalidate any folder caches that might contain this file
    this.invalidate({ type: 'folder' });
    this.invalidate({ type: 'search' });
    this.invalidate({ type: 'recent' });
  }

  /**
   * Invalidate folder cache
   */
  invalidateFolder(folderId: string): void {
    this.delete({ type: 'folder', id: folderId });
  }

  /**
   * Invalidate all search caches
   */
  invalidateSearches(): void {
    this.invalidate({ type: 'search' });
  }

  /**
   * Generate search key from query and parameters
   */
  private generateSearchKey(query: string, params: any): string {
    const sortedParams = Object.keys(params || {})
      .sort()
      .map(k => `${k}=${params[k]}`)
      .join('&');
    
    return `${query}|${sortedParams}`;
  }

  /**
   * Preload related files (e.g., when viewing a folder, preload file details)
   */
  async preloadFiles(fileIds: string[], fetcher: (id: string) => Promise<GoogleDriveFile>): Promise<void> {
    const uncachedIds = fileIds.filter(id => !this.has({ type: 'file', id }));
    
    if (uncachedIds.length === 0) return;

    // Batch load uncached files
    const batchSize = 10;
    for (let i = 0; i < uncachedIds.length; i += batchSize) {
      const batch = uncachedIds.slice(i, i + batchSize);
      
      const promises = batch.map(async (id) => {
        try {
          const file = await fetcher(id);
          this.setFile(file);
        } catch (error) {
          console.warn(`Failed to preload file ${id}:`, error);
        }
      });

      await Promise.allSettled(promises);
    }
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmup(dataFetchers: {
    recentFiles?: () => Promise<GoogleDriveFile[]>;
    starredFiles?: () => Promise<GoogleDriveFile[]>;
    sharedFiles?: () => Promise<GoogleDriveFile[]>;
  }): Promise<void> {
    const promises: Promise<void>[] = [];

    if (dataFetchers.recentFiles && !this.has({ type: 'recent', id: 'files' })) {
      promises.push(
        dataFetchers.recentFiles()
          .then(files => this.setRecentFiles(files))
          .catch(error => console.warn('Failed to warm up recent files:', error))
      );
    }

    if (dataFetchers.starredFiles && !this.has({ type: 'starred', id: 'files' })) {
      promises.push(
        dataFetchers.starredFiles()
          .then(files => this.setStarredFiles(files))
          .catch(error => console.warn('Failed to warm up starred files:', error))
      );
    }

    if (dataFetchers.sharedFiles && !this.has({ type: 'shared', id: 'files' })) {
      promises.push(
        dataFetchers.sharedFiles()
          .then(files => this.setSharedFiles(files))
          .catch(error => console.warn('Failed to warm up shared files:', error))
      );
    }

    await Promise.allSettled(promises);
  }
}

// Export singleton instance
export const driveCache = new GoogleDriveCache({
  maxSize: 1000,
  defaultTtl: 5 * 60 * 1000, // 5 minutes
  persistToDisk: true,
  storageKey: 'google-drive-cache-v1'
});

// Cache utility functions
export const cacheUtils = {
  /**
   * Create cache key helper
   */
  key: (type: string, id: string, params?: Record<string, any>): CacheKey => ({
    type: type as any,
    id,
    params
  }),

  /**
   * Batch cache operations
   */
  batchSet: <T>(items: Array<{ key: CacheKey; data: T; options?: any }>) => {
    items.forEach(({ key, data, options }) => {
      driveCache.set(key, data, options);
    });
  },

  /**
   * Cache with fallback
   */
  getOrFetch: async <T>(
    key: CacheKey,
    fetcher: () => Promise<T>,
    options?: any
  ): Promise<T> => {
    const cached = driveCache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    driveCache.set(key, data, options);
    return data;
  },

  /**
   * Smart cache refresh (only if expired)
   */
  smartRefresh: async <T>(
    key: CacheKey,
    fetcher: () => Promise<T>,
    options?: any
  ): Promise<T> => {
    if (driveCache.has(key)) {
      return driveCache.get<T>(key)!;
    }

    const data = await fetcher();
    driveCache.set(key, data, options);
    return data;
  }
};