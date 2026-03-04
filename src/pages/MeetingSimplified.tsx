import { useState, useEffect } from 'react';
import { VideoCallFrame } from '@/components/video/VideoCallFrame';
import { useProjectContext } from '@/context/ProjectContext';
import { useNewAuth } from '@/context/NewAuthContext';
import { functionBridge } from '@/lib/function-bridge';
import { toast } from 'sonner';
import { DocumentProcessor } from '@/lib/documentProcessing';
import { ContextBar } from '@/components/context/ContextBar';
import { useContextIntegration } from '@/hooks/useContextIntegration';
import { InterviewContext } from '@/types/interview';
import { dailySingleton } from '@/lib/dailySingleton';
import { trackVideoMeeting, trackEvent } from '@/lib/analytics';
import {
  Video,
  Users,
  MessageSquare,
  Loader2,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  VideoIcon,
  VideoOff,
  FileText,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Folder,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface Participant {
  id: string;
  name?: string;
}

export default function MeetingSimplified() {
  const { user } = useNewAuth();
  const { selectedProjectId, selectedProject } = useProjectContext();

  // Meeting state
  const [meetingStep, setMeetingStep] = useState<'welcome' | 'setup' | 'meeting'>('welcome');
  const [meetingPurpose, setMeetingPurpose] = useState<'interview' | 'kickoff' | 'other'>('interview');
  const [showContext, setShowContext] = useState(false);

  // Clean up Daily instance on unmount if in meeting view
  useEffect(() => {
    return () => {
      if (meetingStep === 'meeting') {
        dailySingleton.destroyCallFrame();
      }
    };
  }, [meetingStep]);
  
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [roomUrl, setRoomUrl] = useState<string>('');
  
  // Interview context
  const [interviewContext, setInterviewContext] = useState<InterviewContext | null>(null);
  
  // Video call state
  const [callFrame, setCallFrame] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Context integration for file uploads, web scraping, and AI search
  const {
    processContent,
    sendToWebSocket,
    isProcessing: isContextProcessing,
    isWebSocketConnected
  } = useContextIntegration({
    context: 'meeting',
    enableRealTime: true
  });

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    try {
      if (!user) {
        toast.error('Please sign in to upload files');
        return;
      }

      // Validate file
      const validation = DocumentProcessor.validateFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid file type');
        return;
      }

      setIsLoading(true);

      await DocumentProcessor.processDocument({
        file,
        userId: user.uid,
        onProgress: () => {},
        onComplete: (content) => {
          setResumeFile(file);
          toast.success('Resume uploaded and processed successfully!');
        },
        onError: (error) => {
          throw new Error(error);
        }
      });

    } catch (error) {
      console.error('Error processing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file. Please try again.';
      if (errorMessage.includes('size') || errorMessage.includes('20MB')) {
        toast.error('File too large. Please use a file smaller than 20MB.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startMeeting = async () => {
    if (meetingPurpose === 'interview' && !jobTitle.trim()) {
      toast.error('Please enter a job title');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await functionBridge.createDailyRoom({
        projectId: selectedProjectId || null,
        meetingType: meetingPurpose,
        title: jobTitle || 'Meeting',
        userId: user?.uid
      });

      const dailyUrl = response?.room?.url || response?.url;

      if (dailyUrl) {
        setRoomUrl(dailyUrl);
        setMeetingStep('meeting');
        toast.success('Meeting room created successfully!');
        
        // Track meeting start
        const meetingId = dailyUrl.split('/').pop() || 'unknown';
        trackVideoMeeting('start', meetingId);
        trackEvent('Video Meeting', {
          action: 'start',
          meetingType: meetingPurpose,
          hasProject: selectedProjectId ? 1 : 0
        });
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
    // Track meeting end
    if (roomUrl) {
      const meetingId = roomUrl.split('/').pop() || 'unknown';
      trackVideoMeeting('end', meetingId);
      trackEvent('Video Meeting', {
        action: 'end',
        meetingType: meetingPurpose
      });
    }
    
    // Destroy the Daily instance when ending the meeting
    await dailySingleton.destroyCallFrame();
    
    setMeetingStep('welcome');
    setJobTitle('');
    setJobDescription('');
    setResumeFile(null);
    setRoomUrl('');
    toast.success('Meeting ended');
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
        toast.success('Recording stopped');
      } else {
        callFrame.startRecording();
        toast.success('Recording started');
      }
      setIsRecording(!isRecording);
    }
  };

  if (meetingStep === 'welcome') {
    return (
      <div className="flex-1 flex flex-col bg-background rounded-lg overflow-auto">
        <div className="max-w-4xl mx-auto p-4 sm:p-8 w-full">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Video className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold mb-4">Welcome to Meeting Room</h1>
            <p className="text-base sm:text-xl text-muted-foreground">
              AI-powered meetings that help you make better hiring decisions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card 
              className={cn(
                "cursor-pointer border-2 transition-all",
                meetingPurpose === 'interview'
                  ? "border-primary ring-1 ring-primary"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => setMeetingPurpose('interview')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Interview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Conduct structured interviews with AI-powered guidance and real-time insights
                </p>
              </CardContent>
            </Card>

            <Card 
              className={cn(
                "cursor-pointer border-2 transition-all",
                meetingPurpose === 'kickoff'
                  ? "border-primary ring-1 ring-primary"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => setMeetingPurpose('kickoff')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-info" />
                  Kickoff Call
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Understand hiring needs and build effective job requirements
                </p>
              </CardContent>
            </Card>

            <Card 
              className={cn(
                "cursor-pointer border-2 transition-all",
                meetingPurpose === 'other'
                  ? "border-primary ring-1 ring-primary"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => setMeetingPurpose('other')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-success" />
                  General Meeting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Any other recruitment-related meeting or discussion
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button
              onClick={() => setMeetingStep('setup')}
              size="lg"
              className="px-6 py-4 sm:px-8 sm:py-6 text-base sm:text-lg font-semibold"
            >
              Continue
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (meetingStep === 'setup') {
    return (
      <div className="flex-1 flex flex-col bg-background rounded-lg overflow-auto">
        <div className="max-w-3xl mx-auto p-6 w-full">
          <div className="mb-6">
            <Button
              onClick={() => setMeetingStep('welcome')}
              variant="ghost"
              className="mb-4"
            >
              ← Back
            </Button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {meetingPurpose === 'interview' && 'Interview Setup'}
                  {meetingPurpose === 'kickoff' && 'Kickoff Call Setup'}
                  {meetingPurpose === 'other' && 'Meeting Setup'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Configure your meeting settings
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowContext(!showContext)}
                className={`flex items-center gap-2 ${
                  selectedProject || uploadedFiles.length > 0
                    ? 'bg-success/10 text-success border-success/30'
                    : ''
                }`}
              >
                <Folder className="w-4 h-4" />
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {selectedProject?.name || (uploadedFiles.length > 0 ? 'Context Added' : 'Add Context')}
                </span>
                {showContext ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          {/* Collapsible Context Section */}
          {showContext && (
            <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
              <ContextBar
                context="meeting"
                title=""
                description=""
                onContentProcessed={async (content) => {
                  try {
                    await processContent(content);
                    setUploadedFiles(prev => [...prev, {
                      name: content.metadata?.filename || `${content.type} content`,
                      content: content.text,
                      type: content.type,
                      size: content.text.length,
                    }]);
                    toast.success(`${content.type} content added`);
                    setShowContext(false);
                  } catch (error) {
                    console.error('Meeting context processing error:', error);
                  }
                }}
                projectSelectorProps={{
                  placeholder: "Select project...",
                  className: "w-full"
                }}
                showLabels={true}
                layout="stacked"
                className="border-0 shadow-none p-0 mb-0"
              />

              {isWebSocketConnected && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Real-time AI processing enabled</span>
                </div>
              )}
            </div>
          )}

          <Card className="border border-gray-200 rounded-lg">
            <CardContent className="p-6 space-y-6">

              {/* Job Title (for interviews) */}
              {meetingPurpose === 'interview' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g., Senior Software Engineer"
                      className="border border-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Job Description (Optional)
                    </label>
                    <Textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the job description here for AI-powered insights..."
                      rows={4}
                      className="border border-gray-300"
                    />
                  </div>

                  {/* Show uploaded files from context */}
                  {uploadedFiles.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Uploaded Content
                      </label>
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                            <FileText className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium">{file.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {file.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Meeting Title (for other types) */}
              {meetingPurpose !== 'interview' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Meeting Title
                  </label>
                  <Input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Initial Requirements Discussion"
                    className="border border-gray-300"
                  />
                </div>
              )}

              <Alert className="border border-green-200 bg-green-50">
                <Sparkles className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <strong>AI Assistant Ready!</strong> Your meeting will have real-time AI support for:
                  <ul className="mt-2 space-y-1 text-sm">
                    <li className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      Intelligent question suggestions
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      Real-time transcription
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      Meeting insights and analysis
                    </li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => startMeeting()}
                disabled={(meetingPurpose === 'interview' && !jobTitle.trim()) || isLoading || isContextProcessing}
                className="w-full py-3 font-medium disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Starting Meeting...
                  </>
                ) : (
                  <>
                    Start Meeting
                    <Video className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
              
              {/* Helpful validation message */}
              {meetingPurpose === 'interview' && !jobTitle.trim() && (
                <p className="text-sm text-muted-foreground mt-3 text-center">
                  Please enter a job title to continue
                </p>
              )}
              {selectedProjectId && (
                <p className="text-sm text-green-600 mt-3 text-center">
                  Meeting will be saved to project: <strong>{selectedProject?.name}</strong>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Meeting View
  return (
    <div className="flex-1 flex flex-col bg-gray-900 rounded-lg overflow-hidden relative min-h-[100dvh] lg:min-h-0 lg:h-full">
      {/* Video Area */}
      <VideoCallFrame
        roomUrl={roomUrl}
        onJoinMeeting={() => {
          toast.success('Joined meeting successfully');
        }}
        onParticipantJoined={setParticipants}
        onParticipantLeft={(p) => {
          setParticipants(prev => prev.filter(participant => participant.id !== p.id));
        }}
        onLeaveMeeting={() => {}}
        onRecordingStarted={() => {}}
        onCallFrameReady={setCallFrame}
      />

      {/* Meeting Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2
                    bg-card rounded-full border shadow-lg p-1.5 sm:p-2 max-w-[95vw]">
        <div className="flex items-center gap-1.5 sm:gap-2">
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
        <div className="absolute top-16 right-2 sm:top-4 sm:right-4 bg-card rounded-lg border shadow-lg p-2 sm:p-3 max-w-[45vw] sm:max-w-none">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4" />
            <span className="font-medium text-sm">Participants ({participants.length})</span>
          </div>
          <div className="space-y-1">
            {participants.map((p) => (
              <div key={p.id} className="text-sm text-muted-foreground">
                {p.name || 'Anonymous'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meeting Info */}
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-card rounded-lg border shadow-lg p-2 sm:p-3 max-w-[45vw] sm:max-w-none">
        <div className="text-sm font-medium">
          {meetingPurpose === 'interview' ? `Interview: ${jobTitle}` : jobTitle || 'Meeting'}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          AI Assistant Active
        </div>
      </div>
    </div>
  );
}