
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UploadRequirementsButton } from "@/components/url-scraper";

interface InterviewSetupFormProps {
  onSubmit: (data: InterviewSetupData) => void;
  isLoading?: boolean;
}

export interface InterviewSetupData {
  roleTitle: string;
  roleDescription: string;
  interviewFramework: string;
  customFrameworkPrompt?: string;
  uploadedFiles: File[];
}

const FRAMEWORK_OPTIONS = [
  { value: 'star', label: 'STAR Method', description: 'Situation, Task, Action, Result framework' },
  { value: 'behavioral', label: 'Behavioral Interview', description: 'Focus on past behavior patterns' },
  { value: 'competency', label: 'Competency-Based', description: 'Evaluate specific skills and abilities' },
  { value: 'other', label: 'Other', description: 'Custom interview framework' }
];

export const InterviewSetupForm = ({ onSubmit, isLoading = false }: InterviewSetupFormProps) => {
  const [formData, setFormData] = useState<InterviewSetupData>({
    roleTitle: '',
    roleDescription: '',
    interviewFramework: 'behavioral',
    customFrameworkPrompt: '',
    uploadedFiles: []
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setFormData(prev => ({
        ...prev,
        uploadedFiles: [...prev.uploadedFiles, ...files]
      }));
      toast.success(`${files.length} file(s) uploaded successfully`);
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.roleTitle.trim()) {
      toast.error("Please enter the role title");
      return;
    }
    
    if (!formData.roleDescription.trim()) {
      toast.error("Please enter the role description");
      return;
    }
    
    if (formData.interviewFramework === 'other' && !formData.customFrameworkPrompt?.trim()) {
      toast.error("Please provide a custom interview framework prompt");
      return;
    }

    onSubmit(formData);
  };

  const selectedFramework = FRAMEWORK_OPTIONS.find(f => f.value === formData.interviewFramework);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Setup Interview Session</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="roleTitle">Role Title *</Label>
            <Input
              id="roleTitle"
              value={formData.roleTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, roleTitle: e.target.value }))}
              placeholder="e.g., Senior Software Engineer, Product Manager"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roleDescription">Role Description *</Label>
            <div className="space-y-3">
              <Textarea
                id="roleDescription"
                value={formData.roleDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, roleDescription: e.target.value }))}
                placeholder="Describe the role, key responsibilities, and requirements..."
                rows={4}
                required
              />
              <div className="flex justify-center">
                <UploadRequirementsButton
                  context="interview"
                  size="md"
                  variant="inline"
                  onScrapedContent={(data) => {
                    setFormData(prev => ({ ...prev, roleDescription: data.text }));
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="framework">Interview Framework *</Label>
            <Select
              value={formData.interviewFramework}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                interviewFramework: value,
                customFrameworkPrompt: value !== 'other' ? '' : prev.customFrameworkPrompt
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select interview framework" />
              </SelectTrigger>
              <SelectContent>
                {FRAMEWORK_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFramework && selectedFramework.value !== 'other' && (
              <p className="text-sm text-gray-600">{selectedFramework.description}</p>
            )}
          </div>

          {formData.interviewFramework === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="customPrompt">Custom Framework Prompt *</Label>
              <Textarea
                id="customPrompt"
                value={formData.customFrameworkPrompt}
                onChange={(e) => setFormData(prev => ({ ...prev, customFrameworkPrompt: e.target.value }))}
                placeholder="Describe your custom interview approach and the types of questions you want to ask..."
                rows={3}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Upload Context Files (Optional)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
                id="fileUpload"
              />
              <label htmlFor="fileUpload" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Click to upload job descriptions, resumes, or other context files
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, DOC, DOCX, TXT, MD
                </p>
              </label>
            </div>
            
            {formData.uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label>Uploaded Files:</Label>
                {formData.uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up interview...
              </>
            ) : (
              "Start Interview Setup"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
