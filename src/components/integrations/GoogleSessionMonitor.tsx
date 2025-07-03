import React, { useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  Shield, 
  Wifi, 
  WifiOff,
  Settings,
  Bell,
  BellOff
} from 'lucide-react';
import { googleTokenManager } from '@/lib/google-token-manager';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { toast } from 'sonner';

interface SessionStats {
  totalAccounts: number;
  activeAccounts: number;
  expiredAccounts: number;
  expiringSoonAccounts: number;
}

interface GoogleSessionMonitorProps {
  showDetailedView?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  showNotifications?: boolean;
  onSessionChange?: (isValid: boolean) => void;
  className?: string;
}

export function GoogleSessionMonitor({
  showDetailedView = false,
  autoRefresh = true,
  refreshInterval = 60000, // 1 minute
  showNotifications = true,
  onSessionChange,
  className = ''
}: GoogleSessionMonitorProps) {
  const { accounts, refreshAllTokens } = useGoogleAuth();
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalAccounts: 0,
    activeAccounts: 0,
    expiredAccounts: 0,
    expiringSoonAccounts: 0
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(showNotifications);

  // Update session stats
  const updateSessionStats = useCallback(async () => {
    try {
      const stats = await googleTokenManager.getSessionStats();
      setSessionStats(stats);
      setLastCheck(new Date());

      // Check if session validity changed
      const isValid = stats.activeAccounts > 0;
      onSessionChange?.(isValid);

      // Show notifications for issues
      if (notificationsEnabled) {
        if (stats.expiredAccounts > 0) {
          toast.error(
            `${stats.expiredAccounts} Google account(s) have expired tokens`,
            {
              id: 'expired-tokens',
              action: {
                label: 'Refresh',
                onClick: () => handleRefreshTokens()
              }
            }
          );
        } else if (stats.expiringSoonAccounts > 0) {
          toast.warning(
            `${stats.expiringSoonAccounts} Google account(s) will expire soon`,
            {
              id: 'expiring-tokens',
              action: {
                label: 'Refresh',
                onClick: () => handleRefreshTokens()
              }
            }
          );
        }
      }
    } catch (error) {
      console.error('Error updating session stats:', error);
    }
  }, [onSessionChange, notificationsEnabled]);

  // Handle token refresh
  const handleRefreshTokens = useCallback(async () => {
    if (isRefreshing) return;

    try {
      setIsRefreshing(true);
      await refreshAllTokens();
      await updateSessionStats();
      toast.success('Tokens refreshed successfully');
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      toast.error('Failed to refresh some tokens');
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, refreshAllTokens, updateSessionStats]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      updateSessionStats();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateSessionStats]);

  // Auto-refresh session stats
  useEffect(() => {
    updateSessionStats();

    if (autoRefresh && isOnline) {
      const interval = setInterval(updateSessionStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, isOnline, updateSessionStats]);

  // Calculate session health
  const getSessionHealth = () => {
    if (sessionStats.totalAccounts === 0) {
      return {
        status: 'none',
        color: 'gray',
        message: 'No Google accounts connected',
        progress: 0
      };
    }

    if (sessionStats.expiredAccounts > 0) {
      return {
        status: 'critical',
        color: 'red',
        message: `${sessionStats.expiredAccounts} account(s) need attention`,
        progress: 25
      };
    }

    if (sessionStats.expiringSoonAccounts > 0) {
      return {
        status: 'warning',
        color: 'orange',
        message: `${sessionStats.expiringSoonAccounts} account(s) expiring soon`,
        progress: 75
      };
    }

    return {
      status: 'healthy',
      color: 'green',
      message: 'All accounts are active',
      progress: 100
    };
  };

  const health = getSessionHealth();

  // Compact view
  if (!showDetailedView) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* Connection status */}
        <div className="flex items-center space-x-1">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-600" />
          )}
        </div>

        {/* Session health */}
        <Badge 
          variant={health.status === 'healthy' ? 'default' : 'destructive'}
          className="flex items-center space-x-1"
        >
          {health.status === 'healthy' ? (
            <CheckCircle className="w-3 h-3" />
          ) : health.status === 'warning' ? (
            <Clock className="w-3 h-3" />
          ) : health.status === 'critical' ? (
            <AlertTriangle className="w-3 h-3" />
          ) : (
            <Shield className="w-3 h-3" />
          )}
          <span>{sessionStats.activeAccounts}/{sessionStats.totalAccounts}</span>
        </Badge>

        {/* Refresh button */}
        {(health.status === 'critical' || health.status === 'warning') && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshTokens}
            disabled={isRefreshing || !isOnline}
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
    );
  }

  // Detailed view
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Google Session Status</span>
            </CardTitle>
            <CardDescription>
              Last checked: {lastCheck.toLocaleTimeString()}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className="p-2"
            >
              {notificationsEnabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshTokens}
              disabled={isRefreshing || !isOnline}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center space-x-3">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-600" />
            )}
            <div>
              <p className="font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </p>
              <p className="text-sm text-gray-600">
                {isOnline ? 'Connected to Google services' : 'No internet connection'}
              </p>
            </div>
          </div>
          <Badge variant={isOnline ? 'default' : 'destructive'}>
            {isOnline ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        {/* Session Health */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Session Health</h4>
            <Badge 
              variant={health.status === 'healthy' ? 'default' : 'destructive'}
              className={`bg-${health.color}-100 text-${health.color}-800`}
            >
              {health.status}
            </Badge>
          </div>
          
          <Progress value={health.progress} className="h-2" />
          
          <p className="text-sm text-gray-600">{health.message}</p>
        </div>

        {/* Account Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {sessionStats.activeAccounts}
            </p>
            <p className="text-sm text-gray-600">Active Accounts</p>
          </div>
          
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {sessionStats.totalAccounts}
            </p>
            <p className="text-sm text-gray-600">Total Accounts</p>
          </div>
        </div>

        {/* Alerts */}
        {sessionStats.expiredAccounts > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {sessionStats.expiredAccounts} account(s) have expired tokens and need to be reconnected.
            </AlertDescription>
          </Alert>
        )}

        {sessionStats.expiringSoonAccounts > 0 && sessionStats.expiredAccounts === 0 && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              {sessionStats.expiringSoonAccounts} account(s) will expire soon. 
              Consider refreshing tokens to maintain access.
            </AlertDescription>
          </Alert>
        )}

        {!isOnline && (
          <Alert variant="destructive">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              No internet connection. Token refresh and Google API calls will fail.
            </AlertDescription>
          </Alert>
        )}

        {sessionStats.totalAccounts === 0 && (
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              No Google accounts connected. Connect an account to enable Google Drive and Docs features.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}