import { useState } from "react";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export const useMeetingHandler = () => {
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null);

  const createMeeting = async (userId: string) => {
    try {
      if (!db) {
        throw new Error("Firestore not initialized");
      }

      const docRef = await addDoc(collection(db, 'meetings'), {
        start_time: new Date().toISOString(),
        participants: [],
        user_id: userId,
        meeting_date: new Date().toISOString().split('T')[0],
        created_at: serverTimestamp()
      });

      setCurrentMeetingId(docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error in createMeeting:", error);
      throw error;
    }
  };

  return {
    currentMeetingId,
    createMeeting
  };
};
