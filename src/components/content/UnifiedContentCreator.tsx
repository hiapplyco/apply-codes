import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProjectSelector } from "@/components/project/ProjectSelector";
import { JobEditorContent } from "@/components/jobs/editor/JobEditorContent";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import contentTypes from "../../../contentcreationbots.json";

interface GeneratedContent {
  content: string;
  markdown: string;
}

export const UnifiedContentCreator = () => {
  const [selectedContentType, setSelectedContentType] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [rawContent, setRawContent] = useState("");

  const contentOptions = contentTypes.recruiter_hr_content;

  const handleGenerate = async () => {
    if (!selectedContentType || !userInput.trim()) {
      toast.error("Please select a content type and provide input");
      return;
    }

    const selectedOption = contentOptions.find(opt => opt.content_type === selectedContentType);
    if (!selectedOption) {
      toast.error("Invalid content type selected");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          contentType: selectedContentType,
          userInput: userInput,
          systemPrompt: selectedOption.system_prompt,
        },
      });

      if (error) throw error;

      if (data && data.content) {
        setGeneratedContent({
          content: data.content,
          markdown: data.markdown || data.content,
        });
        setRawContent(data.markdown || data.content);
        toast.success("Content generated successfully!");
      } else {
        throw new Error("No content generated");
      }
    } catch (error) {
      console.error("Error generating content:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    setRawContent(newContent);
  };

  const selectedOption = contentOptions.find(opt => opt.content_type === selectedContentType);

  return (
    <div className="space-y-8">
      {/* Project Selector */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <ProjectSelector 
          label="Select project for content creation"
          placeholder="Choose a project (optional)"
          className="max-w-md"
        />
      </div>

      {/* Content Creation Form */}
      <Card className="border-2 border-black bg-white shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#8B5CF6]">Create Content</CardTitle>
          <CardDescription className="text-gray-600">
            Generate professional recruitment content with AI assistance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content Type Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="content-type" className="text-sm font-medium">
              Content Type
            </Label>
            <div className="flex items-center gap-2">
              <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                <SelectTrigger 
                  id="content-type"
                  className="w-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
                >
                  <SelectValue placeholder="Select content type..." />
                </SelectTrigger>
                <SelectContent className="border-2 border-black">
                  {contentOptions.map((option) => (
                    <SelectItem key={option.content_type} value={option.content_type}>
                      <span className="flex items-center gap-2">
                        <span>{option.emoji}</span>
                        <span>{option.content_type}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedOption && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-10 w-10"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>{selectedOption.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          {/* User Input */}
          <div className="space-y-2">
            <Label htmlFor="user-input" className="text-sm font-medium">
              Your Input
            </Label>
            <Textarea
              id="user-input"
              placeholder={selectedOption ? 
                "Provide the details mentioned in the content type description..." : 
                "Select a content type first..."
              }
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="min-h-[150px] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
              disabled={!selectedContentType}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!selectedContentType || !userInput.trim() || isGenerating}
            className="w-full bg-[#8B5CF6] text-white hover:bg-[#7C3AED] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)] disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Content...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Content Editor */}
      {generatedContent && (
        <Card className="border-2 border-black bg-white shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#8B5CF6]">
              Generated {selectedContentType}
            </CardTitle>
            <CardDescription className="text-gray-600">
              Edit and refine your content below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="min-h-[400px]">
              <JobEditorContent
                initialContent={rawContent}
                onUpdate={handleContentChange}
                isAnalysisComplete={true}
                isError={false}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};