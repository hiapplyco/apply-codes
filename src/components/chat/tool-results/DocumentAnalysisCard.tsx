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
import {
  ChevronDown,
  FileText,
  GitCompare,
  Sparkles,
  Search,
  Briefcase,
  GraduationCap,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ToolResultComponentProps,
  ResumeParseResult,
  DocumentComparisonResult,
  JobDescriptionEnhancement,
  JobRequirementsAnalysis,
} from '@/types/mcp-chat';

export const DocumentAnalysisCard: React.FC<ToolResultComponentProps> = ({
  toolName,
  data,
  status,
}) => {
  const [rawOpen, setRawOpen] = useState(false);

  if (status === 'error') {
    return (
      <Card className="border border-red-200 bg-red-50/50 my-2">
        <CardContent className="p-3 text-xs text-red-700">
          Document analysis failed.
        </CardContent>
      </Card>
    );
  }

  const renderers: Record<string, () => React.ReactNode> = {
    parse_resume: () => <ResumeView data={data as ResumeParseResult} />,
    compare_documents: () => <ComparisonView data={data as DocumentComparisonResult} />,
    enhance_job_description: () => <EnhancementView data={data as JobDescriptionEnhancement} />,
    analyze_job_requirements: () => <RequirementsView data={data as JobRequirementsAnalysis} />,
  };

  const render = renderers[toolName];

  return (
    <Card className="border border-indigo-200 bg-white shadow-sm my-2">
      {render ? render() : (
        <CardContent className="p-3 text-xs text-gray-500">
          Unsupported document tool: {toolName}
        </CardContent>
      )}
      <div className="px-3 pb-3">
        <Collapsible open={rawOpen} onOpenChange={setRawOpen}>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
            <ChevronDown className={cn('w-3 h-3 transition-transform', rawOpen && 'rotate-180')} />
            View raw data
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="text-xs bg-gray-50 rounded p-2 mt-1 overflow-x-auto max-h-48 overflow-y-auto font-mono text-gray-600">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Card>
  );
};

function ResumeView({ data }: { data: ResumeParseResult }) {
  if (!data?.contact) return null;

  return (
    <>
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-semibold text-gray-900">Resume Analysis</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-medium text-gray-800">{data.contact.name}</span>
          {data.contact.email && (
            <span className="text-xs text-gray-500 flex items-center gap-0.5">
              <Mail className="w-3 h-3" /> {data.contact.email}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {data.summary && (
          <p className="text-xs text-gray-600 mb-3">{data.summary}</p>
        )}

        <Accordion type="multiple" defaultValue={['skills']} className="space-y-1">
          {data.experience?.length > 0 && (
            <AccordionItem value="experience" className="border-b-0">
              <AccordionTrigger className="text-xs font-medium py-2">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> Experience ({data.experience.length})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {data.experience.slice(0, 5).map((exp, idx) => (
                    <div key={idx} className="p-2 bg-gray-50 rounded">
                      <p className="text-xs font-medium text-gray-900">{exp.title}</p>
                      <p className="text-[11px] text-gray-600">{exp.company}</p>
                      {(exp.startDate || exp.duration) && (
                        <p className="text-[10px] text-gray-400">
                          {exp.startDate}{exp.endDate ? ` - ${exp.endDate}` : ''} {exp.duration ? `(${exp.duration})` : ''}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {data.skills && (
            <AccordionItem value="skills" className="border-b-0">
              <AccordionTrigger className="text-xs font-medium py-2">Skills</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1.5">
                  {Object.entries(data.skills).map(([category, skills]) => {
                    if (!Array.isArray(skills) || skills.length === 0) return null;
                    return (
                      <div key={category}>
                        <p className="text-[10px] text-gray-500 capitalize mb-0.5">{category}</p>
                        <div className="flex flex-wrap gap-1">
                          {skills.map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] bg-indigo-50 text-indigo-700">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {data.education?.length > 0 && (
            <AccordionItem value="education" className="border-b-0">
              <AccordionTrigger className="text-xs font-medium py-2">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" /> Education
                </span>
              </AccordionTrigger>
              <AccordionContent>
                {data.education.map((edu, idx) => (
                  <div key={idx} className="text-xs">
                    <span className="font-medium">{edu.degree}</span>
                    <span className="text-gray-500"> - {edu.institution}</span>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </>
  );
}

function ComparisonView({ data }: { data: DocumentComparisonResult }) {
  const comp = data?.comparison;
  if (!comp) return null;

  const scoreColor = comp.matchScore >= 80
    ? 'text-green-600'
    : comp.matchScore >= 50
    ? 'text-yellow-600'
    : 'text-red-600';

  return (
    <>
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-gray-900">Document Comparison</span>
          </div>
          <div className="text-center">
            <p className={cn('text-xl font-bold', scoreColor)}>{comp.matchScore}%</p>
            <p className="text-[10px] text-gray-500">{comp.matchLevel}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <Progress value={comp.matchScore} className="h-2 mb-3" />

        <div className="grid grid-cols-2 gap-3 mb-3">
          {comp.keyMatches?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green-700 mb-1">Matches</p>
              <ul className="list-disc pl-3">
                {comp.keyMatches.slice(0, 5).map((m, i) => (
                  <li key={i} className="text-[11px] text-gray-600">{m}</li>
                ))}
              </ul>
            </div>
          )}
          {comp.gaps?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-700 mb-1">Gaps</p>
              <ul className="list-disc pl-3">
                {comp.gaps.slice(0, 5).map((g, i) => (
                  <li key={i} className="text-[11px] text-gray-600">{g}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {comp.recommendations?.length > 0 && (
          <div className="p-2 bg-indigo-50 rounded text-xs">
            <p className="font-medium text-indigo-800 mb-1">Recommendations</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {comp.recommendations.map((r, i) => (
                <li key={i} className="text-indigo-700">{r}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </>
  );
}

function EnhancementView({ data }: { data: JobDescriptionEnhancement }) {
  if (!data?.enhanced) return null;

  return (
    <>
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-semibold text-gray-900">Job Description Enhancement</span>
        </div>
        {data.enhanced.title && (
          <p className="text-xs text-gray-600 mt-1">{data.enhanced.title}</p>
        )}
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="p-2 bg-gray-50 rounded text-center">
            <p className="text-[10px] text-gray-500">Original</p>
            <p className="text-sm font-medium">{data.original.wordCount} words</p>
            <p className="text-[10px] text-gray-400">{data.original.readabilityScore}</p>
          </div>
          <div className="p-2 bg-indigo-50 rounded text-center">
            <p className="text-[10px] text-gray-500">Enhanced</p>
            <p className="text-sm font-medium text-indigo-700">{data.enhanced.wordCount} words</p>
            <p className="text-[10px] text-gray-400">{data.enhanced.readabilityScore}</p>
          </div>
        </div>

        {data.improvements?.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-700 mb-1">Improvements</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {data.improvements.map((imp, idx) => (
                <li key={idx} className="text-xs text-gray-600">{imp}</li>
              ))}
            </ul>
          </div>
        )}

        {data.seoKeywords?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.seoKeywords.map((kw, idx) => (
              <Badge key={idx} variant="outline" className="text-[10px]">{kw}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </>
  );
}

function RequirementsView({ data }: { data: JobRequirementsAnalysis }) {
  if (!data?.jobTitle) return null;

  const complexityColor: Record<string, string> = {
    High: 'bg-red-100 text-red-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Low: 'bg-green-100 text-green-700',
  };

  return (
    <>
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-gray-900">Job Requirements Analysis</span>
          </div>
          {data.complexity && (
            <Badge className={cn('text-xs', complexityColor[data.complexity] || 'bg-gray-100 text-gray-600')}>
              {data.complexity} Complexity
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {data.jobTitle} - {data.experienceLevel}
        </p>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="grid grid-cols-2 gap-3 mb-3">
          {data.requiredSkills?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-700 mb-1">Required Skills</p>
              <div className="flex flex-wrap gap-1">
                {data.requiredSkills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="text-[10px] bg-red-50 text-red-700">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {data.preferredSkills?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-700 mb-1">Preferred Skills</p>
              <div className="flex flex-wrap gap-1">
                {data.preferredSkills.map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="text-[10px]">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-3">
          {data.location && <span>Location: {data.location}</span>}
          {data.remoteOptions && <span>Remote: {data.remoteOptions}</span>}
          {data.salaryInfo?.range && <span>Salary: {data.salaryInfo.range}</span>}
        </div>

        {data.searchTerms?.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-700 mb-1">Search Terms</p>
            <div className="flex flex-wrap gap-1">
              {data.searchTerms.map((term, idx) => (
                <Badge key={idx} variant="outline" className="text-[10px] font-mono">{term}</Badge>
              ))}
            </div>
          </div>
        )}

        {data.recommendations?.length > 0 && (
          <div className="p-2 bg-indigo-50 rounded text-xs">
            <p className="font-medium text-indigo-800 mb-1">Recommendations</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {data.recommendations.map((r, idx) => (
                <li key={idx} className="text-indigo-700">{r}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </>
  );
}

export default DocumentAnalysisCard;
