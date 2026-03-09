'use client';

import { useParams, useRouter } from 'next/navigation';
import { AnalysisResults } from "@/components/search/AnalysisResults";

const Report = () => {
  const params = useParams();
  const router = useRouter();
  const jobId = typeof params.jobId === 'string' ? params.jobId : Array.isArray(params.jobId) ? params.jobId[0] : undefined;

  if (!jobId) {
    return null;
  }

  return (
    <div className="container max-w-4xl py-8">

      <AnalysisResults
        jobId={parseInt(jobId)}
        agentOutput={null}
        searchString=""
        onClose={() => router.push('/')}
      />

    </div>
  );
};

export default Report;

