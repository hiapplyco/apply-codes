/**
 * InterviewQuestionsMockup
 *
 * Displays generated interview questions in a categorized card grid
 * with optional scoring guides.
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Copy,
  Download,
  Check,
  MessageSquare,
  Target,
  Users,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Question {
  text: string;
  category: string;
  scoringGuide?: string;
}

interface InterviewQuestionsMockupProps {
  content: string;
  questions?: Question[];
  jobTitle?: string;
  className?: string;
}

// Category configuration
const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  'Technical': { icon: Target, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'Behavioral': { icon: Users, color: 'text-green-600', bgColor: 'bg-green-100' },
  'Cultural': { icon: Lightbulb, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  'Situational': { icon: MessageSquare, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  'General': { icon: MessageSquare, color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

export function InterviewQuestionsMockup({
  content,
  questions: providedQuestions,
  jobTitle = 'Position',
  className,
}: InterviewQuestionsMockupProps) {
  const [copied, setCopied] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  // Parse questions from content if not provided
  const questions = useMemo(() => {
    if (providedQuestions && providedQuestions.length > 0) {
      return providedQuestions;
    }

    const parsed: Question[] = [];
    let currentCategory = 'General';
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Check for category headers
      if (trimmed.startsWith('##') || trimmed.startsWith('**')) {
        const categoryName = trimmed.replace(/[#*]/g, '').trim();
        if (categoryName.toLowerCase().includes('technical')) {
          currentCategory = 'Technical';
        } else if (categoryName.toLowerCase().includes('behavioral')) {
          currentCategory = 'Behavioral';
        } else if (categoryName.toLowerCase().includes('cultural') || categoryName.toLowerCase().includes('fit')) {
          currentCategory = 'Cultural';
        } else if (categoryName.toLowerCase().includes('situational')) {
          currentCategory = 'Situational';
        } else {
          currentCategory = categoryName || 'General';
        }
        continue;
      }

      // Check for numbered questions or bullet points
      const questionMatch = trimmed.match(/^(\d+[\.\)]\s*|[-*]\s*)(.+\?)/);
      if (questionMatch) {
        parsed.push({
          text: questionMatch[2].trim(),
          category: currentCategory,
        });
      } else if (trimmed.endsWith('?') && trimmed.length > 10) {
        parsed.push({
          text: trimmed,
          category: currentCategory,
        });
      }
    }

    return parsed;
  }, [content, providedQuestions]);

  // Group questions by category
  const groupedQuestions = useMemo(() => {
    const groups: Record<string, Question[]> = {};
    for (const q of questions) {
      const cat = q.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(q);
    }
    return groups;
  }, [questions]);

  const categories = Object.keys(groupedQuestions);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Questions copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('[InterviewQuestionsMockup] Copy failed:', error);
      toast.error('Failed to copy');
    }
  };

  const handleCopyCategory = async (category: string) => {
    try {
      const categoryQuestions = groupedQuestions[category] || [];
      const text = `${category} Questions:\n\n${categoryQuestions.map((q, i) => `${i + 1}. ${q.text}`).join('\n')}`;
      await navigator.clipboard.writeText(text);
      toast.success(`${category} questions copied!`);
    } catch (error) {
      console.error('[InterviewQuestionsMockup] Copy category failed:', error);
      toast.error('Failed to copy');
    }
  };

  const toggleQuestion = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const getCategoryConfig = (category: string) => {
    return CATEGORY_CONFIG[category] || CATEGORY_CONFIG['General'];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header Card */}
      <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Interview Questions
              </CardTitle>
              <p className="text-purple-100 text-sm mt-1">
                {questions.length} questions for {jobTitle}
              </p>
            </div>
            <div className="flex gap-2">
              {categories.map((cat) => {
                const config = getCategoryConfig(cat);
                return (
                  <Badge
                    key={cat}
                    variant="secondary"
                    className="bg-white/20 text-white border-white/30"
                  >
                    {groupedQuestions[cat].length} {cat}
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Questions by Category */}
      {categories.length > 1 ? (
        <Tabs defaultValue={categories[0]} className="w-full">
          <TabsList className="w-full justify-start border-2 border-black p-1 bg-gray-100">
            {categories.map((category) => {
              const config = getCategoryConfig(category);
              const Icon = config.icon;
              return (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  <Icon className="w-4 h-4" />
                  {category}
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {groupedQuestions[category].length}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="mt-4">
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyCategory(category)}
                    className="border-2 border-black"
                  >
                    <Copy className="w-3 h-3 mr-2" />
                    Copy {category} Questions
                  </Button>
                </div>

                {groupedQuestions[category].map((question, index) => (
                  <QuestionCard
                    key={index}
                    question={question}
                    index={index}
                    category={category}
                    isExpanded={expandedQuestions.has(index)}
                    onToggle={() => toggleQuestion(index)}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        // Single category view
        <div className="space-y-3">
          {questions.map((question, index) => (
            <QuestionCard
              key={index}
              question={question}
              index={index}
              category={question.category}
              isExpanded={expandedQuestions.has(index)}
              onToggle={() => toggleQuestion(index)}
            />
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleCopy}
          className="flex-1 bg-purple-600 hover:bg-purple-700 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy All Questions
            </>
          )}
        </Button>
        <Button
          variant="outline"
          className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
}

// Question Card Component
function QuestionCard({
  question,
  index,
  category,
  isExpanded,
  onToggle,
}: {
  question: Question;
  index: number;
  category: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['General'];
  const Icon = config.icon;

  return (
    <Card className="border-2 border-gray-200 hover:border-purple-300 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm",
            config.bgColor,
            config.color
          )}>
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 font-medium">{question.text}</p>

            {question.scoringGuide && (
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="h-6 px-2 text-xs text-gray-500"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      Hide Scoring Guide
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      Show Scoring Guide
                    </>
                  )}
                </Button>

                {isExpanded && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                    {question.scoringGuide}
                  </div>
                )}
              </div>
            )}
          </div>
          <Badge variant="outline" className={cn("flex-shrink-0", config.color)}>
            <Icon className="w-3 h-3 mr-1" />
            {category}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default InterviewQuestionsMockup;
