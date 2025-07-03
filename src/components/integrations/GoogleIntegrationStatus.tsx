import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  RefreshCw,
  Wifi,
  WifiOff,
  GoogleDrive,
  FileText,
  Users,
  Key,
  Shield,
  Activity,
  TrendingUp,
  AlertTriangle,
  Info,
  Settings,
  ExternalLink
} from 'lucide-react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { toast } from 'sonner';

interface ConnectionStatus {
  isOnline: boolean;
  lastSync: Date | null;
  syncInProgress: boolean;
  errorCount: number;
  successfulOperations: number;
  totalOperations: number;
}

interface ServiceStatus {
  drive: {
    available: boolean;
    lastError?: string;
    quotaUsed: number;
    quotaTotal: number;
  };
  docs: {
    available: boolean;
    lastError?: string;
    collaborationEnabled: boolean;
  };
  auth: {
    tokenExpiry: Date | null;
    refreshAvailable: boolean;
    lastRefresh: Date | null;
  };
}

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible: boolean;
}

export function GoogleIntegrationStatus() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    lastSync: null,
    syncInProgress: false,
    errorCount: 0,
    successfulOperations: 0,
    totalOperations: 0
  });

  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    drive: {
      available: false,
      quotaUsed: 0,
      quotaTotal: 15000 // 15GB default
    },
    docs: {
      available: false,
      collaborationEnabled: false
    },
    auth: {
      tokenExpiry: null,
      refreshAvailable: false,
      lastRefresh: null
    }
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDetailedStatus, setShowDetailedStatus] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { accounts, currentAccount, refreshAllTokens } = useGoogleAuth();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus(prev => ({ ...prev, isOnline: true }));
      addNotification({
        id: 'online',
        type: 'success',
        title: 'Connection Restored',
        message: 'Google services are now accessible',
        timestamp: new Date(),
        dismissible: true
      });
    };

    const handleOffline = () => {
      setConnectionStatus(prev => ({ ...prev, isOnline: false }));
      addNotification({
        id: 'offline',
        type: 'warning',
        title: 'Connection Lost',
        message: 'Google services are temporarily unavailable',
        timestamp: new Date(),
        dismissible: true
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update service status based on accounts
  useEffect(() => {
    if (accounts.length > 0 && currentAccount) {
      const now = new Date();
      const tokenExpiry = currentAccount.tokenExpiry ? new Date(currentAccount.tokenExpiry) : null;
      const tokenExpiringIn24Hours = tokenExpiry && (tokenExpiry.getTime() - now.getTime()) < 24 * 60 * 60 * 1000;

      setServiceStatus(prev => ({
        ...prev,
        drive: {
          ...prev.drive,
          available: currentAccount.scopes.includes('https://www.googleapis.com/auth/drive')
        },
        docs: {
          ...prev.docs,
          available: currentAccount.scopes.includes('https://www.googleapis.com/auth/documents'),
          collaborationEnabled: true
        },
        auth: {
          tokenExpiry,
          refreshAvailable: !!currentAccount.refreshToken,
          lastRefresh: new Date(currentAccount.lastUsed || currentAccount.createdAt)
        }
      }));

      // Check for token expiry warnings
      if (tokenExpiringIn24Hours && tokenExpiry) {
        addNotification({
          id: 'token-expiring',
          type: 'warning',
          title: 'Token Expiring Soon',
          message: `Your Google access token expires in ${Math.round((tokenExpiry.getTime() - now.getTime()) / (1000 * 60 * 60))} hours`,
          timestamp: new Date(),
          action: {
            label: 'Refresh Now',
            onClick: handleRefreshTokens
          },
          dismissible: true
        });
      }
    }
  }, [accounts, currentAccount]);

  const addNotification = (notification: Omit<Notification, 'id'> & { id?: string }) => {
    const newNotification: Notification = {
      id: notification.id || `notification-${Date.now()}`,
      ...notification
    };

    setNotifications(prev => {
      // Remove existing notification with same id
      const filtered = prev.filter(n => n.id !== newNotification.id);
      return [newNotification, ...filtered].slice(0, 10); // Keep max 10 notifications
    });

    // Auto-dismiss success notifications after 5 seconds
    if (newNotification.type === 'success' && newNotification.dismissible) {
      setTimeout(() => {
        dismissNotification(newNotification.id);
      }, 5000);
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleRefreshTokens = async () => {
    setRefreshing(true);
    try {
      await refreshAllTokens();
      addNotification({
        id: 'tokens-refreshed',
        type: 'success',
        title: 'Tokens Refreshed',
        message: 'All Google access tokens have been refreshed',
        timestamp: new Date(),
        dismissible: true
      });
    } catch (error) {
      addNotification({
        id: 'refresh-failed',
        type: 'error',
        title: 'Refresh Failed',
        message: 'Failed to refresh some tokens. Please check your connection.',
        timestamp: new Date(),
        dismissible: true
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (available: boolean) => {
    return available ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (available: boolean) => {
    return available ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getOverallStatus = () => {
    if (!connectionStatus.isOnline) return { status: 'offline', color: 'text-red-600' };
    if (!serviceStatus.drive.available || !serviceStatus.docs.available) return { status: 'degraded', color: 'text-yellow-600' };
    if (serviceStatus.auth.tokenExpiry && new Date(serviceStatus.auth.tokenExpiry) <= new Date()) return { status: 'expired', color: 'text-red-600' };
    return { status: 'operational', color: 'text-green-600' };
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GoogleDrive className="w-5 h-5 text-blue-600" />
              <CardTitle>Google Integration Status</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={`${overallStatus.color} bg-opacity-10`}>
                {connectionStatus.isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                {overallStatus.status.toUpperCase()}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetailedStatus(!showDetailedStatus)}
              >
                {showDetailedStatus ? 'Hide Details' : 'Show Details'}
              </Button>
            </div>
          </div>
          <CardDescription>
            Real-time status of your Google Drive and Docs integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Drive Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <GoogleDrive className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Drive</span>
              </div>
              <div className={`flex items-center space-x-1 ${getStatusColor(serviceStatus.drive.available)}`}>
                {getStatusIcon(serviceStatus.drive.available)}
                <span className="text-sm">{serviceStatus.drive.available ? 'Active' : 'Inactive'}</span>
              </div>
            </div>

            {/* Docs Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-green-600" />
                <span className="font-medium">Docs</span>
              </div>
              <div className={`flex items-center space-x-1 ${getStatusColor(serviceStatus.docs.available)}`}>
                {getStatusIcon(serviceStatus.docs.available)}
                <span className="text-sm">{serviceStatus.docs.available ? 'Active' : 'Inactive'}</span>
              </div>
            </div>

            {/* Auth Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-purple-600" />
                <span className="font-medium">Auth</span>
              </div>
              <div className={`flex items-center space-x-1 ${getStatusColor(!!serviceStatus.auth.refreshAvailable)}`}>
                {getStatusIcon(!!serviceStatus.auth.refreshAvailable)}
                <span className="text-sm">{serviceStatus.auth.refreshAvailable ? 'Valid' : 'Invalid'}</span>
              </div>
            </div>
          </div>

          {/* Detailed Status */}
          {showDetailedStatus && (
            <div className="mt-6 space-y-4">
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Connection Details */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center space-x-2">
                    <Activity className="w-4 h-4" />
                    <span>Connection Details</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={overallStatus.color}>
                        {connectionStatus.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Sync:</span>
                      <span>{connectionStatus.lastSync ? connectionStatus.lastSync.toLocaleString() : 'Never'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span>
                        {connectionStatus.totalOperations > 0 
                          ? `${Math.round((connectionStatus.successfulOperations / connectionStatus.totalOperations) * 100)}%`
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Service Details */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Service Details</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Drive Quota:</span>
                      <span>
                        {serviceStatus.drive.quotaUsed}MB / {serviceStatus.drive.quotaTotal}MB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Collaboration:</span>
                      <span className={serviceStatus.docs.collaborationEnabled ? 'text-green-600' : 'text-red-600'}>
                        {serviceStatus.docs.collaborationEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Token Expiry:</span>
                      <span>
                        {serviceStatus.auth.tokenExpiry 
                          ? serviceStatus.auth.tokenExpiry.toLocaleDateString()
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar for Quota */}
              {serviceStatus.drive.quotaTotal > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Drive Storage Used</span>
                    <span>{Math.round((serviceStatus.drive.quotaUsed / serviceStatus.drive.quotaTotal) * 100)}%</span>
                  </div>
                  <Progress value={(serviceStatus.drive.quotaUsed / serviceStatus.drive.quotaTotal) * 100} />
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshTokens}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Tokens
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/google-integrations-settings', '_blank')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNotifications([])}
              >
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Alert key={notification.id} className="relative">
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{notification.title}</h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {notification.timestamp.toLocaleTimeString()}
                          </span>
                          {notification.dismissible && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => dismissNotification(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <XCircle className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <AlertDescription className="mt-1">
                        {notification.message}
                      </AlertDescription>
                      {notification.action && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={notification.action.onClick}
                          >
                            {notification.action.label}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}