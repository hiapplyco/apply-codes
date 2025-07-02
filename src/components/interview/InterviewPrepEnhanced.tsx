import React, { useState, useCallback } from 'react';
import { Upload, Link, FileText, Briefcase, Target, Loader2, ChevronRight, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { FirecrawlService } from '@/utils/FirecrawlService';
import { supabase } from '@/integrations/supabase/client';
import { InterviewContext, CompanyRubric, InterviewFramework } from '@/types/interview';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadRequirementsButton } from '@/components/url-scraper';

const interviewFrameworks: InterviewFramework[] = [
  {
    id: 'behavioral',
    name: 'Behavioral (STAR)',
    description: 'Focus on past behaviors to predict future performance',
    categories: [
      { id: 'leadership', name: 'Leadership', questions: [], timeAllocation: 15 },
      { id: 'teamwork', name: 'Teamwork', questions: [], timeAllocation: 15 },
      { id: 'problem-solving', name: 'Problem Solving', questions: [], timeAllocation: 20 },
    ],
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Assess technical skills and problem-solving abilities',
    categories: [
      { id: 'coding', name: 'Coding Skills', questions: [], timeAllocation: 30 },
      { id: 'system-design', name: 'System Design', questions: [], timeAllocation: 20 },
      { id: 'debugging', name: 'Debugging', questions: [], timeAllocation: 10 },
    ],
  },
  {
    id: 'case',
    name: 'Case Study',
    description: 'Evaluate analytical and business thinking',
    categories: [
      { id: 'analysis', name: 'Problem Analysis', questions: [], timeAllocation: 20 },
      { id: 'solution', name: 'Solution Design', questions: [], timeAllocation: 25 },
      { id: 'presentation', name: 'Presentation', questions: [], timeAllocation: 15 },
    ],
  },
];

interface InterviewPrepEnhancedProps {
  onPrepComplete: (context: InterviewContext) => void;
}

export function InterviewPrepEnhanced({ onPrepComplete }: InterviewPrepEnhancedProps) {
  const [activeTab, setActiveTab] = useState('job');
  const [isProcessing, setIsProcessing] = useState(false);
  const firecrawlService = new FirecrawlService();

  // Job Description State
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobUrls, setJobUrls] = useState<string[]>(['']);
  const [jobFile, setJobFile] = useState<File | null>(null);

  // Resume State
  const [candidateName, setCandidateName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrls, setResumeUrls] = useState<string[]>(['']);

  // Company Rubric State
  const [rubricFile, setRubricFile] = useState<File | null>(null);
  const [rubricText, setRubricText] = useState('');
  const [hasRubric, setHasRubric] = useState(false);

  // Interview Settings
  const [selectedFramework, setSelectedFramework] = useState('behavioral');
  const [interviewDuration, setInterviewDuration] = useState(60);

  const handleFileUpload = async (file: File, type: 'job' | 'resume' | 'rubric') => {
    if (!file) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to upload files');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);

      const { data, error } = await supabase.functions.invoke('parse-document', {
        body: formData,
      });

      if (error) {
        console.error(`Error from parse-document:`, error);
        throw error;
      }

      const extractedText = data.text || '';
      
      switch (type) {
        case 'job':
          setJobDescription(extractedText);
          setJobFile(file);
          // Extract job title if possible
          const titleMatch = extractedText.match(/(?:position|title|role):\s*([^\n]+)/i);
          if (titleMatch) setJobTitle(titleMatch[1].trim());
          break;
        case 'resume':
          setResumeText(extractedText);
          setResumeFile(file);
          // Extract candidate name if possible
          const nameMatch = extractedText.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/);
          if (nameMatch) setCandidateName(nameMatch[1]);
          break;
        case 'rubric':
          setRubricText(extractedText);
          setRubricFile(file);
          setHasRubric(true);
          break;
      }

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} file processed successfully`);
    } catch (error) {
      console.error(`Error processing ${type} file:`, error);
      
      // Provide more specific error messages
      if (error?.message?.includes('size')) {
        toast.error(`File too large. Please use a file smaller than 2MB.`);
      } else if (error?.message?.includes('type')) {
        toast.error(`Unsupported file type. Please use PDF, DOC, DOCX, or TXT files.`);
      } else if (error?.details) {
        toast.error(`Failed to process file: ${error.details}`);
      } else {
        toast.error(`Failed to process ${type} file. Please try again.`);
      }
    }
  };

  const handleUrlCrawl = async (url: string, type: 'job' | 'resume') => {
    if (!url.trim()) return;

    try {
      const content = await firecrawlService.crawlWebsite(url);
      if (content) {
        if (type === 'job') {
          setJobDescription(prev => prev + '\n\n' + content);
        } else {
          setResumeText(prev => prev + '\n\n' + content);
        }
        toast.success(`${type === 'job' ? 'Job posting' : 'Resume'} URL content extracted`);
      }
    } catch (error) {
      console.error(`Error crawling ${type} URL:`, error);
      toast.error(`Failed to extract content from ${type} URL`);
    }
  };

  const addUrl = (type: 'job' | 'resume') => {
    if (type === 'job') {
      setJobUrls([...jobUrls, '']);
    } else {
      setResumeUrls([...resumeUrls, '']);
    }
  };

  const updateUrl = (type: 'job' | 'resume', index: number, value: string) => {
    if (type === 'job') {
      const newUrls = [...jobUrls];
      newUrls[index] = value;
      setJobUrls(newUrls);
    } else {
      const newUrls = [...resumeUrls];
      newUrls[index] = value;
      setResumeUrls(newUrls);
    }
  };

  const removeUrl = (type: 'job' | 'resume', index: number) => {
    if (type === 'job') {
      setJobUrls(jobUrls.filter((_, i) => i !== index));
    } else {
      setResumeUrls(resumeUrls.filter((_, i) => i !== index));
    }
  };

  const analyzeAndPrepare = async () => {
    if (!jobDescription.trim() || !resumeText.trim()) {
      toast.error('Please provide both job description and resume');
      return;
    }

    if (!candidateName.trim()) {
      toast.error('Please enter the candidate name');
      return;
    }

    if (!jobTitle.trim()) {
      toast.error('Please enter the position title');
      return;
    }

    setIsProcessing(true);
    try {
      // Process all URLs
      for (const url of jobUrls.filter(u => u.trim())) {
        await handleUrlCrawl(url, 'job');
      }
      for (const url of resumeUrls.filter(u => u.trim())) {
        await handleUrlCrawl(url, 'resume');
      }

      // Parse company rubric if provided
      let companyRubric: CompanyRubric | undefined;
      if (hasRubric && rubricText) {
        // Here you would parse the rubric text into structured format
        // For now, we'll create a basic structure
        companyRubric = {
          id: 'custom-rubric',
          name: 'Company Evaluation Rubric',
          competencies: [],
          scoringScale: {
            min: 1,
            max: 5,
            labels: {
              1: 'Does not meet expectations',
              2: 'Partially meets expectations',
              3: 'Meets expectations',
              4: 'Exceeds expectations',
              5: 'Exceptional',
            },
          },
        };
      }

      const context: InterviewContext = {
        jobDescription,
        resume: resumeText,
        companyRubric,
        interviewType: interviewFrameworks.find(f => f.id === selectedFramework)!,
        candidateName,
        position: jobTitle,
        projectId: '', // This would come from project context
      };

      // Call the completion handler
      onPrepComplete(context);
      toast.success('Interview preparation complete!');
    } catch (error) {
      console.error('Error preparing interview:', error);
      toast.error('Failed to prepare interview');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="job">Job Details</TabsTrigger>
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="rubric">Company Rubric</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Job Details Tab */}
        <TabsContent value="job" className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Position Title</label>
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g., Senior Software Engineer"
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Job Description</label>
            <div className="flex gap-2 items-start">
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                rows={6}
                className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-1"
              />
              <UploadRequirementsButton
                onScrapedContent={(scrapedData) => {
                  setJobDescription(prev => 
                    prev 
                      ? `${prev}\n\n--- Content from ${scrapedData.url} ---\n${scrapedData.text}`
                      : scrapedData.text
                  );
                  toast.success('Successfully imported job description from URL');
                }}
                context="interview"
                size="sm"
                variant="inline"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Upload Job Posting</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-500 transition-colors">
              <input
                type="file"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'job')}
                className="hidden"
                id="job-file-upload"
                accept=".pdf,.doc,.docx,.txt"
              />
              <label htmlFor="job-file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-purple-600 font-medium">Click to upload job posting</p>
                {jobFile && (
                  <Badge variant="secondary" className="mt-2">
                    {jobFile.name}
                  </Badge>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Job Posting URLs</label>
            <div className="space-y-2">
              {jobUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={url}
                    onChange={(e) => updateUrl('job', index, e.target.value)}
                    placeholder="https://careers.company.com/job/123"
                    className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                  <Button
                    onClick={() => handleUrlCrawl(url, 'job')}
                    disabled={!url.trim()}
                    size="icon"
                    className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Link className="w-4 h-4" />
                  </Button>
                  {jobUrls.length > 1 && (
                    <Button
                      onClick={() => removeUrl('job', index)}
                      variant="destructive"
                      size="icon"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                onClick={() => addUrl('job')}
                variant="outline"
                className="w-full border-2 border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another URL
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Resume Tab */}
        <TabsContent value="resume" className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Candidate Name</label>
            <Input
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="John Doe"
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Resume Content</label>
            <Textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste resume content here..."
              rows={6}
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Upload Resume</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-500 transition-colors">
              <input
                type="file"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'resume')}
                className="hidden"
                id="resume-file-upload"
                accept=".pdf,.doc,.docx,.txt"
              />
              <label htmlFor="resume-file-upload" className="cursor-pointer">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-purple-600 font-medium">Click to upload resume</p>
                {resumeFile && (
                  <Badge variant="secondary" className="mt-2">
                    {resumeFile.name}
                  </Badge>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">LinkedIn / Portfolio URLs</label>
            <div className="space-y-2">
              {resumeUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={url}
                    onChange={(e) => updateUrl('resume', index, e.target.value)}
                    placeholder="https://linkedin.com/in/johndoe"
                    className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                  <Button
                    onClick={() => handleUrlCrawl(url, 'resume')}
                    disabled={!url.trim()}
                    size="icon"
                    className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Link className="w-4 h-4" />
                  </Button>
                  {resumeUrls.length > 1 && (
                    <Button
                      onClick={() => removeUrl('resume', index)}
                      variant="destructive"
                      size="icon"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                onClick={() => addUrl('resume')}
                variant="outline"
                className="w-full border-2 border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another URL
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Company Rubric Tab */}
        <TabsContent value="rubric" className="space-y-4">
          <Card className="p-4 bg-purple-50 border-2 border-purple-200">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-purple-600 mt-1" />
              <div>
                <h4 className="font-medium text-purple-900">Company Evaluation Rubric</h4>
                <p className="text-sm text-purple-700 mt-1">
                  Upload your company's competency framework or evaluation criteria to align the interview
                  with your specific requirements.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="has-rubric"
              checked={hasRubric}
              onChange={(e) => setHasRubric(e.target.checked)}
              className="w-4 h-4 text-purple-600"
            />
            <label htmlFor="has-rubric" className="text-sm font-medium">
              I have a company evaluation rubric
            </label>
          </div>

          {hasRubric && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Rubric Content</label>
                <Textarea
                  value={rubricText}
                  onChange={(e) => setRubricText(e.target.value)}
                  placeholder="Paste your competency framework or evaluation criteria..."
                  rows={6}
                  className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Upload Rubric File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-500 transition-colors">
                  <input
                    type="file"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'rubric')}
                    className="hidden"
                    id="rubric-file-upload"
                    accept=".pdf,.doc,.docx,.txt,.xlsx,.csv"
                  />
                  <label htmlFor="rubric-file-upload" className="cursor-pointer">
                    <Briefcase className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-purple-600 font-medium">Click to upload rubric</p>
                    {rubricFile && (
                      <Badge variant="secondary" className="mt-2">
                        {rubricFile.name}
                      </Badge>
                    )}
                  </label>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Interview Framework</label>
            <Select value={selectedFramework} onValueChange={setSelectedFramework}>
              <SelectTrigger className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {interviewFrameworks.map((framework) => (
                  <SelectItem key={framework.id} value={framework.id}>
                    <div>
                      <div className="font-medium">{framework.name}</div>
                      <div className="text-xs text-gray-500">{framework.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Interview Duration: {interviewDuration} minutes
            </label>
            <input
              type="range"
              min="30"
              max="120"
              step="15"
              value={interviewDuration}
              onChange={(e) => setInterviewDuration(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>30 min</span>
              <span>60 min</span>
              <span>90 min</span>
              <span>120 min</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <h4 className="font-medium mb-2">AI Assistance Level</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="radio" name="ai-level" value="high" defaultChecked />
                  <span className="text-sm">High - Proactive suggestions</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="ai-level" value="medium" />
                  <span className="text-sm">Medium - On-demand help</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="ai-level" value="low" />
                  <span className="text-sm">Low - Minimal assistance</span>
                </label>
              </div>
            </Card>

            <Card className="p-4 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <h4 className="font-medium mb-2">Focus Areas</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Technical Skills</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Soft Skills</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Cultural Fit</span>
                </label>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button
          onClick={analyzeAndPrepare}
          disabled={isProcessing || !jobDescription.trim() || !resumeText.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 
                   border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                   hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing & Preparing...
            </>
          ) : (
            <>
              Generate Interview Guide
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}