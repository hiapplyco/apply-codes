import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Settings, Trash2, RefreshCw, Link, Unlink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

interface GoogleAccountManagerProps {
  onAccountConnected?: (account: GoogleAccount) => void;
  onAccountDisconnected?: (accountId: string) => void;
  requiredScopes?: string[];
  className?: string;
}

declare global {
  interface Window {
    google: any;
    handleGoogleAccountConnection: (response: any) => void;
  }
}

export function GoogleAccountManager({ 
  onAccountConnected, 
  onAccountDisconnected, 
  requiredScopes = [
    GOOGLE_API_SCOPES.DRIVE.FULL_ACCESS,
    GOOGLE_API_SCOPES.DOCS.FULL_ACCESS
  ],
  className = ''
}: GoogleAccountManagerProps) {
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate nonce for OAuth security
  const generateNonce = async () => {
    const nonceValue = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
    const encoder = new TextEncoder();
    const encodedNonce = encoder.encode(nonceValue);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedNonceValue = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    
    return { nonce: nonceValue, hashedNonce: hashedNonceValue };
  };

  // Load connected Google accounts
  const loadConnectedAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get connected Google accounts from the database
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
      setError(err instanceof Error ? err.message : 'Failed to load Google accounts');
      toast.error('Failed to load connected Google accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  // Connect new Google account
  const connectGoogleAccount = useCallback(async () => {
    if (connecting) return;
    
    try {
      setConnecting(true);
      setError(null);
      
      const { nonce, hashedNonce } = await generateNonce();
      
      // Create global callback function
      window.handleGoogleAccountConnection = async (response: any) => {
        try {
          // Verify the nonce
          const idToken = response.credential;
          const payload = JSON.parse(atob(idToken.split('.')[1]));
          
          if (payload.nonce !== hashedNonce) {
            throw new Error('Invalid nonce - possible security issue');
          }

          // Exchange the ID token for access token with required scopes
          const { data: tokenData, error: tokenError } = await supabase.functions.invoke(
            'exchange-google-token',
            {
              body: {
                idToken,
                scopes: requiredScopes,
                nonce
              }
            }
          );

          if (tokenError) {
            throw tokenError;
          }

          // Store the Google account connection
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('User not authenticated');
          }

          const googleAccount: Partial<GoogleAccount> = {
            user_id: user.id,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            google_id: payload.sub,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            scopes: tokenData.scopes || requiredScopes,
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

          // Update local state
          setAccounts(prev => {
            const existing = prev.find(acc => acc.id === savedAccount.id);
            if (existing) {
              return prev.map(acc => acc.id === savedAccount.id ? savedAccount : acc);
            }
            return [savedAccount, ...prev];
          });

          toast.success(`Successfully connected Google account: ${payload.email}`);
          onAccountConnected?.(savedAccount);
        } catch (err) {
          console.error('Error connecting Google account:', err);
          toast.error(err instanceof Error ? err.message : 'Failed to connect Google account');
        } finally {
          setConnecting(false);
        }
      };

      // Initialize Google Sign-In with extended scopes
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: window.handleGoogleAccountConnection,
          nonce: hashedNonce,
          use_fedcm_for_prompt: true,
          auto_select: false,
          cancel_on_tap_outside: true,
          auto_prompt: false,
          context: 'use', // Specify context for account selection
          ux_mode: 'popup', // Use popup mode for better UX
          state_cookie_domain: window.location.hostname,
          allowed_parent_origin: window.location.origin,
          intermediate_iframe_close_callback: () => {
            setConnecting(false);
          }
        });

        // Request authorization with required scopes
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', import.meta.env.VITE_GOOGLE_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', window.location.origin);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', requiredScopes.join(' '));
        authUrl.searchParams.set('access_type', 'offline');
        authUrl.searchParams.set('prompt', 'consent');
        authUrl.searchParams.set('state', hashedNonce);
        authUrl.searchParams.set('include_granted_scopes', 'true');

        // Open authorization in popup
        const popup = window.open(
          authUrl.toString(),
          'google-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Handle popup close
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            setConnecting(false);
          }
        }, 1000);
      } else {
        throw new Error('Google Sign-In library not loaded');
      }
    } catch (err) {
      console.error('Error initiating Google connection:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate Google connection');
      toast.error('Failed to connect Google account');
      setConnecting(false);
    }
  }, [connecting, requiredScopes, onAccountConnected]);

  // Refresh account token
  const refreshAccountToken = useCallback(async (accountId: string) => {
    try {
      setRefreshing(accountId);
      setError(null);

      const { data: refreshData, error: refreshError } = await supabase.functions.invoke(
        'refresh-google-token',
        {
          body: { accountId }
        }
      );

      if (refreshError) {
        throw refreshError;
      }

      // Update local state
      setAccounts(prev => prev.map(acc => 
        acc.id === accountId 
          ? { ...acc, ...refreshData, last_used: new Date().toISOString() }
          : acc
      ));

      toast.success('Token refreshed successfully');
    } catch (err) {
      console.error('Error refreshing token:', err);
      toast.error('Failed to refresh token');
    } finally {
      setRefreshing(null);
    }
  }, []);

  // Disconnect Google account
  const disconnectAccount = useCallback(async (accountId: string) => {
    try {
      setError(null);
      
      // Revoke token and remove from database
      const { error: revokeError } = await supabase.functions.invoke(
        'revoke-google-token',
        {
          body: { accountId }
        }
      );

      if (revokeError) {
        throw revokeError;
      }

      // Remove from local state
      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      
      toast.success('Google account disconnected successfully');
      onAccountDisconnected?.(accountId);
    } catch (err) {
      console.error('Error disconnecting account:', err);
      toast.error('Failed to disconnect Google account');
    }
  }, [onAccountDisconnected]);

  // Check if account has required scopes
  const hasRequiredScopes = (account: GoogleAccount): boolean => {
    return requiredScopes.every(scope => account.scopes.includes(scope));
  };

  // Check if token is expired
  const isTokenExpired = (account: GoogleAccount): boolean => {
    if (!account.tokenExpiry) return false;
    return new Date(account.tokenExpiry) <= new Date();
  };

  // Load Google Sign-In library
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      loadConnectedAccounts();
    };
    
    document.head.appendChild(script);
    
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window.handleGoogleAccountConnection;
    };
  }, [loadConnectedAccounts]);

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading Google accounts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Google Account Integration</h2>
          <p className="text-gray-600 mt-1">
            Connect your Google accounts to access Drive and Docs
          </p>
        </div>
        <Button
          onClick={connectGoogleAccount}
          disabled={connecting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {connecting ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Link className="w-4 h-4 mr-2" />
              Connect Google Account
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Settings className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Google accounts connected</h3>
              <p className="text-gray-600 mb-4">
                Connect your Google account to access Drive and Docs features
              </p>
              <Button
                onClick={connectGoogleAccount}
                disabled={connecting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {connecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4 mr-2" />
                    Connect Your First Account
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accounts.map((account) => {
            const hasScopes = hasRequiredScopes(account);
            const isExpired = isTokenExpired(account);
            const needsRefresh = isExpired || !hasScopes;

            return (
              <Card key={account.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {account.picture && (
                        <img
                          src={account.picture}
                          alt={account.name}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div>
                        <CardTitle className="text-lg">{account.name}</CardTitle>
                        <CardDescription>{account.email}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {needsRefresh ? (
                        <Badge variant="destructive">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Needs Attention
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Permissions:</p>
                      <div className="flex flex-wrap gap-2">
                        {requiredScopes.map((scope) => {
                          const hasScope = account.scopes.includes(scope);
                          const scopeName = scope.includes('drive') ? 'Google Drive' : 'Google Docs';
                          
                          return (
                            <Badge
                              key={scope}
                              variant={hasScope ? 'default' : 'outline'}
                              className={hasScope ? 'bg-green-100 text-green-800' : 'text-red-600 border-red-300'}
                            >
                              {scopeName}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>

                    {isExpired && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Token expired. Please refresh to continue using this account.
                        </AlertDescription>
                      </Alert>
                    )}

                    {!hasScopes && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Missing required permissions. Please reconnect to grant access.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="text-sm text-gray-600">
                      <p>Connected: {new Date(account.createdAt).toLocaleDateString()}</p>
                      {account.lastUsed && (
                        <p>Last used: {new Date(account.lastUsed).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="bg-gray-50 pt-3">
                  <div className="flex justify-between w-full">
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refreshAccountToken(account.id)}
                        disabled={refreshing === account.id}
                      >
                        {refreshing === account.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                          </>
                        )}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnectAccount(account.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Unlink className="w-4 h-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}