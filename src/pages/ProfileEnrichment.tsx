/**
 * Profile Enrichment Page
 * Allows users to look up contact information for candidates
 */

import { useState, memo } from 'react';
import { useNewAuth } from '@/context/NewAuthContext';
import { useEnrichment } from '@/hooks/useEnrichment';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Linkedin,
  Mail,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertCircle,
  UserSearch
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import LinkedInEnrichmentForm from '@/components/enrichment/LinkedInEnrichmentForm';
import EmailEnrichmentForm from '@/components/enrichment/EmailEnrichmentForm';
import NameSearchForm from '@/components/enrichment/NameSearchForm';
import EnrichmentResultCard from '@/components/enrichment/EnrichmentResultCard';
import SearchResultsList from '@/components/enrichment/SearchResultsList';
import CreditUsageDisplay from '@/components/enrichment/CreditUsageDisplay';
import { NameSearchParams } from '@/components/enrichment/types';

const ProfileEnrichment = memo(() => {
  const { user, isLoading: authLoading, isAuthenticated } = useNewAuth();
  const {
    enrichByLinkedIn,
    enrichByEmail,
    searchByName,
    selectSearchResult,
    enrichedData,
    searchResults,
    isLoading,
    error,
    history,
    clearHistory,
    resetResult
  } = useEnrichment();

  const [activeTab, setActiveTab] = useState<string>('linkedin');
  const [showHistory, setShowHistory] = useState(false);
  const [lastLinkedInUrl, setLastLinkedInUrl] = useState<string | null>(null);

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  // Auth check
  if (!isAuthenticated) {
    return (
      <div className="container max-w-4xl py-8">
        <Card className="border-2 border-red-300 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p>Please sign in to use the enrichment feature.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle form submissions
  const handleLinkedInSubmit = async (value: string) => {
    setLastLinkedInUrl(value.includes('linkedin.com') ? value : `https://linkedin.com/in/${value}`);
    await enrichByLinkedIn(value);
  };

  const handleEmailSubmit = async (email: string) => {
    setLastLinkedInUrl(null);
    await enrichByEmail(email);
  };

  const handleNameSearch = async (params: NameSearchParams) => {
    setLastLinkedInUrl(null);
    await searchByName(params);
  };

  const handleSelectResult = (result: any) => {
    if (result.linkedin_username) {
      setLastLinkedInUrl(`https://linkedin.com/in/${result.linkedin_username}`);
    } else if (result.linkedin_url) {
      setLastLinkedInUrl(result.linkedin_url);
    }
    selectSearchResult(result);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    resetResult();
  };

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserSearch className="h-7 w-7 text-purple-600" />
            Contact Enrichment
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Look up contact information for candidates using LinkedIn, email, or name
          </p>
        </div>
        <CreditUsageDisplay />
      </div>

      {/* Main Card with Tabs */}
      <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Find Contact Information</CardTitle>
          <CardDescription>
            Choose a method to look up a person's contact details. Each lookup uses 1 credit.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="linkedin" className="flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                <span className="hidden sm:inline">LinkedIn</span>
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Email</span>
              </TabsTrigger>
              <TabsTrigger value="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Name Search</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="linkedin" className="mt-0">
              <LinkedInEnrichmentForm
                onSubmit={handleLinkedInSubmit}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="email" className="mt-0">
              <EmailEnrichmentForm
                onSubmit={handleEmailSubmit}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="name" className="mt-0">
              <NameSearchForm
                onSubmit={handleNameSearch}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Search Results (for name search) */}
      {searchResults.length > 0 && !enrichedData && (
        <SearchResultsList
          results={searchResults}
          onSelect={handleSelectResult}
        />
      )}

      {/* Enrichment Result */}
      {enrichedData && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Enrichment Result</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetResult}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear Result
            </Button>
          </div>
          <EnrichmentResultCard
            data={enrichedData}
            linkedinUrl={lastLinkedInUrl || undefined}
          />
        </div>
      )}

      {/* Error Display */}
      {error && !enrichedData && (
        <Card className="border-2 border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <Card className="border-2 border-gray-200">
          <CardHeader
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setShowHistory(!showHistory)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <CardTitle className="text-base">Recent Lookups ({history.length})</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearHistory();
                  }}
                  className="text-gray-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {showHistory ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </div>
          </CardHeader>

          {showHistory && (
            <CardContent className="pt-0">
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={
                            item.inputType === 'linkedin'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : item.inputType === 'email'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-green-50 text-green-700 border-green-200'
                          }
                        >
                          {item.inputType}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{item.displayName}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={item.success ? 'default' : 'secondary'}
                        className={item.success ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}
                      >
                        {item.success ? 'Found' : 'Not Found'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
});

ProfileEnrichment.displayName = 'ProfileEnrichment';

export default ProfileEnrichment;
