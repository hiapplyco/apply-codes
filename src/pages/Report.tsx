
import { useParams, useNavigate } from "react-router-dom";
import { AnalysisResults } from "@/components/search/AnalysisResults";

const Report = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  if (!jobId) {
    return null;
  }

  return (
    <div className="container max-w-4xl py-8">

      <AnalysisResults 
        jobId={parseInt(jobId)} 
        onClose={() => navigate('/')} 
      />

    </div>
  );
};

export default Report;

