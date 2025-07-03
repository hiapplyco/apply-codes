import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export class GoogleTokenManager {
  private static instance: GoogleTokenManager;
  private refreshPromises: Map<string, Promise<TokenRefreshResult>> = new Map();
  private refreshTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes before expiry

  private constructor() {
    this.initializeAutoRefresh();
  }

  public static getInstance(): GoogleTokenManager {
    if (!GoogleTokenManager.instance) {
      GoogleTokenManager.instance = new GoogleTokenManager();
    }
    return GoogleTokenManager.instance;
  }

  /**
   * Get a valid access token for the user's active Google account
   */
  public async getValidAccessToken(userId?: string): Promise<string | null> {
    try {
      const account = await this.getActiveGoogleAccount(userId);
      if (!account) {
        return null;
      }

      // Check if token needs refresh
      if (this.isTokenExpired(account) || this.isTokenExpiringSoon(account)) {
        const refreshResult = await this.refreshAccountToken(account.id);
        if (refreshResult.success && refreshResult.accessToken) {
          return refreshResult.accessToken;
        }
        return null;
      }

      // Update last used timestamp
      await this.updateLastUsed(account.id);
      return account.accessToken;
    } catch (error) {
      console.error('Error getting valid access token:', error);
      return null;
    }
  }

  /**
   * Get the active Google account for a user
   */
  public async getActiveGoogleAccount(userId?: string): Promise<GoogleAccount | null> {
    try {
      let targetUserId = userId;
      
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }
        targetUserId = user.id;
      }

      const { data: accounts, error } = await supabase
        .from('google_accounts')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('status', 'active')
        .order('last_used', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      return accounts?.[0] || null;
    } catch (error) {
      console.error('Error getting active Google account:', error);
      return null;
    }
  }

  /**
   * Refresh an access token using the refresh token
   */
  public async refreshAccountToken(accountId: string): Promise<TokenRefreshResult> {
    // Check if refresh is already in progress
    const existingPromise = this.refreshPromises.get(accountId);
    if (existingPromise) {
      return existingPromise;
    }

    const refreshPromise = this.performTokenRefresh(accountId);
    this.refreshPromises.set(accountId, refreshPromise);

    try {
      const result = await refreshPromise;
      return result;
    } finally {
      this.refreshPromises.delete(accountId);
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(accountId: string): Promise<TokenRefreshResult> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'refresh-google-token',
        {
          body: { accountId }
        }
      );

      if (error) {
        throw error;
      }

      // Schedule next refresh
      this.scheduleTokenRefresh(accountId, data.token_expiry);

      return {
        success: true,
        accessToken: data.access_token,
        expiresAt: data.token_expiry
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      
      // Handle specific error cases
      if (error.message?.includes('refresh token expired')) {
        await this.markAccountForReconnection(accountId);
        return {
          success: false,
          error: 'Refresh token expired. Please reconnect your Google account.'
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to refresh token'
      };
    }
  }

  /**
   * Check if a token is expired
   */
  public isTokenExpired(account: GoogleAccount): boolean {
    if (!account.tokenExpiry) {
      return false;
    }
    return new Date(account.tokenExpiry) <= new Date();
  }

  /**
   * Check if a token is expiring soon
   */
  public isTokenExpiringSoon(account: GoogleAccount): boolean {
    if (!account.tokenExpiry) {
      return false;
    }
    const expiryTime = new Date(account.tokenExpiry).getTime();
    const now = Date.now();
    return (expiryTime - now) <= this.TOKEN_REFRESH_BUFFER;
  }

  /**
   * Validate a session and return session info
   */
  public async validateSession(userId?: string): Promise<SessionInfo> {
    try {
      const account = await this.getActiveGoogleAccount(userId);
      
      if (!account) {
        return {
          isValid: false,
          needsRefresh: false,
          error: 'No active Google account found'
        };
      }

      const isExpired = this.isTokenExpired(account);
      const needsRefresh = isExpired || this.isTokenExpiringSoon(account);

      if (isExpired) {
        return {
          isValid: false,
          account,
          needsRefresh: true,
          error: 'Access token has expired'
        };
      }

      return {
        isValid: true,
        account,
        needsRefresh
      };
    } catch (error) {
      console.error('Error validating session:', error);
      return {
        isValid: false,
        needsRefresh: false,
        error: error.message || 'Failed to validate session'
      };
    }
  }

  /**
   * Initialize automatic token refresh
   */
  private initializeAutoRefresh(): void {
    // Check for tokens that need refreshing every 10 minutes
    setInterval(async () => {
      await this.refreshExpiredTokens();
    }, 10 * 60 * 1000);

    // Initial check
    setTimeout(() => {
      this.refreshExpiredTokens();
    }, 5000);
  }

  /**
   * Refresh all expired or expiring tokens
   */
  public async refreshExpiredTokens(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      const { data: accounts, error } = await supabase
        .from('google_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error || !accounts) {
        return;
      }

      const refreshPromises = accounts
        .filter(account => 
          this.isTokenExpired(account) || this.isTokenExpiringSoon(account)
        )
        .map(account => this.refreshAccountToken(account.id));

      const results = await Promise.allSettled(refreshPromises);
      
      const failedRefreshes = results.filter(result => 
        result.status === 'rejected' || 
        (result.status === 'fulfilled' && !result.value.success)
      );

      if (failedRefreshes.length > 0) {
        console.warn(`Failed to refresh ${failedRefreshes.length} token(s)`);
      }
    } catch (error) {
      console.error('Error in automatic token refresh:', error);
    }
  }

  /**
   * Schedule token refresh before expiry
   */
  private scheduleTokenRefresh(accountId: string, tokenExpiry: string): void {
    // Clear existing timer
    const existingTimer = this.refreshTimers.get(accountId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const expiryTime = new Date(tokenExpiry).getTime();
    const refreshTime = expiryTime - this.TOKEN_REFRESH_BUFFER;
    const now = Date.now();

    if (refreshTime > now) {
      const timeout = setTimeout(async () => {
        await this.refreshAccountToken(accountId);
        this.refreshTimers.delete(accountId);
      }, refreshTime - now);

      this.refreshTimers.set(accountId, timeout);
    }
  }

  /**
   * Mark account as needing reconnection
   */
  private async markAccountForReconnection(accountId: string): Promise<void> {
    try {
      await supabase
        .from('google_accounts')
        .update({
          status: 'needs_reconnection',
          access_token: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId);
    } catch (error) {
      console.error('Error marking account for reconnection:', error);
    }
  }

  /**
   * Update last used timestamp
   */
  private async updateLastUsed(accountId: string): Promise<void> {
    try {
      await supabase
        .from('google_accounts')
        .update({
          last_used: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId);
    } catch (error) {
      console.error('Error updating last used timestamp:', error);
    }
  }

  /**
   * Revoke and cleanup tokens
   */
  public async revokeTokens(accountId: string): Promise<boolean> {
    try {
      // Clear any scheduled refresh
      const timer = this.refreshTimers.get(accountId);
      if (timer) {
        clearTimeout(timer);
        this.refreshTimers.delete(accountId);
      }

      // Clear any pending refresh promise
      this.refreshPromises.delete(accountId);

      // Call revoke function
      const { error } = await supabase.functions.invoke(
        'revoke-google-token',
        {
          body: { accountId }
        }
      );

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error revoking tokens:', error);
      return false;
    }
  }

  /**
   * Check if user has required scopes
   */
  public async hasRequiredScopes(scopes: string[], userId?: string): Promise<boolean> {
    try {
      const account = await this.getActiveGoogleAccount(userId);
      if (!account) {
        return false;
      }

      return scopes.every(scope => account.scopes.includes(scope));
    } catch (error) {
      console.error('Error checking scopes:', error);
      return false;
    }
  }

  /**
   * Get session statistics
   */
  public async getSessionStats(userId?: string): Promise<{
    totalAccounts: number;
    activeAccounts: number;
    expiredAccounts: number;
    expiringSoonAccounts: number;
  }> {
    try {
      let targetUserId = userId;
      
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }
        targetUserId = user.id;
      }

      const { data: accounts, error } = await supabase
        .from('google_accounts')
        .select('*')
        .eq('user_id', targetUserId);

      if (error || !accounts) {
        return {
          totalAccounts: 0,
          activeAccounts: 0,
          expiredAccounts: 0,
          expiringSoonAccounts: 0
        };
      }

      const activeAccounts = accounts.filter(acc => 
        acc.status === 'active' && !this.isTokenExpired(acc)
      );

      const expiredAccounts = accounts.filter(acc => 
        this.isTokenExpired(acc)
      );

      const expiringSoonAccounts = accounts.filter(acc => 
        !this.isTokenExpired(acc) && this.isTokenExpiringSoon(acc)
      );

      return {
        totalAccounts: accounts.length,
        activeAccounts: activeAccounts.length,
        expiredAccounts: expiredAccounts.length,
        expiringSoonAccounts: expiringSoonAccounts.length
      };
    } catch (error) {
      console.error('Error getting session stats:', error);
      return {
        totalAccounts: 0,
        activeAccounts: 0,
        expiredAccounts: 0,
        expiringSoonAccounts: 0
      };
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    // Clear all timers
    this.refreshTimers.forEach(timer => clearTimeout(timer));
    this.refreshTimers.clear();
    
    // Clear all promises
    this.refreshPromises.clear();
  }
}

// Export singleton instance
export const googleTokenManager = GoogleTokenManager.getInstance();