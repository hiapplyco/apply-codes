import React, { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { toast } from 'sonner';
import { GOOGLE_API_SCOPES } from '@/lib/google-api-config';
import { auth, db } from '@/lib/firebase';
import { functionBridge } from '@/lib/function-bridge';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
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

const accountsCollection = (userId: string) => collection(db, 'users', userId, 'googleAccounts');

export const GoogleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GoogleAuthState>({
    accounts: [],
    isLoading: true,
    error: null,
    isConnecting: false,
    currentAccount: null,
  });

  const mapSnapshotToAccount = useCallback((snapshot: any): GoogleAccount => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
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
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const user = auth?.currentUser;
      if (!user || !db) {
        setState(prev => ({ ...prev, accounts: [], currentAccount: null, isLoading: false }));
        return;
      }

      const accountsQuery = query(accountsCollection(user.uid), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(accountsQuery);
      const accounts = snapshot.docs.map(mapSnapshotToAccount);

      setState(prev => ({
        ...prev,
        accounts,
        currentAccount: accounts[0] || null,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error loading Google accounts:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load accounts',
        isLoading: false
      }));
    }
  }, [mapSnapshotToAccount]);

  const connectAccount = useCallback(async (
    scopes: string[] = [GOOGLE_API_SCOPES.DRIVE.FULL_ACCESS, GOOGLE_API_SCOPES.DOCS.FULL_ACCESS]
  ) => {
    if (state.isConnecting) return;

    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));

      const user = auth?.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const nonceValue = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
      const encoder = new TextEncoder();
      const hashedNonce = await crypto.subtle.digest('SHA-256', encoder.encode(nonceValue))
        .then(buffer => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join(''));

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', import.meta.env.VITE_GOOGLE_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', window.location.origin);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scopes.join(' '));
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', hashedNonce);
      authUrl.searchParams.set('include_granted_scopes', 'true');

      const popup = window.open(
        authUrl.toString(),
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      const handleAuthCallback = async (code: string, callbackState: string) => {
        try {
          if (callbackState !== hashedNonce) {
            throw new Error('Invalid state parameter');
          }

          const tokenData = await functionBridge.exchangeGoogleToken({
            code,
            redirectUri: window.location.origin
          });

          const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
          });

          if (!userInfoResponse.ok) {
            throw new Error('Failed to fetch Google user info');
          }

          const userInfo = await userInfoResponse.json();

          await setDoc(doc(accountsCollection(user.uid), userInfo.id), {
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture || null,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token || null,
            scopes: tokenData.scope ? tokenData.scope.split(' ') : scopes,
            tokenExpiry: tokenData.expires_at,
            createdAt: serverTimestamp(),
            lastUsed: serverTimestamp()
          }, { merge: true });

          await loadAccounts();
          toast.success(`Connected Google account: ${userInfo.email}`);
        } catch (error) {
          console.error('Error completing Google OAuth:', error);
          toast.error('Failed to connect Google account');
          setState(prev => ({
            ...prev,
            error: error instanceof Error ? error.message : 'Authentication failed'
          }));
        } finally {
          setState(prev => ({ ...prev, isConnecting: false }));
        }
      };

      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          handleAuthCallback(event.data.code, event.data.state);
          popup?.close();
          window.removeEventListener('message', messageHandler);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          toast.error(event.data.error || 'OAuth failed');
          setState(prev => ({ ...prev, isConnecting: false }));
          popup?.close();
          window.removeEventListener('message', messageHandler);
        }
      };

      window.addEventListener('message', messageHandler);

      const monitor = setInterval(() => {
        if (popup?.closed) {
          clearInterval(monitor);
          window.removeEventListener('message', messageHandler);
          setState(prev => ({ ...prev, isConnecting: false }));
        }
      }, 1000);
    } catch (error) {
      console.error('Error initiating Google OAuth:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to connect account',
        isConnecting: false
      }));
    }
  }, [state.isConnecting, loadAccounts]);

  const disconnectAccount = useCallback(async (accountId: string) => {
    try {
      const user = auth?.currentUser;
      if (!user || !db) {
        throw new Error('User not authenticated');
      }

      const account = state.accounts.find(acc => acc.id === accountId);
      if (account?.accessToken) {
        try {
          await functionBridge.revokeGoogleToken({ accessToken: account.accessToken });
        } catch (error) {
          console.warn('Failed to revoke Google token:', error);
        }
      }

      await deleteDoc(doc(accountsCollection(user.uid), accountId));
      await loadAccounts();
      toast.success('Google account disconnected');
    } catch (error) {
      console.error('Error disconnecting Google account:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to disconnect account'
      }));
    }
  }, [state.accounts, loadAccounts]);

  const refreshToken = useCallback(async (accountId: string) => {
    try {
      const user = auth?.currentUser;
      if (!user || !db) {
        throw new Error('User not authenticated');
      }

      const account = state.accounts.find(acc => acc.id === accountId);
      if (!account?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const refreshed = await functionBridge.refreshGoogleToken({ refreshToken: account.refreshToken });

      await updateDoc(doc(accountsCollection(user.uid), accountId), {
        accessToken: refreshed.access_token,
        tokenExpiry: refreshed.expires_at,
        lastUsed: serverTimestamp()
      });

      await loadAccounts();
      toast.success('Google token refreshed');
    } catch (error) {
      console.error('Error refreshing Google token:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh token'
      }));
    }
  }, [state.accounts, loadAccounts]);

  const selectAccount = useCallback((accountId: string) => {
    setState(prev => ({
      ...prev,
      currentAccount: prev.accounts.find(acc => acc.id === accountId) || null
    }));
  }, []);

  const checkTokenValidity = useCallback((accountId: string): boolean => {
    const account = state.accounts.find(acc => acc.id === accountId);
    if (!account?.tokenExpiry) return false;
    return new Date(account.tokenExpiry) > new Date();
  }, [state.accounts]);

  const hasRequiredScopes = useCallback((accountId: string, requiredScopes: string[]): boolean => {
    const account = state.accounts.find(acc => acc.id === accountId);
    if (!account) return false;
    return requiredScopes.every(scope => account.scopes.includes(scope));
  }, [state.accounts]);

  const refreshAllTokens = useCallback(async () => {
    for (const account of state.accounts) {
      if (!account.refreshToken) continue;
      const isValid = checkTokenValidity(account.id);
      if (!isValid) {
        await refreshToken(account.id);
      }
    }
  }, [state.accounts, checkTokenValidity, refreshToken]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshAllTokens();
    }, 5 * 60 * 1000);

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
    clearError
  };

  return (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  );
};

export const useGoogleAuthStandalone = () => {
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const user = auth?.currentUser;
      if (!user || !db) {
        setAccounts([]);
        setIsLoading(false);
        return;
      }

      const snapshot = await getDocs(query(accountsCollection(user.uid), orderBy('createdAt', 'desc')));
      const mapped = snapshot.docs.map(docSnap => {
        const data = docSnap.data() as any;
        return {
          id: docSnap.id,
          email: data.email,
          name: data.name,
          picture: data.picture || undefined,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || undefined,
          scopes: data.scopes || [],
          tokenExpiry: data.tokenExpiry ? String(data.tokenExpiry) : undefined,
          createdAt: toIsoString(data.createdAt),
          lastUsed: toIsoString(data.lastUsed)
        } as GoogleAccount;
      });

      setAccounts(mapped);
    } catch (error) {
      console.error('Error loading Google accounts:', error);
      setError(error instanceof Error ? error.message : 'Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { accounts, isLoading, error, reload: load };
};

function toIsoString(value: any): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value.toDate) return value.toDate().toISOString();
  return new Date().toISOString();
}
