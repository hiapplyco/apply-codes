import React, { useState, useRef, useEffect } from 'react';
import { VideoCallFrame } from '@/components/video/VideoCallFrame';
import { TranscriptionProcessor } from '@/components/video/TranscriptionProcessor';
import { MeetingDataManager } from '@/components/video/MeetingDataManager';
import { ProjectSelector } from '@/components/project/ProjectSelector';
import { useProjectContext } from '@/context/ProjectContext';
import { useNewAuth } from '@/context/NewAuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useScreeningSession } from '@/hooks/useScreeningSession';
import { useInterviewCoPilot } from '@/hooks/useInterviewCoPilot';
import { createDailyRoom } from '@/lib/firebase/functions/createDailyRoom';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Users,
  MessageSquare,
  Settings,
  Loader2,
  ChevronRight,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  VideoIcon,
  VideoOff,
  X,
  Maximize2,
  Minimize2,
  PanelRightOpen,
  PanelRightClose,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { InterviewPrepEnhanced } from '@/components/interview/InterviewPrepEnhanced';
import { InterviewDashboard } from '@/components/interview/InterviewDashboard';
import { QuestionSuggestions } from '@/components/interview/QuestionSuggestions';
import { InterviewChat } from '@/components/interview/InterviewChat';
import { ContextBar } from '@/components/context/ContextBar';
import { useContextIntegration } from '@/hooks/useContextIntegration';
import { InterviewContext, TranscriptEntry } from '@/types/interview';
import { Resizable } from 're-resizable';
import { InterviewGuidanceSidebar } from '@/components/interview/InterviewGuidanceSidebar';
import { CompetencySetup } from '@/components/interview/CompetencySetup';
import { useDailyTranscription } from '@/hooks/useDailyTranscription';
import { useInterviewGuidance } from '@/hooks/useInterviewGuidance';
import { useInterviewStore } from '@/stores/interviewStore';
import type { InterviewCompetency } from '@/types/interview';

type MeetingType = 'kickoff' | 'interview' | 'screening';

interface MeetingConfig {
  type: MeetingType;
  title: string;
  description: string;
  features: {
    fileUpload: boolean;
    urlCrawling: boolean;
    videoCall: boolean;
    interviewPrep: boolean;
    transcription: boolean;
    recording: boolean;
    coPilot: boolean;
  };
}

const meetingConfigs: Record<MeetingType, MeetingConfig> = {
  kickoff: {
    type: 'kickoff',
    title: 'Kickoff Meeting',
    description: 'Initial meeting to understand project requirements and goals',
    features: {
      fileUpload: true,
      urlCrawling: true,
      videoCall: true,
      interviewPrep: false,
      transcription: true,
      recording: true,
      coPilot: false,
    },
  },
  interview: {
    type: 'interview',
    title: 'Interview Session',
    description: 'AI-powered interview with real-time guidance and analysis',
    features: {
      fileUpload: true,
      urlCrawling: true,
      videoCall: true,
      interviewPrep: true,
      transcription: true,
      recording: true,
      coPilot: true,
    },
  },
  screening: {
    type: 'screening',
    title: 'Screening Call',
    description: 'Quick screening calls to evaluate candidates',
    features: {
      fileUpload: false,
      urlCrawling: false,
      videoCall: true,
      interviewPrep: false,
      transcription: true,
      recording: true,
      coPilot: false,
    },
  },
};

interface Participant {
  id: string;
  name?: string;
}

export default function MeetingEnhanced() {
  const navigate = useNavigate();
  const { user } = useNewAuth();
  const { selectedProjectId } = useProjectContext();
  const { sessionId } = useScreeningSession();

  // Meeting state
  const [meetingType, setMeetingType] = useState<MeetingType>('interview');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('setup');

  // Interview context
  const [interviewContext, setInterviewContext] = useState<InterviewContext | null>(null);
  const [competencies, setCompetencies] = useState<InterviewCompetency[]>([]);
  const [showGuidance, setShowGuidance] = useState(false);

  // Video call state
  const [callFrame, setCallFrame] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const startTimeRef = useRef<Date>(new Date());

  // Transcription
  const [whisperTranscript, setWhisperTranscript] = useState('');
  const transcriptionProcessor = TranscriptionProcessor();
  const meetingDataManager = MeetingDataManager(selectedProjectId);

  // UI state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDashboardMinimized, setIsDashboardMinimized] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  // WebSocket for real-time features
  useWebSocket(sessionId);

  // Interview store
  const { setContext: setInterviewStoreContext } = useInterviewStore();

  // Real-time transcription hook
  const { startTranscription, stopTranscription } = useDailyTranscription({
    callObject: callFrame,
    sessionId: sessionId || '',
    meetingId: interviewContext?.meetingId || '',
    enabled: isInMeeting && meetingType === 'interview' && !!callFrame,
    onTranscript: (speaker, text) => {
      console.log(`${speaker}: ${text}`);
    },
  });

  // Interview guidance hook
  const { updateContext: updateGuidanceContext } = useInterviewGuidance({
    sessionId: sessionId || '',
    meetingId: interviewContext?.meetingId || '',
    enabled: isInMeeting && meetingType === 'interview' && showGuidance,
  });

  const currentConfig = meetingConfigs[meetingType];

  // Context integration for file uploads, web scraping, and AI search
  const {
    processContent,
    sendToWebSocket,
    isProcessing: isContextProcessing,
    isWebSocketConnected
  } = useContextIntegration({
    context: 'meeting',
    sessionId: sessionId || undefined,
    enableRealTime: true
  });

  // Interview Co-Pilot hook
  const {
    session,
    addTranscriptEntry,
    updateCompetencyScore,
    generateQuestions,
    acceptSuggestion,
    dismissFlag,
    endInterview,
    isProcessing,
  } = useInterviewCoPilot({
    context: interviewContext!,
    sessionId: sessionId || '',
    onTranscriptionUpdate: (entry: TranscriptEntry) => {
      // Update local transcript display
      setWhisperTranscript(prev => prev + ' ' + entry.text);
    },
    onAnalysisUpdate: (analysis) => {
      // Analysis updates handled by the hook
    },
    onSuggestion: (suggestion) => {
      // Suggestions handled by the hook
    },
    onFlag: (flag) => {
      // Flags handled by the hook
    },
  });

  useEffect(() => {
    document.title = `Meeting Room - ${currentConfig.title} | Apply`;
    return () => {
      document.title = 'Apply';
    };
  }, [currentConfig]);

  const handleInterviewPrepComplete = (context: InterviewContext) => {
    setInterviewContext({
      ...context,
      projectId: selectedProjectId || '',
    });
    setMeetingTitle(`${context.position} - ${context.candidateName}`);
    toast.success('Interview preparation complete! You can now start the meeting.');
  };

  const startMeeting = async () => {
    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }

    if (!meetingTitle.trim()) {
      toast.error('Please enter a meeting title');
      return;
    }

    if (meetingType === 'interview' && !interviewContext) {
      toast.error('Please complete interview preparation first');
      return;
    }

    setIsLoading(true);
    try {
      // Create Daily room for the meeting
      const roomResponse = await createDailyRoom({
        projectId: selectedProjectId,
        meetingType,
        title: meetingTitle,
        userId: user?.uid
      });

      const roomUrl = roomResponse?.room?.url || roomResponse?.url;

      if (roomUrl) {
        console.log('Daily room created successfully:', roomUrl);

        // Update interview context with meeting ID if interview type
        if (meetingType === 'interview' && interviewContext) {
          // Use default competencies if none are set
          const finalCompetencies = competencies.length > 0 ? competencies : [
            {
              id: 'tech-1',
              name: 'Technical Skills',
              description: 'Core technical abilities required for the role',
              category: 'technical' as const,
              required: true,
              coverageLevel: 0
            },
            {
              id: 'tech-2',
              name: 'Problem Solving',
              description: 'Ability to analyze and solve complex problems',
              category: 'technical' as const,
              required: true,
              coverageLevel: 0
            },
            {
              id: 'behav-1',
              name: 'Communication',
              description: 'Clear and effective communication skills',
              category: 'behavioral' as const,
              required: true,
              coverageLevel: 0
            },
            {
              id: 'behav-2',
              name: 'Team Collaboration',
              description: 'Working effectively with team members',
              category: 'behavioral' as const,
              required: false,
              coverageLevel: 0
            }
          ];

          const updatedContext = {
            ...interviewContext,
            meetingId: roomResponse?.room?.id || roomUrl,
            sessionId: sessionId || '',
            jobRole: interviewContext.position,
            competencies: finalCompetencies,
            stage: 'intro' as const,
          };

          console.log('Interview context being set:', updatedContext);

          // Update store and guidance system
          setInterviewStoreContext(updatedContext);
          updateGuidanceContext(updatedContext);

          // Enable guidance for interviews
          setShowGuidance(true);
        }

        setIsInMeeting(true);
        setActiveTab('meeting');
        startTimeRef.current = new Date();
        toast.success('Meeting room created successfully!');
      } else {
        throw new Error('No room URL returned from API');
      }
    } catch (error) {
      console.error('Failed to start meeting:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start meeting');
    } finally {
      setIsLoading(false);
    }
  };

  const endMeeting = async () => {
    const endTime = new Date();

    try {
      // Stop transcription if active
      if (meetingType === 'interview') {
        await stopTranscription();
      }
      if (meetingType === 'interview' && interviewContext) {
        // Generate interview report
        const report = await endInterview();
        if (report) {
          toast.success('Interview report generated successfully');
        }
      } else {
        // Save regular meeting data
        await meetingDataManager.saveMeetingData({
          startTime: startTimeRef.current,
          endTime,
          participants,
          transcription: whisperTranscript,
          meetingType,
          title: meetingTitle,
        });
      }

      // Update session status if exists
      if (sessionId && db) {
        await updateDoc(doc(db, 'chatSessions', sessionId), {
          status: 'completed',
          endedAt: new Date().toISOString()
        });
      }

      toast.success('Meeting ended successfully');
      setIsInMeeting(false);
      setActiveTab('analysis');
    } catch (error) {
      console.error('Failed to end meeting:', error);
      toast.error('Failed to save meeting data');
    }
  };

  const handleTranscriptionUpdate = (text: string, speaker: 'interviewer' | 'candidate' = 'candidate') => {
    if (meetingType === 'interview' && interviewContext) {
      addTranscriptEntry(speaker, text);
    } else {
      (transcriptionProcessor as any).addTranscription(text);
      setWhisperTranscript(prev => prev + ' ' + text);
    }
  };

  const toggleMute = () => {
    if (callFrame) {
      callFrame.setLocalAudio(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (callFrame) {
      callFrame.setLocalVideo(!isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleRecording = () => {
    if (callFrame) {
      if (isRecording) {
        callFrame.stopRecording();
      } else {
        callFrame.startRecording();
      }
      setIsRecording(!isRecording);
    }
  };

  return (
    <div className="flex-1 overflow-hidden bg-gradient-to-br from-[#FFFBF4] to-white">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-white">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-[#8B5CF6] via-[#9B87F5] to-[#A18472] bg-clip-text text-transparent">
                Meeting Room
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {isInMeeting ? meetingTitle : 'AI-powered meetings with real-time assistance'}
              </p>
            </div>
            {!isInMeeting && <ProjectSelector />}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {!isInMeeting ? (
            // Setup View
            <div className="h-full overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto">
              {/* Meeting Type Selector */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {Object.values(meetingConfigs).map((config) => (
                  <Card
                    key={config.type}
                    className={cn(
                      "cursor-pointer transition-all duration-200 border-4 border-black",
                      "hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1",
                      meetingType === config.type
                        ? "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-purple-50"
                        : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    )}
                    onClick={() => setMeetingType(config.type)}
                  >
                    <div className="p-6">
                      <h3 className="font-bold text-xl mb-2">{config.title}</h3>
                      <p className="text-gray-600 text-sm mb-4">{config.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {config.features.videoCall && (
                          <Badge variant="secondary" className="bg-purple-100">
                            <Video className="w-3 h-3 mr-1" />
                            Video
                          </Badge>
                        )}
                        {config.features.coPilot && (
                          <Badge variant="secondary" className="bg-yellow-100">
                            AI Co-Pilot
                          </Badge>
                        )}
                        {config.features.transcription && (
                          <Badge variant="secondary" className="bg-blue-100">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Transcript
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Context Bar for uploads, scraping, and AI search */}
              <div className="mb-8">
                <ContextBar
                  context="meeting"
                  title="Meeting Context & Project"
                  description="Select a project and add context for your meeting through uploads, web scraping, or AI search"
                  onContentProcessed={async (content) => {
                    try {
                      // Process with orchestration
                      await processContent(content as any);

                      // Send to WebSocket for real-time processing if connected
                      if (isWebSocketConnected && sessionId) {
                        await sendToWebSocket(content);
                      }

                      // Add to uploaded files for display
                      setUploadedFiles(prev => [...prev, {
                        name: content.metadata?.filename || `${content.type} content`,
                        content: content.text,
                        type: content.type,
                        size: content.text.length,
                      }]);

                      toast.success(`${content.type} content processed and ready for meeting`);
                    } catch (error) {
                      console.error('Meeting context processing error:', error);
                    }
                  }}
                  projectSelectorProps={{
                    placeholder: "Select project for this meeting...",
                    className: "w-full max-w-md"
                  }}
                  showLabels={true}
                  size="default"
                  layout="stacked"
                />

                {/* Real-time status indicator */}
                {isWebSocketConnected && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Real-time AI processing enabled</span>
                  </div>
                )}
              </div>

              {/* Setup Content */}
              <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                {meetingType === 'interview' && currentConfig.features.interviewPrep ? (
                  <div className="p-6 space-y-6">
                    <InterviewPrepEnhanced onPrepComplete={handleInterviewPrepComplete} />

                    {/* Competency Setup for Interview Guidance */}
                    <div className="border-t-2 border-gray-200 pt-6">
                      <CompetencySetup
                        jobRole={interviewContext?.position || 'Software Engineer'}
                        onCompetenciesSet={(comps) => {
                          setCompetencies(comps);
                          toast.success(`${comps.length} competencies configured for interview guidance`);
                        }}
                        initialCompetencies={competencies}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Meeting Title</label>
                      <Input
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                        placeholder={`Enter ${currentConfig.title.toLowerCase()} title`}
                        className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      />
                    </div>

                    <Button
                      onClick={startMeeting}
                      disabled={!selectedProjectId || !meetingTitle.trim() || isLoading}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 
                               border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                               hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Starting Meeting...
                        </>
                      ) : (
                        <>
                          Start {currentConfig.title}
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <>
              {/* Meeting View */}
              <div className="h-full flex">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col">
                  {/* Video Area */}
                  <div className="flex-1 relative bg-gray-900">
                    {currentConfig.features.videoCall && (
                      <VideoCallFrame
                        onJoinMeeting={() => {
                          toast.success('Joined meeting successfully');
                        }}
                        onParticipantJoined={(p) => setParticipants(prev => [...prev, p])}
                        onParticipantLeft={(p) => {
                          setParticipants(prev => prev.filter(participant => participant.id !== p.id));
                        }}
                        onTranscriptionUpdate={(text: any) => handleTranscriptionUpdate(text)}
                        onCallFrameCreated={setCallFrame}
                      />
                    )}

                    {/* Meeting Controls */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                                  bg-white rounded-full border-2 border-black 
                                  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-2">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={toggleMute}
                          variant={isMuted ? "destructive" : "default"}
                          size="icon"
                          className="rounded-full"
                        >
                          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </Button>
                        <Button
                          onClick={toggleVideo}
                          variant={isVideoOff ? "destructive" : "default"}
                          size="icon"
                          className="rounded-full"
                        >
                          {isVideoOff ? <VideoOff className="w-4 h-4" /> : <VideoIcon className="w-4 h-4" />}
                        </Button>
                        {currentConfig.features.recording && (
                          <Button
                            onClick={toggleRecording}
                            variant={isRecording ? "destructive" : "default"}
                            size="icon"
                            className="rounded-full"
                          >
                            <div className={cn(
                              "w-3 h-3 rounded-full",
                              isRecording ? "bg-white animate-pulse" : "bg-red-500"
                            )} />
                          </Button>
                        )}
                        {meetingType !== 'interview' && (
                          <Button
                            onClick={() => setIsChatOpen(!isChatOpen)}
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        )}
                        {meetingType === 'interview' && (
                          <Button
                            onClick={() => setShowGuidance(!showGuidance)}
                            variant={showGuidance ? "secondary" : "outline"}
                            size="icon"
                            className="rounded-full"
                            title="Toggle AI Interview Guidance"
                          >
                            <Brain className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          onClick={endMeeting}
                          variant="destructive"
                          className="rounded-full px-4"
                        >
                          <PhoneOff className="w-4 h-4 mr-2" />
                          End Meeting
                        </Button>
                      </div>
                    </div>

                    {/* Participants List */}
                    {participants.length > 0 && (
                      <div className="absolute top-4 right-4 bg-white rounded-lg border-2 border-black 
                                    shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4" />
                          <span className="font-medium text-sm">Participants ({participants.length})</span>
                        </div>
                        <div className="space-y-1">
                          {participants.map((p) => (
                            <div key={p.id} className="text-sm text-gray-600">
                              {p.name || 'Anonymous'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dashboard Toggle */}
                    {meetingType === 'interview' && currentConfig.features.coPilot && (
                      <div className="absolute top-4 left-4">
                        <Button
                          onClick={() => setIsDashboardMinimized(!isDashboardMinimized)}
                          variant="outline"
                          size="icon"
                          className="bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                          {isDashboardMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Interview Dashboard (Bottom) */}
                  {meetingType === 'interview' && currentConfig.features.coPilot && interviewContext && (
                    <div className={cn(
                      "border-t bg-white transition-all duration-300",
                      isDashboardMinimized ? "h-20" : "h-80"
                    )}>
                      <div className="h-full p-4 overflow-y-auto">
                        <InterviewDashboard
                          session={session}
                          context={interviewContext}
                          onSuggestionAccept={acceptSuggestion}
                          onFlagAction={dismissFlag}
                          isMinimized={isDashboardMinimized}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                {meetingType === 'interview' && currentConfig.features.coPilot && interviewContext && (
                  <Resizable
                    defaultSize={{ width: isSidebarCollapsed ? 60 : 400, height: '100%' }}
                    minWidth={isSidebarCollapsed ? 60 : 300}
                    maxWidth={600}
                    enable={{ left: !isSidebarCollapsed }}
                    className={cn(
                      "border-l bg-white transition-all duration-300",
                      isSidebarCollapsed && "w-[60px]"
                    )}
                  >
                    <div className="h-full flex flex-col">
                      <div className="p-4 border-b flex items-center justify-between">
                        {!isSidebarCollapsed && (
                          <h3 className="font-bold">AI Assistant</h3>
                        )}
                        <Button
                          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                          variant="ghost"
                          size="icon"
                        >
                          {isSidebarCollapsed ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
                        </Button>
                      </div>
                      {!isSidebarCollapsed && (
                        <div className="flex-1 overflow-hidden p-4">
                          <QuestionSuggestions
                            suggestions={session.suggestions}
                            competencies={interviewContext.companyRubric?.competencies || []}
                            currentCategory="general"
                            onQuestionSelect={(question) => {
                              toast.info('Question copied to clipboard');
                            }}
                            onGenerateMore={generateQuestions}
                            isGenerating={isProcessing}
                          />
                        </div>
                      )}
                    </div>
                  </Resizable>
                )}

              </div>

              {/* Interview Guidance Sidebar */}
              {meetingType === 'interview' && showGuidance && (
                <InterviewGuidanceSidebar
                  defaultExpanded={true}
                  className="z-40"
                />
              )}
            </>
          )}
        </div>

        {/* Chat Sheet */}
        {isInMeeting && (
          <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Meeting Chat</SheetTitle>
              </SheetHeader>
              <div className="h-full flex flex-col pt-4">
                <InterviewChat />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div >
  );
}
