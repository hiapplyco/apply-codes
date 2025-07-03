
import { AgentOutput } from "@/types/agent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Briefcase, DollarSign, Star, Users, Target, BarChart3, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AnalysisReportProps {
  agentOutput?: AgentOutput | null;
  isGeneratingAnalysis: boolean;
  isProcessingComplete: boolean;
  jobId?: number | null;
  children?: React.ReactNode;
}

export const AnalysisReport = ({ 
  agentOutput, 
  isGeneratingAnalysis, 
  isProcessingComplete, 
  jobId,
  children 
}: AnalysisReportProps) => {
  const navigate = useNavigate();
  if (isGeneratingAnalysis && !isProcessingComplete) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Generating analysis...</p>
        </div>
        {children}
      </div>
    );
  }

  if (!agentOutput && !isGeneratingAnalysis) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Analysis Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">No analysis available yet. Generate an analysis to see insights about your job requirements.</p>
            {children}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Job Summary Card */}
        {agentOutput?.job_summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Job Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-line text-gray-800">
                  {agentOutput.job_summary}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Description Card */}
        {agentOutput?.enhanced_description && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Enhanced Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-line text-gray-800">
                  {agentOutput.enhanced_description}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compensation Analysis Card */}
        {agentOutput?.compensation_analysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Compensation Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-line text-gray-800">
                  {agentOutput.compensation_analysis}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Terms Analysis Card */}
        {agentOutput?.terms && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Key Terms Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Skills */}
                {agentOutput.terms.skills && agentOutput.terms.skills.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {agentOutput.terms.skills.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Titles */}
                {agentOutput.terms.titles && agentOutput.terms.titles.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Similar Titles
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {agentOutput.terms.titles.map((title: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keywords */}
                {agentOutput.terms.keywords && agentOutput.terms.keywords.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Keywords
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {agentOutput.terms.keywords.map((keyword: string, index: number) => (
                        <Badge key={index} variant="default">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dashboard Analytics Link */}
      {agentOutput && jobId && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <BarChart3 className="h-5 w-5" />
              Advanced Analytics Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 mb-2">
                  View comprehensive recruitment intelligence with interactive charts and AI-powered insights.
                </p>
                <ul className="text-sm text-purple-600 space-y-1">
                  <li>• Talent pipeline visualizations</li>
                  <li>• Skills distribution analysis</li>
                  <li>• Compensation market insights</li>
                  <li>• Predictive hiring metrics</li>
                </ul>
              </div>
              <Button
                onClick={() => navigate(`/analytics/${jobId}`)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Dashboard
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {children}
    </div>
  );
};
