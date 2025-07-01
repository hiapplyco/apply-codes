import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Lightbulb, 
  Target,
  ChevronRight,
  Clock,
  AlertCircle,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { InterviewQuestion, Suggestion, Competency } from '@/types/interview';
import { toast } from 'sonner';

interface QuestionSuggestionsProps {
  suggestions: Suggestion[];
  competencies: Competency[];
  currentCategory: string;
  onQuestionSelect: (question: string) => void;
  onGenerateMore: (category: string) => Promise<InterviewQuestion[]>;
  isGenerating?: boolean;
}

export function QuestionSuggestions({
  suggestions,
  competencies,
  currentCategory,
  onQuestionSelect,
  onGenerateMore,
  isGenerating = false,
}: QuestionSuggestionsProps) {
  const [activeTab, setActiveTab] = useState('suggested');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<InterviewQuestion[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filter suggestions by type
  const questionSuggestions = suggestions.filter(s => s.type === 'question');
  const followUpSuggestions = suggestions.filter(s => s.type === 'follow_up');
  const coachingSuggestions = suggestions.filter(s => s.type === 'coaching');

  // Group suggestions by competency
  const suggestionsByCompetency = questionSuggestions.reduce((acc, suggestion) => {
    const competencyId = suggestion.competencyId || 'general';
    if (!acc[competencyId]) acc[competencyId] = [];
    acc[competencyId].push(suggestion);
    return acc;
  }, {} as Record<string, Suggestion[]>);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success('Question copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy question');
    }
  };

  const handleGenerateMore = async () => {
    setIsLoadingMore(true);
    try {
      const newQuestions = await onGenerateMore(currentCategory);
      setGeneratedQuestions(prev => [...prev, ...newQuestions]);
    } catch (error) {
      console.error('Error generating questions:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const renderSuggestionCard = (suggestion: Suggestion) => (
    <Card 
      key={suggestion.id}
      className={cn(
        "p-3 border-2 transition-all duration-200 cursor-pointer",
        "hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5",
        suggestion.priority === 'high' && "border-yellow-400 bg-yellow-50",
        suggestion.priority === 'medium' && "border-purple-400 bg-purple-50",
        suggestion.priority === 'low' && "border-gray-300"
      )}
      onClick={() => onQuestionSelect(suggestion.text)}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium flex-1">{suggestion.text}</p>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(suggestion.text, suggestion.id);
              }}
              className="h-7 w-7 p-0"
            >
              {copiedId === suggestion.id ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {suggestion.timing === 'immediate' && (
            <Badge variant="destructive" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Now
            </Badge>
          )}
          {suggestion.competencyId && (
            <Badge variant="secondary" className="text-xs">
              {competencies.find(c => c.id === suggestion.competencyId)?.name || 'General'}
            </Badge>
          )}
        </div>
        
        {suggestion.reason && (
          <p className="text-xs text-gray-600 italic">{suggestion.reason}</p>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-600" />
          Question Assistant
        </h3>
        <Button
          onClick={handleGenerateMore}
          disabled={isLoadingMore || isGenerating}
          size="sm"
          variant="outline"
          className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          {isLoadingMore ? (
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3 mr-1" />
          )}
          Generate More
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="suggested">
            Suggested ({questionSuggestions.length})
          </TabsTrigger>
          <TabsTrigger value="followup">
            Follow-ups ({followUpSuggestions.length})
          </TabsTrigger>
          <TabsTrigger value="coaching">
            Tips ({coachingSuggestions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggested" className="mt-4">
          <ScrollArea className="h-64">
            <div className="space-y-3 pr-4">
              {questionSuggestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Lightbulb className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No question suggestions yet</p>
                  <p className="text-xs mt-1">They'll appear as the interview progresses</p>
                </div>
              ) : (
                Object.entries(suggestionsByCompetency).map(([competencyId, suggestions]) => (
                  <div key={competencyId} className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Target className="w-3 h-3" />
                      {competencyId === 'general' 
                        ? 'General Questions' 
                        : competencies.find(c => c.id === competencyId)?.name || competencyId}
                    </h4>
                    {suggestions.map(renderSuggestionCard)}
                  </div>
                ))
              )}

              {generatedQuestions.length > 0 && (
                <div className="space-y-2 mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700">Generated Questions</h4>
                  {generatedQuestions.map((question) => (
                    <Card
                      key={question.id}
                      className="p-3 border-2 border-gray-300 cursor-pointer 
                               hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
                      onClick={() => onQuestionSelect(question.text)}
                    >
                      <p className="text-sm">{question.text}</p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="followup" className="mt-4">
          <ScrollArea className="h-64">
            <div className="space-y-3 pr-4">
              {followUpSuggestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No follow-up suggestions yet</p>
                  <p className="text-xs mt-1">They'll appear based on candidate responses</p>
                </div>
              ) : (
                followUpSuggestions.map(renderSuggestionCard)
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="coaching" className="mt-4">
          <ScrollArea className="h-64">
            <div className="space-y-3 pr-4">
              {coachingSuggestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No coaching tips yet</p>
                  <p className="text-xs mt-1">You're doing great!</p>
                </div>
              ) : (
                coachingSuggestions.map((suggestion) => (
                  <Card
                    key={suggestion.id}
                    className="p-3 border-2 border-blue-300 bg-blue-50"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{suggestion.text}</p>
                        {suggestion.reason && (
                          <p className="text-xs text-gray-600 mt-1">{suggestion.reason}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="p-3 bg-gray-50 border-2 border-gray-200">
        <p className="text-xs text-gray-600 mb-2">Quick prompts:</p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => onQuestionSelect("Can you tell me more about that?")}
          >
            Tell me more
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => onQuestionSelect("What was the outcome of that situation?")}
          >
            What happened?
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => onQuestionSelect("How did you measure success?")}
          >
            Measure success?
          </Button>
        </div>
      </Card>
    </div>
  );
}