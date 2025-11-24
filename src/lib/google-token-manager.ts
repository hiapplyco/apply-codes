import { auth, db } from '@/lib/firebase';
import { functionBridge } from '@/lib/function-bridge';
import { toast } from 'sonner';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';

interface GoogleAccount {
  id: string;
  email: string;
  name: string;
  picture?: string;
  accessToken: string;
  refreshToken?: string;
  scopes: string[];
  tokenExpiry?: string;
  createdAt: string;
  lastUsed?: string;
}

interface TokenRefreshResult {
  success: boolean;
  accessToken?: string;
  expiresAt?: string;
  error?: string;
}

interface SessionInfo {
  isValid: boolean;
  account?: GoogleAccount;
  needsRefresh: boolean;
  error?: string;
}

const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes

const accountsCollection = (userId: string) => collection(db, 'users', userId, 'googleAccounts');

export class GoogleTokenManager {
  private static instance: GoogleTokenManager;
  private refreshPromises: Map<string, Promise<TokenRefreshResult>> = new Map();

  private constructor() {}

  public static getInstance(): GoogleTokenManager {
    if (!GoogleTokenManager.instance) {
      GoogleTokenManager.instance = new GoogleTokenManager();
    }
    return GoogleTokenManager.instance;
  }

  public cleanup(): void {
    this.refreshPromises.clear();
  }

  public async getValidAccessToken(userId?: string): Promise<string | null> {
    const account = await this.getActiveGoogleAccount(userId);
    if (!account) return null;

    if (this.isTokenExpired(account) || this.isTokenExpiringSoon(account)) {
      const result = await this.refreshAccountToken(account.id);
      if (result.success && result.accessToken) {
        return result.accessToken;
      }
      return null;
    }

    await this.updateLastUsed(account.id);
    return account.accessToken;
  }

  public async getActiveGoogleAccount(userId?: string): Promise<GoogleAccount | null> {
    const user = await this.resolveUser(userId);
    if (!user || !db) return null;

    const accountsQuery = query(accountsCollection(user), orderBy('lastUsed', 'desc'));
    const snapshot = await getDocs(accountsQuery);
    const [first] = snapshot.docs;
    return first ? this.mapAccount(first.id, first.data()) : null;
  }

  public async refreshAccountToken(accountId: string): Promise<TokenRefreshResult> {
    const existing = this.refreshPromises.get(accountId);
    if (existing) return existing;

    const promise = this.performTokenRefresh(accountId);
    this.refreshPromises.set(accountId, promise);
    try {
      return await promise;
    } finally {
      this.refreshPromises.delete(accountId);
    }
  }

  private async performTokenRefresh(accountId: string): Promise<TokenRefreshResult> {
    try {
      const account = await this.getAccountById(accountId);
      if (!account?.refreshToken) {
        throw new Error('Refresh token unavailable');
      }

      const refreshed = await functionBridge.refreshGoogleToken({ refreshToken: account.refreshToken });

      const user = auth?.currentUser;
      if (!user || !db) {
        throw new Error('User not authenticated');
      }

      await updateDoc(doc(accountsCollection(user.uid), accountId), {
        accessToken: refreshed.access_token,
        tokenExpiry: refreshed.expires_at,
        lastUsed: serverTimestamp()
      });

      return {
        success: true,
        accessToken: refreshed.access_token,
        expiresAt: refreshed.expires_at
      };
    } catch (error) {
      console.error('Error refreshing Google token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh token'
      };
    }
  }

  public isTokenExpired(account: GoogleAccount): boolean {
    if (!account.tokenExpiry) return false;
    return new Date(account.tokenExpiry) <= new Date();
  }

  public isTokenExpiringSoon(account: GoogleAccount): boolean {
    if (!account.tokenExpiry) return false;
    const expiryTime = new Date(account.tokenExpiry).getTime();
    return expiryTime - Date.now() <= TOKEN_REFRESH_BUFFER;
  }

  public async validateSession(userId?: string): Promise<SessionInfo> {
    const account = await this.getActiveGoogleAccount(userId);
    if (!account) {
      return { isValid: false, needsRefresh: false };
    }

    const needsRefresh = this.isTokenExpired(account) || this.isTokenExpiringSoon(account);

    return {
      isValid: !needsRefresh,
      needsRefresh,
      account
    };
  }

  public async markAccountForReconnection(accountId: string) {
    const user = auth?.currentUser;
    if (!user || !db) return;

    await updateDoc(doc(accountsCollection(user.uid), accountId), {
      tokenExpiry: null,
      lastUsed: serverTimestamp()
    });

    toast.error('Please reconnect your Google account to restore Drive features.');
  }

  private async updateLastUsed(accountId: string) {
    const user = auth?.currentUser;
    if (!user || !db) return;
    await updateDoc(doc(accountsCollection(user.uid), accountId), {
      lastUsed: serverTimestamp()
    });
  }

  private async getAccountById(accountId: string): Promise<GoogleAccount | null> {
    const user = auth?.currentUser;
    if (!user || !db) return null;

    const snapshot = await getDoc(doc(accountsCollection(user.uid), accountId));
    if (!snapshot.exists()) return null;
    return this.mapAccount(snapshot.id, snapshot.data());
  }

  private async resolveUser(userId?: string) {
    if (userId) return userId;
    const user = auth?.currentUser;
    if (!user) return null;
    return user.uid;
  }

  private mapAccount(id: string, data: any): GoogleAccount {
    return {
      id,
      email: data.email,
      name: data.name,
      picture: data.picture || undefined,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || undefined,
      scopes: data.scopes || [],
      tokenExpiry: data.tokenExpiry ? String(data.tokenExpiry) : undefined,
      createdAt: toIsoString(data.createdAt),
      lastUsed: toIsoString(data.lastUsed)
    };
  }
}

function toIsoString(value: any): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value.toDate) return value.toDate().toISOString();
  return new Date().toISOString();
}
