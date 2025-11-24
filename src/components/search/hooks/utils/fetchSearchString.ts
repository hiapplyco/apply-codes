
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export const fetchSearchString = async (currentJobId: number | string | null) => {
  if (!currentJobId || !db) return null;

  const jobId = String(currentJobId);

  try {
    const jobRef = doc(db, "jobs", jobId);
    const jobSnap = await getDoc(jobRef);

    if (!jobSnap.exists()) {
      return null;
    }

    const data = jobSnap.data() as { search_string?: string };
    return data?.search_string || null;
  } catch (error) {
    console.error('Error fetching search string:', error);
    return null;
  }
};
