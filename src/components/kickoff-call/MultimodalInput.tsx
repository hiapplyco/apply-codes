import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Upload, 
  FileAudio,
  FileVideo,
  FileText,
  X
} from 'lucide-react';

interface MultimodalInputProps {
  onFileUpload: (file: File) => void;
  onAudioCapture: (audioBlob: Blob) => void;
  onVideoCapture: (videoBlob: Blob) => void;
  onTranscription?: (text: string) => void;
  acceptedFileTypes?: string[];
}

export const MultimodalInput = ({
  onFileUpload,
  onAudioCapture,
  onVideoCapture,
  onTranscription,
  acceptedFileTypes = ['.pdf', '.docx', '.txt', '.mp3', '.mp4', '.wav', '.webm']
}: MultimodalInputProps) => {
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = useCallback(async (includeVideo: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: includeVideo
      });
      
      streamRef.current = stream;
      
      if (includeVideo && videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      const mimeType = includeVideo ? 'video/webm' : 'audio/webm';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (includeVideo) {
          onVideoCapture(blob);
        } else {
          onAudioCapture(blob);
        }
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };
      
      mediaRecorder.start();
      
      if (includeVideo) {
        setIsRecordingVideo(true);
      } else {
        setIsRecordingAudio(true);
      }
      
      // Start duration timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Failed to access camera/microphone. Please check permissions.');
    }
  }, [onAudioCapture, onVideoCapture]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setIsRecordingAudio(false);
      setIsRecordingVideo(false);
      setRecordingDuration(0);
    }
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simulate upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
      
      onFileUpload(file);
      
      setTimeout(() => {
        setUploadProgress(0);
        toast.success(`${file.name} uploaded successfully`);
      }, 1500);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Multimodal Input</h3>
      
      {/* File Upload */}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
        {uploadProgress > 0 && uploadProgress < 100 && (
          <Progress value={uploadProgress} className="h-2" />
        )}
      </div>

      {/* Audio Recording */}
      <div className="space-y-2">
        <Button
          variant={isRecordingAudio ? "destructive" : "outline"}
          className="w-full"
          onClick={() => isRecordingAudio ? stopRecording() : startRecording(false)}
          disabled={isRecordingVideo}
        >
          {isRecordingAudio ? (
            <>
              <MicOff className="mr-2 h-4 w-4" />
              Stop Audio Recording ({formatDuration(recordingDuration)})
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Record Audio
            </>
          )}
        </Button>
      </div>

      {/* Video Recording */}
      <div className="space-y-2">
        <Button
          variant={isRecordingVideo ? "destructive" : "outline"}
          className="w-full"
          onClick={() => isRecordingVideo ? stopRecording() : startRecording(true)}
          disabled={isRecordingAudio}
        >
          {isRecordingVideo ? (
            <>
              <VideoOff className="mr-2 h-4 w-4" />
              Stop Video Recording ({formatDuration(recordingDuration)})
            </>
          ) : (
            <>
              <Video className="mr-2 h-4 w-4" />
              Record Video
            </>
          )}
        </Button>
        
        {isRecordingVideo && (
          <div className="relative rounded-lg overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-64 object-cover"
            />
            <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-sm">
              REC • {formatDuration(recordingDuration)}
            </div>
          </div>
        )}
      </div>

      {/* File Type Icons Legend */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p className="font-medium">Supported file types:</p>
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" /> Documents
          </span>
          <span className="flex items-center gap-1">
            <FileAudio className="h-3 w-3" /> Audio
          </span>
          <span className="flex items-center gap-1">
            <FileVideo className="h-3 w-3" /> Video
          </span>
        </div>
      </div>
    </Card>
  );
};