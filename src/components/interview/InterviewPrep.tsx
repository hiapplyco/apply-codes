import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { UploadRequirementsButton } from '@/components/url-scraper';

interface Question {
  question: string;
  assesses: string;
}

interface InterviewPrepResponse {
  interviewType: string;
  tooltip: string;
  questions: Question[];
}

const interviewTypes = [
  {
    id: 'behavioral',
    name: 'Behavioral',
    tooltip:
      'Focuses on past behaviors to predict future performance. Questions often start with "Tell me about a time when..."',
  },
  {
    id: 'star',
    name: 'STAR Method',
    tooltip:
      'Situation, Task, Action, Result. Used to assess past behavior and predict future performance by asking candidates to describe specific examples of their experiences.',
  },
  {
    id: 'technical',
    name: 'Technical',
    tooltip:
      'Evaluates a candidate\'s technical skills and knowledge. Can include coding challenges, system design questions, or theoretical concepts.',
  },
  {
    id: 'case-study',
    name: 'Case Study',
    tooltip:
      'Presents business problems or analytical challenges to assess problem-solving skills, analytical thinking, and business acumen.',
  },
  {
    id: 'cultural-fit',
    name: 'Cultural Fit',
    tooltip:
      'Assesses alignment with company values, team dynamics, and organizational culture to ensure a good match.',
  },
  {
    id: 'panel',
    name: 'Panel Interview',
    tooltip:
      'Multiple interviewers assess the candidate simultaneously, providing diverse perspectives and comprehensive evaluation.',
  },
  {
    id: 'screening',
    name: 'Phone/Video Screening',
    tooltip:
      'Initial assessment to evaluate basic qualifications, communication skills, and interest in the position.',
  },
  {
    id: 'executive',
    name: 'Executive Interview',
    tooltip:
      'Focuses on leadership capabilities, strategic thinking, vision, and ability to drive organizational success.',
  },
  {
    id: 'competency',
    name: 'Competency-Based',
    tooltip:
      'Evaluates specific skills and competencies required for the role through structured questions and scenarios.',
  },
  {
    id: 'stress',
    name: 'Stress Interview',
    tooltip:
      'Tests how candidates handle pressure, challenging situations, and unexpected questions to assess resilience.',
  },
  {
    id: 'group',
    name: 'Group Interview',
    tooltip:
      'Multiple candidates are interviewed together to assess teamwork, leadership, and how they interact with others.',
  },
  {
    id: 'custom',
    name: 'Custom Framework',
    tooltip:
      'Create your own interview structure tailored to your specific needs and evaluation criteria.',
  },
];

interface InterviewPrepProps {
  onInterviewStart?: (data: {
    roleTitle: string;
    roleDescription: string;
    interviewType: string;
    context: string;
  }) => void;
}

export function InterviewPrep({ onInterviewStart }: InterviewPrepProps = {}) {
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<InterviewPrepResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processingFiles, setProcessingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setProcessingFiles(true);
    const newFiles: File[] = [];
    let combinedText = context;

    for (const file of files) {
      try {
        // Create FormData to match edge function expectations
        const formData = new FormData();
        formData.append('file', file);
        
        // Get the current user for the userId requirement
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Please sign in to upload files');
          continue;
        }
        formData.append('userId', user.id);
        
        // Call edge function with FormData
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-document`;
        console.log('Uploading file to:', url);
        console.log('File name:', file.name);
        console.log('File type:', file.type);
        console.log('File size:', file.size);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: formData,
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok || !data.success) {
          console.error('Upload failed:', { 
            status: response.status, 
            error: data.error,
            data 
          });
          toast.error(`Failed to process ${file.name}: ${data.error || 'Unknown error'}`);
        } else if (data?.text) {
          combinedText += `\n\n--- Content from ${file.name} ---\n${data.text}`;
          newFiles.push(file);
          toast.success(`Successfully processed ${file.name}`);
        }
      } catch (err) {
        console.error('Full error details:', {
          error: err,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
          errorStack: err instanceof Error ? err.stack : undefined
        });
        toast.error(`Error processing ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    setContext(combinedText);
    setUploadedFiles([...uploadedFiles, ...newFiles]);
    setProcessingFiles(false);

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    // TODO: Also remove the file content from the context
  };

  const handleSubmit = async (interviewType: string) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    const { data, error } = await supabase.functions.invoke('prepare-interview', {
      body: { context, interviewType },
    });

    if (error) {
      setError(error.message);
    } else {
      setResponse(data);
    }

    setLoading(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Interview Preparation Room</h2>
      <div className="mb-4 space-y-4">
        <div className="flex gap-2 items-start">
          <Textarea
            placeholder="Paste job description, resume, or any other relevant context here..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="min-h-[200px] flex-1"
            rows={10}
          />
          <UploadRequirementsButton
            onScrapedContent={(scrapedData) => {
              setContext(prev => 
                prev 
                  ? `${prev}\n\n--- Content from ${scrapedData.url} ---\n${scrapedData.text}`
                  : scrapedData.text
              );
              toast.success('Successfully imported content from URL');
            }}
            context="interview"
            size="sm"
            variant="inline"
          />
        </div>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.rtf,.odt"
            onChange={handleFileUpload}
            className="hidden"
            id="fileUpload"
          />
          <label htmlFor="fileUpload" className="cursor-pointer">
            {processingFiles ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 text-gray-400 animate-spin mb-2" />
                <p className="text-sm text-gray-600">Processing files...</p>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  Click to upload job descriptions, resumes, or other context files
                </p>
                <p className="text-xs text-gray-500">
                  Supported formats: PDF, DOC, DOCX, TXT, RTF, ODT
                </p>
              </>
            )}
          </label>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Select Interview Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <TooltipProvider>
            {interviewTypes.map(({ id, name, tooltip }) => (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => handleSubmit(id)} 
                    disabled={loading || !context}
                    variant="outline"
                    className="h-auto py-3 px-4 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {name}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {response && (
        <div>
          <h3 className="text-xl font-bold mb-2">{response.interviewType} Interview Questions</h3>
          <p className="text-sm text-gray-500 mb-4">{response.tooltip}</p>
          <ul className="space-y-4">
            {response.questions.map((q, index) => (
              <li key={index}>
                <p className="font-semibold">{q.question}</p>
                <p className="text-sm text-gray-600">Assesses: {q.assesses}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}