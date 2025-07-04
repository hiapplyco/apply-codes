import React, { useState, useRef, useEffect } from 'react';
import { VideoCallFrame } from '@/components/video/VideoCallFrame';
import { ProjectSelector } from '@/components/project/ProjectSelector';
import { useProjectContext } from '@/context/ProjectContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DocumentProcessor } from '@/lib/documentProcessing';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  Users, 
  MessageSquare, 
  Loader2,
  ChevronRight,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  VideoIcon,
  VideoOff,
  FileText,
  Link,
  Plus,
  AlertCircle,
  Sparkles,
  CheckCircle,
  ArrowRight
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
  const navigate = useNavigate();
  const { selectedProjectId } = useProjectContext();
  
  // Meeting state
  const [meetingStep, setMeetingStep] = useState<'welcome' | 'setup' | 'meeting'>('welcome');
  const [meetingPurpose, setMeetingPurpose] = useState<'interview' | 'kickoff' | 'other'>('interview');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Interview context
  const [interviewContext, setInterviewContext] = useState<InterviewContext | null>(null);
  
  // Video call state
  const [callFrame, setCallFrame] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
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
        userId: user.id,
        onProgress: (status) => {
          console.log('Processing status:', status);
        },
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
    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }

    if (meetingPurpose === 'interview' && !jobTitle) {
      toast.error('Please enter a job title');
      return;
    }

    setIsLoading(true);
    
    // Simulate meeting setup
    setTimeout(() => {
      setMeetingStep('meeting');
      setIsLoading(false);
      toast.success('Meeting started successfully!');
    }, 1500);
  };

  const endMeeting = () => {
    setMeetingStep('welcome');
    setJobTitle('');
    setJobDescription('');
    setResumeFile(null);
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
      <div className="flex-1 flex flex-col bg-gradient-to-br from-purple-50 to-white rounded-lg overflow-auto">
        <div className="max-w-4xl mx-auto p-8 w-full">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Video className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Welcome to Meeting Room</h1>
            <p className="text-xl text-gray-600">
              AI-powered meetings that help you make better hiring decisions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card 
              className={cn(
                "cursor-pointer border-2 transition-all",
                meetingPurpose === 'interview' 
                  ? "border-purple-600 shadow-[4px_4px_0px_0px_rgba(147,51,234,1)]" 
                  : "border-gray-200 hover:border-purple-300"
              )}
              onClick={() => setMeetingPurpose('interview')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Interview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Conduct structured interviews with AI-powered guidance and real-time insights
                </p>
              </CardContent>
            </Card>

            <Card 
              className={cn(
                "cursor-pointer border-2 transition-all",
                meetingPurpose === 'kickoff' 
                  ? "border-purple-600 shadow-[4px_4px_0px_0px_rgba(147,51,234,1)]" 
                  : "border-gray-200 hover:border-purple-300"
              )}
              onClick={() => setMeetingPurpose('kickoff')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Kickoff Call
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Understand hiring needs and build effective job requirements
                </p>
              </CardContent>
            </Card>

            <Card 
              className={cn(
                "cursor-pointer border-2 transition-all",
                meetingPurpose === 'other' 
                  ? "border-purple-600 shadow-[4px_4px_0px_0px_rgba(147,51,234,1)]" 
                  : "border-gray-200 hover:border-purple-300"
              )}
              onClick={() => setMeetingPurpose('other')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-600" />
                  General Meeting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Any other recruitment-related meeting or discussion
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button
              onClick={() => setMeetingStep('setup')}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg font-semibold 
                       border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                       hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform hover:translate-x-[2px] 
                       hover:translate-y-[2px] transition-all"
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
      <div className="flex-1 flex flex-col bg-gradient-to-br from-purple-50 to-white rounded-lg overflow-auto">
        <div className="max-w-3xl mx-auto p-8 w-full">
          <div className="mb-8">
            <Button
              onClick={() => setMeetingStep('welcome')}
              variant="ghost"
              className="mb-4"
            >
              ← Back
            </Button>
            
            <h1 className="text-3xl font-bold mb-2">
              {meetingPurpose === 'interview' && 'Interview Setup'}
              {meetingPurpose === 'kickoff' && 'Kickoff Call Setup'}
              {meetingPurpose === 'other' && 'Meeting Setup'}
            </h1>
            <p className="text-gray-600">
              Let's gather some information to make your meeting more productive
            </p>
          </div>

          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardContent className="p-6 space-y-6">
              {/* Project Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Project <span className="text-red-500">*</span>
                </label>
                <ProjectSelector />
                {!selectedProjectId && (
                  <p className="text-sm text-orange-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Please select a project to continue
                  </p>
                )}
              </div>

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
                      className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
                      className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Candidate Resume (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-500 transition-colors">
                      <input
                        type="file"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        className="hidden"
                        id="resume-upload"
                        accept=".pdf,.doc,.docx,.txt"
                        disabled={isLoading}
                      />
                      <label htmlFor="resume-upload" className="cursor-pointer">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-purple-600 font-medium">
                          {isLoading ? 'Processing...' : 'Click to upload resume'}
                        </p>
                        {resumeFile && (
                          <Badge variant="secondary" className="mt-2">
                            {resumeFile.name}
                          </Badge>
                        )}
                      </label>
                    </div>
                  </div>
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
                    className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
              )}

              <Alert className="border-2 border-green-400 bg-green-50">
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
                onClick={startMeeting}
                disabled={!selectedProjectId || (meetingPurpose === 'interview' && !jobTitle) || isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 text-lg font-semibold 
                         border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                         hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform hover:translate-x-[2px] 
                         hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Meeting View
  return (
    <div className="flex-1 flex flex-col bg-gray-900 rounded-lg overflow-hidden">
      {/* Video Area */}
      <VideoCallFrame
        onJoinMeeting={() => {
          toast.success('Joined meeting successfully');
        }}
        onParticipantJoined={setParticipants}
        onParticipantLeft={(p) => {
          setParticipants(prev => prev.filter(participant => participant.id !== p.id));
        }}
        onTranscriptionUpdate={(text) => console.log('Transcription:', text)}
        onCallFrameCreated={setCallFrame}
      />

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

      {/* Meeting Info */}
      <div className="absolute top-4 left-4 bg-white rounded-lg border-2 border-black 
                    shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3">
        <div className="text-sm font-medium">
          {meetingPurpose === 'interview' ? `Interview: ${jobTitle}` : jobTitle || 'Meeting'}
        </div>
        <div className="text-xs text-gray-600 mt-1">
          AI Assistant Active
        </div>
      </div>
    </div>
  );
}