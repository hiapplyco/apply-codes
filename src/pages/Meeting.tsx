import React, { useState, useRef, useEffect } from 'react';
import { VideoCallFrame } from '@/components/video/VideoCallFrame';
import { TranscriptionProcessor } from '@/components/video/TranscriptionProcessor';
import { MeetingDataManager } from '@/components/video/MeetingDataManager';
import { ProjectSelector } from '@/components/project/ProjectSelector';
import { useProjectContext } from '@/context/ProjectContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useScreeningSession } from '@/hooks/useScreeningSession';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  Users, 
  FileText, 
  Globe, 
  MessageSquare, 
  Settings,
  Loader2,
  Upload,
  Link,
  ChevronRight,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  VideoIcon,
  VideoOff,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FirecrawlService } from '@/utils/FirecrawlService';

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
    },
  },
  interview: {
    type: 'interview',
    title: 'Interview Session',
    description: 'Conduct structured interviews with candidates',
    features: {
      fileUpload: true,
      urlCrawling: false,
      videoCall: true,
      interviewPrep: true,
      transcription: true,
      recording: true,
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
    },
  },
};

interface UploadedFile {
  name: string;
  content: string;
  type: string;
  size: number;
}

interface Participant {
  id: string;
  name?: string;
}

export default function Meeting() {
  const navigate = useNavigate();
  const { selectedProjectId } = useProjectContext();
  const { sessionId } = useScreeningSession();
  const firecrawlService = new FirecrawlService();
  
  // Meeting state
  const [meetingType, setMeetingType] = useState<MeetingType>('kickoff');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('setup');
  
  // File and URL state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [urls, setUrls] = useState<string[]>(['']);
  const [crawlingUrl, setCrawlingUrl] = useState<string | null>(null);
  
  // Video call state
  const [callFrame, setCallFrame] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const startTimeRef = useRef<Date>(new Date());
  
  // Transcription and chat
  const [whisperTranscript, setWhisperTranscript] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const transcriptionProcessor = TranscriptionProcessor();
  const meetingDataManager = MeetingDataManager(selectedProjectId);
  
  // WebSocket for real-time features
  useWebSocket(sessionId);
  
  const currentConfig = meetingConfigs[meetingType];

  useEffect(() => {
    document.title = `Meeting Room - ${currentConfig.title} | Apply`;
    return () => {
      document.title = 'Apply';
    };
  }, [currentConfig]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          content,
          type: file.type,
          size: file.size,
        }]);
        
        // Suggest title from filename
        if (!meetingTitle && uploadedFiles.length === 0) {
          const suggestedTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setMeetingTitle(suggestedTitle);
        }
      };
      reader.readAsText(file);
    });
  };

  const handleUrlAdd = () => {
    setUrls([...urls, '']);
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleUrlRemove = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const crawlUrl = async (url: string) => {
    if (!url.trim()) return;
    
    setCrawlingUrl(url);
    try {
      const content = await firecrawlService.crawlWebsite(url);
      if (content) {
        setUploadedFiles(prev => [...prev, {
          name: new URL(url).hostname,
          content,
          type: 'text/html',
          size: content.length,
        }]);
        toast.success('URL content extracted successfully');
      }
    } catch (error) {
      console.error('Failed to crawl URL:', error);
      toast.error('Failed to extract content from URL');
    } finally {
      setCrawlingUrl(null);
    }
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

    setIsLoading(true);
    try {
      // Process kickoff data if applicable
      if (meetingType === 'kickoff' && uploadedFiles.length > 0) {
        const { data, error } = await supabase.functions.invoke('process-kickoff-call', {
          body: {
            title: meetingTitle,
            files: uploadedFiles.map(f => ({ name: f.name, content: f.content })),
            projectId: selectedProjectId,
          },
        });

        if (error) throw error;
        toast.success('Kickoff materials processed successfully');
      }

      setIsInMeeting(true);
      setActiveTab('meeting');
      startTimeRef.current = new Date();
    } catch (error) {
      console.error('Failed to start meeting:', error);
      toast.error('Failed to start meeting');
    } finally {
      setIsLoading(false);
    }
  };

  const endMeeting = async () => {
    const endTime = new Date();
    
    try {
      // Save meeting data
      await meetingDataManager.saveMeetingData({
        startTime: startTimeRef.current,
        endTime,
        participants,
        transcription: whisperTranscript,
        meetingType,
        title: meetingTitle,
      });

      // Update session status if exists
      if (sessionId) {
        await supabase
          .from('chat_sessions')
          .update({ status: 'completed' })
          .eq('id', sessionId);
      }

      toast.success('Meeting ended and data saved successfully');
      setIsInMeeting(false);
      setActiveTab('analysis');
    } catch (error) {
      console.error('Failed to end meeting:', error);
      toast.error('Failed to save meeting data');
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
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#FFFBF4] to-white">
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-[#8B5CF6] via-[#9B87F5] to-[#A18472] bg-clip-text text-transparent mb-2">
            Meeting Room
          </h1>
          <p className="text-lg text-gray-600">
            All-in-one space for kickoffs, interviews, and screening calls
          </p>
        </div>

        {/* Project Selector */}
        <div className="mb-6">
          <ProjectSelector />
        </div>

        {/* Meeting Type Selector */}
        {!isInMeeting && (
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
                    {config.features.fileUpload && (
                      <Badge variant="secondary" className="bg-green-100">
                        <FileText className="w-3 h-3 mr-1" />
                        Files
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
        )}

        {/* Main Content Area */}
        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="setup" disabled={isInMeeting}>Setup</TabsTrigger>
              <TabsTrigger value="meeting" disabled={!isInMeeting}>Meeting</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>

            {/* Setup Tab */}
            <TabsContent value="setup" className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Meeting Title</label>
                  <Input
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder={`Enter ${currentConfig.title.toLowerCase()} title`}
                    className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>

                {/* File Upload Section */}
                {currentConfig.features.fileUpload && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Upload Files</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.doc,.docx,.txt,.rtf,.odt"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Click to upload files
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, DOC, DOCX, TXT, RTF, ODT
                      </p>
                    </div>

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-black"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-purple-600" />
                              <span className="text-sm font-medium">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <button
                              onClick={() => setUploadedFiles(files => files.filter((_, i) => i !== index))}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* URL Crawling Section */}
                {currentConfig.features.urlCrawling && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Add URLs</label>
                    <div className="space-y-2">
                      {urls.map((url, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={url}
                            onChange={(e) => handleUrlChange(index, e.target.value)}
                            placeholder="https://example.com"
                            className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          />
                          <Button
                            onClick={() => crawlUrl(url)}
                            disabled={!url.trim() || crawlingUrl === url}
                            className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          >
                            {crawlingUrl === url ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Globe className="w-4 h-4" />
                            )}
                          </Button>
                          {urls.length > 1 && (
                            <Button
                              onClick={() => handleUrlRemove(index)}
                              variant="destructive"
                              size="icon"
                              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        onClick={handleUrlAdd}
                        variant="outline"
                        className="w-full border-2 border-dashed border-gray-300 hover:border-purple-500"
                      >
                        <Link className="w-4 h-4 mr-2" />
                        Add Another URL
                      </Button>
                    </div>
                  </div>
                )}


                {/* Start Meeting Button */}
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
            </TabsContent>

            {/* Meeting Tab */}
            <TabsContent value="meeting" className="p-0">
              {isInMeeting && (
                <div className="relative">
                  {/* Video Call Frame */}
                  {currentConfig.features.videoCall && (
                    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                      <VideoCallFrame
                        onJoinMeeting={() => {
                          toast.success('Joined meeting successfully');
                        }}
                        onParticipantJoined={setParticipants}
                        onParticipantLeft={(p) => {
                          setParticipants(prev => prev.filter(participant => participant.id !== p.id));
                        }}
                        onTranscriptionUpdate={(text) => {
                          transcriptionProcessor.addTranscription(text);
                          setWhisperTranscript(prev => prev + ' ' + text);
                        }}
                        onCallFrameCreated={setCallFrame}
                      />
                    </div>
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
                      <Button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                      >
                        <MessageSquare className="w-4 h-4" />
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
                </div>
              )}
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent value="analysis" className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-4">Meeting Analysis</h3>
                  <p className="text-gray-600">
                    Analysis and insights from your meeting will appear here after the meeting ends.
                  </p>
                </div>

                {whisperTranscript && (
                  <div>
                    <h4 className="font-medium mb-2">Transcript Preview</h4>
                    <div className="bg-gray-50 rounded-lg p-4 border-2 border-black">
                      <p className="text-sm text-gray-700 line-clamp-4">
                        {whisperTranscript}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Chat Sheet */}
        {isInMeeting && meetingType === 'interview' && (
          <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Interview Assistant</SheetTitle>
              </SheetHeader>
              <div className="h-full flex flex-col pt-4">
                <InterviewChat />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  );
}