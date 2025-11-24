import { DailyCall } from "@daily-co/daily-js";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export const useTranscriptionHandler = (currentMeetingId: string | null) => {
  const startTranscription = async (callFrame: DailyCall) => {
    try {
      await callFrame.startTranscription();
      console.log("Transcription started");
      toast.success("Live transcription enabled");
    } catch (error) {
      console.error("Error starting transcription:", error);
      toast.error("Failed to start transcription");
    }
  };

  const handleTranscriptionMessage = async (event: any, userId: string) => {
    console.log("Transcription message:", event);
    if (currentMeetingId) {
      try {
        if (!db) {
          throw new Error("Firestore not initialized");
        }

        await addDoc(collection(db, 'daily_transcriptions'), {
          participant_id: event.participantId,
          text: event.text,
          timestamp: event.timestamp,
          meeting_id: currentMeetingId,
          user_id: userId,
          created_at: serverTimestamp()
        });
      } catch (error) {
        console.error("Error saving transcription:", error);
      }
    }
  };

  return {
    startTranscription,
    handleTranscriptionMessage
  };
};
