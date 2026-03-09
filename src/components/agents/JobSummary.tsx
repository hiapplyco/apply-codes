import { FileText } from "lucide-react";
import { AgentWindow } from "./AgentWindow";
import { useAgentOutputs } from "@/stores/useAgentOutputs";

interface JobSummaryProps {
  jobId: number | null;
}

export const JobSummary = ({ jobId }: JobSummaryProps) => {
  const { data: agentOutput, isLoading } = useAgentOutputs(jobId);

  if (!jobId) return null;

  return (
    <AgentWindow
      title="Job Summary"
      icon={<FileText className="h-6 w-6" />}
    >
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        </div>
      ) : (
        <div className="prose prose-sm max-w-none whitespace-pre-line text-gray-800">
          {(agentOutput?.job_summary as React.ReactNode) || "No job summary available."}
        </div>
      )}
    </AgentWindow>
  );
};