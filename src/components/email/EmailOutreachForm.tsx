import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Mail, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface EmailOutreachFormProps {
  candidateProfileUrl: string;
  candidateName?: string;
  projectId?: string;
  onEmailSent?: () => void;
}

interface EmailResult {
  success: boolean;
  message?: string;
  error?: string;
  recipient?: string;
  subject?: string;
}

export function EmailOutreachForm({ 
  candidateProfileUrl, 
  candidateName, 
  projectId,
  onEmailSent 
}: EmailOutreachFormProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [customText, setCustomText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailResult, setEmailResult] = useState<EmailResult | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || '');
  const [projects, setProjects] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Fetch user's projects when modal opens
  useEffect(() => {
    if (isOpen && user && !projectId) {
      fetchProjects();
    }
  }, [isOpen, user, projectId]);

  // Update selected project when prop changes
  useEffect(() => {
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  }, [projectId]);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, color')
        .eq('user_id', user?.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleSendEmail = async () => {
    if (!customText.trim()) {
      toast.error('Please enter a custom message');
      return;
    }

    if (!selectedProjectId) {
      toast.error('Please select a project to send this email from');
      return;
    }

    setIsLoading(true);
    setEmailResult(null);

    try {
      const response = await fetch('/functions/v1/send-outreach-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`,
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          candidateProfileUrl,
          userCustomText: customText
        })
      });

      const result = await response.json();

      if (result.success) {
        setEmailResult(result);
        toast.success('Email sent successfully!');
        onEmailSent?.();
        
        // Clear form after successful send
        setTimeout(() => {
          setCustomText('');
          setEmailResult(null);
          setIsOpen(false);
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setEmailResult({ success: false, error: errorMessage });
      toast.error(`Failed to send email: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCustomText('');
    setEmailResult(null);
    setIsLoading(false);
    if (!projectId) {
      setSelectedProjectId('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          variant="outline"
          className="border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)] transition-all duration-200"
        >
          <Mail className="w-4 h-4 mr-2" />
          Send Email
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Mail className="w-5 h-5" />
            Send Outreach Email
          </DialogTitle>
          {candidateName && (
            <p className="text-sm text-gray-600 mt-1">
              To: <span className="font-medium">{candidateName}</span>
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Project Selector - Only show if no project is pre-selected */}
          {!projectId && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Send from Project *
              </label>
              <Select 
                value={selectedProjectId} 
                onValueChange={setSelectedProjectId}
                disabled={isLoading || loadingProjects}
              >
                <SelectTrigger className="border-2 border-gray-300 focus:border-purple-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                  <SelectValue placeholder={loadingProjects ? "Loading projects..." : "Select a project"} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {projects.length === 0 && !loadingProjects && (
                <p className="text-xs text-red-600 mt-1">
                  No projects found. Please create a project first to send emails.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Your Custom Message *
            </label>
            <Textarea
              placeholder="e.g., I noticed your experience with React and TypeScript aligns perfectly with what we're looking for. Would you be interested in learning more about this exciting opportunity?"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="min-h-[120px] border-2 border-gray-300 focus:border-purple-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] transition-all duration-200"
              disabled={isLoading}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                This message will be personalized with project details and candidate info
              </p>
              <span className="text-xs text-gray-400">
                {customText.length}/500
              </span>
            </div>
          </div>

          {emailResult && (
            <div className={`p-4 rounded-lg border-2 ${
              emailResult.success 
                ? 'border-green-500 bg-green-50' 
                : 'border-red-500 bg-red-50'
            }`}>
              <div className="flex items-start gap-2">
                {emailResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
                    emailResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {emailResult.success ? 'Email Sent Successfully!' : 'Failed to Send Email'}
                  </p>
                  {emailResult.success && emailResult.recipient && (
                    <p className="text-sm text-green-700 mt-1">
                      Sent to: {emailResult.recipient}
                    </p>
                  )}
                  {emailResult.success && emailResult.subject && (
                    <p className="text-sm text-green-700">
                      Subject: {emailResult.subject}
                    </p>
                  )}
                  {emailResult.error && (
                    <p className="text-sm text-red-700 mt-1">
                      {emailResult.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
            className="border-2 border-gray-300 hover:border-gray-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={isLoading || !customText.trim() || !selectedProjectId}
            className="bg-purple-600 hover:bg-purple-700 text-white border-2 border-purple-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)] transition-all duration-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}