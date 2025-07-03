import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  GoogleDrive,
  FileText,
  Upload,
  Download,
  Share2,
  FolderOpen,
  Plus,
  TrendingUp,
  Users,
  Clock,
  Star,
  ArrowRight,
  Settings,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Zap,
  Target,
  BookOpen,
  Activity,
  BarChart3,
  Calendar,
  Files
} from 'lucide-react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { toast } from 'sonner';

interface IntegrationMetrics {
  documentsCreated: number;
  documentsImported: number;
  documentsShared: number;
  storageUsed: number;
  storageTotal: number;
  collaborators: number;
  lastActivity: Date | null;
  weeklyActivity: number;
  popularContentTypes: Array<{ type: string; count: number }>;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  enabled: boolean;
  badge?: string;
}

export function GoogleIntegrationCards() {
  const [metrics, setMetrics] = useState<IntegrationMetrics>({
    documentsCreated: 0,
    documentsImported: 0,
    documentsShared: 0,
    storageUsed: 0,
    storageTotal: 15000, // 15GB default
    collaborators: 0,
    lastActivity: null,
    weeklyActivity: 0,
    popularContentTypes: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const { accounts, currentAccount, isLoading: authLoading } = useGoogleAuth();

  // Load integration metrics
  useEffect(() => {
    if (currentAccount) {
      loadIntegrationMetrics();
    } else {
      setIsLoading(false);
    }
  }, [currentAccount]);

  const loadIntegrationMetrics = async () => {
    try {
      setIsLoading(true);
      
      // In a real app, this would be an API call
      // For now, we'll simulate with localStorage data
      const savedMetrics = localStorage.getItem('google-integration-metrics');
      if (savedMetrics) {
        setMetrics(JSON.parse(savedMetrics));
      } else {
        // Generate sample data for demonstration
        setMetrics({
          documentsCreated: 12,
          documentsImported: 5,
          documentsShared: 8,
          storageUsed: 156, // MB
          storageTotal: 15000,
          collaborators: 6,
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          weeklyActivity: 25,
          popularContentTypes: [
            { type: 'Job Description', count: 7 },
            { type: 'Interview Questions', count: 4 },
            { type: 'Offer Letter', count: 3 }
          ]
        });
      }
    } catch (error) {
      console.error('Error loading integration metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'create-content',
      title: 'Create Content',
      description: 'Generate new recruitment documents with AI',
      icon: <Plus className="w-4 h-4" />,
      action: () => window.open('/content', '_blank'),
      enabled: !!currentAccount,
      badge: 'Popular'
    },
    {
      id: 'import-docs',
      title: 'Import Documents',
      description: 'Bring existing Google Docs into Apply',
      icon: <Upload className="w-4 h-4" />,
      action: () => window.open('/content?tab=import', '_blank'),
      enabled: !!currentAccount
    },
    {
      id: 'browse-drive',
      title: 'Browse Drive',
      description: 'View and manage your Google Drive files',
      icon: <FolderOpen className="w-4 h-4" />,
      action: () => window.open('/drive-browser', '_blank'),
      enabled: !!currentAccount
    },
    {
      id: 'share-document',
      title: 'Share Document',
      description: 'Share recent documents with team members',
      icon: <Share2 className="w-4 h-4" />,
      action: () => toast.info('Select a document from Content Creator to share'),
      enabled: !!currentAccount && metrics.documentsCreated > 0
    }
  ];

  const handleConnectGoogle = () => {
    window.open('/google-integrations-settings', '_blank');
  };

  const handleStartTutorial = () => {
    toast.info('Opening Google Integration Tutorial...');
    // In a real app, this would trigger the tutorial modal
  };

  const getStoragePercentage = () => {
    return (metrics.storageUsed / metrics.storageTotal) * 100;
  };

  const getActivityStatus = () => {
    if (!metrics.lastActivity) return { status: 'No activity', color: 'text-gray-500' };
    
    const hoursAgo = (Date.now() - metrics.lastActivity.getTime()) / (1000 * 60 * 60);
    
    if (hoursAgo < 1) return { status: 'Active now', color: 'text-green-600' };
    if (hoursAgo < 24) return { status: `${Math.round(hoursAgo)}h ago`, color: 'text-blue-600' };
    if (hoursAgo < 168) return { status: `${Math.round(hoursAgo / 24)}d ago`, color: 'text-yellow-600' };
    return { status: 'Inactive', color: 'text-gray-500' };
  };

  if (authLoading || isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // If no Google account connected
  if (!currentAccount || accounts.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <GoogleDrive className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Connect Google Integration</CardTitle>
            <CardDescription className="text-base">
              Unlock powerful document creation and collaboration features by connecting your Google account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg border">
                <FileText className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <h4 className="font-medium mb-1">Smart Documents</h4>
                <p className="text-sm text-gray-600">AI-powered content creation with Google Docs integration</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border">
                <Users className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <h4 className="font-medium mb-1">Team Collaboration</h4>
                <p className="text-sm text-gray-600">Real-time collaboration and sharing with your team</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border">
                <Zap className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
                <h4 className="font-medium mb-1">Workflow Automation</h4>
                <p className="text-sm text-gray-600">Streamlined recruitment document workflows</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                size="lg" 
                onClick={handleConnectGoogle}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <GoogleDrive className="w-5 h-5 mr-2" />
                Connect Google Account
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleStartTutorial}
              >
                <BookOpen className="w-5 h-5 mr-2" />
                View Tutorial
              </Button>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Secure & Private:</strong> We use OAuth 2.0 for secure authentication. 
                You can revoke access at any time from your Google Account settings.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activityStatus = getActivityStatus();

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Documents Created</p>
                <p className="text-2xl font-bold text-green-600">{metrics.documentsCreated}</p>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-600 mt-2">
              <TrendingUp className="w-3 h-3" />
              <span>+{metrics.weeklyActivity}% this week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Storage Used</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.storageUsed}MB</p>
              </div>
              <GoogleDrive className="w-8 h-8 text-blue-600" />
            </div>
            <Progress value={getStoragePercentage()} className="mt-2" />
            <p className="text-xs text-gray-600 mt-1">
              {(100 - getStoragePercentage()).toFixed(1)}% remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Team Members</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.collaborators}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-600 mt-2">
              <Share2 className="w-3 h-3" />
              <span>{metrics.documentsShared} docs shared</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Activity</p>
                <p className={`text-2xl font-bold ${activityStatus.color}`}>
                  <Activity className="w-4 h-4 inline mr-1" />
                  {activityStatus.status.split(' ')[0]}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-xs text-gray-600 mt-2">{activityStatus.status}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription>
            Fast access to common Google integration tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                onClick={action.action}
                disabled={!action.enabled}
                className="h-auto p-4 flex flex-col items-center space-y-2 relative"
              >
                {action.badge && (
                  <Badge className="absolute -top-2 -right-2 text-xs bg-yellow-100 text-yellow-800">
                    {action.badge}
                  </Badge>
                )}
                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                  {action.icon}
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs text-gray-600">{action.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Popular Content Types</span>
            </CardTitle>
            <CardDescription>
              Most frequently created document types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.popularContentTypes.map((item, index) => (
                <div key={item.type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    <span className="text-sm font-medium">{item.type}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(item.count / Math.max(...metrics.popularContentTypes.map(i => i.count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-600" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>
              Your latest Google integration activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Document Created</p>
                  <p className="text-xs text-gray-600">Job Description for Senior Developer</p>
                </div>
                <span className="text-xs text-gray-500">2h ago</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Share2 className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Document Shared</p>
                  <p className="text-xs text-gray-600">Interview Questions shared with team</p>
                </div>
                <span className="text-xs text-gray-500">1d ago</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <Upload className="w-5 h-5 text-purple-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Document Imported</p>
                  <p className="text-xs text-gray-600">Company handbook imported from Drive</p>
                </div>
                <span className="text-xs text-gray-500">3d ago</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Button variant="ghost" size="sm" className="w-full">
                <Calendar className="w-4 h-4 mr-2" />
                View Full Activity Log
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings & Help */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <span>Integration Management</span>
          </CardTitle>
          <CardDescription>
            Manage your Google integration settings and get help
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => window.open('/google-integrations-settings', '_blank')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage Settings
            </Button>
            <Button
              variant="outline"
              onClick={handleStartTutorial}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Tutorial
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('/docs/google-integration', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Documentation
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://myaccount.google.com/permissions', '_blank')}
            >
              <GoogleDrive className="w-4 h-4 mr-2" />
              Google Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}