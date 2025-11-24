
import { useQuery } from "@tanstack/react-query";
import { ResumeMatch } from "../types";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

export const useResumeMatches = (jobId: number) => {
  return useQuery({
    queryKey: ["resume-matches", jobId],
    queryFn: async () => {
      if (!db) return [];

      const matchesRef = collection(db, "resume_matches");
      const q = query(
        matchesRef,
        where("job_id", "==", String(jobId)),
        orderBy("created_at", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ResumeMatch[];
    },
    retry: 1
  });
};
