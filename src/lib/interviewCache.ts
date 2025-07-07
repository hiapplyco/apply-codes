import { LRUCache } from 'lru-cache';
import type { InterviewTip, InterviewCompetency } from '@/types/interview';

interface CachedAnalysis {
  competencyMentions: string[];
  suggestedTips: InterviewTip[];
  timestamp: number;
}

interface CachedGuidance {
  prompt: string;
  response: InterviewTip[];
  timestamp: number;
}

export class InterviewCache {
  private static instance: InterviewCache;
  
  // Memory caches with size limits
  private analysisCache: LRUCache<string, CachedAnalysis>;
  private guidanceCache: LRUCache<string, CachedGuidance>;
  private transcriptBuffer: Map<string, string[]>;
  
  // IndexedDB for persistent storage
  private dbName = 'interviewGuidanceCache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  
  private constructor() {
    // Initialize LRU caches with max items and TTL
    this.analysisCache = new LRUCache<string, CachedAnalysis>({
      max: 100, // Max 100 analysis results
      ttl: 1000 * 60 * 30, // 30 minutes TTL
    });
    
    this.guidanceCache = new LRUCache<string, CachedGuidance>({
      max: 50, // Max 50 guidance responses
      ttl: 1000 * 60 * 60, // 1 hour TTL
    });
    
    this.transcriptBuffer = new Map();
    
    // Initialize IndexedDB
    this.initializeDB();
  }
  
  static getInstance(): InterviewCache {
    if (!InterviewCache.instance) {
      InterviewCache.instance = new InterviewCache();
    }
    return InterviewCache.instance;
  }
  
  private async initializeDB() {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not supported');
      return;
    }
    
    try {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB');
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'sessionId' });
          sessionStore.createIndex('timestamp', 'timestamp');
        }
        
        if (!db.objectStoreNames.contains('competencies')) {
          const competencyStore = db.createObjectStore('competencies', { keyPath: 'id' });
          competencyStore.createIndex('sessionId', 'sessionId');
        }
        
        if (!db.objectStoreNames.contains('tips')) {
          const tipsStore = db.createObjectStore('tips', { keyPath: 'id' });
          tipsStore.createIndex('sessionId', 'sessionId');
          tipsStore.createIndex('timestamp', 'timestamp');
        }
      };
    } catch (error) {
      console.error('IndexedDB initialization error:', error);
    }
  }
  
  // Analysis caching
  getCachedAnalysis(transcript: string): CachedAnalysis | null {
    const key = this.generateAnalysisKey(transcript);
    return this.analysisCache.get(key) || null;
  }
  
  setCachedAnalysis(transcript: string, analysis: CachedAnalysis) {
    const key = this.generateAnalysisKey(transcript);
    this.analysisCache.set(key, analysis);
  }
  
  // Guidance caching
  getCachedGuidance(prompt: string): CachedGuidance | null {
    const key = this.generateGuidanceKey(prompt);
    return this.guidanceCache.get(key) || null;
  }
  
  setCachedGuidance(prompt: string, tips: InterviewTip[]) {
    const key = this.generateGuidanceKey(prompt);
    this.guidanceCache.set(key, {
      prompt,
      response: tips,
      timestamp: Date.now(),
    });
  }
  
  // Transcript buffering for batch processing
  addToTranscriptBuffer(sessionId: string, transcript: string) {
    if (!this.transcriptBuffer.has(sessionId)) {
      this.transcriptBuffer.set(sessionId, []);
    }
    
    const buffer = this.transcriptBuffer.get(sessionId)!;
    buffer.push(transcript);
    
    // Limit buffer size
    if (buffer.length > 10) {
      buffer.shift();
    }
  }
  
  getTranscriptBuffer(sessionId: string): string[] {
    return this.transcriptBuffer.get(sessionId) || [];
  }
  
  clearTranscriptBuffer(sessionId: string) {
    this.transcriptBuffer.delete(sessionId);
  }
  
  // IndexedDB operations for persistent storage
  async saveSession(sessionId: string, data: any) {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      
      await store.put({
        sessionId,
        ...data,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }
  
  async getSession(sessionId: string): Promise<any | null> {
    if (!this.db) return null;
    
    try {
      const transaction = this.db.transaction(['sessions'], 'readonly');
      const store = transaction.objectStore('sessions');
      const request = store.get(sessionId);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }
  
  async saveTips(sessionId: string, tips: InterviewTip[]) {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['tips'], 'readwrite');
      const store = transaction.objectStore('tips');
      
      for (const tip of tips) {
        await store.put({
          ...tip,
          sessionId,
        });
      }
    } catch (error) {
      console.error('Failed to save tips:', error);
    }
  }
  
  async getTipsBySession(sessionId: string): Promise<InterviewTip[]> {
    if (!this.db) return [];
    
    try {
      const transaction = this.db.transaction(['tips'], 'readonly');
      const store = transaction.objectStore('tips');
      const index = store.index('sessionId');
      const request = index.getAll(sessionId);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get tips:', error);
      return [];
    }
  }
  
  // Clean up old data
  async cleanupOldData(daysToKeep = 7) {
    if (!this.db) return;
    
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    try {
      // Clean sessions
      const sessionTx = this.db.transaction(['sessions'], 'readwrite');
      const sessionStore = sessionTx.objectStore('sessions');
      const sessionIndex = sessionStore.index('timestamp');
      const sessionRange = IDBKeyRange.upperBound(cutoffTime);
      
      const sessionsToDelete = await sessionIndex.getAllKeys(sessionRange);
      for (const key of sessionsToDelete) {
        await sessionStore.delete(key);
      }
      
      // Clean tips
      const tipsTx = this.db.transaction(['tips'], 'readwrite');
      const tipsStore = tipsTx.objectStore('tips');
      const tipsIndex = tipsStore.index('timestamp');
      const tipsRange = IDBKeyRange.upperBound(cutoffTime);
      
      const tipsToDelete = await tipsIndex.getAllKeys(tipsRange);
      for (const key of tipsToDelete) {
        await tipsStore.delete(key);
      }
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
    }
  }
  
  // Key generation helpers
  private generateAnalysisKey(transcript: string): string {
    // Create a simple hash of the transcript for caching
    return `analysis_${this.simpleHash(transcript.slice(0, 200))}`;
  }
  
  private generateGuidanceKey(prompt: string): string {
    // Create a simple hash of the prompt for caching
    return `guidance_${this.simpleHash(prompt.slice(0, 200))}`;
  }
  
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
  
  // Clear all caches
  clearAll() {
    this.analysisCache.clear();
    this.guidanceCache.clear();
    this.transcriptBuffer.clear();
  }
}