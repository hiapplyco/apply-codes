import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  Clock, 
  Target, 
  AlertCircle, 
  TrendingUp,
  MessageSquare,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Brain,
  Flag
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  InterviewSession,
  Competency,
  Suggestion,
  InterviewFlag,
  VisualizationData,
  InterviewContext,
  CompetencyScore
} from '@/types/interview';

interface InterviewDashboardProps {
  session: InterviewSession;
  context: InterviewContext;
  onSuggestionAccept: (suggestion: Suggestion) => void;
  onFlagAction: (flag: InterviewFlag) => void;
  isMinimized?: boolean;
}

export function InterviewDashboard({ 
  session, 
  context, 
  onSuggestionAccept, 
  onFlagAction,
  isMinimized = false 
}: InterviewDashboardProps) {
  const [expandedSections, setExpandedSections] = useState({
    competencies: true,
    suggestions: true,
    flags: false,
    insights: false,
  });

  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - session.startTime.getTime();
      setElapsedTime(Math.floor(elapsed / 1000));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session.startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Calculate competency coverage percentage
  const getCompetencyCoverage = (competencyId: string) => {
    return session.analysis.competencyCoverage[competencyId] || 0;
  };

  // Get priority suggestions
  const prioritySuggestions = session.suggestions
    .filter(s => s.priority === 'high' && s.timing !== 'later')
    .slice(0, 3);

  // Get active flags
  const activeFlags = session.flags.filter(f => f.severity !== 'low');

  if (isMinimized) {
    return (
      <Card className="p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-mono font-bold">{formatTime(elapsedTime)}</span>
            </div>
            <Badge variant="secondary" className="bg-purple-100">
              {session.analysis.timeManagement.pacing}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {prioritySuggestions.length > 0 && (
              <Badge className="bg-yellow-500 text-black">
                {prioritySuggestions.length} suggestions
              </Badge>
            )}
            {activeFlags.length > 0 && (
              <Badge variant="destructive">
                {activeFlags.length} flags
              </Badge>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Time and Progress Header */}
      <Card className="p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="font-mono text-2xl font-bold">{formatTime(elapsedTime)}</span>
            </div>
            <Badge 
              variant="secondary" 
              className={cn(
                "font-medium",
                session.analysis.timeManagement.pacing === 'optimal' && "bg-green-100 text-green-700",
                session.analysis.timeManagement.pacing === 'too_fast' && "bg-yellow-100 text-yellow-700",
                session.analysis.timeManagement.pacing === 'too_slow' && "bg-red-100 text-red-700"
              )}
            >
              {session.analysis.timeManagement.pacing.replace('_', ' ')}
            </Badge>
          </div>
          <Progress 
            value={(elapsedTime / (context.interviewType.categories.reduce((acc, cat) => acc + cat.timeAllocation, 0) * 60)) * 100} 
            className="h-2"
          />
        </div>
      </Card>

      {/* Competency Coverage */}
      <Collapsible open={expandedSections.competencies}>
        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <CollapsibleTrigger 
            onClick={() => toggleSection('competencies')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold">Competency Coverage</h3>
            </div>
            {expandedSections.competencies ? <ChevronUp /> : <ChevronDown />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0 space-y-3">
              {context.companyRubric?.competencies.map((competency) => {
                const coverage = getCompetencyCoverage(competency.id);
                const score = session.scores.find(s => s.competencyId === competency.id);
                
                return (
                  <div key={competency.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{competency.name}</span>
                        {score && (
                          <Badge variant="outline" className="text-xs">
                            Score: {score.score}/{context.companyRubric?.scoringScale.max}
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm font-medium">{coverage}%</span>
                    </div>
                    <div className="relative">
                      <Progress value={coverage} className="h-2" />
                      {coverage < 50 && (
                        <div className="absolute -top-1 -right-1">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              }) || (
                <div className="text-sm text-gray-500">
                  No company rubric provided. Using standard competencies.
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* AI Suggestions */}
      <Collapsible open={expandedSections.suggestions}>
        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <CollapsibleTrigger 
            onClick={() => toggleSection('suggestions')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <h3 className="font-bold">AI Suggestions</h3>
              {prioritySuggestions.length > 0 && (
                <Badge className="bg-yellow-100 text-yellow-700">
                  {prioritySuggestions.length} active
                </Badge>
              )}
            </div>
            {expandedSections.suggestions ? <ChevronUp /> : <ChevronDown />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ScrollArea className="h-48 p-4 pt-0">
              <div className="space-y-3">
                {prioritySuggestions.length === 0 ? (
                  <p className="text-sm text-gray-500">No immediate suggestions</p>
                ) : (
                  prioritySuggestions.map((suggestion) => (
                    <div 
                      key={suggestion.id}
                      className="p-3 bg-yellow-50 rounded-lg border-2 border-yellow-200"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <Badge 
                            variant="secondary" 
                            className="mb-1 text-xs bg-yellow-200 text-yellow-800"
                          >
                            {suggestion.type}
                          </Badge>
                          <p className="text-sm font-medium">{suggestion.text}</p>
                          <p className="text-xs text-gray-600 mt-1">{suggestion.reason}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onSuggestionAccept(suggestion)}
                          className="hover:bg-yellow-100"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Skill Match Heatmap */}
      <Card className="p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-green-600" />
          <h3 className="font-bold">Skill Match</h3>
          <Badge className="bg-green-100 text-green-700">
            {session.analysis.skillMatch.overallMatch}% match
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {session.analysis.skillMatch.requiredSkills.slice(0, 6).map((skill) => (
            <div
              key={skill.skill}
              className={cn(
                "p-2 rounded-md text-xs font-medium text-center",
                skill.demonstrated
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-gray-100 text-gray-500 border border-gray-300"
              )}
            >
              {skill.skill}
              {skill.demonstrated && (
                <CheckCircle className="w-3 h-3 inline-block ml-1" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Flags and Alerts */}
      {activeFlags.length > 0 && (
        <Collapsible open={expandedSections.flags}>
          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <CollapsibleTrigger 
              onClick={() => toggleSection('flags')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-600" />
                <h3 className="font-bold">Flags & Alerts</h3>
                <Badge variant="destructive">{activeFlags.length}</Badge>
              </div>
              {expandedSections.flags ? <ChevronUp /> : <ChevronDown />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-2">
                {activeFlags.map((flag) => (
                  <div
                    key={flag.id}
                    className={cn(
                      "p-3 rounded-lg border-2",
                      flag.type === 'red_flag' && "bg-red-50 border-red-200",
                      flag.type === 'follow_up' && "bg-blue-50 border-blue-200",
                      flag.type === 'positive' && "bg-green-50 border-green-200"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {flag.type === 'red_flag' && <AlertCircle className="w-4 h-4 text-red-600" />}
                          {flag.type === 'follow_up' && <MessageSquare className="w-4 h-4 text-blue-600" />}
                          {flag.type === 'positive' && <TrendingUp className="w-4 h-4 text-green-600" />}
                          <Badge 
                            variant={flag.severity === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {flag.severity}
                          </Badge>
                        </div>
                        <p className="text-sm">{flag.description}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Action: {flag.suggestedAction}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onFlagAction(flag)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Real-time Insights */}
      <Collapsible open={expandedSections.insights}>
        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <CollapsibleTrigger 
            onClick={() => toggleSection('insights')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold">Interview Insights</h3>
            </div>
            {expandedSections.insights ? <ChevronUp /> : <ChevronDown />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0">
              <div className="space-y-2">
                {session.analysis.overallInsights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-1.5" />
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Category Time Breakdown */}
      <Card className="p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="font-bold mb-3">Time per Category</h3>
        <div className="space-y-2">
          {context.interviewType.categories.map((category) => {
            const timeSpent = session.analysis.timeManagement.categoryBreakdown[category.id] || 0;
            const allocated = category.timeAllocation * 60; // Convert to seconds
            const percentage = (timeSpent / allocated) * 100;
            
            return (
              <div key={category.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{category.name}</span>
                  <span className="font-mono text-xs">
                    {formatTime(timeSpent)} / {formatTime(allocated)}
                  </span>
                </div>
                <Progress 
                  value={Math.min(percentage, 100)} 
                  className={cn(
                    "h-1.5",
                    percentage > 100 && "bg-red-200"
                  )}
                />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}