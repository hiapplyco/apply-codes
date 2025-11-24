import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  TrendingUp, 
  Award, 
  MapPin, 
  Building2, 
  Calendar, 
  Star,
  CheckCircle,
  XCircle,
  BarChart3,
  Users,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SearchResult } from '@/types/search';
import { useNewAuth } from '@/context/NewAuthContext';
import { toast } from 'sonner';

interface CandidateAnalysisProps {
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

export const CandidateAnalysis: React.FC<CandidateAnalysisProps> = ({
  candidates,
  jobDescription,
  onCandidateSelect
}) => {
  const { user } = useNewAuth();
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [comparisonMode, setComparisonMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true); // Default to expanded

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

      if (score.skills > 80) strengths.push('Strong relevant skills');
      if (score.experience > 70) strengths.push(`${experienceYears}+ years experience`);
      if (score.location > 90) strengths.push('Located in target region');
      
      if (score.skills < 70) gaps.push('Limited relevant experience');
      if (score.experience < 50) gaps.push('Less experienced');
      if (!candidate.snippet?.toLowerCase().includes('ai')) gaps.push('No AI background mentioned');

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

  const toggleCandidateSelection = (candidateId: string) => {
    const newSelection = new Set(selectedCandidates);
    if (newSelection.has(candidateId)) {
      newSelection.delete(candidateId);
    } else {
      if (newSelection.size >= 3) {
        toast.error('You can compare up to 3 candidates at a time');
        return;
      }
      newSelection.add(candidateId);
    }
    setSelectedCandidates(newSelection);
  };

  const selectedCandidatesData = analyzedCandidates.filter(c => 
    selectedCandidates.has(c.link)
  );

  if (!candidates.length) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Candidate Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{candidates.length}</div>
              <div className="text-sm text-muted-foreground">Total Candidates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analyzedCandidates.filter(c => c.score.overall >= 80).length}
              </div>
              <div className="text-sm text-muted-foreground">Highly Qualified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {analyzedCandidates.filter(c => c.score.overall >= 60 && c.score.overall < 80).length}
              </div>
              <div className="text-sm text-muted-foreground">Good Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Math.round(analyzedCandidates.reduce((acc, c) => acc + c.score.overall, 0) / analyzedCandidates.length)}%
              </div>
              <div className="text-sm text-muted-foreground">Average Match Score</div>
            </div>
          </div>

          <div className="mt-4">
            <Button 
              variant={comparisonMode ? "default" : "outline"}
              onClick={() => setComparisonMode(!comparisonMode)}
              className="w-full"
            >
              <Users className="w-4 h-4 mr-2" />
              {comparisonMode ? 'Exit Comparison Mode' : 'Compare Candidates'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comparison View */}
      {comparisonMode && selectedCandidatesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Candidate Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2">Criteria</th>
                    {selectedCandidatesData.map(candidate => (
                      <th key={candidate.link} className="text-center p-2">
                        {candidate.title?.split(' - ')[0] || 'Candidate'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-2 font-medium">Overall Score</td>
                    {selectedCandidatesData.map(candidate => (
                      <td key={candidate.link} className="text-center p-2">
                        <Badge variant={candidate.score.overall >= 80 ? "default" : "secondary"}>
                          {candidate.score.overall}%
                        </Badge>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t">
                    <td className="p-2">Skills Match</td>
                    {selectedCandidatesData.map(candidate => (
                      <td key={candidate.link} className="text-center p-2">
                        <Progress value={candidate.score.skills} className="w-full" />
                        <span className="text-xs">{candidate.score.skills}%</span>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t">
                    <td className="p-2">Experience</td>
                    {selectedCandidatesData.map(candidate => (
                      <td key={candidate.link} className="text-center p-2">
                        <Progress value={candidate.score.experience} className="w-full" />
                        <span className="text-xs">{candidate.score.experience}%</span>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t">
                    <td className="p-2">Location</td>
                    {selectedCandidatesData.map(candidate => (
                      <td key={candidate.link} className="text-center p-2">
                        {candidate.score.location > 90 ? (
                          <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ranked Candidates Dropdown */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="border-2 border-purple-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full p-6 flex items-center justify-between hover:bg-purple-50/50 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                    Top Candidates for Outreach
                  </h3>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {analyzedCandidates.length} candidates ranked by AI match score
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  {analyzedCandidates.filter(c => c.score.overall >= 70).length} High Matches
                </Badge>
                <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="border-t border-purple-100 p-6 space-y-4 bg-white/50">
              {analyzedCandidates.slice(0, 10).map((candidate) => (
          <Card 
            key={candidate.link} 
            className={`cursor-pointer transition-all ${
              comparisonMode && selectedCandidates.has(candidate.link) 
                ? 'ring-2 ring-purple-600' 
                : ''
            }`}
            onClick={() => comparisonMode ? toggleCandidateSelection(candidate.link) : onCandidateSelect?.(candidate)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">
                      #{candidate.rank}
                    </Badge>
                    <h4 className="font-semibold">{candidate.title}</h4>
                    {candidate.rank <= 3 && (
                      <Award className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {candidate.snippet}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {candidate.strengths.map((strength, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {strength}
                      </Badge>
                    ))}
                    {candidate.gaps.slice(0, 2).map((gap, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs text-muted-foreground">
                        {gap}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>{candidate.score.overall}% Match</span>
                    </div>
                    {comparisonMode && (
                      <Button
                        size="sm"
                        variant={selectedCandidates.has(candidate.link) ? "default" : "outline"}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCandidateSelection(candidate.link);
                        }}
                      >
                        {selectedCandidates.has(candidate.link) ? 'Selected' : 'Select'}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="ml-4">
                  <div className="w-16 h-16 relative">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke={candidate.score.overall >= 80 ? '#10b981' : candidate.score.overall >= 60 ? '#f59e0b' : '#6b7280'}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${candidate.score.overall * 1.76} 176`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold">{candidate.score.overall}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
              ))}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
};