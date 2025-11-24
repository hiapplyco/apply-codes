
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export const createChatSession = async (userId: string) => {
  const title = `Interview Session ${new Date().toLocaleString()}`;

  if (!db) {
    throw new Error("Firestore not initialized");
  }

  const docRef = await addDoc(collection(db, "chatSessions"), {
    title,
    status: 'active',
    userId,
    createdAt: serverTimestamp()
  });

  return {
    id: docRef.id,
    title,
    status: 'active',
    userId
  };
};
