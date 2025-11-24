import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

interface SearchResultsProps {
  jobId: number | null;
}

const SearchResults = ({ jobId }: SearchResultsProps) => {
  const { data: results, isLoading } = useQuery({
    queryKey: ["searchResults", jobId],
    queryFn: async () => {
      if (!jobId || !db) return [];

      const resultsRef = collection(db, "search_results");
      const q = query(
        resultsRef,
        where("job_id", "==", String(jobId)),
        orderBy("relevance_score", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    },
    enabled: !!jobId,
  });

  if (!jobId) return null;
  if (isLoading) return <div>Loading results...</div>;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Search Results</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Relevance Score</TableHead>
            <TableHead>Profile</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results?.map((result) => (
            <TableRow key={result.id}>
              <TableCell>{result.profile_name}</TableCell>
              <TableCell>{result.profile_title}</TableCell>
              <TableCell>{result.profile_location}</TableCell>
              <TableCell>{result.relevance_score}</TableCell>
              <TableCell>
                <a
                  href={result.profile_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  View Profile
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SearchResults;
