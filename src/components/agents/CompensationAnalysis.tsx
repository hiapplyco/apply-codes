import { DollarSign } from "lucide-react";
import { AgentWindow } from "./AgentWindow";
import { useAgentOutputs } from "@/stores/useAgentOutputs";

interface CompensationAnalysisProps {
  jobId: number | null;
}

export const CompensationAnalysis = ({ jobId }: CompensationAnalysisProps) => {
  const { data: agentOutput, isLoading } = useAgentOutputs(jobId);

  if (!jobId) return null;

  return (
    <AgentWindow
      title="Compensation Analysis"
      icon={<DollarSign className="h-6 w-6" />}
    >
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        </div>
      ) : (
        <div className="prose prose-sm max-w-none whitespace-pre-line text-gray-800">
          {(agentOutput?.compensation_analysis as React.ReactNode) || "No compensation information found."}
        </div>
      )}
    </AgentWindow>
  );
};