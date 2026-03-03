import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, CalendarDays, Target, Milestone } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolResultComponentProps, RecruitmentPlanResult } from '@/types/mcp-chat';

const priorityColor: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

export const RecruitmentPlanCard: React.FC<ToolResultComponentProps> = ({
  data,
  status,
}) => {
  const [rawOpen, setRawOpen] = useState(false);
  const result = data as RecruitmentPlanResult;

  if (status === 'error' || !result?.overview) {
    return (
      <Card className="border border-red-200 bg-red-50/50 my-2">
        <CardContent className="p-3 text-xs text-red-700">
          Failed to create recruitment plan.
        </CardContent>
      </Card>
    );
  }

  const { overview, phases, sourcingStrategy, milestones, budgetBreakdown, successMetrics, riskMitigation, nextSteps } = result;

  return (
    <Card className="border border-orange-200 bg-white shadow-sm my-2">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-semibold text-gray-900">Recruitment Plan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge className={cn('text-xs', priorityColor[overview.priority] || 'bg-gray-100 text-gray-600')}>
              {overview.priority}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <CalendarDays className="w-3 h-3 mr-1" />
              {overview.timeline}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {overview.roles.map((role, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">{role}</Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0">
        <Accordion type="multiple" defaultValue={['phases', 'channels']} className="space-y-1">
          {phases?.length > 0 && (
            <AccordionItem value="phases" className="border-b-0">
              <AccordionTrigger className="text-xs font-medium py-2">
                Phases ({phases.length})
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {phases.map((phase, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">
                          {idx + 1}
                        </div>
                        {idx < phases.length - 1 && <div className="w-0.5 h-4 bg-purple-200 mt-1" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-900">{phase.name}</span>
                          <span className="text-[10px] text-gray-500">{phase.duration}</span>
                        </div>
                        <ul className="mt-0.5">
                          {phase.tasks.slice(0, 3).map((task, ti) => (
                            <li key={ti} className="text-[11px] text-gray-500">- {task}</li>
                          ))}
                          {phase.tasks.length > 3 && (
                            <li className="text-[10px] text-gray-400">+{phase.tasks.length - 3} more</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {sourcingStrategy?.channels?.length > 0 && (
            <AccordionItem value="channels" className="border-b-0">
              <AccordionTrigger className="text-xs font-medium py-2">
                Sourcing Channels
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {sourcingStrategy.channels.map((ch, idx) => {
                    const pct = parseInt(ch.allocation) || 0;
                    return (
                      <div key={idx}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-gray-700">{ch.name}</span>
                          <span className="text-gray-500">{ch.allocation}</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {milestones?.length > 0 && (
            <AccordionItem value="milestones" className="border-b-0">
              <AccordionTrigger className="text-xs font-medium py-2">
                <span className="flex items-center gap-1">
                  <Milestone className="w-3 h-3" /> Milestones
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1.5">
                  {milestones.map((ms, idx) => (
                    <div key={idx} className="flex gap-2 text-xs">
                      <Badge variant="outline" className="text-[10px] flex-shrink-0">
                        Week {ms.week}
                      </Badge>
                      <span className="text-gray-700">{ms.milestone}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {successMetrics?.kpis && Object.keys(successMetrics.kpis).length > 0 && (
            <AccordionItem value="kpis" className="border-b-0">
              <AccordionTrigger className="text-xs font-medium py-2">
                Success Metrics
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(successMetrics.kpis).map(([key, value]) => (
                    <Badge key={key} variant="outline" className="text-[10px]">
                      {key}: {value}
                    </Badge>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {nextSteps?.length > 0 && (
          <div className="mt-3 p-2 bg-orange-50 rounded">
            <p className="text-xs font-medium text-orange-800 mb-1">Next Steps</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {nextSteps.slice(0, 4).map((step, idx) => (
                <li key={idx} className="text-xs text-orange-700">{step}</li>
              ))}
            </ul>
          </div>
        )}

        <Collapsible open={rawOpen} onOpenChange={setRawOpen}>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-3">
            <ChevronDown className={cn('w-3 h-3 transition-transform', rawOpen && 'rotate-180')} />
            View raw data
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="text-xs bg-gray-50 rounded p-2 mt-1 overflow-x-auto max-h-48 overflow-y-auto font-mono text-gray-600">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default RecruitmentPlanCard;
