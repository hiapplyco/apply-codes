
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { InterviewHeader } from "@/components/interview/InterviewHeader";
import { InterviewSetupForm, InterviewSetupData } from "@/components/interview/InterviewSetupForm";
import { InterviewPlanDisplay } from "@/components/interview/InterviewPlanDisplay";
import { useInterviewSetup } from "@/hooks/useInterviewSetup";
import { useAuth } from "@/context/AuthContext";
import { ProjectSelector } from "@/components/project/ProjectSelector";

import { InterviewPrep as InterviewPrepComponent } from '@/components/interview/InterviewPrep';

type InterviewStep = 'setup' | 'plan' | 'interview' | 'prep';

interface InterviewPlan {
  overview: string;
  estimatedDuration: string;
  keyAreas: string[];
  questions: Array<{
    category: string;
    question: string;
    followUp?: string[];
  }>;
  evaluationCriteria: string[];
}

export default function InterviewPrep() {
  const [currentStep, setCurrentStep] = useState<InterviewStep>('prep');
  const [setupData, setSetupData] = useState<InterviewSetupData | null>(null);
  const { createInterviewSession, isLoading, sessionId, interviewPlan } = useInterviewSetup();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    document.title = "Interview Preparation Room | Apply";
    
    return () => {
      document.title = "Apply";
    };
  }, []);

  console.log('InterviewPrep render:', { 
    currentStep, 
    authLoading, 
    isAuthenticated, 
    isLoading,
    timestamp: new Date().toISOString()
  });

  // If auth is still loading, show loading screen
  if (authLoading) {
    console.log('Auth is loading, showing spinner...');
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <InterviewHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show login prompt
  if (!isAuthenticated) {
    console.log('User not authenticated, showing login prompt...');
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <InterviewHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please log in to access the interview preparation features.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated, show the main interface
  console.log('User authenticated, showing main interface...');

  const handleSetupSubmit = async (data: InterviewSetupData) => {
    try {
      console.log('Submitting interview setup:', data);
      setSetupData(data);
      await createInterviewSession(data);
      setCurrentStep('plan');
    } catch (error) {
      console.error('Failed to create interview session:', error);
    }
  };

  const handleStartInterview = () => {
    if (!sessionId) {
      toast.error('No interview session found');
      return;
    }
    
    setCurrentStep('interview');
    toast.success('Starting interview session...');
  };

  const handleBackToSetup = () => {
    setCurrentStep('setup');
    setSetupData(null);
  };

  const getFrameworkDisplayName = (framework: string) => {
    const frameworks = {
      'star': 'STAR Method',
      'behavioral': 'Behavioral Interview',
      'competency': 'Competency-Based',
      'other': 'Custom Framework'
    };
    return frameworks[framework as keyof typeof frameworks] || framework;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <InterviewHeader />
      
      <div className="flex-1 p-6 overflow-auto">
        {/* Project selector at the top of all steps */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <ProjectSelector 
              label="Select project for interview preparation"
              placeholder="Choose a project (optional)"
              className="max-w-md"
            />
          </div>
        </div>

        {currentStep === 'setup' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Interview Setup
              </h1>
              <p className="text-gray-600">
                Set up a structured interview for your role. Choose a framework, upload context files, 
                and generate a comprehensive interview plan.
              </p>
            </div>
            
            <InterviewSetupForm 
              onSubmit={handleSetupSubmit}
              isLoading={isLoading}
            />
            <div className="mt-4">
              <Button onClick={() => setCurrentStep('prep')}>Prepare Interview Questions</Button>
            </div>
          </div>
        )}

        {currentStep === 'prep' && (
          <div className="max-w-4xl mx-auto">
            <InterviewPrepComponent onInterviewStart={(data) => {
              setSetupData({
                roleTitle: data.roleTitle,
                roleDescription: data.roleDescription,
                interviewFramework: data.interviewType,
                customFramework: data.interviewType === 'custom' ? data.interviewType : undefined,
                contextFiles: []
              });
              handleSetupSubmit({
                roleTitle: data.roleTitle,
                roleDescription: data.roleDescription,
                interviewFramework: data.interviewType,
                customFramework: data.interviewType === 'custom' ? data.interviewType : undefined,
                contextFiles: []
              });
            }} />
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('setup')}
              >
                Use Advanced Interview Setup
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'plan' && setupData && interviewPlan && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <Button
                  variant="ghost"
                  onClick={handleBackToSetup}
                  className="mb-4"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Setup
                </Button>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Interview Plan Generated
                </h1>
                <p className="text-gray-600">
                  Review your structured interview plan and start the interview when ready.
                </p>
              </div>
              
              <Button onClick={handleStartInterview} className="bg-green-600 hover:bg-green-700">
                <Play className="mr-2 h-4 w-4" />
                Start Interview
              </Button>
            </div>
            
            <InterviewPlanDisplay
              plan={interviewPlan}
              roleTitle={setupData.roleTitle}
              framework={getFrameworkDisplayName(setupData.interviewFramework)}
            />
          </div>
        )}

        {currentStep === 'interview' && (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Live Interview Session</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <h3 className="text-xl font-medium mb-4">Interview Session Ready</h3>
                  <p className="text-gray-600 mb-6">
                    Your interview session is now active. Video calling, transcription, 
                    and scoring features will be implemented in the next phase.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900">Role: {setupData?.roleTitle}</h4>
                      <p className="text-blue-700">Framework: {setupData && getFrameworkDisplayName(setupData.interviewFramework)}</p>
                      <p className="text-blue-700">Session ID: {sessionId}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentStep('plan')}
                    >
                      Back to Plan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
