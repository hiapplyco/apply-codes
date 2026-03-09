
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgentOutputs } from "@/stores/useAgentOutputs";

interface KeyTermsWindowProps {
  jobId: number;
}

export const KeyTermsWindow = ({ jobId }: KeyTermsWindowProps) => {
  const { data: agentOutput, isLoading, error } = useAgentOutputs(jobId);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Key Terms Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Key Terms Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error loading key terms analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Key Terms Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          {(agentOutput as any)?.key_terms ? (
            <div className="whitespace-pre-line text-gray-800">
              {(agentOutput as any).key_terms}
            </div>
          ) : (
            <p className="text-gray-500">No key terms analysis available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
