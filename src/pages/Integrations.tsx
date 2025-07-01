import React, { useState } from 'react';
import { Plus, Check, Settings, ExternalLink, Loader2, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Integration {
  id: string;
  name: string;
  category: 'ATS' | 'HRIS' | 'CRM';
  description: string;
  logo: string;
  status: 'connected' | 'available' | 'coming_soon';
  features: string[];
  setupTime: string;
  popular?: boolean;
}

const integrations: Integration[] = [
  {
    id: 'greenhouse',
    name: 'Greenhouse',
    category: 'ATS',
    description: 'Sync candidates and job postings with Greenhouse ATS',
    logo: '🌿',
    status: 'available',
    features: ['Candidate sync', 'Job posting import', 'Status updates', 'Two-way sync'],
    setupTime: '5 minutes',
    popular: true,
  },
  {
    id: 'lever',
    name: 'Lever',
    category: 'ATS',
    description: 'Connect your Lever ATS for seamless recruitment workflows',
    logo: '📊',
    status: 'available',
    features: ['Candidate import', 'Application tracking', 'Interview scheduling', 'Analytics'],
    setupTime: '5 minutes',
    popular: true,
  },
  {
    id: 'workday',
    name: 'Workday',
    category: 'HRIS',
    description: 'Integrate with Workday HCM for comprehensive HR management',
    logo: '☁️',
    status: 'available',
    features: ['Employee data sync', 'Requisition management', 'Onboarding', 'Reporting'],
    setupTime: '10 minutes',
  },
  {
    id: 'bamboohr',
    name: 'BambooHR',
    category: 'HRIS',
    description: 'Sync employee data and streamline your HR processes',
    logo: '🎋',
    status: 'available',
    features: ['Employee records', 'Time tracking', 'Performance', 'Reports'],
    setupTime: '5 minutes',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'CRM',
    description: 'Connect Salesforce CRM for candidate relationship management',
    logo: '☁️',
    status: 'coming_soon',
    features: ['Contact sync', 'Lead tracking', 'Campaign integration', 'Custom fields'],
    setupTime: '15 minutes',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'CRM',
    description: 'Integrate HubSpot for marketing and candidate nurturing',
    logo: '🧡',
    status: 'coming_soon',
    features: ['Contact management', 'Email campaigns', 'Pipeline tracking', 'Analytics'],
    setupTime: '10 minutes',
  },
  {
    id: 'rippling',
    name: 'Rippling',
    category: 'HRIS',
    description: 'All-in-one HR, IT, and Finance platform integration',
    logo: '💧',
    status: 'available',
    features: ['Employee sync', 'Payroll data', 'Benefits admin', 'Compliance'],
    setupTime: '10 minutes',
    popular: true,
  },
  {
    id: 'ashby',
    name: 'Ashby',
    category: 'ATS',
    description: 'Modern recruiting software for high-growth teams',
    logo: '🚀',
    status: 'coming_soon',
    features: ['Analytics-first', 'Automation', 'Scheduling', 'Sourcing'],
    setupTime: '5 minutes',
  },
];

export default function Integrations() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ATS' | 'HRIS' | 'CRM'>('all');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const availableCount = integrations.filter(i => i.status === 'available').length;

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-orange-50 to-white">
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Integrations</h1>
          <p className="text-lg text-gray-600">
            Connect your existing tools to streamline your recruitment workflow
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black text-purple-600">{connectedCount}</div>
            <div className="text-sm text-gray-600 mt-1">Connected</div>
          </div>
          <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black text-green-600">{availableCount}</div>
            <div className="text-sm text-gray-600 mt-1">Available</div>
          </div>
          <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black text-gray-400">{integrations.length}</div>
            <div className="text-sm text-gray-600 mt-1">Total Integrations</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-lg 
                         shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none 
                         focus:ring-2 focus:ring-purple-600"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'ATS', 'HRIS', 'CRM'] as const).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-3 rounded-lg border-2 border-black font-semibold
                           transition-all duration-200 
                           ${selectedCategory === category
                             ? 'bg-purple-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                             : 'bg-white hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                           }`}
                >
                  {category === 'all' ? 'All' : category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration) => (
            <div
              key={integration.id}
              className={`bg-white rounded-xl border-2 border-black p-6 
                       shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                       transition-all duration-200 hover:scale-[1.02] cursor-pointer
                       ${integration.status === 'coming_soon' ? 'opacity-75' : ''}`}
              onClick={() => setSelectedIntegration(integration)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{integration.logo}</div>
                  <div>
                    <h3 className="font-bold text-lg">{integration.name}</h3>
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      {integration.category}
                    </span>
                  </div>
                </div>
                {integration.popular && (
                  <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded">
                    POPULAR
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {integration.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {integration.status === 'connected' && (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Connected</span>
                    </>
                  )}
                  {integration.status === 'available' && (
                    <>
                      <Plus className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-600">Connect</span>
                    </>
                  )}
                  {integration.status === 'coming_soon' && (
                    <span className="text-sm font-medium text-gray-400">Coming Soon</span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{integration.setupTime}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredIntegrations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No integrations found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Integration Detail Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
             onClick={() => setSelectedIntegration(null)}>
          <div className="bg-white rounded-xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] 
                        max-w-2xl w-full max-h-[90vh] overflow-y-auto"
               onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b-2 border-black">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{selectedIntegration.logo}</div>
                  <div>
                    <h2 className="text-2xl font-black">{selectedIntegration.name}</h2>
                    <span className="text-sm font-medium text-gray-500 uppercase">
                      {selectedIntegration.category} Integration
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedIntegration(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-2">About</h3>
                <p className="text-gray-600">{selectedIntegration.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-lg mb-2">Features</h3>
                <ul className="space-y-2">
                  {selectedIntegration.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-lg mb-2">Setup Time</h3>
                <p className="text-gray-600">
                  Average setup time: <span className="font-semibold">{selectedIntegration.setupTime}</span>
                </p>
              </div>

              <div className="flex gap-3">
                {selectedIntegration.status === 'connected' && (
                  <>
                    <button className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg 
                                   border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] 
                                   hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all 
                                   duration-200 font-semibold flex items-center justify-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg 
                                   border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] 
                                   hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all 
                                   duration-200 font-semibold">
                      Disconnect
                    </button>
                  </>
                )}
                {selectedIntegration.status === 'available' && (
                  <button className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg 
                                 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] 
                                 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all 
                                 duration-200 font-semibold flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    Connect {selectedIntegration.name}
                  </button>
                )}
                {selectedIntegration.status === 'coming_soon' && (
                  <button disabled className="w-full py-3 px-4 bg-gray-200 text-gray-400 rounded-lg 
                                         border-2 border-gray-300 cursor-not-allowed font-semibold">
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}