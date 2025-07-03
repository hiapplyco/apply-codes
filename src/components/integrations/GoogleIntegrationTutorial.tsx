import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Video,
  ExternalLink,
  Download,
  Upload,
  FolderOpen,
  Share2,
  Settings,
  Shield,
  GoogleDrive,
  FileText,
  Users,
  Lightbulb,
  Target,
  Clock,
  Star,
  Info,
  HelpCircle,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  estimatedTime: number; // in minutes
  isOptional?: boolean;
  prerequisites?: string[];
  actionRequired?: boolean;
  videoUrl?: string;
  docsUrl?: string;
}

interface TutorialProgress {
  currentStep: number;
  completedSteps: string[];
  startedAt?: Date;
  estimatedTimeRemaining: number;
}

export function GoogleIntegrationTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState<TutorialProgress>({
    currentStep: 0,
    completedSteps: [],
    estimatedTimeRemaining: 15
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);

  const { accounts, currentAccount } = useGoogleAuth();

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'intro',
      title: 'Welcome to Google Integration',
      description: 'Learn how to connect and use Google Drive & Docs with Apply',
      estimatedTime: 2,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <GoogleDrive className="w-16 h-16 mx-auto text-blue-600 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Welcome to Google Integration!</h3>
            <p className="text-gray-600 mb-6">
              Connect your Google account to seamlessly create, edit, and share recruitment documents 
              directly from Apply.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <FolderOpen className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <h4 className="font-medium mb-1">Google Drive</h4>
              <p className="text-sm text-gray-600">Store and organize recruitment documents</p>
            </Card>
            <Card className="p-4 text-center">
              <FileText className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <h4 className="font-medium mb-1">Google Docs</h4>
              <p className="text-sm text-gray-600">Collaborative document editing</p>
            </Card>
            <Card className="p-4 text-center">
              <Share2 className="w-8 h-8 mx-auto text-purple-600 mb-2" />
              <h4 className="font-medium mb-1">Team Sharing</h4>
              <p className="text-sm text-gray-600">Share with hiring teams instantly</p>
            </Card>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This tutorial will take approximately 15 minutes to complete. You can pause and resume at any time.
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      id: 'connect-account',
      title: 'Connect Your Google Account',
      description: 'Safely connect your Google account to Apply',
      estimatedTime: 3,
      actionRequired: true,
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-bold mb-4">Step 1: Connect Your Google Account</h3>
          
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Security First:</strong> Apply uses OAuth 2.0 for secure authentication. 
                We never store your Google password and you can revoke access at any time.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">What permissions do we need?</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span><strong>Google Drive:</strong> Create and manage recruitment documents</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span><strong>Google Docs:</strong> Edit documents collaboratively</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span><strong>Profile Info:</strong> Display your name and email</span>
                </li>
              </ul>
            </div>

            {accounts.length === 0 ? (
              <div className="text-center py-6">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.open('/google-integrations-settings', '_blank')}
                >
                  <GoogleDrive className="w-5 h-5 mr-2" />
                  Connect Google Account
                </Button>
                <p className="text-sm text-gray-600 mt-2">
                  This will open a new tab for secure Google authentication
                </p>
              </div>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  ✅ Google account connected! You can proceed to the next step.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'create-content',
      title: 'Create Your First Document',
      description: 'Generate content and export it to Google Docs',
      estimatedTime: 4,
      actionRequired: true,
      prerequisites: ['connect-account'],
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-bold mb-4">Step 2: Create Your First Document</h3>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Now let's create a recruitment document and export it to Google Docs. 
              This demonstrates the seamless integration between Apply and Google.
            </p>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium mb-2 flex items-center">
                <Lightbulb className="w-4 h-4 mr-2 text-blue-600" />
                Try This: Job Description
              </h4>
              <ol className="space-y-2 text-sm list-decimal list-inside">
                <li>Go to the Content Creation page</li>
                <li>Select "Job Description" as content type</li>
                <li>Enter details about a role (e.g., "Senior Software Engineer")</li>
                <li>Click "Generate Content" to create the document</li>
                <li>Use the Google Docs export button to save to Drive</li>
              </ol>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={() => window.open('/content', '_blank')}
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                Open Content Creator
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open('/google-integrations-settings', '_blank')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage Integration
              </Button>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Tip:</strong> All content created in Apply can be exported to Google Docs, 
                where you can collaborate with your team in real-time.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )
    },
    {
      id: 'import-documents',
      title: 'Import Existing Documents',
      description: 'Bring your existing Google Docs into Apply',
      estimatedTime: 3,
      isOptional: true,
      prerequisites: ['connect-account'],
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-bold mb-4">Step 3: Import Existing Documents</h3>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              You can also import existing documents from Google Drive into Apply for editing and enhancement.
            </p>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium mb-2 flex items-center">
                <Upload className="w-4 h-4 mr-2 text-green-600" />
                How to Import
              </h4>
              <ol className="space-y-2 text-sm list-decimal list-inside">
                <li>In Content Creator, switch to the "Import" tab</li>
                <li>Browse your Google Drive files</li>
                <li>Select a Google Docs document</li>
                <li>The content will be imported into Apply's editor</li>
                <li>Make edits and export back to Google Docs</li>
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-medium mb-2">✅ Supported Formats</h4>
                <ul className="text-sm space-y-1">
                  <li>• Google Docs (.gdoc)</li>
                  <li>• Microsoft Word (.docx)</li>
                  <li>• Plain Text (.txt)</li>
                  <li>• HTML files (.html)</li>
                </ul>
              </Card>
              <Card className="p-4">
                <h4 className="font-medium mb-2">🚀 Benefits</h4>
                <ul className="text-sm space-y-1">
                  <li>• AI-powered enhancement</li>
                  <li>• Consistent formatting</li>
                  <li>• Team collaboration</li>
                  <li>• Version control</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'sharing-collaboration',
      title: 'Sharing & Collaboration',
      description: 'Share documents with your team and collaborate',
      estimatedTime: 3,
      prerequisites: ['create-content'],
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-bold mb-4">Step 4: Sharing & Collaboration</h3>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Once your documents are in Google Docs, you can leverage Google's powerful 
              collaboration features to work with your team.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Share2 className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium">Share Options</h4>
                </div>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center space-x-2">
                    <Circle className="w-3 h-3" />
                    <span>Anyone with link</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Circle className="w-3 h-3" />
                    <span>Specific team members</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Circle className="w-3 h-3" />
                    <span>Organization-wide</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Users className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium">Permission Levels</h4>
                </div>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center space-x-2">
                    <Circle className="w-3 h-3" />
                    <span><strong>View:</strong> Read-only access</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Circle className="w-3 h-3" />
                    <span><strong>Comment:</strong> Add feedback</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Circle className="w-3 h-3" />
                    <span><strong>Edit:</strong> Full editing rights</span>
                  </li>
                </ul>
              </Card>
            </div>

            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                <strong>Pro Tip:</strong> Use "Comment" permission for reviewers and "Edit" for 
                team members who need to make changes to the document.
              </AlertDescription>
            </Alert>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-medium mb-2 flex items-center">
                <Target className="w-4 h-4 mr-2 text-purple-600" />
                Best Practices
              </h4>
              <ul className="space-y-1 text-sm">
                <li>• Set up approval workflows using comments</li>
                <li>• Use version history to track changes</li>
                <li>• Add team members to documents before sharing with candidates</li>
                <li>• Use suggestion mode for review processes</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'advanced-features',
      title: 'Advanced Features',
      description: 'Explore advanced Google integration features',
      estimatedTime: 2,
      isOptional: true,
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-bold mb-4">Step 5: Advanced Features</h3>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Discover advanced features that make your recruitment workflow even more efficient.
            </p>

            <Tabs defaultValue="automation" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="automation">Automation</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="automation" className="space-y-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-3 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-yellow-600" />
                    Workflow Automation
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Auto-save to specific Drive folders</li>
                    <li>• Automatic sharing with team members</li>
                    <li>• Batch document generation</li>
                    <li>• Template-based content creation</li>
                  </ul>
                </Card>
              </TabsContent>
              
              <TabsContent value="templates" className="space-y-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-3 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-orange-600" />
                    Document Templates
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Create reusable document templates</li>
                    <li>• Brand-consistent formatting</li>
                    <li>• Pre-filled sections and placeholders</li>
                    <li>• Team template library</li>
                  </ul>
                </Card>
              </TabsContent>
              
              <TabsContent value="analytics" className="space-y-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-3 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-blue-600" />
                    Usage Analytics
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Document creation metrics</li>
                    <li>• Team collaboration insights</li>
                    <li>• Most popular content types</li>
                    <li>• Time-to-hire correlation</li>
                  </ul>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )
    }
  ];

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('google-integration-tutorial-progress');
    if (savedProgress) {
      try {
        setProgress(JSON.parse(savedProgress));
      } catch (error) {
        console.error('Failed to load tutorial progress:', error);
      }
    }
  }, []);

  // Save progress to localStorage
  const saveProgress = (newProgress: TutorialProgress) => {
    setProgress(newProgress);
    localStorage.setItem('google-integration-tutorial-progress', JSON.stringify(newProgress));
  };

  const markStepComplete = (stepId: string) => {
    const newProgress = {
      ...progress,
      completedSteps: [...progress.completedSteps.filter(id => id !== stepId), stepId],
      estimatedTimeRemaining: Math.max(0, progress.estimatedTimeRemaining - (tutorialSteps.find(s => s.id === stepId)?.estimatedTime || 0))
    };
    saveProgress(newProgress);
    toast.success('Step completed!');
  };

  const goToStep = (stepIndex: number) => {
    const newProgress = { ...progress, currentStep: stepIndex };
    saveProgress(newProgress);
  };

  const nextStep = () => {
    if (progress.currentStep < tutorialSteps.length - 1) {
      goToStep(progress.currentStep + 1);
    }
  };

  const prevStep = () => {
    if (progress.currentStep > 0) {
      goToStep(progress.currentStep - 1);
    }
  };

  const resetTutorial = () => {
    const newProgress: TutorialProgress = {
      currentStep: 0,
      completedSteps: [],
      startedAt: new Date(),
      estimatedTimeRemaining: tutorialSteps.reduce((total, step) => total + step.estimatedTime, 0)
    };
    saveProgress(newProgress);
    toast.success('Tutorial reset!');
  };

  const currentStep = tutorialSteps[progress.currentStep];
  const isStepCompleted = (stepId: string) => progress.completedSteps.includes(stepId);
  const completionPercentage = (progress.completedSteps.length / tutorialSteps.length) * 100;

  return (
    <div className="space-y-4">
      {/* Quick Start Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <CardTitle>Google Integration Tutorial</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {progress.completedSteps.length}/{tutorialSteps.length} Steps
              </Badge>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Play className="w-4 h-4 mr-2" />
                    {progress.completedSteps.length === 0 ? 'Start Tutorial' : 'Continue Tutorial'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <GoogleDrive className="w-5 h-5 text-blue-600" />
                      <span>Google Integration Tutorial</span>
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Progress Header */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium">
                            Step {progress.currentStep + 1} of {tutorialSteps.length}
                          </span>
                          <Badge className={currentStep.isOptional ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}>
                            {currentStep.isOptional ? 'Optional' : 'Required'}
                          </Badge>
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{currentStep.estimatedTime} min</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={resetTutorial}>
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Reset
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{Math.round(completionPercentage)}% Complete</span>
                        </div>
                        <Progress value={completionPercentage} />
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="min-h-[400px]">
                      {currentStep.content}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={prevStep}
                        disabled={progress.currentStep === 0}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous
                      </Button>

                      <div className="flex items-center space-x-2">
                        {!isStepCompleted(currentStep.id) && (
                          <Button
                            variant="outline"
                            onClick={() => markStepComplete(currentStep.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Complete
                          </Button>
                        )}
                        
                        <Button
                          onClick={nextStep}
                          disabled={progress.currentStep === tutorialSteps.length - 1}
                        >
                          Next
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>

                    {/* Step Overview */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Tutorial Steps</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {tutorialSteps.map((step, index) => (
                          <Button
                            key={step.id}
                            variant={index === progress.currentStep ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => goToStep(index)}
                            className="justify-start h-auto p-2"
                          >
                            <div className="flex items-center space-x-2 w-full">
                              {isStepCompleted(step.id) ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Circle className="w-4 h-4 text-gray-400" />
                              )}
                              <div className="text-left min-w-0 flex-1">
                                <div className="font-medium text-xs truncate">{step.title}</div>
                                <div className="text-xs text-gray-600">{step.estimatedTime} min</div>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <CardDescription>
            Learn how to connect and use Google Drive & Docs with Apply ({progress.estimatedTimeRemaining} min remaining)
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm">What You'll Learn</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Connect Google account securely</li>
                <li>• Create and export documents</li>
                <li>• Import existing files</li>
                <li>• Share and collaborate</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="font-medium text-sm">Estimated Time</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Total: 15 minutes</p>
                <p>Required steps: 12 minutes</p>
                <p>Optional steps: 3 minutes</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-sm">Need Help?</span>
              </div>
              <div className="text-sm text-gray-600">
                <Button variant="ghost" size="sm" className="h-auto p-0 text-left">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Documentation
                </Button>
                <br />
                <Button variant="ghost" size="sm" className="h-auto p-0 text-left">
                  <Video className="w-3 h-3 mr-1" />
                  Video Guide
                </Button>
              </div>
            </div>
          </div>

          {completionPercentage > 0 && completionPercentage < 100 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Play className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm">Tutorial in Progress</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                You're {Math.round(completionPercentage)}% through the tutorial. 
                Continue where you left off.
              </p>
              <Button size="sm" onClick={() => setIsOpen(true)}>
                Continue Tutorial
              </Button>
            </div>
          )}

          {completionPercentage === 100 && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Tutorial Complete!</strong> You've mastered Google integration with Apply. 
                Check out advanced features or start creating your first document.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}