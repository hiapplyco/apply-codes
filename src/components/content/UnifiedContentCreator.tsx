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
import { ContextBar } from "@/components/context/ContextBar";
import { ContentGenerationDialog } from "@/components/content/ContentGenerationDialog";
import { useProjectContext } from "@/context/ProjectContext";
import { advancedMarkdownToHtml } from "@/utils/markdownToHtml";
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
  const [contextContent, setContextContent] = useState<string>("");
  const [projectContext, setProjectContext] = useState<string>("");
  const [showGenerationDialog, setShowGenerationDialog] = useState(false);

  const { selectedProject } = useProjectContext();
  const contentOptions = contentTypes.recruiter_hr_content;

  const handleContextContent = async (content: any) => {
    try {
      setContextContent(content.text);
      toast.success(`${content.type} context added to content creation`);
    } catch (error) {
      console.error('Context processing error:', error);
      toast.error('Failed to process context content');
    }
  };

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
    setShowGenerationDialog(true);
    try {
      console.log('Sending request to generate-content with:', {
        contentType: selectedContentType,
        userInput: userInput.substring(0, 100) + '...', // Log first 100 chars
        systemPrompt: selectedOption.system_prompt.substring(0, 100) + '...' // Log first 100 chars
      });

      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          contentType: selectedContentType,
          userInput: userInput,
          systemPrompt: selectedOption.system_prompt,
          contextContent: contextContent,
          projectContext: selectedProject ? `Project: ${selectedProject.name}\nDescription: ${selectedProject.description || 'No description'}` : '',
          projectId: selectedProject?.id,
        },
      });

      console.log('Response from generate-content:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data && data.content) {
        console.log('Content received, length:', data.content.length);
        const htmlContent = advancedMarkdownToHtml(data.content);
        console.log('HTML content generated, length:', htmlContent.length);
        
        setGeneratedContent({
          content: htmlContent,
          markdown: data.markdown || data.content,
        });
        setRawContent(htmlContent);
        toast.success("Content generated successfully!");
      } else {
        console.error('No content in response:', data);
        throw new Error(`No content generated. Response: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error("Error generating content:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate content");
      
      // Set error state for the editor
      setGeneratedContent({
        content: '<p>Error generating content. Please try again.</p>',
        markdown: 'Error generating content. Please try again.'
      });
      setRawContent('<p>Error generating content. Please try again.</p>');
    } finally {
      setIsGenerating(false);
      // Dialog will auto-close after showing completion state
    }
  };

  const handleContentChange = (newContent: string) => {
    setRawContent(newContent);
  };

  const selectedOption = contentOptions.find(opt => opt.content_type === selectedContentType);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Context Bar with Project Selector */}
      <div className="animate-in slide-in-from-top duration-700 delay-100">
        <ContextBar
        context="general"
        title="Add Context for Content Creation"
        description="Upload documents, scrape websites, or search for additional context to enhance your content"
        onContentProcessed={handleContextContent}
        showProjectSelector={true}
        projectSelectorProps={{
          label: "Select project for content creation",
          placeholder: "Choose a project (optional)",
          className: "w-full"
        }}
        showLabels={true}
        layout="vertical"
        compact={false}
        className="mb-6"
      />
      </div>

      {/* Content Creation Form */}
      <div className="animate-in slide-in-from-bottom duration-700 delay-200">
        <Card className="border-2 border-black bg-white shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)]">
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

          {/* Context Status Indicator */}
          {(contextContent || selectedProject) && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg animate-in slide-in-from-left duration-500 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Info className="w-4 h-4 animate-pulse" />
                <span className="font-medium">Context Active:</span>
              </div>
              <div className="mt-1 text-xs text-green-600 space-y-1">
                {selectedProject && (
                  <div className="animate-in fade-in duration-300 delay-100">• Project: {selectedProject.name}</div>
                )}
                {contextContent && (
                  <div className="animate-in fade-in duration-300 delay-200">• Additional context from uploaded/scraped content</div>
                )}
              </div>
            </div>
          )}

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
            className="w-full bg-[#8B5CF6] text-white hover:bg-[#7C3AED] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)] disabled:opacity-50 transition-all duration-200 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,0.7)] hover:scale-[1.02] active:scale-[0.98]"
            type="button"
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
      </div>

      {/* Generated Content Editor */}
      {generatedContent && (
        <div className="animate-in slide-in-from-bottom duration-700 delay-300">
          <Card className="border-2 border-black bg-white shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)]">
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
        </div>
      )}

      {/* Content Generation Dialog */}
      <ContentGenerationDialog
        isOpen={showGenerationDialog}
        onClose={() => setShowGenerationDialog(false)}
        contentType={selectedContentType}
        isGenerating={isGenerating}
        hasContext={!!(contextContent || selectedProject)}
        projectName={selectedProject?.name}
      />
    </div>
  );
};