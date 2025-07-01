import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Check, 
  Settings, 
  ExternalLink, 
  Loader2, 
  Search, 
  Building2,
  Users,
  Briefcase,
  TrendingUp,
  Clock,
  Shield,
  Sparkles,
  Star,
  Info,
  ChevronRight,
  Filter,
  Grid3x3,
  List
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Integration {
  id: string;
  name: string;
  category: 'ATS' | 'HRIS' | 'Unified' | 'Free';
  subcategory?: 'Enterprise' | 'Mid-Market' | 'SMB';
  description: string;
  logo: string;
  status: 'connected' | 'available' | 'coming_soon';
  features: string[];
  aiFeatures: string[];
  uniqueValue: string[];
  setupTime: string;
  pricing?: string;
  employeeRange?: string;
  popular?: boolean;
  badge?: string;
}

const integrations: Integration[] = [
  // Enterprise HRIS
  {
    id: 'workday',
    name: 'Workday HCM',
    category: 'HRIS',
    subcategory: 'Enterprise',
    description: 'Enterprise cloud applications for finance and HR',
    logo: '☁️',
    status: 'available',
    features: [
      'Full employee lifecycle management',
      'Global payroll processing',
      'Talent acquisition workflows',
      'Organizational planning',
      'Time tracking & absence'
    ],
    aiFeatures: [
      'Predictive workforce analytics',
      'AI-driven succession planning',
      'Automated job matching',
      'Intelligent compensation modeling'
    ],
    uniqueValue: [
      'Enterprise Interface Builder',
      'Real-time data transformation',
      'Multi-tenant architecture',
      'Complex approval workflows'
    ],
    setupTime: '2-3 hours',
    employeeRange: '5,000+',
    popular: true,
    badge: 'Enterprise Leader'
  },
  {
    id: 'sap-successfactors',
    name: 'SAP SuccessFactors',
    category: 'HRIS',
    subcategory: 'Enterprise',
    description: 'Intelligent HR solutions for the experience economy',
    logo: '🔷',
    status: 'available',
    features: [
      'Core HR management',
      'Performance & goals',
      'Learning management',
      'Recruiting management',
      'Compensation planning'
    ],
    aiFeatures: [
      'AI-powered performance insights',
      'Predictive learning paths',
      'Intelligent candidate ranking',
      'Bias detection in reviews'
    ],
    uniqueValue: [
      'OData protocol flexibility',
      'Metadata-driven customization',
      '40+ country localization',
      'Module-based architecture'
    ],
    setupTime: '2-4 hours',
    employeeRange: '5,000+',
    badge: 'Global Standard'
  },
  {
    id: 'oracle-hcm',
    name: 'Oracle HCM Cloud',
    category: 'HRIS',
    subcategory: 'Enterprise',
    description: 'Complete global HR in the cloud',
    logo: '🔴',
    status: 'available',
    features: [
      'Comprehensive HCM suite',
      'Advanced analytics',
      'Career development',
      'Benefits administration',
      'Workforce modeling'
    ],
    aiFeatures: [
      'ML job recommendations',
      'Predictive retention analysis',
      'AI chatbot for candidates',
      'Automated screening'
    ],
    uniqueValue: [
      'Unified data model',
      'Built-in BI and reporting',
      'Industry configurations',
      'Mobile-first architecture'
    ],
    setupTime: '3-5 hours',
    employeeRange: '5,000+',
    badge: 'Analytics Powerhouse'
  },
  {
    id: 'ukg-pro',
    name: 'UKG Pro',
    category: 'HRIS',
    subcategory: 'Enterprise',
    description: 'Workforce management that works for all',
    logo: '⏰',
    status: 'available',
    features: [
      'Workforce management',
      'Advanced scheduling',
      'Payroll processing',
      'HR service delivery',
      'People analytics'
    ],
    aiFeatures: [
      'AI shift optimization',
      'Predictive scheduling',
      'Anomaly detection',
      'Workforce forecasting'
    ],
    uniqueValue: [
      'Industry-leading time & attendance',
      'Compliance automation',
      'Union management',
      'Real-time labor analytics'
    ],
    setupTime: '2-3 hours',
    employeeRange: '1,000+',
    badge: 'Workforce Expert'
  },
  {
    id: 'adp-workforce',
    name: 'ADP Workforce Now',
    category: 'HRIS',
    subcategory: 'Enterprise',
    description: 'All-in-one workforce management for mid-sized companies',
    logo: '🔺',
    status: 'available',
    features: [
      'Payroll processing',
      'Benefits management',
      'Talent management',
      'Time & attendance',
      'HR management'
    ],
    aiFeatures: [
      'Predictive analytics dashboard',
      'AI compliance alerts',
      'Automated benefits recommendations',
      'Intelligent reporting'
    ],
    uniqueValue: [
      '400+ app marketplace',
      'Multi-country payroll',
      'Tax compliance automation',
      'Mobile self-service'
    ],
    setupTime: '1-2 hours',
    employeeRange: '50-999',
    popular: true,
    badge: 'Payroll Leader'
  },

  // ATS Platforms
  {
    id: 'icims',
    name: 'iCIMS',
    category: 'ATS',
    subcategory: 'Enterprise',
    description: 'Transform your talent acquisition with the iCIMS Talent Cloud',
    logo: '🎯',
    status: 'available',
    features: [
      'End-to-end recruiting',
      'CRM capabilities',
      'Onboarding workflows',
      'Career sites',
      'Compliance tracking'
    ],
    aiFeatures: [
      'AI matching algorithms',
      'Chatbot screening',
      'Predictive hiring success',
      'Automated sourcing'
    ],
    uniqueValue: [
      'Event-driven architecture',
      '300+ marketplace integrations',
      'Built-in video interviewing',
      'Advanced CRM features'
    ],
    setupTime: '1-2 hours',
    employeeRange: 'All sizes',
    badge: 'Enterprise ATS'
  },
  {
    id: 'greenhouse',
    name: 'Greenhouse',
    category: 'ATS',
    description: 'Hiring software to help you build a winning team',
    logo: '🌿',
    status: 'available',
    features: [
      'Structured hiring process',
      'Interview management',
      'Scorecard system',
      'Offer management',
      'Analytics & reporting'
    ],
    aiFeatures: [
      'AI interview insights',
      'Predictive quality of hire',
      'Automated job distribution',
      'Bias interruption tools'
    ],
    uniqueValue: [
      'Customizable workflows',
      '300+ integrations',
      'EEOC/OFCCP reporting',
      'Mobile recruiting app'
    ],
    setupTime: '30 minutes',
    employeeRange: '100+',
    popular: true,
    badge: 'Best Practices'
  },
  {
    id: 'lever',
    name: 'Lever',
    category: 'ATS',
    description: 'Complete ATS + CRM to source, nurture, and hire top talent',
    logo: '📊',
    status: 'available',
    features: [
      'Collaborative recruiting',
      'Talent CRM',
      'Interview scheduling',
      'Nurture campaigns',
      'Pipeline analytics'
    ],
    aiFeatures: [
      'AI-powered sourcing',
      'Predictive engagement',
      'Automated follow-ups',
      'Smart talent matching'
    ],
    uniqueValue: [
      'Unified ATS + CRM',
      'Team collaboration',
      'Chrome extension',
      'Email integration'
    ],
    setupTime: '30 minutes',
    employeeRange: '100+',
    popular: true,
    badge: 'Relationship First'
  },
  {
    id: 'smartrecruiters',
    name: 'SmartRecruiters',
    category: 'ATS',
    description: 'Hiring Success platform to find and hire great people',
    logo: '🎪',
    status: 'available',
    features: [
      'Talent acquisition',
      'CRM features',
      'Job marketing',
      'Collaborative hiring',
      'Offer management'
    ],
    aiFeatures: [
      'AI sourcing',
      'Predictive job performance',
      'Automated screening',
      'Smart matching'
    ],
    uniqueValue: [
      '100+ app marketplace',
      'Free forever plan',
      'Mobile recruiting',
      'Global platform'
    ],
    setupTime: '20 minutes',
    pricing: 'Free tier available',
    employeeRange: 'All sizes',
    badge: 'Free Option'
  },

  // Mid-Market HRIS
  {
    id: 'bamboohr',
    name: 'BambooHR',
    category: 'HRIS',
    subcategory: 'Mid-Market',
    description: 'HR software with heart',
    logo: '🎋',
    status: 'available',
    features: [
      'Core HR functions',
      'Employee self-service',
      'Time-off tracking',
      'Performance management',
      'Onboarding'
    ],
    aiFeatures: [
      'AI reporting insights',
      'Predictive turnover',
      'Automated workflows',
      'Smart document parsing'
    ],
    uniqueValue: [
      'User-friendly interface',
      'Mobile app',
      'Custom workflows',
      'Integrated ATS'
    ],
    setupTime: '30 minutes',
    employeeRange: '25-500',
    popular: true,
    badge: 'SMB Favorite'
  },
  {
    id: 'namely',
    name: 'Namely',
    category: 'HRIS',
    subcategory: 'Mid-Market',
    description: 'The HR platform employees love',
    logo: '💼',
    status: 'available',
    features: [
      'Modular HRIS',
      'Payroll processing',
      'Benefits admin',
      'Time & attendance',
      'Performance reviews'
    ],
    aiFeatures: [
      'Predictive analytics',
      'AI compliance monitoring',
      'Automated benchmarking',
      'Intelligent alerts'
    ],
    uniqueValue: [
      'All-in-one platform',
      'Customizable dashboards',
      'Social news feed',
      'Peer recognition'
    ],
    setupTime: '1 hour',
    employeeRange: '50-1000',
    badge: 'Culture Focused'
  },
  {
    id: 'gusto',
    name: 'Gusto',
    category: 'HRIS',
    subcategory: 'SMB',
    description: 'Modern HR, benefits, and payroll for teams',
    logo: '🍑',
    status: 'available',
    features: [
      'Full-service payroll',
      'Benefits management',
      'HR tools',
      'Time tracking',
      'Hiring & onboarding'
    ],
    aiFeatures: [
      'AI tax optimization',
      'Predictive cash flow',
      'Automated compliance',
      'Smart benefits'
    ],
    uniqueValue: [
      '10-minute setup',
      'Multi-state compliance',
      'Financial wellness',
      'Contractor payments'
    ],
    setupTime: '10 minutes',
    employeeRange: '1-100',
    popular: true,
    badge: 'Easy Setup'
  },
  {
    id: 'paycor',
    name: 'Paycor',
    category: 'HRIS',
    subcategory: 'Mid-Market',
    description: 'HCM software to manage your team',
    logo: '💰',
    status: 'available',
    features: [
      'HCM platform',
      'Recruiting',
      'Onboarding',
      'Learning management',
      'Analytics'
    ],
    aiFeatures: [
      'AI recruiting insights',
      'Predictive retention',
      'Automated scheduling',
      'Smart compensation'
    ],
    uniqueValue: [
      'Industry solutions',
      'Embedded analytics',
      'Mobile-first design',
      'Partner marketplace'
    ],
    setupTime: '1 hour',
    employeeRange: '50-1000',
    badge: 'Industry Expert'
  },
  {
    id: 'hibob',
    name: 'HiBob',
    category: 'HRIS',
    subcategory: 'Mid-Market',
    description: 'The HRIS for the way you work today',
    logo: '🚀',
    status: 'available',
    features: [
      'Modern HRIS',
      'Culture tools',
      'Performance',
      'Compensation',
      'Analytics'
    ],
    aiFeatures: [
      'AI engagement insights',
      'Predictive culture metrics',
      'Automated surveys',
      'Smart org design'
    ],
    uniqueValue: [
      'Culture-first approach',
      'Beautiful UI/UX',
      'Flexible workflows',
      'Global capabilities'
    ],
    setupTime: '45 minutes',
    employeeRange: '50-2000',
    badge: 'Modern Choice'
  },
  {
    id: 'personio',
    name: 'Personio',
    category: 'HRIS',
    subcategory: 'SMB',
    description: 'The People Operating System',
    logo: '🇩🇪',
    status: 'available',
    features: [
      'HR management',
      'Recruiting',
      'Performance',
      'Payroll prep',
      'Absence management'
    ],
    aiFeatures: [
      'AI document processing',
      'Predictive hiring',
      'Automated workflows',
      'Smart reminders'
    ],
    uniqueValue: [
      'All-in-one for SMBs',
      'German engineering',
      'GDPR compliant',
      'Custom attributes'
    ],
    setupTime: '45 minutes',
    employeeRange: '10-2000',
    badge: 'European Leader'
  },

  // Unified Platforms
  {
    id: 'rippling',
    name: 'Rippling',
    category: 'Unified',
    description: 'Employee management platform: HR, IT, Finance',
    logo: '💧',
    status: 'available',
    features: [
      'Unified HR/IT/Finance',
      'Global payroll',
      'Benefits',
      'Device management',
      'App management'
    ],
    aiFeatures: [
      'AI-powered automation',
      'Predictive compliance',
      'Smart provisioning',
      'Intelligent workflows'
    ],
    uniqueValue: [
      'Unity platform concept',
      '500+ integrations',
      'Global employment',
      'No-code automation'
    ],
    setupTime: '45 minutes',
    employeeRange: 'All sizes',
    popular: true,
    badge: 'Unified Platform'
  },
  {
    id: 'paycom',
    name: 'Paycom',
    category: 'Unified',
    description: 'One software. All HR processes.',
    logo: '🟦',
    status: 'available',
    features: [
      'Single database',
      'Payroll',
      'Talent acquisition',
      'Time/labor',
      'HR management'
    ],
    aiFeatures: [
      'Beti® payroll AI',
      'Predictive analytics',
      'Automated workflows',
      'Smart notifications'
    ],
    uniqueValue: [
      'True single database',
      'Employee-driven',
      'Mobile-first',
      'Direct data access'
    ],
    setupTime: '1-2 hours',
    employeeRange: '50+',
    badge: 'Single Database'
  },

  // Free/Freemium Options
  {
    id: 'zoho-people',
    name: 'Zoho People',
    category: 'Free',
    description: 'Organize, automate, and simplify your HR processes',
    logo: '🔶',
    status: 'available',
    features: [
      'HR management',
      'Leave tracking',
      'Performance',
      'Employee database',
      'Shift scheduling'
    ],
    aiFeatures: [
      'AI attendance insights',
      'Predictive leave patterns',
      'Automated scheduling',
      'Smart analytics'
    ],
    uniqueValue: [
      'Part of Zoho suite',
      'Affordable pricing',
      'Custom forms',
      'Mobile check-in'
    ],
    setupTime: '30 minutes',
    pricing: 'Free for 5 users',
    employeeRange: '5-500',
    badge: 'Free Tier'
  },
  {
    id: 'zoho-recruit',
    name: 'Zoho Recruit',
    category: 'Free',
    description: 'ATS for Staffing Agencies and Corporate HR',
    logo: '🔷',
    status: 'available',
    features: [
      'ATS features',
      'Resume parsing',
      'Job board posting',
      'Interview scheduling',
      'Client portal'
    ],
    aiFeatures: [
      'AI resume matching',
      'Predictive hiring',
      'Automated screening',
      'Smart job distribution'
    ],
    uniqueValue: [
      'Free forever plan',
      'Blueprint automation',
      'Zoho integration',
      'Custom modules'
    ],
    setupTime: '20 minutes',
    pricing: 'Free forever plan',
    employeeRange: 'All sizes',
    badge: 'Free Forever'
  },
  {
    id: 'freshteam',
    name: 'Freshteam',
    category: 'Free',
    description: 'HR software for growing businesses',
    logo: '🌱',
    status: 'available',
    features: [
      'Applicant tracking',
      'Onboarding',
      'Time off',
      'Employee info',
      'Offboarding'
    ],
    aiFeatures: [
      'AI candidate scoring',
      'Predictive analytics',
      'Automated workflows',
      'Smart recommendations'
    ],
    uniqueValue: [
      'Part of Freshworks',
      'Chatbot integration',
      'Simple UI',
      'Quick setup'
    ],
    setupTime: '15 minutes',
    pricing: 'Free for 50 employees',
    employeeRange: '1-500',
    badge: 'Quick Start'
  },

  // Coming Soon - CRM
  {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'CRM',
    description: 'Connect Salesforce CRM for candidate relationship management',
    logo: '☁️',
    status: 'coming_soon',
    features: ['Contact sync', 'Lead tracking', 'Campaign integration', 'Custom fields'],
    aiFeatures: ['Einstein AI insights', 'Predictive scoring', 'Automated workflows'],
    uniqueValue: ['Market leader', 'Extensive ecosystem', 'Custom apps'],
    setupTime: '2-3 hours',
    employeeRange: 'All sizes',
    badge: 'Coming Q2 2025'
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'CRM',
    description: 'Integrate HubSpot for marketing and candidate nurturing',
    logo: '🧡',
    status: 'coming_soon',
    features: ['Contact management', 'Email campaigns', 'Pipeline tracking', 'Analytics'],
    aiFeatures: ['AI content assistant', 'Predictive lead scoring', 'Smart workflows'],
    uniqueValue: ['All-in-one platform', 'Free CRM', 'Marketing automation'],
    setupTime: '1 hour',
    pricing: 'Free tier available',
    employeeRange: 'All sizes',
    badge: 'Coming Q2 2025'
  },
];

// Helper functions
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'HRIS': return Building2;
    case 'ATS': return Briefcase;
    case 'Unified': return TrendingUp;
    case 'Free': return Sparkles;
    default: return Users;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'HRIS': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'ATS': return 'bg-green-100 text-green-700 border-green-200';
    case 'Unified': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'Free': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'connected': return 'bg-green-100 text-green-700 border-green-200';
    case 'available': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'coming_soon': return 'bg-gray-100 text-gray-500 border-gray-200';
    default: return '';
  }
};

export default function IntegrationsEnhanced() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ATS' | 'HRIS' | 'Unified' | 'Free'>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<'all' | 'Enterprise' | 'Mid-Market' | 'SMB'>('all');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'popularity' | 'setupTime'>('popularity');

  // Filter and sort integrations
  const filteredIntegrations = useMemo(() => {
    let filtered = integrations.filter((integration) => {
      const matchesSearch = 
        integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.features.some(f => f.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
      const matchesSubcategory = selectedSubcategory === 'all' || integration.subcategory === selectedSubcategory;
      return matchesSearch && matchesCategory && matchesSubcategory;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'popularity':
          if (a.popular && !b.popular) return -1;
          if (!a.popular && b.popular) return 1;
          return 0;
        case 'setupTime':
          const getMinutes = (time: string) => {
            const match = time.match(/(\d+)/);
            return match ? parseInt(match[1]) : 999;
          };
          return getMinutes(a.setupTime) - getMinutes(b.setupTime);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, selectedCategory, selectedSubcategory, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const connected = integrations.filter(i => i.status === 'connected').length;
    const available = integrations.filter(i => i.status === 'available').length;
    const enterprise = integrations.filter(i => i.subcategory === 'Enterprise').length;
    const free = integrations.filter(i => i.category === 'Free' || i.pricing?.includes('Free')).length;
    
    return { connected, available, enterprise, free };
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-orange-50 to-white">
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Integration Marketplace</h1>
          <p className="text-lg text-gray-600">
            Connect your existing tools to transform recruitment with unified access to 20+ platforms
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black text-purple-600">{stats.connected}</div>
            <div className="text-sm text-gray-600 mt-1">Connected</div>
          </Card>
          <Card className="p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black text-green-600">{stats.available}</div>
            <div className="text-sm text-gray-600 mt-1">Available</div>
          </Card>
          <Card className="p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black text-blue-600">{stats.enterprise}</div>
            <div className="text-sm text-gray-600 mt-1">Enterprise</div>
          </Card>
          <Card className="p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black text-yellow-600">{stats.free}</div>
            <div className="text-sm text-gray-600 mt-1">Free Options</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search integrations, features, or capabilities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
                <SelectTrigger className="w-40 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="ATS">ATS Platforms</SelectItem>
                  <SelectItem value="HRIS">HRIS Systems</SelectItem>
                  <SelectItem value="Unified">Unified Platforms</SelectItem>
                  <SelectItem value="Free">Free Options</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedSubcategory} onValueChange={(value: any) => setSelectedSubcategory(value)}>
                <SelectTrigger className="w-40 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                  <SelectItem value="Mid-Market">Mid-Market</SelectItem>
                  <SelectItem value="SMB">SMB</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-40 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popular First</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="setupTime">Quick Setup</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-1 border-2 border-black rounded-lg p-1 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'ATS', 'HRIS', 'Unified', 'Free'] as const).map((category) => {
              const Icon = getCategoryIcon(category);
              const count = category === 'all' 
                ? integrations.length 
                : integrations.filter(i => i.category === category).length;
              
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "px-4 py-2 rounded-full border-2 font-semibold transition-all duration-200 flex items-center gap-2",
                    selectedCategory === category
                      ? "bg-purple-600 text-white border-purple-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      : "bg-white border-gray-300 hover:border-purple-600"
                  )}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {category === 'all' ? 'All' : category}
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Integration Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIntegrations.map((integration) => (
              <Card
                key={integration.id}
                className={cn(
                  "border-2 border-black p-6 cursor-pointer transition-all duration-200",
                  "hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1",
                  integration.status === 'coming_soon' && "opacity-75"
                )}
                onClick={() => setSelectedIntegration(integration)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{integration.logo}</div>
                    <div>
                      <h3 className="font-bold text-lg">{integration.name}</h3>
                      <Badge variant="secondary" className={cn("text-xs", getCategoryColor(integration.category))}>
                        {integration.category}
                      </Badge>
                    </div>
                  </div>
                  {integration.badge && (
                    <Badge className="bg-purple-100 text-purple-700 text-xs">
                      {integration.badge}
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {integration.description}
                </p>

                {/* Key Features */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {integration.features.slice(0, 3).map((feature, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {feature}
                      </span>
                    ))}
                    {integration.features.length > 3 && (
                      <span className="text-xs text-gray-500">+{integration.features.length - 3} more</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
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
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {integration.setupTime}
                  </div>
                </div>

                {integration.pricing && (
                  <div className="mt-2 text-xs text-green-600 font-medium">
                    {integration.pricing}
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIntegrations.map((integration) => (
              <Card
                key={integration.id}
                className={cn(
                  "border-2 border-black p-6 cursor-pointer transition-all duration-200",
                  "hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5",
                  integration.status === 'coming_soon' && "opacity-75"
                )}
                onClick={() => setSelectedIntegration(integration)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{integration.logo}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-xl">{integration.name}</h3>
                        <Badge variant="secondary" className={cn("text-xs", getCategoryColor(integration.category))}>
                          {integration.category}
                        </Badge>
                        {integration.subcategory && (
                          <Badge variant="outline" className="text-xs">
                            {integration.subcategory}
                          </Badge>
                        )}
                        {integration.badge && (
                          <Badge className="bg-purple-100 text-purple-700 text-xs">
                            {integration.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{integration.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{integration.setupTime}</span>
                        </div>
                        {integration.employeeRange && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span>{integration.employeeRange}</span>
                          </div>
                        )}
                        {integration.pricing && (
                          <div className="text-green-600 font-medium">
                            {integration.pricing}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant={integration.status === 'available' ? 'default' : 'outline'}
                    disabled={integration.status === 'coming_soon'}
                    className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {integration.status === 'connected' && 'Manage'}
                    {integration.status === 'available' && 'Connect'}
                    {integration.status === 'coming_soon' && 'Coming Soon'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

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
                        max-w-4xl w-full max-h-[90vh] overflow-hidden"
               onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b-2 border-black">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{selectedIntegration.logo}</div>
                  <div>
                    <h2 className="text-2xl font-black">{selectedIntegration.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className={cn("text-sm", getCategoryColor(selectedIntegration.category))}>
                        {selectedIntegration.category}
                      </Badge>
                      {selectedIntegration.subcategory && (
                        <Badge variant="outline" className="text-sm">
                          {selectedIntegration.subcategory}
                        </Badge>
                      )}
                      {selectedIntegration.badge && (
                        <Badge className="bg-purple-100 text-purple-700 text-sm">
                          {selectedIntegration.badge}
                        </Badge>
                      )}
                    </div>
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

            <ScrollArea className="h-[calc(90vh-200px)]">
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-2">About</h3>
                  <p className="text-gray-600">{selectedIntegration.description}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      Core Features
                    </h3>
                    <ul className="space-y-2">
                      {selectedIntegration.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      AI-Powered Features
                    </h3>
                    <ul className="space-y-2">
                      {selectedIntegration.aiFeatures.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-purple-600" />
                          </div>
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    Unique Value
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {selectedIntegration.uniqueValue.map((value, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <Clock className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Setup Time</p>
                    <p className="font-bold">{selectedIntegration.setupTime}</p>
                  </div>
                  {selectedIntegration.employeeRange && (
                    <div className="text-center">
                      <Users className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">Best For</p>
                      <p className="font-bold">{selectedIntegration.employeeRange}</p>
                    </div>
                  )}
                  {selectedIntegration.pricing && (
                    <div className="text-center">
                      <TrendingUp className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">Pricing</p>
                      <p className="font-bold text-green-600">{selectedIntegration.pricing}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  {selectedIntegration.status === 'connected' && (
                    <>
                      <Button 
                        variant="outline"
                        className="flex-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                      <Button 
                        variant="destructive"
                        className="flex-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        Disconnect
                      </Button>
                    </>
                  )}
                  {selectedIntegration.status === 'available' && (
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white 
                               border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] 
                               hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Connect {selectedIntegration.name}
                    </Button>
                  )}
                  {selectedIntegration.status === 'coming_soon' && (
                    <Button 
                      disabled 
                      className="w-full cursor-not-allowed"
                    >
                      Coming Soon
                    </Button>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}