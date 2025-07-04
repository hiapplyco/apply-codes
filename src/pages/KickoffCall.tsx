
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { KickoffForm } from "@/components/kickoff-call/KickoffForm";
import { FileUploadSection } from "@/components/kickoff-call/FileUploadSection";
import { FileList } from "@/components/kickoff-call/FileList";
import { SummaryCard } from "@/components/kickoff-call/SummaryCard";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ContextBar } from "@/components/context/ContextBar";
import { useContextIntegration } from "@/hooks/useContextIntegration";

interface Summary {
  id: string;
  title: string;
  content: string;
  source: string;
}

const KickOffCall = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [filePaths, setFilePaths] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; path: string }[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [title, setTitle] = useState("");
  
  // Context integration for kickoff meetings
  const { processContent } = useContextIntegration({
    context: 'meeting'
  });

  const handleFileUpload = (filePath: string, fileName: string, text: string) => {
    setUploadedFiles(prev => [...prev, { name: fileName, path: filePath }]);
    setFilePaths(prev => [...prev, filePath]);
    
    // Add summary card for the uploaded file
    setSummaries(prev => [...prev, {
      id: filePath,
      title: fileName,
      content: text.length > 200 ? text.substring(0, 200) + "..." : text,
      source: `File: ${fileName}`
    }]);
    
    // Suggest a title if none is set
    if (!title.trim()) {
      const suggestedTitle = `Kickoff Call - ${fileName.split('.')[0]}`;
      setTitle(suggestedTitle);
      toast.info(`Title set to "${suggestedTitle}"`);
    }
  };

  const removeFile = (index: number) => {
    const removedFile = uploadedFiles[index];
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePaths(prev => prev.filter((_, i) => i !== index));
    setSummaries(prev => prev.filter(s => s.id !== removedFile.path));
    
    toast.info(`Removed file: ${removedFile.name}`);
  };

  const removeSummary = (id: string) => {
    setSummaries(prev => prev.filter(s => s.id !== id));
    const fileIndex = uploadedFiles.findIndex(f => f.path === id);
    if (fileIndex !== -1) {
      removeFile(fileIndex);
    }
  };

  const handleContextContent = async (content: any) => {
    try {
      await processContent(content);
      
      // Add to uploaded files for display
      setUploadedFiles(prev => [...prev, { 
        name: content.metadata?.filename || `${content.type} content`, 
        path: `context-${Date.now()}` 
      }]);
      
      // Add summary card
      setSummaries(prev => [...prev, {
        id: `context-${Date.now()}`,
        title: content.metadata?.filename || `${content.type} Content`,
        content: content.text.length > 200 ? content.text.substring(0, 200) + "..." : content.text,
        source: `${content.type}: ${content.metadata?.url || content.metadata?.filename || 'Direct input'}`
      }]);
      
      // Suggest title if none is set
      if (!title.trim() && content.metadata?.filename) {
        const suggestedTitle = `Kickoff Call - ${content.metadata.filename.split('.')[0]}`;
        setTitle(suggestedTitle);
        toast.info(`Title set to "${suggestedTitle}"`);
      }
      
      toast.success(`${content.type} content added to kickoff call`);
    } catch (error) {
      console.error('Context processing error:', error);
    }
  };

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Page header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-[#8B5CF6]">Kickoff Call Setup</h1>
        <p className="text-gray-600 text-lg">
          Let's gather some information to make your meeting more productive
        </p>
      </div>

      {/* Context Bar with Project Selector and Context Buttons */}
      <ContextBar
        context="meeting"
        title="Project & Meeting Context"
        description="Select a project and add context through uploads, web scraping, or AI search"
        onContentProcessed={handleContextContent}
        projectSelectorProps={{
          placeholder: "Choose a project for this kickoff call (optional)",
          className: "w-full max-w-md"
        }}
        showLabels={true}
        size="default"
        layout="stacked"
      />

      <Card className="p-6 border-4 border-black bg-[#FFFBF4] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#8B5CF6] via-[#9B87F5] to-[#A18472] bg-clip-text text-transparent">
          Recruiting Kick Off Call
        </h1>

        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-lg font-bold block">
              Title
            </label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for this kickoff call"
              className="w-full p-4 border-4 border-black rounded bg-white 
                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-medium focus:ring-0 focus:border-black
                transition-all duration-200 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                hover:translate-x-[2px] hover:translate-y-[2px]"
            />
          </div>

          <FileUploadSection 
            onFileUpload={handleFileUpload}
            isProcessing={isProcessing}
          />
          
          <FileList 
            files={uploadedFiles}
            onRemove={removeFile}
          />

          {summaries.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Content Summaries</h2>
              <div className="grid gap-4">
                {summaries.map((summary) => (
                  <SummaryCard
                    key={summary.id}
                    title={summary.title}
                    content={summary.content}
                    source={summary.source}
                    onRemove={() => removeSummary(summary.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <KickoffForm 
            isProcessing={isProcessing}
            filePaths={filePaths}
            title={title}
            onTitleChange={setTitle}
          />
        </div>
      </Card>
    </div>
  );
};

export default KickOffCall;
