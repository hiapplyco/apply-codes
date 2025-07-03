import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  GoogleDrive, 
  FileText, 
  Users, 
  Settings, 
  BookOpen, 
  BarChart3,
  Info,
  CheckCircle 
} from 'lucide-react';

// Import all the new Google integration components
import { ContentCreationWithGoogle } from '@/components/content/ContentCreationWithGoogle';
import { GoogleIntegrationStatus } from '@/components/integrations/GoogleIntegrationStatus';
import { GoogleIntegrationTutorial } from '@/components/integrations/GoogleIntegrationTutorial';
import { GoogleIntegrationCards } from '@/components/dashboard/GoogleIntegrationCards';
import { GoogleDriveBreadcrumb, GoogleDriveQuickNav } from '@/components/drive/GoogleDriveBreadcrumb';

/**
 * Demo page to showcase all Google integration UI components
 * This page demonstrates the complete UI integration for Google Drive and Docs
 */
export default function GoogleIntegrationDemo() {
  // Sample data for demonstration
  const sampleBreadcrumb = [
    { id: 'root', name: 'My Drive', type: 'root' as const, path: '/', isClickable: true },
    { id: 'recruitment', name: 'Recruitment Docs', type: 'folder' as const, path: '/recruitment', isClickable: true },
    { id: 'current', name: 'Job Descriptions', type: 'folder' as const, path: '/recruitment/jobs', isClickable: false }
  ];

  const handleBreadcrumbNavigate = (item: any) => {
    console.log('Navigate to:', item);
  };

  const handleSearch = (query: string) => {
    console.log('Search for:', query);
  };

  const handleFilterChange = (filter: string) => {
    console.log('Filter changed to:', filter);
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <GoogleDrive className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-bold">Google Integration UI Demo</h1>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Complete Integration
          </Badge>
        </div>
        <p className="text-gray-600 text-lg">
          Comprehensive UI components for seamless Google Drive and Docs integration with Apply
        </p>
      </div>

      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Demo Environment:</strong> This page showcases all Google integration components. 
          In production, these components would be integrated throughout the app based on user needs.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Content</span>
          </TabsTrigger>
          <TabsTrigger value="navigation" className="flex items-center space-x-2">
            <GoogleDrive className="w-4 h-4" />
            <span>Navigation</span>
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Status</span>
          </TabsTrigger>
          <TabsTrigger value="tutorial" className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Tutorial</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span>Dashboard Integration Cards</span>
              </CardTitle>
              <CardDescription>
                Main dashboard view showing Google integration status, metrics, and quick actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleIntegrationCards />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-green-600" />
                <span>Enhanced Content Creator</span>
              </CardTitle>
              <CardDescription>
                Content creation with Google Docs export/import capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContentCreationWithGoogle />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="navigation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GoogleDrive className="w-5 h-5 text-blue-600" />
                <span>Drive Navigation Components</span>
              </CardTitle>
              <CardDescription>
                Breadcrumb navigation and quick access for Google Drive browsing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Breadcrumb Navigation</h4>
                <div className="border rounded-lg">
                  <GoogleDriveBreadcrumb
                    items={sampleBreadcrumb}
                    onNavigate={handleBreadcrumbNavigate}
                    onSearch={handleSearch}
                    onFilterChange={handleFilterChange}
                    currentFilter="all"
                  />
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-4">Quick Navigation</h4>
                <div className="border rounded-lg">
                  <GoogleDriveQuickNav
                    onNavigate={handleBreadcrumbNavigate}
                    currentPath="/recruitment/jobs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-gray-600" />
                <span>Integration Status & Monitoring</span>
              </CardTitle>
              <CardDescription>
                Real-time status monitoring, notifications, and health indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleIntegrationStatus />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tutorial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <span>User Onboarding Tutorial</span>
              </CardTitle>
              <CardDescription>
                Interactive tutorial to guide users through Google integration setup and usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleIntegrationTutorial />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Integration Settings</span>
              </CardTitle>
              <CardDescription>
                The complete settings page is available as a separate route
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Google Integration Settings</h3>
                <p className="text-gray-600 mb-4">
                  Manage Google account connections, permissions, and integration preferences
                </p>
                <div className="flex justify-center space-x-3">
                  <a 
                    href="/google-integrations-settings" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Open Settings Page
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feature Summary */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>Complete Integration Features</span>
          </CardTitle>
          <CardDescription>
            Summary of all implemented Google integration UI components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-green-700">✅ Account Management</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Google OAuth connection</li>
                <li>• Multiple account support</li>
                <li>• Token refresh automation</li>
                <li>• Permission scope management</li>
                <li>• Security monitoring</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-blue-700">✅ Content Integration</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Enhanced content creator</li>
                <li>• Google Docs export</li>
                <li>• Document import</li>
                <li>• Real-time collaboration</li>
                <li>• Sharing controls</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-purple-700">✅ User Experience</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Intuitive navigation</li>
                <li>• Status indicators</li>
                <li>• Interactive tutorial</li>
                <li>• Dashboard integration</li>
                <li>• Error handling</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-orange-700">✅ Drive Integration</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• File browser</li>
                <li>• Breadcrumb navigation</li>
                <li>• Quick access shortcuts</li>
                <li>• Search functionality</li>
                <li>• Folder organization</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-red-700">✅ Monitoring & Support</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Real-time status</li>
                <li>• Health indicators</li>
                <li>• Usage analytics</li>
                <li>• Error notifications</li>
                <li>• Help documentation</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-indigo-700">✅ Business Features</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Team collaboration</li>
                <li>• Workflow automation</li>
                <li>• Template management</li>
                <li>• Progress tracking</li>
                <li>• Performance metrics</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}