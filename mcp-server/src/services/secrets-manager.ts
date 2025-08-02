import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface CachedSecrets {
  secrets: Record<string, string>;
  timestamp: number;
  hash: string;
}

export class SecretsManager {
  private secrets: Record<string, string> = {};
  private supabase: SupabaseClient | null = null;
  private cacheFile: string;
  private cacheTTL: number = 3600000; // 1 hour in milliseconds
  private initialized: boolean = false;

  constructor() {
    this.cacheFile = path.join(process.cwd(), '.secrets-cache');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // First try to load from cache
    const cached = this.loadFromCache();
    if (cached) {
      this.secrets = cached.secrets;
      console.error('Loaded secrets from cache');
    }

    // If no cache or cache is expired, load from Supabase
    if (!cached || this.isCacheExpired(cached)) {
      await this.loadFromSupabase();
    }

    this.initialized = true;
  }

  private async loadFromSupabase(): Promise<void> {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase credentials not found, falling back to environment variables');
        this.loadFromEnvironment();
        return;
      }

      // Fetch secrets from Edge Function
      const response = await fetch(`${supabaseUrl}/functions/v1/get-mcp-secrets`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch secrets: ${response.statusText}`);
      }

      this.secrets = await response.json() as Record<string, string>;
      
      // Cache the secrets
      this.saveToCache(this.secrets);
      console.error('Loaded secrets from Supabase');
    } catch (error) {
      console.error('Failed to load secrets from Supabase:', error);
      // Fall back to environment variables
      this.loadFromEnvironment();
    }
  }

  private loadFromEnvironment(): void {
    // Load from environment variables as fallback
    const envKeys = [
      'GOOGLE_CSE_API_KEY',
      'GOOGLE_CSE_ID',
      'PERPLEXITY_API_KEY',
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY'
    ];

    envKeys.forEach(key => {
      const value = process.env[key];
      if (value) {
        this.secrets[key] = value;
      }
    });

    console.error('Loaded secrets from environment variables');
  }

  private loadFromCache(): CachedSecrets | null {
    try {
      if (!fs.existsSync(this.cacheFile)) {
        return null;
      }

      const encrypted = fs.readFileSync(this.cacheFile, 'utf8');
      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to load cache:', error);
      return null;
    }
  }

  private saveToCache(secrets: Record<string, string>): void {
    try {
      const cached: CachedSecrets = {
        secrets,
        timestamp: Date.now(),
        hash: this.generateHash(secrets)
      };

      const encrypted = this.encrypt(JSON.stringify(cached));
      fs.writeFileSync(this.cacheFile, encrypted, 'utf8');
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }

  private isCacheExpired(cached: CachedSecrets): boolean {
    return Date.now() - cached.timestamp > this.cacheTTL;
  }

  private encrypt(text: string): string {
    // Use machine-specific key for encryption
    const key = crypto.scryptSync(
      process.env.USER || 'default',
      'mcp-secrets-salt',
      32
    );
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');
    const key = crypto.scryptSync(
      process.env.USER || 'default',
      'mcp-secrets-salt',
      32
    );
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  private generateHash(secrets: Record<string, string>): string {
    const content = JSON.stringify(secrets);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  get(key: string): string | undefined {
    return this.secrets[key];
  }

  getAll(): Record<string, string> {
    return { ...this.secrets };
  }

  async refresh(): Promise<void> {
    await this.loadFromSupabase();
  }

  clearCache(): void {
    try {
      if (fs.existsSync(this.cacheFile)) {
        fs.unlinkSync(this.cacheFile);
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}

// Singleton instance
export const secretsManager = new SecretsManager();