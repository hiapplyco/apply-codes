
import { useState } from "react";
import { toast } from "sonner";
import { generateLinkedinPost } from "@/lib/firebase/functions/generateLinkedinPost";

// ... (rest of the file)

      const result = await generateLinkedinPost({
        content: finalContent,
        link,
      });
      setGeneratedPost(result.post);
      if (result.analysis) {
        setAnalysis(result.analysis);
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

  return (
    <div className="container py-8 space-y-8 max-w-2xl mx-auto">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Create LinkedIn Post</h1>
        <p className="text-muted-foreground">
          Generate engaging content with expert analysis for your recruitment campaigns
        </p>
      </div>

      <LinkedInPostForm 
        onSubmit={handleSubmit}
        isLoading={isLoading}
        isScrapingUrl={isScrapingUrl}
      />

      {(generatedPost || analysis) && (
        <LinkedInPostResults 
          generatedPost={generatedPost}
          analysis={analysis}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isAnalysisOpen={isAnalysisOpen}
          onAnalysisOpenChange={setIsAnalysisOpen}
        />
      )}
    </div>
  );
};

export default LinkedInPostGenerator;
