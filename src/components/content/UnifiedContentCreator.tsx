import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Folder, ChevronDown, ChevronUp, Upload, Download, Share2, Copy, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { functionBridge } from "@/lib/function-bridge";
import { JobEditorContent } from "@/components/jobs/editor/JobEditorContent";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StandardProjectContext } from '@/components/project/StandardProjectContext';
import { ContentGenerationDialog } from "@/components/content/ContentGenerationDialog";
import { GoogleDocsModal } from "./GoogleDocsModal";
import { useProjectContext } from "@/context/ProjectContext";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { advancedMarkdownToHtml } from "@/utils/markdownToHtml";

// Lazy-load GoogleDriveFilePicker to avoid bundling googleapis (Node.js) at build time
const GoogleDriveFilePicker = dynamic(
  () => import("@/components/drive/GoogleDriveFilePicker").then(mod => ({ default: mod.GoogleDriveFilePicker })),
  { ssr: false, loading: () => <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div> }
);

interface ContentType {
  content_type: string;
  emoji: string;
  tooltip: string;
  system_prompt: string;
}

interface GeneratedContent {
  content: string;
  markdown: string;
  googleDocId?: string;
  googleDriveUrl?: string;
}

export const UnifiedContentCreator = () => {
  const [selectedContentType, setSelectedContentType] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [rawContent, setRawContent] = useState("");
  const [contextContent, setContextContent] = useState<string>("");
  const [showGenerationDialog, setShowGenerationDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [contentOptions, setContentOptions] = useState<ContentType[]>([]);
  const [isLoadingContentTypes, setIsLoadingContentTypes] = useState(true);
  const [showContext, setShowContext] = useState(false);
  const [showGoogleDocsModal, setShowGoogleDocsModal] = useState(false);
  const [showDriveFilePicker, setShowDriveFilePicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const { selectedProject } = useProjectContext();
  const { currentAccount } = useGoogleAuth();

  // Load content types from public directory
  useEffect(() => {
    const loadContentTypes = async () => {
      try {
        const response = await fetch('/data/contentcreationbots.json');
        if (!response.ok) {
          throw new Error('Failed to load content types');
        }
        const data = await response.json();
        setContentOptions(data?.recruiter_hr_content || []);
      } catch (error) {
        console.error('Error loading content types:', error);
        toast.error('Failed to load content types. Please refresh the page.');
        setContentOptions([]);
      } finally {
        setIsLoadingContentTypes(false);
      }
    };

    loadContentTypes();
  }, []);

  const filteredOptions = contentOptions.filter((option: ContentType) =>
    option.content_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.tooltip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  interface ContextContent {
    text: string;
    type: string;
  }

  const handleContextContent = async (content: ContextContent) => {
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

    const selectedOption = contentOptions.find((opt: ContentType) => opt.content_type === selectedContentType);
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

      const response = await functionBridge.generateContent({
        contentType: selectedContentType,
        userInput,
        systemPrompt: selectedOption.system_prompt,
        contextContent,
        projectContext: selectedProject ? `Project: ${selectedProject.name}\nDescription: ${selectedProject.description || 'No description'}` : '',
        projectId: selectedProject?.id
      });

      console.log('Response from generate-content:', response);

      if (response && response.content) {
        console.log('Content received, length:', response.content.length);
        const htmlContent = advancedMarkdownToHtml(response.content);
        console.log('HTML content generated, length:', htmlContent.length);

        setGeneratedContent({
          content: htmlContent,
          markdown: response.markdown || response.content,
        });
        setRawContent(htmlContent);
        toast.success("Content generated successfully!");
      } else {
        console.error('No content in response:', response);
        throw new Error(`No content generated. Response: ${JSON.stringify(response)}`);
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

  const handleExportToGoogleDocs = async () => {
    if (!generatedContent || !currentAccount) {
      toast.error("Please generate content and connect a Google account first");
      return;
    }
    setIsExporting(true);
    try {
      const exportResult = await functionBridge.exportToGoogleDocs({
        content: rawContent,
        title: `${selectedContentType} - ${new Date().toLocaleDateString()}`,
        accountId: currentAccount.id,
      });
      setGeneratedContent((prev) =>
        prev ? { ...prev, googleDocId: exportResult.documentId, googleDriveUrl: exportResult.documentUrl } : null
      );
      toast.success("Content exported to Google Docs!");
    } catch (error) {
      console.error("Error exporting to Google Docs:", error);
      toast.error("Failed to export to Google Docs");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFromGoogleDocs = async (fileId: string, fileName: string) => {
    if (!currentAccount) {
      toast.error("Please connect a Google account first");
      return;
    }
    setIsImporting(true);
    try {
      const importResult = await functionBridge.importFromGoogleDocs({
        fileId,
        accountId: currentAccount.id,
      });
      const htmlContent = advancedMarkdownToHtml(importResult.content);
      setGeneratedContent({
        content: htmlContent,
        markdown: importResult.content,
        googleDocId: fileId,
        googleDriveUrl: importResult.documentUrl,
      });
      setRawContent(htmlContent);
      toast.success(`Imported "${fileName}" from Google Docs`);
      setShowDriveFilePicker(false);
    } catch (error) {
      console.error("Error importing from Google Docs:", error);
      toast.error("Failed to import from Google Docs");
    } finally {
      setIsImporting(false);
    }
  };

  const selectedOption = contentOptions.find((opt: ContentType) => opt.content_type === selectedContentType);

  return (
    <div className="space-y-4">
      {/* Header with context toggle and Google integration */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Content</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate professional recruitment content with AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Google Account Status */}
          {currentAccount ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              Google Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              Google Not Connected
            </Badge>
          )}

          {/* Import from Drive */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDriveFilePicker(true)}
            disabled={!currentAccount}
            className="text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Import
          </Button>

          {/* Context Toggle */}
          <button
            onClick={() => setShowContext(!showContext)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedProject || contextContent
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span className="hidden sm:inline max-w-[120px] truncate">
              {selectedProject?.name || (contextContent ? 'Context Added' : 'Add Context')}
            </span>
            {showContext ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Collapsible Context Section */}
      {showContext && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <StandardProjectContext
            context="general"
            title=""
            description=""
            onContentProcessed={(content) => {
              handleContextContent(content);
              setShowContext(false);
            }}
            projectSelectorPlaceholder="Choose a project..."
            className="border-0 shadow-none p-0 mb-0"
          />
        </div>
      )}

      {/* Content Creation Form */}
      <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-6">
            {/* Content Type Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="content-type" className="text-sm font-medium">
                Content Type
              </Label>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedContentType}
                  onValueChange={setSelectedContentType}
                  open={isSelectOpen}
                  onOpenChange={(open) => {
                    setIsSelectOpen(open);
                    if (!open) setSearchTerm("");
                  }}
                >
                  <SelectTrigger
                    id="content-type"
                    className="w-full border border-gray-300 hover:border-gray-400 transition-colors"
                  >
                    <SelectValue placeholder="Select content type..." />
                  </SelectTrigger>
                  <SelectContent className="border border-gray-200 shadow-lg max-h-[60vh] overflow-hidden">
                    {/* Search Input */}
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search content types..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 h-8 text-sm border-0 focus:ring-1 focus:ring-purple-500 bg-gray-50"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Scrollable Options */}
                    <div className="max-h-[50vh] overflow-y-auto overscroll-contain">
                      {filteredOptions.length > 0 ? (
                        filteredOptions.map((option: ContentType) => (
                          <SelectItem
                            key={option.content_type}
                            value={option.content_type}
                            className="cursor-pointer hover:bg-purple-50 focus:bg-purple-50 py-3 px-4 text-left"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{option.emoji}</span>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{option.content_type}</div>
                                <div className="text-xs text-gray-500 mt-1 line-clamp-2">{option.tooltip}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <Search className="mx-auto h-6 w-6 mb-2 opacity-50" />
                          <p className="text-sm">No content types found</p>
                          <p className="text-xs mt-1">Try adjusting your search</p>
                        </div>
                      )}
                    </div>
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
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <Info className="w-4 h-4" />
                  <span className="font-medium">Context Active:</span>
                </div>
                <div className="mt-1 text-xs text-green-600 space-y-1">
                  {selectedProject && (
                    <div>• Project: {selectedProject.name}</div>
                  )}
                  {contextContent && (
                    <div>• Additional context from uploaded/scraped content</div>
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
                className="min-h-[150px] max-h-[300px] overflow-y-auto border border-gray-300"
                disabled={!selectedContentType}
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!selectedContentType || !userInput.trim() || isGenerating}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
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

      {/* Generated Content Editor */}
      {generatedContent && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Generated {selectedContentType}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Edit and refine your content below
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* Synced badge + link actions */}
                {generatedContent.googleDriveUrl && (
                  <>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Synced
                    </Badge>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedContent.googleDriveUrl!);
                              toast.success("Link copied!");
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Copy Google Docs link</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(generatedContent.googleDriveUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Open in Google Docs</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )}

                {/* Export button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportToGoogleDocs}
                  disabled={isExporting || !currentAccount}
                  className="text-xs"
                >
                  {isExporting ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 mr-1" />
                  )}
                  Export
                </Button>

                {/* Advanced Google Docs modal */}
                <Dialog open={showGoogleDocsModal} onOpenChange={setShowGoogleDocsModal}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!currentAccount}
                      className="text-xs"
                    >
                      <Share2 className="w-3.5 h-3.5 mr-1" />
                      Share
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Google Docs Integration</DialogTitle>
                    </DialogHeader>
                    <GoogleDocsModal
                      content={rawContent}
                      onExport={handleExportToGoogleDocs}
                      onClose={() => setShowGoogleDocsModal(false)}
                      isExporting={isExporting}
                      currentDocUrl={generatedContent.googleDriveUrl}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
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

      {/* Content Generation Dialog */}
      <ContentGenerationDialog
        isOpen={showGenerationDialog}
        onClose={() => setShowGenerationDialog(false)}
        contentType={selectedContentType}
        isGenerating={isGenerating}
        hasContext={!!(contextContent || selectedProject)}
        projectName={selectedProject?.name}
      />

      {/* Google Drive File Picker */}
      {showDriveFilePicker && (
        <Dialog open={showDriveFilePicker} onOpenChange={setShowDriveFilePicker}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Import from Google Drive</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto">
              <GoogleDriveFilePicker
                open={showDriveFilePicker}
                onOpenChange={setShowDriveFilePicker}
                onFileSelect={(file: any) => handleImportFromGoogleDocs(file.id, file.name)}
                allowedTypes={['application/vnd.google-apps.document'] as any}
              />
              {isImporting && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                  <span className="text-sm text-muted-foreground">Importing document...</span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
