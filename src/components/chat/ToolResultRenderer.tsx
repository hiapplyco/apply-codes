import React from 'react';
import type { ToolResultComponentProps, MCPToolResultStatus } from '@/types/mcp-chat';
import { CandidateResultsGrid } from './tool-results/CandidateResultsGrid';
import { InterviewGuideCard } from './tool-results/InterviewGuideCard';
import { RecruitmentPlanCard } from './tool-results/RecruitmentPlanCard';
import { MarketIntelligenceCard } from './tool-results/MarketIntelligenceCard';
import { DocumentAnalysisCard } from './tool-results/DocumentAnalysisCard';
import { GenericToolResult } from './tool-results/GenericToolResult';

const TOOL_RENDERERS: Record<string, React.ComponentType<ToolResultComponentProps>> = {
  boolean_search: CandidateResultsGrid,
  generate_interview_questions: InterviewGuideCard,
  analyze_interview_feedback: InterviewGuideCard,
  create_recruitment_plan: RecruitmentPlanCard,
  get_market_intelligence: MarketIntelligenceCard,
  parse_resume: DocumentAnalysisCard,
  compare_documents: DocumentAnalysisCard,
  enhance_job_description: DocumentAnalysisCard,
  analyze_job_requirements: DocumentAnalysisCard,
};

interface ToolResultRendererProps {
  toolName: string;
  result: unknown;
  status: MCPToolResultStatus;
  onAction?: (action: string, payload?: unknown) => void;
}

export const ToolResultRenderer: React.FC<ToolResultRendererProps> = ({
  toolName,
  result,
  status,
  onAction,
}) => {
  const Component = TOOL_RENDERERS[toolName] || GenericToolResult;

  return (
    <Component
      toolName={toolName}
      data={result}
      status={status}
      onAction={onAction}
    />
  );
};

export default ToolResultRenderer;
