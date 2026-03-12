import { useState } from 'react';
import { toast } from 'sonner';
import { firestoreClient } from '@/lib/firebase-database-bridge';
import { functionBridge } from '@/lib/function-bridge';
import { trackProfileEnrichment, trackEvent } from '@/lib/analytics';
import type { SearchResult, ContactInfo } from '@/types/search-form';
import { extractLocationFromSnippet } from '@/types/search-form';

interface UseProfileActionsParams {
  searchResults: SearchResult[];
  jobDescription: string;
  selectedProjectId: string | null | undefined;
  userId: string | null;
  booleanString: string;
  checkAndExecute: (type: any, fn: () => Promise<any>) => Promise<any>;
  isLimitReached: (type: any) => boolean;
  incrementUsage: (type: any) => Promise<any>;
}

export function useProfileActions({
  searchResults,
  jobDescription,
  selectedProjectId,
  userId,
  booleanString,
  checkAndExecute,
  isLimitReached,
  incrementUsage,
}: UseProfileActionsParams) {
  // Profile selection and expansion
  const [selectedProfiles, setSelectedProfiles] = useState<Set<number>>(new Set());
  const [expandedProfiles, setExpandedProfiles] = useState<Set<number>>(new Set());

  // Analysis state
  const [analysisResults, setAnalysisResults] = useState<{ [key: number]: any }>({});
  const [loadingAnalysis, setLoadingAnalysis] = useState<Set<number>>(new Set());

  // Contact enrichment state
  const [contactInfo, setContactInfo] = useState<{ [key: number]: ContactInfo }>({});
  const [loadingContact, setLoadingContact] = useState<Set<number>>(new Set());

  // Saved candidates state
  const [savedCandidates, setSavedCandidates] = useState<Set<number>>(new Set());
  const [savingCandidates, setSavingCandidates] = useState<Set<number>>(new Set());

  // Batch operation states
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [isBatchEnriching, setIsBatchEnriching] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });

  // Email states
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailContext, setEmailContext] = useState('');
  const [generatedEmails, setGeneratedEmails] = useState<any[]>([]);
  const [isGeneratingEmails, setIsGeneratingEmails] = useState(false);

  // Core enrichment function
  const enrichProfile = async (profileUrl: string): Promise<ContactInfo | null> => {
    try {
      const data = await functionBridge.getContactInfo({ linkedin_url: profileUrl });
      const error = null;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error enriching profile:', error);
      return null;
    }
  };

  // Profile selection toggles
  const toggleProfileSelection = (index: number) => {
    const newSelected = new Set(selectedProfiles);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedProfiles(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProfiles.size === searchResults.length) {
      setSelectedProfiles(new Set());
    } else {
      setSelectedProfiles(new Set(searchResults.map((_, i) => i)));
    }
  };

  const toggleProfileExpansion = (index: number) => {
    const newExpanded = new Set(expandedProfiles);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedProfiles(newExpanded);
  };

  // Analyze a single candidate
  const analyzeCandidate = async (candidate: SearchResult, index: number) => {
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description first');
      return;
    }

    setLoadingAnalysis(prev => new Set([...prev, index]));
    try {
      const data = await functionBridge.analyzeCandidate({
        candidate: {
          name: candidate.title,
          profile: candidate.snippet,
          linkedin_url: candidate.link
        },
        requirements: jobDescription
      });
      const error = null;

      if (error) throw error;

      setAnalysisResults(prev => ({ ...prev, [index]: data }));
      toast.success('Candidate analyzed successfully!');
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Could not analyze candidate. Please try again.');
    } finally {
      setLoadingAnalysis(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  // Get contact info for a single candidate
  const getContactInfo = async (candidate: SearchResult, index: number) => {
    // Check usage limit before enriching
    if (isLimitReached('candidates_enriched')) {
      await checkAndExecute('candidates_enriched', async () => null);
      return;
    }

    setLoadingContact(prev => new Set([...prev, index]));
    try {
      const contactData = await enrichProfile(candidate.link);
      if (contactData) {
        setContactInfo(prev => ({ ...prev, [index]: contactData }));
        toast.success('Contact information retrieved!');
        // Increment enrichment usage count
        incrementUsage('candidates_enriched').catch(err => console.error('Failed to increment enrichment usage:', err));
        // Track successful enrichment
        trackProfileEnrichment(candidate.link, true);
        trackEvent('Profile Enrichment', {
          source: 'search_results',
          hasEmail: contactData.email ? 1 : 0,
          hasPhone: contactData.phone ? 1 : 0
        });
      } else {
        toast.info('No contact information available for this profile');
        trackProfileEnrichment(candidate.link, false);
      }
    } catch (error) {
      console.error('Contact enrichment failed:', error);
      toast.error('Could not retrieve contact information. Please try again.');
      trackProfileEnrichment(candidate.link, false);
    } finally {
      setLoadingContact(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  // Save a candidate to the database
  const saveCandidate = async (candidate: SearchResult, index: number) => {
    console.log('Saving candidate:', { candidate, selectedProjectId, index });

    if (!selectedProjectId) {
      console.error('No project selected for saving candidate');
      toast.error('Please select a project first');
      return;
    }

    setSavingCandidates(prev => new Set([...prev, index]));
    try {
      // Extract candidate details from search result
      const candidateData = {
        user_id: userId, // Add the user_id field that might be missing
        name: candidate.title.split(' - ')[0] || candidate.title, // Extract name from title
        job_title: candidate.title.includes(' - ') ? candidate.title.split(' - ')[1] : '',
        company: candidate.displayLink.includes('linkedin.com') ? '' : candidate.displayLink,
        location: candidate.location || '',
        linkedin_url: candidate.link,
        profile_summary: candidate.snippet,
        status: 'new' as const,
        tags: ['sourced'] as string[],
        enrichment_status: 'pending' as const
      };

      console.log('Candidate data to save:', candidateData);

      // Save candidate to database
      const insertCandidate = await firestoreClient
        .from('saved_candidates')
        .insert({
          ...candidateData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertCandidate.error) {
        console.error('Error saving candidate:', insertCandidate.error);
        throw insertCandidate.error;
      }

      const savedCandidate = (Array.isArray(insertCandidate.data)
        ? insertCandidate.data[0]
        : insertCandidate.data) as Record<string, any> | undefined;

      console.log('Candidate save result:', savedCandidate);

      // Add candidate to project if project is selected
      if (savedCandidate && selectedProjectId) {
        console.log('Adding candidate to project:', {
          candidateId: savedCandidate.id,
          projectId: selectedProjectId
        });

        const projectAssociation = await firestoreClient
          .from('project_candidates')
          .insert({
            project_id: selectedProjectId,
            candidate_id: savedCandidate.id,
            created_at: new Date().toISOString()
          });

        if (projectAssociation.error) {
          console.error('Error adding candidate to project:', projectAssociation.error);
          throw projectAssociation.error;
        }
      }

      // If we have contact info for this candidate, merge it
      const contactData = contactInfo[index];
      if (contactData && savedCandidate) {
        const updateData: any = {};
        if (contactData.email) updateData.work_email = contactData.email;
        if (contactData.phone) updateData.mobile_phone = contactData.phone;
        if (contactData.personal_emails) updateData.personal_emails = contactData.personal_emails;
        if (contactData.phone_numbers) updateData.phone_numbers = contactData.phone_numbers;

        if (Object.keys(updateData).length > 0) {
          updateData.enrichment_status = 'completed';
          await firestoreClient
            .from('saved_candidates')
            .update({
              ...updateData,
              updated_at: new Date().toISOString()
            })
            .eq('id', savedCandidate.id);
        }
      }

      setSavedCandidates(prev => new Set([...prev, index]));
      toast.success('Candidate saved successfully!');

      // Store search in history with project context
      if (booleanString) {
        await firestoreClient
          .from('search_history')
          .insert({
            search_query: booleanString,
            boolean_query: booleanString,
            platform: 'linkedin',
            results_count: searchResults.length,
            project_id: selectedProjectId,
            created_at: new Date().toISOString()
          });
      }

    } catch (error) {
      console.error('Error saving candidate:', error);
      toast.error('Could not save candidate. Please try again.');
    } finally {
      setSavingCandidates(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  // Batch analyze selected candidates
  const batchAnalyze = async () => {
    const selected = Array.from(selectedProfiles).filter(i => !analysisResults[i]);
    if (selected.length === 0) {
      toast.info('All selected candidates are already analyzed');
      return;
    }
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description first');
      return;
    }

    setIsBatchAnalyzing(true);
    setBatchProgress({ done: 0, total: selected.length });

    // Process in batches of 5 concurrent requests
    const BATCH_SIZE = 5;
    for (let i = 0; i < selected.length; i += BATCH_SIZE) {
      const batch = selected.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (idx) => {
        try {
          setLoadingAnalysis(prev => new Set([...prev, idx]));
          const data = await functionBridge.analyzeCandidate({
            candidate: {
              name: searchResults[idx].title,
              profile: searchResults[idx].snippet,
              linkedin_url: searchResults[idx].link
            },
            requirements: jobDescription
          });
          setAnalysisResults(prev => ({ ...prev, [idx]: data }));
        } catch (error) {
          console.error(`Batch analysis failed for index ${idx}:`, error);
        } finally {
          setLoadingAnalysis(prev => { const s = new Set(prev); s.delete(idx); return s; });
          setBatchProgress(prev => ({ ...prev, done: prev.done + 1 }));
        }
      }));
    }

    setIsBatchAnalyzing(false);
    toast.success(`Analyzed ${selected.length} candidates`);
  };

  // Batch enrich selected candidates
  const batchEnrich = async () => {
    const selected = Array.from(selectedProfiles).filter(i => !contactInfo[i]);
    if (selected.length === 0) {
      toast.info('All selected candidates are already enriched');
      return;
    }

    setIsBatchEnriching(true);
    setBatchProgress({ done: 0, total: selected.length });

    const BATCH_SIZE = 3; // Lower concurrency for rate-limited API
    for (let i = 0; i < selected.length; i += BATCH_SIZE) {
      const batch = selected.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (idx) => {
        try {
          setLoadingContact(prev => new Set([...prev, idx]));
          const contactData = await enrichProfile(searchResults[idx].link);
          if (contactData) {
            setContactInfo(prev => ({ ...prev, [idx]: contactData }));
            incrementUsage('candidates_enriched').catch(() => {});
          }
        } catch (error) {
          console.error(`Batch enrichment failed for index ${idx}:`, error);
        } finally {
          setLoadingContact(prev => { const s = new Set(prev); s.delete(idx); return s; });
          setBatchProgress(prev => ({ ...prev, done: prev.done + 1 }));
        }
      }));
    }

    setIsBatchEnriching(false);
    toast.success(`Enriched ${selected.length} candidates`);
  };

  // Export selected candidates to CSV
  const exportSelectedToCSV = () => {
    const selected = searchResults.filter((_, i) => selectedProfiles.has(i));
    if (selected.length === 0) {
      toast.error('Select candidates to export');
      return;
    }

    const headers = ['Name', 'Source', 'Title/Role', 'Company', 'Location', 'Profile URL', 'Snippet', 'Email', 'Phone'];
    const rows = selected.map((r, idx) => {
      const originalIdx = searchResults.indexOf(r);
      const contact = contactInfo[originalIdx];
      const name = (r as any).candidateName || r.title?.split(' | ')[0] || r.title?.split(' - ')[0] || r.title || '';
      const role = (r as any).candidateTitle || r.title?.split(' | ')[1] || r.title?.split(' - ')[1] || '';
      const company = (r as any).candidateCompany || '';
      const location = r.location || extractLocationFromSnippet(r.snippet) || '';
      const source = (r as any).source || 'linkedin';
      return [
        name,
        source,
        role,
        company,
        location,
        r.link,
        r.snippet?.replace(/"/g, '""').substring(0, 200) || '',
        contact?.email || '',
        contact?.phone || '',
      ].map(field => `"${field}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `candidates-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selected.length} candidates to CSV`);
  };

  // Generate email templates for selected candidates
  const generateEmailTemplates = async () => {
    const selectedResults = searchResults.filter((_, index) => selectedProfiles.has(index));

    if (selectedResults.length === 0) {
      toast.error('Please select some profiles first');
      return;
    }

    if (!jobDescription.trim()) {
      toast.error('Please enter a job description first');
      return;
    }

    setIsGeneratingEmails(true);
    try {
      // Prepare candidates data for the edge function
      const candidates = selectedResults.map(result => ({
        name: result.title.split(' - ')[0] || result.title,
        profileUrl: result.link,
        snippet: result.snippet,
        location: result.location
      }));

      const response = await functionBridge.generateEmailTemplates({
        candidates,
        jobDescription,
        context: emailContext.trim() || undefined
      });

      if (response?.success && response?.emailTemplates) {
        setGeneratedEmails(response.emailTemplates);
        toast.success(`Generated ${response.emailTemplates.length} email template(s)!`);
      } else {
        throw new Error('No email templates generated');
      }
    } catch (error) {
      console.error('Error generating email templates:', error);
      toast.error('Could not generate email templates. Please try again.');
    } finally {
      setIsGeneratingEmails(false);
    }
  };

  // Open email dialog (validates selection first)
  const openEmailDialog = () => {
    const selectedResults = searchResults.filter((_, index) => selectedProfiles.has(index));
    if (selectedResults.length === 0) {
      toast.error('Please select some profiles first');
      return;
    }
    setShowEmailDialog(true);
  };

  // Send outreach email for a candidate
  const sendOutreach = async (candidateEmail: { candidate: string; subject: string; body: string; profileUrl: string }, emailIdx: number) => {
    try {
      const result = await functionBridge.sendOutreachEmail({
        profileUrl: candidateEmail.profileUrl,
        projectId: selectedProjectId || undefined,
        customText: candidateEmail.body
      });
      toast.success(`Email sent to ${candidateEmail.candidate}`);
      return result;
    } catch (error) {
      console.error('Send outreach failed:', error);
      toast.error(`Failed to send email to ${candidateEmail.candidate}`);
      throw error;
    }
  };

  return {
    // Profile selection
    selectedProfiles,
    expandedProfiles,

    // Analysis
    analysisResults,
    loadingAnalysis,

    // Contact enrichment
    contactInfo,
    loadingContact,

    // Saved candidates
    savedCandidates,
    savingCandidates,

    // Batch operations
    isBatchAnalyzing,
    isBatchEnriching,
    batchProgress,

    // Email
    showEmailDialog,
    setShowEmailDialog,
    emailContext,
    setEmailContext,
    generatedEmails,
    setGeneratedEmails,
    isGeneratingEmails,

    // Actions
    toggleProfileSelection,
    toggleSelectAll,
    toggleProfileExpansion,
    analyzeCandidate,
    getContactInfo,
    saveCandidate,
    batchAnalyze,
    batchEnrich,
    exportSelectedToCSV,
    enrichProfile,
    generateEmailTemplates,
    openEmailDialog,
    sendOutreach,
  };
}
