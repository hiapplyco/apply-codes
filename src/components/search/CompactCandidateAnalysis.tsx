import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Award, 
  MapPin, 
  Building2, 
  Star,
  BarChart3,
  Users,
  Sparkles,
  ChevronRight,
  Grid3X3,
  List
} from 'lucide-react';
import { SearchResult } from '@/types/search';
import { cn } from '@/lib/utils';

interface CompactCandidateAnalysisProps {
  candidates: SearchResult[];
  jobDescription?: string;
  onCandidateSelect?: (candidate: SearchResult) => void;
}

interface CandidateScore {
  overall: number;
  skills: number;
  experience: number;
  location: number;
  availability: number;
}

interface AnalyzedCandidate extends SearchResult {
  score: CandidateScore;
  strengths: string[];
  gaps: string[];
  rank: number;
}

export const CompactCandidateAnalysis: React.FC<CompactCandidateAnalysisProps> = ({
  candidates,
  jobDescription,
  onCandidateSelect
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTab, setSelectedTab] = useState('top');

  // Analyze and rank candidates
  const analyzedCandidates = useMemo(() => {
    if (!candidates.length) return [];

    return candidates.map((candidate, index) => {
      // Calculate scores based on available data
      const experienceYears = parseInt(candidate.snippet?.match(/(\d+)\+?\s*years?/i)?.[1] || '0');
      const hasRelevantTitle = candidate.title?.toLowerCase().includes('executive assistant') ||
                              candidate.title?.toLowerCase().includes('ea') ||
                              candidate.title?.toLowerCase().includes('admin');
      
      const score: CandidateScore = {
        skills: hasRelevantTitle ? 85 : 65,
        experience: Math.min(experienceYears * 10, 100),
        location: candidate.snippet?.toLowerCase().includes('philippines') ? 95 : 70,
        availability: 80, // Default since we don't have real availability data
        overall: 0
      };

      // Calculate overall score
      score.overall = Math.round(
        (score.skills * 0.35) + 
        (score.experience * 0.25) + 
        (score.location * 0.20) + 
        (score.availability * 0.20)
      );

      // Identify strengths and gaps
      const strengths: string[] = [];
      const gaps: string[] = [];

      if (score.skills > 80) strengths.push('Strong skills match');
      if (score.experience > 70) strengths.push(`${experienceYears}+ years`);
      if (score.location > 90) strengths.push('Ideal location');
      
      if (score.skills < 70) gaps.push('Skills gap');
      if (score.experience < 50) gaps.push('Limited experience');

      return {
        ...candidate,
        score,
        strengths,
        gaps,
        rank: 0
      } as AnalyzedCandidate;
    })
    .sort((a, b) => b.score.overall - a.score.overall)
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }));
  }, [candidates]);

  const topCandidates = analyzedCandidates.slice(0, 5);
  const goodMatches = analyzedCandidates.filter(c => c.score.overall >= 70 && c.score.overall < 85);
  const needsReview = analyzedCandidates.filter(c => c.score.overall < 70);

  if (!candidates.length) {
    return null;
  }

  const CandidateCard = ({ candidate }: { candidate: AnalyzedCandidate }) => {
    const name = candidate.title?.split(' - ')[0] || 'Unknown';
    const role = candidate.title?.split(' - ')[1] || '';
    
    return (
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 h-full"
        onClick={() => onCandidateSelect?.(candidate)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{name}</h4>
              <p className="text-xs text-gray-600 truncate">{role}</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold">{candidate.score.overall}</span>
              <span className="text-xs text-gray-500">%</span>
            </div>
          </div>
          
          <div className="space-y-2 mb-3">
            <Progress value={candidate.score.overall} className="h-2" />
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500" />
                <span>Skills: {candidate.score.skills}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-blue-500" />
                <span>Exp: {candidate.score.experience}%</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {candidate.strengths.slice(0, 2).map((strength, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs py-0">
                {strength}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Compact Summary Header */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              AI Candidate Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                onClick={() => setViewMode('grid')}
                className="h-7 px-2"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
                className="h-7 px-2"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-700">{topCandidates.length}</div>
              <div className="text-xs text-green-600">Top Matches</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-700">{goodMatches.length}</div>
              <div className="text-xs text-yellow-600">Good Matches</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-700">{candidates.length}</div>
              <div className="text-xs text-gray-600">Total Analyzed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Candidate Display */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="top" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            Top {topCandidates.length}
          </TabsTrigger>
          <TabsTrigger value="good" className="text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            Good ({goodMatches.length})
          </TabsTrigger>
          <TabsTrigger value="review" className="text-xs">
            <Users className="w-3 h-3 mr-1" />
            Review ({needsReview.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="top" className="mt-4">
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3"
              : "space-y-2"
          )}>
            {topCandidates.map((candidate) => (
              viewMode === 'grid' ? (
                <CandidateCard key={candidate.link} candidate={candidate} />
              ) : (
                <Card 
                  key={candidate.link}
                  className="cursor-pointer hover:shadow-md transition-all duration-200"
                  onClick={() => onCandidateSelect?.(candidate)}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-lg font-bold text-green-600">
                        #{candidate.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {candidate.title?.split(' - ')[0] || 'Unknown'}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>{candidate.score.overall}% match</span>
                          <span>•</span>
                          <span>{candidate.strengths[0]}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        </TabsContent>

        <TabsContent value="good" className="mt-4">
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3"
              : "space-y-2"
          )}>
            {goodMatches.slice(0, 10).map((candidate) => (
              viewMode === 'grid' ? (
                <CandidateCard key={candidate.link} candidate={candidate} />
              ) : (
                <Card 
                  key={candidate.link}
                  className="cursor-pointer hover:shadow-md transition-all duration-200"
                  onClick={() => onCandidateSelect?.(candidate)}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-lg font-bold text-yellow-600">
                        #{candidate.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {candidate.title?.split(' - ')[0] || 'Unknown'}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>{candidate.score.overall}% match</span>
                          {candidate.strengths[0] && (
                            <>
                              <span>•</span>
                              <span>{candidate.strengths[0]}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        </TabsContent>

        <TabsContent value="review" className="mt-4">
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">
              {needsReview.length} candidates need review
            </p>
            <p className="text-xs mt-1">
              These candidates scored below 70% match
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};