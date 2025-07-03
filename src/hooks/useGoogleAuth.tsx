import React, { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GOOGLE_API_SCOPES } from '@/lib/google-api-config';

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

interface GoogleAuthState {
  accounts: GoogleAccount[];
  isLoading: boolean;
  error: string | null;
  isConnecting: boolean;
  currentAccount: GoogleAccount | null;
}

interface GoogleAuthActions {
  connectAccount: (scopes?: string[]) => Promise<void>;
  disconnectAccount: (accountId: string) => Promise<void>;
  refreshToken: (accountId: string) => Promise<void>;
  selectAccount: (accountId: string) => void;
  checkTokenValidity: (accountId: string) => boolean;
  hasRequiredScopes: (accountId: string, requiredScopes: string[]) => boolean;
  refreshAllTokens: () => Promise<void>;
  clearError: () => void;
}

type GoogleAuthContextType = GoogleAuthState & GoogleAuthActions;

const GoogleAuthContext = createContext<GoogleAuthContextType | null>(null);

export const useGoogleAuth = () => {
  const context = useContext(GoogleAuthContext);
  if (!context) {
    throw new Error('useGoogleAuth must be used within GoogleAuthProvider');
  }
  return context;
};

export const GoogleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GoogleAuthState>({
    accounts: [],
    isLoading: true,
    error: null,
    isConnecting: false,
    currentAccount: null,
  });

  // Load connected accounts
  const loadAccounts = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState(prev => ({ ...prev, accounts: [], isLoading: false, currentAccount: null }));
        return;
      }

      const { data: accounts, error } = await supabase
        .from('google_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const currentAccount = accounts?.[0] || null;
      setState(prev => ({ 
        ...prev, 
        accounts: accounts || [], 
        currentAccount,
        isLoading: false 
      }));
    } catch (err) {
      console.error('Error loading Google accounts:', err);
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Failed to load accounts',
        isLoading: false 
      }));
    }
  }, []);

  // Connect new account
  const connectAccount = useCallback(async (scopes: string[] = [GOOGLE_API_SCOPES.DRIVE.FULL_ACCESS, GOOGLE_API_SCOPES.DOCS.FULL_ACCESS]) => {
    if (state.isConnecting) return;

    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));

      // Generate nonce for security
      const nonceValue = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
      const encoder = new TextEncoder();
      const encodedNonce = encoder.encode(nonceValue);
      const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      // Create authorization URL
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', import.meta.env.VITE_GOOGLE_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', window.location.origin);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scopes.join(' '));
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', hashedNonce);
      authUrl.searchParams.set('include_granted_scopes', 'true');

      // Handle OAuth callback
      const handleAuthCallback = async (code: string, state: string) => {
        try {
          if (state !== hashedNonce) {
            throw new Error('Invalid state parameter - possible CSRF attack');
          }

          const { data: tokenData, error: tokenError } = await supabase.functions.invoke(
            'exchange-google-token',
            {
              body: { code, redirectUri: window.location.origin }
            }
          );

          if (tokenError) {
            throw tokenError;
          }

          // Get user info
          const userInfoResponse = await fetch(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            {
              headers: {
                Authorization: `Bearer ${tokenData.access_token}`
              }
            }
          );

          if (!userInfoResponse.ok) {
            throw new Error('Failed to get user info');
          }

          const userInfo = await userInfoResponse.json();
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            throw new Error('User not authenticated');
          }

          // Save account
          const googleAccount = {
            user_id: user.id,
            google_id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            scopes: tokenData.scope ? tokenData.scope.split(' ') : scopes,
            token_expiry: tokenData.expires_at,
            created_at: new Date().toISOString(),
            last_used: new Date().toISOString()
          };

          const { data: savedAccount, error: saveError } = await supabase
            .from('google_accounts')
            .upsert(googleAccount, {
              onConflict: 'user_id,google_id',
              ignoreDuplicates: false
            })
            .select()
            .single();

          if (saveError) {
            throw saveError;
          }

          // Update state
          setState(prev => {
            const existingIndex = prev.accounts.findIndex(acc => acc.id === savedAccount.id);
            let newAccounts: GoogleAccount[];
            
            if (existingIndex >= 0) {
              newAccounts = prev.accounts.map(acc => 
                acc.id === savedAccount.id ? savedAccount : acc
              );
            } else {
              newAccounts = [savedAccount, ...prev.accounts];
            }

            return {
              ...prev,
              accounts: newAccounts,
              currentAccount: savedAccount,
              isConnecting: false
            };
          });

          toast.success(`Successfully connected Google account: ${userInfo.email}`);
        } catch (err) {
          console.error('Error in auth callback:', err);
          setState(prev => ({ 
            ...prev, 
            error: err instanceof Error ? err.message : 'Authentication failed',
            isConnecting: false 
          }));
          toast.error('Failed to connect Google account');
        }
      };

      // Open auth popup
      const popup = window.open(
        authUrl.toString(),
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for popup messages
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          handleAuthCallback(event.data.code, event.data.state);
          popup?.close();
          window.removeEventListener('message', messageHandler);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          setState(prev => ({ 
            ...prev, 
            error: event.data.error,
            isConnecting: false 
          }));
          popup?.close();
          window.removeEventListener('message', messageHandler);
        }
      };

      window.addEventListener('message', messageHandler);

      // Check if popup was closed
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          setState(prev => ({ ...prev, isConnecting: false }));
        }
      }, 1000);

    } catch (err) {
      console.error('Error connecting account:', err);
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Failed to connect account',
        isConnecting: false 
      }));
    }
  }, [state.isConnecting]);

  // Disconnect account
  const disconnectAccount = useCallback(async (accountId: string) => {
    try {
      setState(prev => ({ ...prev, error: null }));

      const { error } = await supabase.functions.invoke(
        'revoke-google-token',
        {
          body: { accountId }
        }
      );

      if (error) {
        throw error;
      }

      setState(prev => {
        const newAccounts = prev.accounts.filter(acc => acc.id !== accountId);
        const newCurrentAccount = prev.currentAccount?.id === accountId 
          ? (newAccounts[0] || null) 
          : prev.currentAccount;

        return {
          ...prev,
          accounts: newAccounts,
          currentAccount: newCurrentAccount
        };
      });

      toast.success('Google account disconnected successfully');
    } catch (err) {
      console.error('Error disconnecting account:', err);
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Failed to disconnect account'
      }));
    }
  }, []);

  // Refresh token
  const refreshToken = useCallback(async (accountId: string) => {
    try {
      setState(prev => ({ ...prev, error: null }));

      const { data: refreshData, error } = await supabase.functions.invoke(
        'refresh-google-token',
        {
          body: { accountId }
        }
      );

      if (error) {
        throw error;
      }

      setState(prev => ({
        ...prev,
        accounts: prev.accounts.map(acc => 
          acc.id === accountId 
            ? { ...acc, ...refreshData, lastUsed: new Date().toISOString() }
            : acc
        ),
        currentAccount: prev.currentAccount?.id === accountId 
          ? { ...prev.currentAccount, ...refreshData, lastUsed: new Date().toISOString() }
          : prev.currentAccount
      }));

      toast.success('Token refreshed successfully');
    } catch (err) {
      console.error('Error refreshing token:', err);
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Failed to refresh token'
      }));
    }
  }, []);

  // Select account
  const selectAccount = useCallback((accountId: string) => {
    setState(prev => ({
      ...prev,
      currentAccount: prev.accounts.find(acc => acc.id === accountId) || null
    }));
  }, []);

  // Check token validity
  const checkTokenValidity = useCallback((accountId: string): boolean => {
    const account = state.accounts.find(acc => acc.id === accountId);
    if (!account || !account.tokenExpiry) return false;
    
    return new Date(account.tokenExpiry) > new Date();
  }, [state.accounts]);

  // Check required scopes
  const hasRequiredScopes = useCallback((accountId: string, requiredScopes: string[]): boolean => {
    const account = state.accounts.find(acc => acc.id === accountId);
    if (!account) return false;
    
    return requiredScopes.every(scope => account.scopes.includes(scope));
  }, [state.accounts]);

  // Refresh all tokens
  const refreshAllTokens = useCallback(async () => {
    const promises = state.accounts.map(account => {
      if (!checkTokenValidity(account.id)) {
        return refreshToken(account.id);
      }
      return Promise.resolve();
    });

    await Promise.allSettled(promises);
  }, [state.accounts, checkTokenValidity, refreshToken]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Auto-refresh tokens
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAllTokens();
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [refreshAllTokens]);

  const value: GoogleAuthContextType = {
    ...state,
    connectAccount,
    disconnectAccount,
    refreshToken,
    selectAccount,
    checkTokenValidity,
    hasRequiredScopes,
    refreshAllTokens,
    clearError,
  };

  return (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  );
};

// Standalone hook for components not using the provider
export const useGoogleAuthStandalone = () => {
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAccounts([]);
        setIsLoading(false);
        return;
      }

      const { data: googleAccounts, error: fetchError } = await supabase
        .from('google_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setAccounts(googleAccounts || []);
    } catch (err) {
      console.error('Error loading Google accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  return {
    accounts,
    isLoading,
    error,
    reload: loadAccounts,
  };
};