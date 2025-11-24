import { useState } from 'react';
import { functionBridge } from "@/lib/function-bridge";
import { toast } from "sonner";

export const useElevenLabs = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakText = async (text: string, voiceId: string = "pFZP5JQG7iQjIQuC4Bku") => {
    try {
      setIsSpeaking(true);
      const data = await functionBridge.textToSpeech({ text, voiceId });

      if (data?.audioContent) {
        const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
        audio.onended = () => setIsSpeaking(false);
        await audio.play();
      }
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      toast.error('Failed to generate speech');
      setIsSpeaking(false);
    }
  };

  return {
    isSpeaking,
    speakText
  };
};
