import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Loader2, 
  FileText, 
  Info, 
  Upload, 
  Download, 
  FolderOpen, 
  GoogleDrive,
  Share2,
  Settings,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProjectSelector } from "@/components/project/ProjectSelector";
import { JobEditorContent } from "@/components/jobs/editor/JobEditorContent";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { advancedMarkdownToHtml } from "@/utils/markdownToHtml";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { GoogleDriveFilePicker } from "@/components/drive/GoogleDriveFilePicker";
import { GoogleDocsModal } from "./GoogleDocsModal";
import contentTypes from "../../../contentcreationbots.json";

interface GeneratedContent {
  content: string;
  markdown: string;
  googleDocId?: string;
  googleDriveUrl?: string;
}

interface GoogleIntegrationStatus {
  isConnected: boolean;
  hasValidAccess: boolean;
  lastSync?: Date;
  connectedAccounts: number;
}

export const ContentCreationWithGoogle = () => {
  const [selectedContentType, setSelectedContentType] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [rawContent, setRawContent] = useState("");
  const [showGoogleDocsModal, setShowGoogleDocsModal] = useState(false);
  const [showDriveFilePicker, setShowDriveFilePicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState<GoogleIntegrationStatus>({
    isConnected: false,
    hasValidAccess: false,
    connectedAccounts: 0
  });

  const { accounts, currentAccount, isLoading: googleLoading } = useGoogleAuth();
  const contentOptions = contentTypes.recruiter_hr_content;

  // Update integration status when Google auth changes
  useEffect(() => {
    const hasValidAccess = accounts.some(acc => 
      acc.accessToken && 
      (!acc.tokenExpiry || new Date(acc.tokenExpiry) > new Date())
    );

    setIntegrationStatus({
      isConnected: accounts.length > 0,
      hasValidAccess,
      connectedAccounts: accounts.length,
      lastSync: new Date()
    });
  }, [accounts]);

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

      if (error) {
        throw error;
      }

      if (data && data.content) {
        const htmlContent = advancedMarkdownToHtml(data.content);
        
        setGeneratedContent({
          content: htmlContent,
          markdown: data.markdown || data.content,
        });
        setRawContent(htmlContent);
        toast.success("Content generated successfully!");
      } else {
        throw new Error(`No content generated. Response: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error("Error generating content:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate content");
      
      setGeneratedContent({
        content: '<p>Error generating content. Please try again.</p>',
        markdown: 'Error generating content. Please try again.'
      });
      setRawContent('<p>Error generating content. Please try again.</p>');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    setRawContent(newContent);
  };

  const handleExportToGoogleDocs = async () => {
    if (!generatedContent || !currentAccount) {
      toast.error("Please generate content and connect Google account first");
      return;
    }

    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-to-google-docs', {
        body: {
          content: rawContent,
          title: `${selectedContentType} - ${new Date().toLocaleDateString()}`,
          accountId: currentAccount.id
        }
      });

      if (error) throw error;

      setGeneratedContent(prev => prev ? {
        ...prev,
        googleDocId: data.documentId,
        googleDriveUrl: data.documentUrl
      } : null);

      toast.success("Content exported to Google Docs successfully!");
    } catch (error) {
      console.error("Error exporting to Google Docs:", error);
      toast.error("Failed to export to Google Docs");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFromGoogleDocs = async (fileId: string, fileName: string) => {
    if (!currentAccount) {
      toast.error("Please connect Google account first");
      return;
    }

    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-from-google-docs', {
        body: {
          fileId,
          accountId: currentAccount.id
        }
      });

      if (error) throw error;

      const htmlContent = advancedMarkdownToHtml(data.content);
      
      setGeneratedContent({
        content: htmlContent,
        markdown: data.content,
        googleDocId: fileId,
        googleDriveUrl: data.documentUrl
      });
      setRawContent(htmlContent);
      
      toast.success(`Content imported from "${fileName}" successfully!`);
      setShowDriveFilePicker(false);
    } catch (error) {
      console.error("Error importing from Google Docs:", error);
      toast.error("Failed to import from Google Docs");
    } finally {
      setIsImporting(false);
    }
  };

  const handleCopyGoogleDocsLink = () => {
    if (generatedContent?.googleDriveUrl) {
      navigator.clipboard.writeText(generatedContent.googleDriveUrl);
      toast.success("Google Docs link copied to clipboard!");
    }
  };

  const selectedOption = contentOptions.find(opt => opt.content_type === selectedContentType);

  return (
    <div className="space-y-8">
      {/* Google Integration Status */}
      <Card className="border-2 border-blue-500 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GoogleDrive className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Google Integration Status</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              {integrationStatus.hasValidAccess ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Not Connected
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/google-integrations-settings', '_blank')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Connected Accounts:</span>
              <span className="font-medium">{integrationStatus.connectedAccounts}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Drive Access:</span>
              <span className={`font-medium ${integrationStatus.hasValidAccess ? 'text-green-600' : 'text-red-600'}`}>
                {integrationStatus.hasValidAccess ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Last Sync:</span>
              <span className="font-medium text-xs">
                {integrationStatus.lastSync ? integrationStatus.lastSync.toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </div>
          
          {!integrationStatus.hasValidAccess && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Google integration is not active. Connect your Google account to export/import content to Google Docs.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

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
            Generate professional recruitment content with AI assistance and Google integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create New</TabsTrigger>
              <TabsTrigger value="import" disabled={!integrationStatus.hasValidAccess}>
                Import from Google Docs
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="space-y-6">
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
            </TabsContent>
            
            <TabsContent value="import" className="space-y-6">
              <div className="text-center py-8">
                <FolderOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Import from Google Docs</h3>
                <p className="text-gray-600 mb-4">
                  Select a document from your Google Drive to import and edit
                </p>
                <Button
                  onClick={() => setShowDriveFilePicker(true)}
                  disabled={!integrationStatus.hasValidAccess}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose from Google Drive
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Generated Content Editor */}
      {generatedContent && (
        <Card className="border-2 border-black bg-white shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-[#8B5CF6]">
                  Generated {selectedContentType}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Edit and refine your content below
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                {generatedContent.googleDriveUrl && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      <GoogleDrive className="w-3 h-3 mr-1" />
                      Synced
                    </Badge>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCopyGoogleDocsLink}
                            className="h-8 w-8"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy Google Docs link</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(generatedContent.googleDriveUrl, '_blank')}
                            className="h-8 w-8"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Open in Google Docs</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
                <Dialog open={showGoogleDocsModal} onOpenChange={setShowGoogleDocsModal}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={!integrationStatus.hasValidAccess}
                    >
                      <GoogleDrive className="w-4 h-4 mr-2" />
                      Google Docs
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

      {/* Google Drive File Picker Modal */}
      {showDriveFilePicker && (
        <Dialog open={showDriveFilePicker} onOpenChange={setShowDriveFilePicker}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Select Google Docs File</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto">
              <GoogleDriveFilePicker
                onFileSelect={handleImportFromGoogleDocs}
                onCancel={() => setShowDriveFilePicker(false)}
                fileTypes={['application/vnd.google-apps.document']}
                disabled={isImporting}
              />
              {isImporting && (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  <span>Importing document...</span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};