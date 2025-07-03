import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const useInterviewBot = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  
  const pcmData = useRef<number[]>([]);
  const currentFrameB64 = useRef<string>("");

  const initializeClient = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: botData, error: botError } = await supabase.functions.invoke('initialize-daily-bot');
      
      if (botError) {
        console.error('Bot initialization error:', botError);
        throw new Error('Failed to initialize interview assistant');
      }
      
      if (!botData?.websocket_url) {
        throw new Error('Invalid response from interview service');
      }

      await startWebcam();
      connectWebSocket(botData.websocket_url);
      setInterval(() => captureImage(), 3000);
      
      setIsConnected(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error in initializeClient:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize interview assistant');
      setIsLoading(false);
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { max: 640 },
          height: { max: 480 },
        },
        audio: true
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing media devices:", err);
      throw new Error("Failed to access camera and microphone");
    }
  };

  const captureImage = () => {
    if (streamRef.current && canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const imageData = canvasRef.current.toDataURL("image/jpeg").split(",")[1].trim();
        currentFrameB64.current = imageData;
      }
    }
  };

  const connectWebSocket = (url: string) => {
    console.log("Connecting to WebSocket:", url);
    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
      sendInitialSetupMessage();
      startAudioInput();
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket closed");
      setIsConnected(false);
    };

    wsRef.current.onmessage = (event) => {
      const messageData = JSON.parse(event.data);
      if (messageData.text) {
        toast.info(messageData.text);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("Connection error");
    };
  };

  const sendInitialSetupMessage = () => {
    if (wsRef.current) {
      const setupMessage = {
        setup: {
          generation_config: { response_modalities: ["TEXT"] },
        },
      };
      wsRef.current.send(JSON.stringify(setupMessage));
    }
  };

  const startAudioInput = async () => {
    audioContextRef.current = new AudioContext({
      sampleRate: 16000,
    });

    if (streamRef.current) {
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processorRef.current.onaudioprocess = (audioEvent) => {
        const inputData = audioEvent.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let sampleIndex = 0; sampleIndex < inputData.length; sampleIndex++) {
          pcm16[sampleIndex] = inputData[sampleIndex] * 0x7fff;
        }
        pcmData.current.push(...pcm16);
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      intervalRef.current = window.setInterval(() => recordChunk(), 3000);
    }
  };

  const recordChunk = () => {
    if (pcmData.current.length > 0 && wsRef.current) {
      const buffer = new ArrayBuffer(pcmData.current.length * 2);
      const view = new DataView(buffer);
      pcmData.current.forEach((value, index) => {
        view.setInt16(index * 2, value, true);
      });

      const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));

      const payload = {
        realtime_input: {
          media_chunks: [
            {
              mime_type: "audio/pcm",
              data: base64,
            },
            {
              mime_type: "image/jpeg",
              data: currentFrameB64.current,
            },
          ],
        },
      };

      wsRef.current.send(JSON.stringify(payload));
      pcmData.current = [];
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsConnected(false);
    setError(null);
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    isLoading,
    error,
    initializeClient,
    disconnect,
    videoRef,
    canvasRef
  };
};