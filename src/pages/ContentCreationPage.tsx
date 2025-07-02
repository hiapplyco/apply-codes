
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { JobPostingForm } from "@/components/jobs/JobPostingForm";
import { JobCreatedModal } from "@/components/jobs/JobCreatedModal";
import LinkedInPostForm from "@/components/linkedin/LinkedInPostForm";
import LinkedInPostResults from "@/components/linkedin/LinkedInPostResults";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProjectSelector } from "@/components/project/ProjectSelector";

const ContentCreationPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    // Check if the user was redirected from linkedin-post
    return location.state?.from === "/linkedin-post" ? "linkedin" : "job";
  });
  
  const [generatedPost, setGeneratedPost] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [linkedInActiveTab, setLinkedInActiveTab] = useState("post");
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [jobModalData, setJobModalData] = useState<{
    isOpen: boolean;
    jobId?: number;
    jobTitle?: string;
    booleanSearch?: string;
  }>({ isOpen: false });

  // If user was redirected from linkedin-post, set tab to linkedin
  useEffect(() => {
    if (location.pathname.includes("linkedin-post")) {
      setActiveTab("linkedin");
    }
  }, [location]);

  const handleLinkedInSubmit = async (postContent: string, link: string, websiteContent: string) => {
    setIsLoading(true);
    setIsScrapingUrl(true);

    try {
      const finalContent = websiteContent 
        ? `${postContent}\n\nWebsite Content:\n${websiteContent}`
        : postContent;

      const { data, error } = await supabase.functions.invoke('generate-linkedin-post', {
        body: {
          content: finalContent,
          link,
        },
      });

      if (error) throw error;
      
      console.log("Edge function response:", data);
      
      if (!data || (!data.post && !data.analysis)) {
        throw new Error("No content generated from the API");
      }
      
      setGeneratedPost(data.post || "");
      if (data.analysis) {
        setAnalysis(data.analysis);
      }
      toast.success("Post generated successfully!");
    } catch (error) {
      console.error("Error generating post:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate post. Please try again.");
    } finally {
      setIsLoading(false);
      setIsScrapingUrl(false);
    }
  };

  const handleJobPostSuccess = (jobData?: { id: number; booleanSearch?: string; title?: string }) => {
    if (jobData && jobData.booleanSearch) {
      // Show the modal with the job data
      setJobModalData({
        isOpen: true,
        jobId: jobData.id,
        jobTitle: jobData.title,
        booleanSearch: jobData.booleanSearch,
      });
    } else {
      // Fallback to the old behavior if no boolean search was generated
      toast.success("Job posting created successfully!");
      setActiveTab("linkedin");
    }
  };

  const handleCloseJobModal = () => {
    setJobModalData({ isOpen: false });
  };

  const handleCreateAnother = () => {
    setJobModalData({ isOpen: false });
    // Reset form by switching tabs and back
    setActiveTab("linkedin");
    setTimeout(() => setActiveTab("job"), 10);
  };

  return (
    <div className="container py-8 space-y-8 mx-auto">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-[#8B5CF6]">Content Creation Hub</h1>
        <p className="text-gray-600">
          Create job postings and LinkedIn promotion posts for your recruitment campaigns
        </p>
      </div>
      
      {/* Project selector */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-w-3xl mx-auto">
        <ProjectSelector 
          label="Select project for content creation"
          placeholder="Choose a project (optional)"
          className="max-w-md"
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-8 bg-[#F1F1F1] p-1 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <TabsTrigger 
            value="job" 
            className="rounded-md data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            Job Posting
          </TabsTrigger>
          <TabsTrigger 
            value="linkedin" 
            className="rounded-md data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            LinkedIn Post
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="job" className="max-w-3xl mx-auto">
          <Card className="border-2 border-black bg-white shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-[#8B5CF6]">Create Job Posting</CardTitle>
              <CardDescription className="text-gray-600">
                Craft a detailed job posting that will be analyzed and optimized
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JobPostingForm onSuccess={handleJobPostSuccess} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="linkedin" className="max-w-3xl mx-auto">
          <LinkedInPostForm 
            onSubmit={handleLinkedInSubmit}
            isLoading={isLoading}
            isScrapingUrl={isScrapingUrl}
          />
          
          {(generatedPost || analysis) && (
            <div className="mt-8">
              <LinkedInPostResults 
                generatedPost={generatedPost || ""}
                analysis={analysis || ""}
                activeTab={linkedInActiveTab}
                onTabChange={setLinkedInActiveTab}
                isAnalysisOpen={isAnalysisOpen}
                onAnalysisOpenChange={setIsAnalysisOpen}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Job Created Modal */}
      <JobCreatedModal
        isOpen={jobModalData.isOpen}
        onClose={handleCloseJobModal}
        jobId={jobModalData.jobId || 0}
        jobTitle={jobModalData.jobTitle}
        booleanSearch={jobModalData.booleanSearch}
        onCreateAnother={handleCreateAnother}
      />
    </div>
  );
};

export default ContentCreationPage;
