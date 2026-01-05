import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  FileText,
  Users,
  ArrowRight,
  Building2,
  MapPin,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';
import { useClarvidaAuth } from '@/context/ClarvidaAuthContext';
import { ClarvidaNavHeader } from '@/components/clarvida/ClarvidaNavHeader';
import { ContextBuilder } from '@/components/clarvida/ContextBuilder';
import MinimalSearchForm from '@/components/MinimalSearchForm';
import { ClarvidaJobTemplate } from '@/types/organization';

const ClarvidaSourcing = () => {
  const { session, organization, userRole } = useClarvidaAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('builder');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [currentTemplate, setCurrentTemplate] = useState<ClarvidaJobTemplate | null>(null);

  // Get search params from URL (passed from hero search)
  const initialKeyword = searchParams.get('keyword') || '';
  const initialLocation = searchParams.get('location') || '';

  const handleJobDescriptionGenerated = (description: string, template: ClarvidaJobTemplate) => {
    setGeneratedDescription(description);
    setCurrentTemplate(template);
    // Automatically switch to search tab
    setActiveTab('search');
    toast.success('Job description ready! Now generate your boolean search.');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <ClarvidaNavHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Candidate Sourcing</h1>
            <p className="text-gray-600 mt-1">
              Build job descriptions and find qualified candidates
            </p>
          </div>
          {currentTemplate && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-lg shadow-sm mt-4 md:mt-0">
              <Briefcase className="w-4 h-4 text-[#0B5B5E]" />
              <span className="font-medium">{currentTemplate.job_title}</span>
              {currentTemplate.location?.city && (
                <>
                  <span className="text-gray-400">|</span>
                  <MapPin className="w-4 h-4 text-[#0B5B5E]" />
                  <span>{currentTemplate.location.city}, {currentTemplate.location.state}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Organization Badge */}
        {organization && (
          <div className="mb-6 p-4 bg-[#0B5B5E]/5 rounded-lg border border-[#0B5B5E]/20">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-[#0B5B5E]" />
              <span className="font-medium text-[#0B5B5E]">{organization.name}</span>
              {userRole && (
                <Badge className="bg-[#0B5B5E] text-white">
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Workflow Steps */}
        <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-8">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-colors ${
              activeTab === 'builder'
                ? 'bg-[#0B5B5E] text-white'
                : 'bg-white text-gray-600 hover:bg-[#0B5B5E]/10 border border-gray-200'
            }`}
            onClick={() => setActiveTab('builder')}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
              activeTab === 'builder' ? 'bg-white/20' : 'bg-[#0B5B5E]/10'
            }`}>
              1
            </span>
            <span className="font-medium hidden sm:inline">Context Builder</span>
            <span className="font-medium sm:hidden">Context</span>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 hidden sm:block" />
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-colors ${
              activeTab === 'search'
                ? 'bg-[#0B5B5E] text-white'
                : generatedDescription
                ? 'bg-white text-gray-600 hover:bg-[#0B5B5E]/10 border border-gray-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            onClick={() => generatedDescription && setActiveTab('search')}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
              activeTab === 'search' ? 'bg-white/20' : 'bg-[#0B5B5E]/10'
            }`}>
              2
            </span>
            <span className="font-medium hidden sm:inline">Generate Boolean & Search</span>
            <span className="font-medium sm:hidden">Search</span>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 hidden sm:block" />
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              activeTab === 'results'
                ? 'bg-[#0B5B5E] text-white'
                : 'bg-gray-100 text-gray-400 border border-gray-200'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
              activeTab === 'results' ? 'bg-white/20' : 'bg-gray-200'
            }`}>
              3
            </span>
            <span className="font-medium hidden sm:inline">Review Candidates</span>
            <span className="font-medium sm:hidden">Review</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {activeTab === 'builder' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Context Builder */}
              <ContextBuilder
                onJobDescriptionGenerated={handleJobDescriptionGenerated}
              />

              {/* Preview */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2 text-[#0B5B5E]">
                    <FileText className="w-5 h-5" />
                    Job Description Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {generatedDescription ? (
                    <div className="prose prose-sm max-w-none">
                      <Textarea
                        value={generatedDescription}
                        onChange={(e) => setGeneratedDescription(e.target.value)}
                        className="min-h-[500px] font-mono text-sm border-gray-200 focus:border-[#0B5B5E] focus:ring-[#0B5B5E]"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Fill out the form and click "Generate" to see your job description</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-6">
              {/* Current Job Context */}
              {currentTemplate && (
                <Card className="bg-[#0B5B5E]/5 border-[#0B5B5E]/20">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#0B5B5E] rounded-lg">
                          <Briefcase className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#0B5B5E]">
                            {currentTemplate.job_title}
                            {currentTemplate.specialty_credential && ` – ${currentTemplate.specialty_credential}`}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {currentTemplate.location?.city}, {currentTemplate.location?.state} |{' '}
                            {currentTemplate.employment_type} |{' '}
                            {currentTemplate.location?.work_arrangement}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab('builder')}
                        className="border-[#0B5B5E] text-[#0B5B5E] hover:bg-[#0B5B5E] hover:text-white"
                      >
                        Edit Job
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Search Form with Job Description Context */}
              <MinimalSearchForm
                userId={session?.uid || null}
                selectedProjectId={null}
              />
            </div>
          )}

          {activeTab === 'results' && (
            <Card className="p-8 text-center border border-gray-200">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Candidate Results</h3>
              <p className="text-gray-500">
                Complete the search step to see candidate results here
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClarvidaSourcing;
