import { useQuery } from "@tanstack/react-query";
import { ExtractedTerms, AgentOutput } from "@/types/agent";
import { useClientAgentOutputs } from "./useClientAgentOutputs";
import { firestoreClient } from "@/lib/firebase-database-bridge";

/**
 * Shape returned by the query (a subset/adaptation of AgentOutput for display).
 * Uses `terms` instead of `key_terms` because this store
 * parses the raw Firestore record and validates the terms shape.
 */
interface AgentOutputResult {
  id: number;
  job_id: number;
  created_at: string;
  terms: ExtractedTerms | null;
  compensation_analysis: unknown;
  enhanced_description: unknown;
  job_summary: unknown;
}

function isTerms(value: unknown): value is ExtractedTerms {
  if (typeof value !== 'object' || value === null) return false;
  const terms = value as Record<string, unknown>;
  return (
    Array.isArray(terms.skills) &&
    Array.isArray(terms.titles) &&
    Array.isArray(terms.keywords) &&
    terms.skills.every(skill => typeof skill === 'string') &&
    terms.titles.every(title => typeof title === 'string') &&
    terms.keywords.every(keyword => typeof keyword === 'string')
  );
}

export const useAgentOutputs = (jobId: number | null) => {
  const { getOutput } = useClientAgentOutputs();
  const clientOutput = jobId ? getOutput(jobId) : null;

  return useQuery({
    queryKey: ["agent-outputs", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      if (clientOutput) {
        return clientOutput;
      }

      if (!jobId) {
        return null;
      }
      
      try {
        // First verify the job exists
        const { data: jobData, error: jobError } = await firestoreClient
          .from("jobs")
          .select("id")
          .eq("id", jobId)
          .maybeSingle();

        if (jobError) {
          throw jobError;
        }

        if (!jobData) {
          return null;
        }

        // Then get the agent outputs
        const { data, error } = await firestoreClient
          .from("agent_outputs")
          .select("*")
          .eq("job_id", jobId)
          .order('created_at', { ascending: false })
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          return null;
        }

        const record = data as unknown as Record<string, unknown>;
        return {
          id: record.id,
          job_id: record.job_id,
          created_at: record.created_at,
          terms: isTerms(record.terms) ? record.terms : null,
          compensation_analysis: record.compensation_analysis,
          enhanced_description: record.enhanced_description,
          job_summary: record.job_summary
        } as AgentOutputResult;
      } catch (error) {
        throw error;
      }
    },
    refetchInterval: (data) => (!data && !clientOutput ? 1000 : false),
    retry: !clientOutput,
    retryDelay: 1000,
    staleTime: 30000,
  });
};
