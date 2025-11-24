import React, { useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Settings, Trash2, RefreshCw, Link as LinkIcon, Unlink } from 'lucide-react';
import { GOOGLE_API_SCOPES } from '@/lib/google-api-config';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

interface GoogleAccountManagerProps {
  onAccountConnected?: () => void;
  onAccountDisconnected?: (accountId: string) => void;
  requiredScopes?: string[];
  className?: string;
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
  const {
    accounts,
    isLoading,
    error,
    isConnecting,
    currentAccount,
    connectAccount,
    disconnectAccount,
    refreshToken,
    selectAccount,
    hasRequiredScopes,
    checkTokenValidity
  } = useGoogleAuth();

  const accountStatus = useMemo(() => (
    accounts.map(account => ({
      ...account,
      hasRequiredScopes: hasRequiredScopes(account.id, requiredScopes),
      isValid: checkTokenValidity(account.id)
    }))
  ), [accounts, requiredScopes, hasRequiredScopes, checkTokenValidity]);

  const handleConnect = async () => {
    await connectAccount(requiredScopes);
    onAccountConnected?.();
  };

  const handleDisconnect = async (accountId: string) => {
    await disconnectAccount(accountId);
    onAccountDisconnected?.(accountId);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Google Integrations</CardTitle>
          <CardDescription>Loading your connected Google accounts...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Fetching account information</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Google Integrations</CardTitle>
          <CardDescription>Connect your Google Drive and Docs</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={handleConnect} disabled={isConnecting}>
            <LinkIcon className="h-4 w-4 mr-2" />
            {isConnecting ? 'Connecting...' : 'Connect Google Account'}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Google Integrations</CardTitle>
        <CardDescription>
          Connect your Google account to enable Drive and Docs features.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {accountStatus.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No Google accounts connected. Connect an account to save documents to Drive and export to Docs.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {accountStatus.map(account => (
              <div key={account.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{account.name || account.email}</p>
                    <p className="text-sm text-gray-500">{account.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {account.hasRequiredScopes ? (
                      <Badge variant="success">Required scopes granted</Badge>
                    ) : (
                      <Badge variant="destructive">Missing scopes</Badge>
                    )}
                    {account.isValid ? (
                      <Badge variant="outline" className="text-green-700 border-green-200">Valid token</Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-700 border-yellow-200">Needs refresh</Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center text-xs text-gray-500 space-x-4">
                  <span>Scopes: {account.scopes.length}</span>
                  <span>Last used: {account.lastUsed ? new Date(account.lastUsed).toLocaleString() : '—'}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant={currentAccount?.id === account.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => selectAccount(account.id)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {currentAccount?.id === account.id ? 'Active account' : 'Set active'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshToken(account.id)}
                    disabled={isConnecting}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh token
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDisconnect(account.id)}
                    disabled={isConnecting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-3">
        <Button onClick={handleConnect} disabled={isConnecting} className="w-full">
          <LinkIcon className="h-4 w-4 mr-2" />
          {isConnecting ? 'Connecting Google Account...' : 'Connect Google Account'}
        </Button>
        {accountStatus.length > 0 && (
          <Button variant="outline" onClick={() => toast.info('Manage integrations in settings')}>
            <Unlink className="h-4 w-4 mr-2" />
            Manage in Settings
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
