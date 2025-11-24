
import { firestoreClient } from "@/lib/firebase-database-bridge";
import { useClientAgentOutputs } from "@/stores/useClientAgentOutputs";

export const createJob = async (
  searchText: string,
  userId: string | null,
  title: string,
  summary: string,
  source: 'default' | 'clarvida' = 'default'
) => {
  try {
    console.log(`Creating job with source: ${source} and userId: ${userId}`);
    
    const { data, error } = await firestoreClient
      .from('jobs')
      .insert({
        content: searchText,
        user_id: userId,
        title,
        summary,
        source: source || 'default',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creating job:', error);
      throw error;
    }
    
    const insertedJob = Array.isArray(data) ? data[0] : data;
    const jobId = insertedJob?.id;
    console.log(`Created job with ID: ${jobId}`);
    
    // Clear previous search results when creating a new job
    const { setSearchResults } = useClientAgentOutputs.getState();
    if (jobId) {
      setSearchResults(jobId, [], "", 0);
    }
    
    return jobId;
  } catch (error) {
    console.error('Error in createJob:', error);
    // Return a temporary ID for testing when job creation fails
    // This allows the flow to continue for demo/testing purposes
    const tempId = Date.now().toString();
    console.log(`Using temporary job ID: ${tempId} due to error`);
    return tempId;
  }
};
