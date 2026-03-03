export { BaseMCPTool } from './base-tool.js';
export type { ToolDefinition, ToolResponse } from './base-tool.js';

export { GenerateBooleanSearchTool } from './generate-boolean-search.js';
export { CreateJobPostingTool } from './create-job-posting.js';
export { AnalyzeCandidateFitTool } from './analyze-candidate-fit.js';
export { GenerateInterviewQuestionsTool } from './generate-interview-questions.js';
export { EnhanceJobDescriptionTool } from './enhance-job-description.js';
export { MarketCompensationAnalysisTool } from './market-compensation-analysis.js';
export { TalentSourcingStrategyTool } from './talent-sourcing-strategy.js';

import { BaseMCPTool } from './base-tool.js';
import { GenerateBooleanSearchTool } from './generate-boolean-search.js';
import { CreateJobPostingTool } from './create-job-posting.js';
import { AnalyzeCandidateFitTool } from './analyze-candidate-fit.js';
import { GenerateInterviewQuestionsTool } from './generate-interview-questions.js';
import { EnhanceJobDescriptionTool } from './enhance-job-description.js';
import { MarketCompensationAnalysisTool } from './market-compensation-analysis.js';
import { TalentSourcingStrategyTool } from './talent-sourcing-strategy.js';

/**
 * All available recruitment tools, keyed by tool name.
 */
export function createToolRegistry(): Map<string, BaseMCPTool> {
  const tools: BaseMCPTool[] = [
    new GenerateBooleanSearchTool(),
    new CreateJobPostingTool(),
    new AnalyzeCandidateFitTool(),
    new GenerateInterviewQuestionsTool(),
    new EnhanceJobDescriptionTool(),
    new MarketCompensationAnalysisTool(),
    new TalentSourcingStrategyTool(),
  ];

  const registry = new Map<string, BaseMCPTool>();
  for (const tool of tools) {
    registry.set(tool.definition.name, tool);
  }
  return registry;
}
