import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Settings, 
  Shield, 
  Key, 
  Clock, 
  FileText, 
  FolderOpen, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  ExternalLink,
  Info,
  Users,
  Database
} from 'lucide-react';
import { GoogleAccountManager } from '@/components/integrations/GoogleAccountManager';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { GOOGLE_API_SCOPES } from '@/lib/google-api-config';
import { toast } from 'sonner';

interface IntegrationSettings {
  autoRefreshTokens: boolean;
  enableDriveSync: boolean;
  enableDocsCollaboration: boolean;
  enableNotifications: boolean;
  defaultDocPermissions: 'view' | 'edit' | 'comment';
  maxFileSize: number; // in MB
  allowedFileTypes: string[];
}

export default function GoogleIntegrationsSettings() {
  const { 
    accounts, 
    isLoading, 
    error, 
    currentAccount, 
    refreshAllTokens,
    clearError 
  } = useGoogleAuth();

  const [settings, setSettings] = useState<IntegrationSettings>({
    autoRefreshTokens: true,
    enableDriveSync: true,
    enableDocsCollaboration: false,
    enableNotifications: true,
    defaultDocPermissions: 'edit',
    maxFileSize: 10,
    allowedFileTypes: ['application/vnd.google-apps.document', 'application/pdf', 'text/plain']
  });

  const [saving, setSaving] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Load settings from localStorage or API
  useEffect(() => {
    const savedSettings = localStorage.getItem('google-integration-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    }
  }, []);

  // Save settings
  const saveSettings = async (newSettings: IntegrationSettings) => {
    try {
      setSaving(true);
      
      // Save to localStorage (in a real app, this would be an API call)
      localStorage.setItem('google-integration-settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      
      toast.success('Settings saved successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Handle refresh all tokens
  const handleRefreshAllTokens = async () => {
    try {
      await refreshAllTokens();
      setLastRefresh(new Date());
      toast.success('All tokens refreshed successfully');
    } catch (err) {
      console.error('Error refreshing tokens:', err);
      toast.error('Failed to refresh some tokens');
    }
  };

  // Get integration status
  const getIntegrationStatus = () => {
    const activeAccounts = accounts.filter(acc => acc.accessToken);
    const expiredAccounts = accounts.filter(acc => {
      if (!acc.tokenExpiry) return false;
      return new Date(acc.tokenExpiry) <= new Date();
    });

    const hasValidDriveAccess = activeAccounts.some(acc => 
      acc.scopes.includes(GOOGLE_API_SCOPES.DRIVE.FULL_ACCESS) &&
      (!acc.tokenExpiry || new Date(acc.tokenExpiry) > new Date())
    );

    const hasValidDocsAccess = activeAccounts.some(acc => 
      acc.scopes.includes(GOOGLE_API_SCOPES.DOCS.FULL_ACCESS) &&
      (!acc.tokenExpiry || new Date(acc.tokenExpiry) > new Date())
    );

    return {
      totalAccounts: accounts.length,
      activeAccounts: activeAccounts.length,
      expiredAccounts: expiredAccounts.length,
      hasValidDriveAccess,
      hasValidDocsAccess,
    };
  };

  const status = getIntegrationStatus();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="w-8 h-8 animate-spin mr-3" />
          <span className="text-lg">Loading Google integrations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Google Integrations</h1>
        <p className="text-gray-600">
          Manage your Google Drive and Docs connections for enhanced document collaboration
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Connected Accounts</p>
                <p className="text-2xl font-bold">{status.totalAccounts}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tokens</p>
                <p className="text-2xl font-bold text-green-600">{status.activeAccounts}</p>
              </div>
              <Key className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Drive Access</p>
                <div className="flex items-center space-x-2">
                  {status.hasValidDriveAccess ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-medium">
                    {status.hasValidDriveAccess ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <FolderOpen className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Docs Access</p>
                <div className="flex items-center space-x-2">
                  {status.hasValidDocsAccess ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-medium">
                    {status.hasValidDocsAccess ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="accounts">Account Management</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="settings">Integration Settings</TabsTrigger>
          <TabsTrigger value="security">Security & Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Google Account Connections</span>
              </CardTitle>
              <CardDescription>
                Connect and manage your Google accounts for Drive and Docs access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleAccountManager
                requiredScopes={[
                  GOOGLE_API_SCOPES.DRIVE.FULL_ACCESS,
                  GOOGLE_API_SCOPES.DOCS.FULL_ACCESS
                ]}
                onAccountConnected={(account) => {
                  toast.success(`Connected ${account.email}`);
                }}
                onAccountDisconnected={(accountId) => {
                  toast.success('Account disconnected');
                }}
              />
            </CardContent>
          </Card>

          {status.expiredAccounts > 0 && (
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-700">
                  <Clock className="w-5 h-5" />
                  <span>Token Maintenance</span>
                </CardTitle>
                <CardDescription>
                  Some tokens need refreshing to maintain access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      {status.expiredAccounts} account(s) have expired tokens
                    </p>
                    {lastRefresh && (
                      <p className="text-xs text-gray-500">
                        Last refresh: {lastRefresh.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Button onClick={handleRefreshAllTokens}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh All Tokens
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Permission Scopes</span>
              </CardTitle>
              <CardDescription>
                Review and manage the permissions granted to Apply
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FolderOpen className="w-6 h-6 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Google Drive Access</h4>
                      <p className="text-sm text-gray-600">
                        Read, create, edit, and delete files in your Google Drive
                      </p>
                    </div>
                  </div>
                  <Badge variant={status.hasValidDriveAccess ? "default" : "secondary"}>
                    {status.hasValidDriveAccess ? 'Granted' : 'Not Granted'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-6 h-6 text-green-600" />
                    <div>
                      <h4 className="font-medium">Google Docs Access</h4>
                      <p className="text-sm text-gray-600">
                        Create, view, and edit Google Docs documents
                      </p>
                    </div>
                  </div>
                  <Badge variant={status.hasValidDocsAccess ? "default" : "secondary"}>
                    {status.hasValidDocsAccess ? 'Granted' : 'Not Granted'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="w-6 h-6 text-purple-600" />
                    <div>
                      <h4 className="font-medium">Profile Information</h4>
                      <p className="text-sm text-gray-600">
                        Access your name, email, and profile picture
                      </p>
                    </div>
                  </div>
                  <Badge variant={accounts.length > 0 ? "default" : "secondary"}>
                    {accounts.length > 0 ? 'Granted' : 'Not Granted'}
                  </Badge>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  These permissions are required for Apply to create and manage recruitment documents 
                  in your Google Drive. You can revoke these permissions at any time.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Integration Preferences</span>
              </CardTitle>
              <CardDescription>
                Configure how Apply interacts with your Google services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-refresh">Auto-refresh tokens</Label>
                  <p className="text-sm text-gray-600">
                    Automatically refresh access tokens before they expire
                  </p>
                </div>
                <Switch
                  id="auto-refresh"
                  checked={settings.autoRefreshTokens}
                  onCheckedChange={(checked) => 
                    saveSettings({ ...settings, autoRefreshTokens: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="drive-sync">Enable Drive synchronization</Label>
                  <p className="text-sm text-gray-600">
                    Sync recruitment documents with your Google Drive
                  </p>
                </div>
                <Switch
                  id="drive-sync"
                  checked={settings.enableDriveSync}
                  onCheckedChange={(checked) => 
                    saveSettings({ ...settings, enableDriveSync: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="docs-collab">Enable Docs collaboration</Label>
                  <p className="text-sm text-gray-600">
                    Allow collaborative editing of recruitment documents
                  </p>
                </div>
                <Switch
                  id="docs-collab"
                  checked={settings.enableDocsCollaboration}
                  onCheckedChange={(checked) => 
                    saveSettings({ ...settings, enableDocsCollaboration: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Enable notifications</Label>
                  <p className="text-sm text-gray-600">
                    Get notified about document changes and token expiry
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => 
                    saveSettings({ ...settings, enableNotifications: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Security & Privacy</span>
              </CardTitle>
              <CardDescription>
                Security features and privacy controls for your Google integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Token Security</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    All access tokens are encrypted and stored securely. Refresh tokens are used to 
                    automatically renew access without requiring re-authentication.
                  </p>
                  <div className="flex space-x-2">
                    <Badge variant="outline">Encrypted Storage</Badge>
                    <Badge variant="outline">Auto-Renewal</Badge>
                    <Badge variant="outline">Secure Transmission</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Data Access</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Apply only accesses files that you explicitly share or create through the platform. 
                    We never access your personal files or data.
                  </p>
                  <div className="flex space-x-2">
                    <Badge variant="outline">Limited Scope</Badge>
                    <Badge variant="outline">User Consent</Badge>
                    <Badge variant="outline">Audit Trail</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Privacy Controls</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    You maintain full control over your data and can revoke access at any time. 
                    All data processing complies with privacy regulations.
                  </p>
                  <div className="flex space-x-2">
                    <Badge variant="outline">User Control</Badge>
                    <Badge variant="outline">GDPR Compliant</Badge>
                    <Badge variant="outline">Data Portability</Badge>
                  </div>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>Review your Google account permissions and security settings</span>
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href="https://myaccount.google.com/permissions" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1"
                      >
                        <span>Google Account</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}