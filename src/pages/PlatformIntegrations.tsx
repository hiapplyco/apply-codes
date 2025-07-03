import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Check, 
  Settings, 
  ExternalLink, 
  Loader2, 
  Building2,
  Users,
  Briefcase,
  Shield,
  Sparkles,
  Star,
  ChevronRight,
  Plug,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface PlatformIntegration {
  id: string;
  name: string;
  category: 'ATS' | 'HRIS' | 'CRM' | 'Email' | 'Calendar';
  description: string;
  logo: string;
  status: 'connected' | 'available' | 'coming_soon';
  features: string[];
  setupTime: string;
  lastSync?: string;
  recordsCount?: number;
}

const platformIntegrations: PlatformIntegration[] = [
  {
    id: 'greenhouse',
    name: 'Greenhouse',
    category: 'ATS',
    description: 'Sync candidates, jobs, and interview data with your Greenhouse ATS',
    logo: '🌿',
    status: 'available',
    features: ['Candidate Sync', 'Job Import', 'Interview Scheduling', 'Real-time Updates'],
    setupTime: '5 minutes'
  },
  {
    id: 'lever',
    name: 'Lever',
    category: 'ATS',
    description: 'Connect your Lever account to sync candidate pipeline data',
    logo: '📊',
    status: 'available',
    features: ['Pipeline Sync', 'Candidate Import', 'Stage Tracking', 'Notes Sync'],
    setupTime: '5 minutes'
  },
  {
    id: 'workday',
    name: 'Workday',
    category: 'HRIS',
    description: 'Integration with Workday for employee data and organizational structure',
    logo: '☁️',
    status: 'available',
    features: ['Employee Import', 'Org Chart', 'Skills Mapping', 'Department Sync'],
    setupTime: '15 minutes'
  },
  {
    id: 'bamboohr',
    name: 'BambooHR',
    category: 'HRIS',
    description: 'Sync employee data and organizational information from BambooHR',
    logo: '🎋',
    status: 'connected',
    features: ['Employee Sync', 'Department Structure', 'Role Mapping', 'Skills Import'],
    setupTime: '10 minutes',
    lastSync: '2 hours ago',
    recordsCount: 247
  },
  {
    id: 'rippling',
    name: 'Rippling',
    category: 'HRIS',
    description: 'Unified platform integration for complete employee lifecycle management',
    logo: '💧',
    status: 'available',
    features: ['Full Employee Sync', 'Payroll Integration', 'Benefits Data', 'Time Tracking'],
    setupTime: '10 minutes'
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'CRM',
    description: 'Connect with Salesforce CRM for lead and contact management',
    logo: '⛅',
    status: 'coming_soon',
    features: ['Contact Sync', 'Lead Import', 'Account Mapping', 'Opportunity Tracking'],
    setupTime: '15 minutes'
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    category: 'Email',
    description: 'Sync calendar and email data for recruitment communication',
    logo: '📧',
    status: 'available',
    features: ['Calendar Sync', 'Email Templates', 'Meeting Scheduling', 'Contact Import'],
    setupTime: '3 minutes'
  },
  {
    id: 'gmail',
    name: 'Google Workspace',
    category: 'Email',
    description: 'Integration with Gmail and Google Calendar for seamless workflow',
    logo: '📬',
    status: 'connected',
    features: ['Gmail Sync', 'Calendar Integration', 'Contact Import', 'Drive Access'],
    setupTime: '3 minutes',
    lastSync: '30 minutes ago',
    recordsCount: 1203
  }
];

const PlatformIntegrations: React.FC = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<PlatformIntegration[]>(platformIntegrations);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const filteredIntegrations = integrations.filter(integration => {
    if (activeTab === 'all') return true;
    if (activeTab === 'connected') return integration.status === 'connected';
    if (activeTab === 'available') return integration.status === 'available';
    return integration.category.toLowerCase() === activeTab;
  });

  const handleConnect = async (integrationId: string) => {
    setIsConnecting(integrationId);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIntegrations(prev => prev.map(int => 
        int.id === integrationId 
          ? { ...int, status: 'connected' as const, lastSync: 'Just now', recordsCount: Math.floor(Math.random() * 1000) + 100 }
          : int
      ));
      
      const integration = integrations.find(i => i.id === integrationId);
      toast.success(`Successfully connected to ${integration?.name}!`);
    } catch (error) {
      toast.error('Failed to connect integration. Please try again.');
    } finally {
      setIsConnecting(null);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    
    setIntegrations(prev => prev.map(int => 
      int.id === integrationId 
        ? { ...int, status: 'available' as const, lastSync: undefined, recordsCount: undefined }
        : int
    ));
    
    toast.success(`Disconnected from ${integration?.name}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800 border-green-300';
      case 'available': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'coming_soon': return 'bg-gray-100 text-gray-600 border-gray-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'available': return 'Available';
      case 'coming_soon': return 'Coming Soon';
      default: return 'Unknown';
    }
  };

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const availableCount = integrations.filter(i => i.status === 'available').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-2">
            Connect Apply with your existing tools and platforms
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>{connectedCount} Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>{availableCount} Available</span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{connectedCount}</h3>
              <p className="text-sm text-gray-600">Active Integrations</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {integrations.filter(i => i.recordsCount).reduce((sum, i) => sum + (i.recordsCount || 0), 0).toLocaleString()}
              </h3>
              <p className="text-sm text-gray-600">Synced Records</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Real-time</h3>
              <p className="text-sm text-gray-600">Data Synchronization</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 border-2 border-black">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="connected">Connected</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="ats">ATS</TabsTrigger>
          <TabsTrigger value="hris">HRIS</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIntegrations.map((integration) => (
              <Card key={integration.id} className="p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{integration.logo}</div>
                    <div>
                      <h3 className="font-semibold text-lg">{integration.name}</h3>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(integration.status)}`}>
                        {getStatusText(integration.status)}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {integration.category}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  {integration.description}
                </p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Setup time:</span>
                    <span className="font-medium">{integration.setupTime}</span>
                  </div>
                  
                  {integration.lastSync && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last sync:</span>
                      <span className="font-medium text-green-600">{integration.lastSync}</span>
                    </div>
                  )}
                  
                  {integration.recordsCount && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Records synced:</span>
                      <span className="font-medium">{integration.recordsCount.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <h4 className="font-medium text-sm text-gray-900">Features:</h4>
                  <div className="space-y-1">
                    {integration.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-3 h-3 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {integration.status === 'connected' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDisconnect(integration.id)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Manage
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(integration.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : integration.status === 'available' ? (
                    <Button
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                      size="sm"
                      onClick={() => handleConnect(integration.id)}
                      disabled={isConnecting === integration.id}
                    >
                      {isConnecting === integration.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Coming Soon
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredIntegrations.length === 0 && (
        <Card className="p-8 border-2 border-gray-200 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-semibold text-lg text-gray-900 mb-2">No integrations found</h3>
          <p className="text-gray-600">Try selecting a different filter or check back later for new integrations.</p>
        </Card>
      )}
    </div>
  );
};

export default PlatformIntegrations;