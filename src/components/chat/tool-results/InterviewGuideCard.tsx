import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ClipboardList, MessageSquare, Star, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ToolResultComponentProps,
  InterviewGuideResult,
  InterviewFeedbackResult,
} from '@/types/mcp-chat';

function isInterviewGuide(data: unknown): data is InterviewGuideResult {
  return !!data && typeof data === 'object' && 'questions' in data && 'metadata' in data;
}

function isFeedbackAnalysis(data: unknown): data is InterviewFeedbackResult {
  return !!data && typeof data === 'object' && 'overallRecommendation' in data;
}

const difficultyColor: Record<string, string> = {
  basic: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

export const InterviewGuideCard: React.FC<ToolResultComponentProps> = ({
  toolName,
  data,
  status,
}) => {
  const [rawOpen, setRawOpen] = useState(false);

  if (status === 'error') {
    return (
      <Card className="border border-red-200 bg-red-50/50 my-2">
        <CardContent className="p-3 text-xs text-red-700">
          Failed to generate interview content.
        </CardContent>
      </Card>
    );
  }

  if (isFeedbackAnalysis(data)) return <FeedbackView data={data} rawData={data} />;
  if (isInterviewGuide(data)) return <GuideView data={data} rawData={data} />;

  return (
    <Card className="border border-gray-200 my-2">
      <CardContent className="p-3 text-xs text-gray-500">
        Unexpected data format for {toolName}
      </CardContent>
    </Card>
  );
};

function GuideView({ data, rawData }: { data: InterviewGuideResult; rawData: unknown }) {
  const [rawOpen, setRawOpen] = useState(false);
  const { metadata, structure, questions, evaluationCriteria, tips, nextSteps } = data;

  return (
    <Card className="border border-blue-200 bg-white shadow-sm my-2">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-900">Interview Guide</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="text-xs">{metadata.interviewType}</Badge>
            <Badge variant="outline" className="text-xs">{metadata.experienceLevel}</Badge>
            <Badge variant="outline" className="text-xs">{metadata.duration}</Badge>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {metadata.jobRole} at {metadata.company}
        </p>
      </CardHeader>

      <CardContent className="p-3 pt-0">
        <Accordion type="multiple" defaultValue={['questions']} className="space-y-1">
          {structure && Object.keys(structure).length > 0 && (
            <AccordionItem value="structure" className="border-b-0">
              <AccordionTrigger className="text-xs font-medium py-2">
                Interview Structure
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1">
                  {Object.entries(structure).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          <AccordionItem value="questions" className="border-b-0">
            <AccordionTrigger className="text-xs font-medium py-2">
              Questions ({questions.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-900">
                        {idx + 1}. {q.question}
                      </span>
                      <div className="flex gap-1 flex-shrink-0">
                        <Badge variant="outline" className="text-[10px]">{q.category}</Badge>
                        {q.difficulty && (
                          <Badge className={cn('text-[10px]', difficultyColor[q.difficulty] || 'bg-gray-100 text-gray-600')}>
                            {q.difficulty}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {q.followUps?.length > 0 && (
                      <div className="mt-1 pl-3 border-l-2 border-blue-200 space-y-0.5">
                        {q.followUps.map((fu, fi) => (
                          <p key={fi} className="text-[11px] text-gray-500">{fu}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {evaluationCriteria && Object.keys(evaluationCriteria).length > 0 && (
            <AccordionItem value="criteria" className="border-b-0">
              <AccordionTrigger className="text-xs font-medium py-2">
                Evaluation Criteria
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1.5">
                  {Object.entries(evaluationCriteria).map(([key, value]) => (
                    <div key={key} className="text-xs">
                      <span className="font-medium text-gray-700 capitalize">{key}: </span>
                      <span className="text-gray-600">{value}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {tips?.length > 0 && (
          <div className="mt-3 p-2 bg-blue-50 rounded">
            <p className="text-xs font-medium text-blue-800 mb-1">Tips</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {tips.map((tip, idx) => (
                <li key={idx} className="text-xs text-blue-700">{tip}</li>
              ))}
            </ul>
          </div>
        )}

        <RawToggle rawData={rawData} open={rawOpen} onOpenChange={setRawOpen} />
      </CardContent>
    </Card>
  );
}

function FeedbackView({ data, rawData }: { data: InterviewFeedbackResult; rawData: unknown }) {
  const [rawOpen, setRawOpen] = useState(false);
  const { candidate, summary, overallRecommendation, analysis, nextSteps } = data;

  return (
    <Card className="border border-green-200 bg-white shadow-sm my-2">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-900">Feedback Analysis</span>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              'text-xs',
              overallRecommendation.decision.toLowerCase().includes('hire')
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            )}
          >
            <ThumbsUp className="w-3 h-3 mr-1" />
            {overallRecommendation.decision}
          </Badge>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {candidate.name} - {candidate.role}
        </p>
      </CardHeader>

      <CardContent className="p-3 pt-0">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-lg font-bold text-purple-600">{summary.averageRating.toFixed(1)}</p>
            <p className="text-[10px] text-gray-500">Avg Rating</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-lg font-bold text-purple-600">{summary.totalInterviews}</p>
            <p className="text-[10px] text-gray-500">Interviews</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-lg font-bold text-purple-600">{summary.consensusLevel.percentage}%</p>
            <p className="text-[10px] text-gray-500">Consensus</p>
          </div>
        </div>

        {analysis.keyInsights?.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-700 mb-1">Key Insights</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {analysis.keyInsights.map((insight, idx) => (
                <li key={idx} className="text-xs text-gray-600">{insight}</li>
              ))}
            </ul>
          </div>
        )}

        {overallRecommendation.reasoning?.length > 0 && (
          <div className="p-2 bg-green-50 rounded text-xs">
            <p className="font-medium text-green-800 mb-1">
              Recommendation ({overallRecommendation.confidence} confidence)
            </p>
            <ul className="list-disc pl-4 space-y-0.5">
              {overallRecommendation.reasoning.map((r, idx) => (
                <li key={idx} className="text-green-700">{r}</li>
              ))}
            </ul>
          </div>
        )}

        <RawToggle rawData={rawData} open={rawOpen} onOpenChange={setRawOpen} />
      </CardContent>
    </Card>
  );
}

function RawToggle({
  rawData,
  open,
  onOpenChange,
}: {
  rawData: unknown;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-3">
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
        View raw data
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="text-xs bg-gray-50 rounded p-2 mt-1 overflow-x-auto max-h-48 overflow-y-auto font-mono text-gray-600">
          {JSON.stringify(rawData, null, 2)}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default InterviewGuideCard;
