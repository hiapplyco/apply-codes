
import { useEffect, useRef, useState } from "react";
import { DailyCall, DailyEventObjectFatalError } from "@daily-co/daily-js";
import { VideoPreviewProps } from "./types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { dailySingleton } from "@/lib/dailySingleton";

export const VideoPreview = ({ onCallFrameReady, roomUrl }: VideoPreviewProps) => {
  const callWrapperRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  // Track component mount state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    if (!callWrapperRef.current) return;
    
    // If we don't have a room URL yet, don't try to initialize the call frame
    if (!roomUrl) {
      console.log("No room URL provided, waiting for URL");
      setIsLoading(true);
      return;
    }

    console.log("Initializing Daily call frame with URL:", roomUrl);

    const initializeCallFrame = async () => {
      try {
        setIsLoading(true);
        
        // Ensure component is still mounted before creating frame
        if (!mountedRef.current || !callWrapperRef.current || isCancelled) {
          console.log("Component unmounted or wrapper not ready, skipping frame creation");
          return;
        }

        // Use singleton to create or get the Daily frame
        const frame = await dailySingleton.getOrCreateCallFrame(
          callWrapperRef.current,
          roomUrl
        );

        if (isCancelled) {
          console.log("Component unmounted during frame creation, skipping setup");
          return;
        }

        console.log("Daily frame ready, setting up event handlers...");
        
        frame.on('camera-error', () => {
          toast.error('Unable to access camera. Please check your permissions.');
        });

        frame.on('error', (event: DailyEventObjectFatalError) => {
          console.error('Daily.co error:', event);
          toast.error('An error occurred while connecting to the video call.');
        });

        frame.on('joining-meeting', () => {
          console.log('Joining meeting...');
        });

        frame.on('joined-meeting', () => {
          console.log('Successfully joined meeting');
          toast.success('Successfully joined meeting!');
        });

        frame.on('recording-started', (event: any) => {
          console.log('Recording started:', event);
        });

        frame.on('recording-stopped', (event: any) => {
          console.log('Recording stopped:', event);
        });

        frame.on('recording-error', (event: any) => {
          console.error('Recording error:', event);
          toast.error('Recording error occurred');
        });

        frame.on('left-meeting', () => {
          toast.info('You have left the meeting');
        });

        setIsLoading(false);
        onCallFrameReady(frame);
      } catch (error: any) {
        console.error("Error initializing call frame:", error);
        setIsLoading(false);
        if (error.message?.includes('Duplicate DailyIframe')) {
          toast.error('Video call already active. Please refresh the page if you see this error.');
        } else {
          toast.error('Failed to initialize video call. Please try refreshing the page.');
        }
      }
    };

    initializeCallFrame();

    return () => {
      isCancelled = true;
      console.log("VideoPreview component unmounting");
    };
  }, [onCallFrameReady, roomUrl]);

  return (
    <div className="absolute inset-0">
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-full w-full bg-gray-50">
          <Loader2 className="h-10 w-10 text-[#9b87f5] animate-spin mb-4" />
          <p className="text-gray-600">Initializing video room...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
        </div>
      )}
      <div 
        ref={callWrapperRef} 
        className="w-full h-full relative"
        style={{ minHeight: '600px', backgroundColor: 'transparent' }}
      />
    </div>
  );
};
