import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);

interface CachedSecrets {
  secrets: Record<string, string>;
  timestamp: number;
  hash: string;
}

export class SecretsManager {
  private secrets: Record<string, string> = {};
  private cacheFile: string;
  private cacheTTL: number = 3600000; // 1 hour in milliseconds
  private initialized: boolean = false;

  constructor() {
    this.cacheFile = path.join(process.cwd(), '.secrets-cache');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // First try to load from cache
    const cached = await this.loadFromCache();
    if (cached && !this.isCacheExpired(cached)) {
      this.secrets = cached.secrets;
      console.error('Loaded secrets from cache');
    } else {
      // Load from environment variables
      await this.loadFromEnvironment();
    }

    this.initialized = true;
  }

  private async loadFromEnvironment(): Promise<void> {
    const envKeys = [
      'GOOGLE_CSE_API_KEY',
      'GOOGLE_CSE_ID',
      'GEMINI_API_KEY',
      'PERPLEXITY_API_KEY',
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'NYMERIA_API_KEY',
    ];

    envKeys.forEach(key => {
      const value = process.env[key];
      if (value) {
        this.secrets[key] = value;
      }
    });

    // Cache the loaded secrets
    if (Object.keys(this.secrets).length > 0) {
      await this.saveToCache(this.secrets);
    }

    console.error(`Loaded ${Object.keys(this.secrets).length} secrets from environment`);
  }

  private async loadFromCache(): Promise<CachedSecrets | null> {
    try {
      if (!fs.existsSync(this.cacheFile)) {
        return null;
      }

      const encrypted = fs.readFileSync(this.cacheFile, 'utf8');
      const decrypted = await this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to load cache:', error);
      return null;
    }
  }

  private async saveToCache(secrets: Record<string, string>): Promise<void> {
    try {
      const cached: CachedSecrets = {
        secrets,
        timestamp: Date.now(),
        hash: this.generateHash(secrets)
      };

      const encrypted = await this.encrypt(JSON.stringify(cached));
      fs.writeFileSync(this.cacheFile, encrypted, 'utf8');
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }

  private isCacheExpired(cached: CachedSecrets): boolean {
    return Date.now() - cached.timestamp > this.cacheTTL;
  }

  private async encrypt(text: string): Promise<string> {
    const key = (await scrypt(
      process.env.MCP_CACHE_SECRET || 'dev-fallback',
      'mcp-secrets-salt',
      32
    )) as Buffer;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  private async decrypt(encryptedText: string): Promise<string> {
    const [ivHex, encrypted] = encryptedText.split(':');
    const key = (await scrypt(
      process.env.MCP_CACHE_SECRET || 'dev-fallback',
      'mcp-secrets-salt',
      32
    )) as Buffer;
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
    await this.loadFromEnvironment();
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
