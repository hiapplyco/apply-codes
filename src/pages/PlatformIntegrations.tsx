import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Check, 
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

interface PlatformIntegration {
  id: string;
  name: string;
  category: 'ATS' | 'HRIS' | 'CRM' | 'Email' | 'Calendar';
  description: string;
  logo: string;
  status: 'connected' | 'available';
  features: string[];
  setupTime: string;
  lastSync?: string;
  recordsCount?: number;
}

const platformIntegrations: PlatformIntegration[] = [
  {
    id: 'bullhorn',
    name: 'Bullhorn',
    category: 'ATS',
    description: 'ATS & CRM platform for staffing agencies and recruiting firms',
    logo: '🎯',
    status: 'available',
    features: ['ATS & CRM unified platform', 'Job order management', 'Interview scheduling', 'Compliance tracking'],
    setupTime: '3-5 business days'
  },
  {
    id: 'greenhouse',
    name: 'Greenhouse',
    category: 'ATS',
    description: 'Sync candidates, jobs, and interview data with your Greenhouse ATS',
    logo: '🌿',
    status: 'available',
    features: ['Candidate Sync', 'Job Import', 'Interview Scheduling', 'Real-time Updates'],
    setupTime: '1-2 business days'
  },
  {
    id: 'lever',
    name: 'Lever',
    category: 'ATS',
    description: 'Connect your Lever account to sync candidate pipeline data',
    logo: '📊',
    status: 'available',
    features: ['Pipeline Sync', 'Candidate Import', 'Stage Tracking', 'Notes Sync'],
    setupTime: '1-2 business days'
  },
  {
    id: 'workday',
    name: 'Workday',
    category: 'HRIS',
    description: 'Integration with Workday for employee data and organizational structure',
    logo: '☁️',
    status: 'available',
    features: ['Employee Import', 'Org Chart', 'Skills Mapping', 'Department Sync'],
    setupTime: '3-5 business days'
  },
  {
    id: 'bamboohr',
    name: 'BambooHR',
    category: 'HRIS',
    description: 'Sync employee data and organizational information from BambooHR',
    logo: '🎋',
    status: 'connected',
    features: ['Employee Sync', 'Department Structure', 'Role Mapping', 'Skills Import'],
    setupTime: '1-2 business days',
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
    setupTime: '1-2 business days'
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'CRM',
    description: 'Connect with Salesforce CRM for lead and contact management',
    logo: '⛅',
    status: 'available',
    features: ['Contact Sync', 'Lead Import', 'Account Mapping', 'Opportunity Tracking'],
    setupTime: '3-5 business days'
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    category: 'Email',
    description: 'Sync calendar and email data for recruitment communication',
    logo: '📧',
    status: 'available',
    features: ['Calendar Sync', 'Email Templates', 'Meeting Scheduling', 'Contact Import'],
    setupTime: '1-2 business days'
  },
  {
    id: 'gmail',
    name: 'Google Workspace',
    category: 'Email',
    description: 'Integration with Gmail and Google Calendar for seamless workflow',
    logo: '📬',
    status: 'connected',
    features: ['Gmail Sync', 'Calendar Integration', 'Contact Import', 'Drive Access'],
    setupTime: '1-2 business days',
    lastSync: '30 minutes ago',
    recordsCount: 1203
  }
];

const PlatformIntegrations: React.FC = () => {
  const [integrations] = useState<PlatformIntegration[]>(platformIntegrations);
  const [activeTab, setActiveTab] = useState('all');

  const filteredIntegrations = integrations.filter(integration => {
    if (activeTab === 'all') return true;
    if (activeTab === 'connected') return integration.status === 'connected';
    if (activeTab === 'available') return integration.status === 'available';
    return integration.category.toLowerCase() === activeTab;
  });

  // Get integration-specific setup steps
  const getIntegrationSteps = (integration: PlatformIntegration) => {
    const integrationSteps: Record<string, string[]> = {
      'bullhorn': [
        'OAuth 2.0 app registration with Bullhorn',
        'API client configuration with proper scopes',
        'Webhook setup for real-time data sync'
      ],
      'greenhouse': [
        'API key creation in Greenhouse Dev Center',
        'Permission configuration for required endpoints',
        'Webhook configuration for candidate updates'
      ],
      'lever': [
        'OAuth 2.0 application setup via partner program',
        'API authentication with refresh token management',
        'Custom integration testing and validation'
      ],
      'workday': [
        'Integration System User (ISU) setup',
        'OAuth 2.0 client registration and domain permissions',
        'Security group configuration and testing'
      ],
      'bamboohr': [
        'API key generation with proper permissions',
        'OAuth 2.0 transition for enhanced security',
        'Data sync validation and webhook setup'
      ],
      'rippling': [
        'API access setup in Company Settings',
        'OAuth 2.0 Bearer token configuration',
        'User Management and SSO integration'
      ]
    };
    
    return integrationSteps[integration.id] || [
      'OAuth/API authentication setup',
      'Data sync configuration',
      'Integration testing and validation'
    ];
  };

  // Create email CTA for integration requests
  const createIntegrationEmail = (integration: PlatformIntegration) => {
    const steps = getIntegrationSteps(integration);
    const subject = encodeURIComponent(`Integration Request: ${integration.name}`);
    const body = encodeURIComponent(
      `Hi Martin,\n\nI would like to integrate ${integration.name} with my Apply recruitment platform.\n\n` +
      `Platform Details:\n` +
      `• System: ${integration.name}\n` +
      `• Category: ${integration.category}\n` +
      `• Expected Setup Time: ${integration.setupTime}\n\n` +
      `Key Features I'm interested in:\n` +
      integration.features.slice(0, 4).map(feature => `• ${feature}`).join('\n') + '\n\n' +
      `Technical Integration Steps Required:\n` +
      steps.map(step => `• ${step}`).join('\n') + '\n\n' +
      `Please provide:\n` +
      `• Integration development timeline\n` +
      `• Required authentication credentials/setup\n` +
      `• Testing and deployment process\n` +
      `• Ongoing maintenance requirements\n\n` +
      `Looking forward to streamlining our recruitment workflow with ${integration.name}.\n\n` +
      `Best regards`
    );
    return `mailto:martin@hiapply.co?subject=${subject}&body=${body}`;
  };

  // Handle integration request email
  const handleIntegrationRequest = (integration: PlatformIntegration) => {
    // All integrations are available, create full integration request
    window.location.href = createIntegrationEmail(integration);
  };

  const handleConnect = async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (integration) {
      handleIntegrationRequest(integration);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800 border-green-300';
      case 'available': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'available': return 'Available';
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
                    <Button
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                      size="sm"
                      onClick={() => handleIntegrationRequest(integration)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Get Connected
                    </Button>
                  ) : integration.status === 'available' ? (
                    <Button
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                      size="sm"
                      onClick={() => handleConnect(integration.id)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Get Connected
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                      size="sm"
                      onClick={() => handleIntegrationRequest(integration)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Notify Me
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