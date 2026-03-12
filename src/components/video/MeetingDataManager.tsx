import { auth, db } from "@/lib/firebase";
import { functionBridge } from "@/lib/function-bridge";
import { toast } from "sonner";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

interface MeetingData {
  startTime: Date;
  endTime: Date;
  participants: any[];
  transcription: string;
  meetingType?: string;
  title?: string;
}

export const MeetingDataManager = (projectId?: string | null) => {
  const generateMeetingSummary = async (transcriptText: string) => {
    try {
      const result = await functionBridge.summarizeMeeting({ transcript: transcriptText });
      return result.summary;
    } catch (error) {
      console.error('Error generating meeting summary:', error);
      return null;
    }
  };

  const saveMeetingData = async ({ startTime, endTime, participants, transcription, meetingType, title }: MeetingData) => {
    try {
      const user = auth?.currentUser;
      if (!user) {
        console.error("User not authenticated");
        return;
      }

      const summary = await generateMeetingSummary(transcription);

      if (!db) {
        throw new Error("Firestore not initialized");
      }

      const docRef = await addDoc(collection(db, "meetings"), {
        userId: user.uid,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        participants,
        transcription,
        summary,
        meetingDate: new Date().toISOString().split('T')[0],
        projectId: projectId || null,
        meetingType: meetingType || null,
        title: title || null,
        createdAt: serverTimestamp()
      });

      toast.success("Meeting data saved successfully");
      return { id: docRef.id, summary };
    } catch (error) {
      console.error('Error saving meeting data:', error);
      toast.error("Failed to save meeting data");
      throw error;
    }
  };

  return { saveMeetingData };
};
