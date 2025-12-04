/**
 * Card component to display enrichment results with contact info and save functionality
 */

import { useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Mail,
  Phone,
  Linkedin,
  Building2,
  MapPin,
  Copy,
  Check,
  ExternalLink,
  Folder,
  Loader2,
  ChevronDown,
  User,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { EnrichedProfileData } from './types';
import { useNewAuth } from '@/context/NewAuthContext';
import { useProjects } from '@/hooks/useProjects';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

interface EnrichmentResultCardProps {
  data: EnrichedProfileData;
  linkedinUrl?: string;
}

const EnrichmentResultCard = memo(({ data, linkedinUrl }: EnrichmentResultCardProps) => {
  const { user } = useNewAuth();
  const { projects } = useProjects();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedToProject, setSavedToProject] = useState<string | null>(null);

  // Derive name from various possible fields
  const name = data.name ||
    [data.profile?.first_name, data.profile?.last_name].filter(Boolean).join(' ') ||
    'Unknown';

  const jobTitle = data.job_title || data.title;
  const company = data.job_company_name || data.company;
  const location = data.location || [data.city, data.state, data.country].filter(Boolean).join(', ');

  // Get LinkedIn URL from data or props
  const profileLinkedIn = linkedinUrl ||
    data.social_profiles?.find(p => p.network === 'linkedin')?.url ||
    data.profiles?.find(p => p.network === 'linkedin')?.url;

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error('Could not copy to clipboard');
    }
  };

  const handleSaveToProject = async (projectId: string, projectName: string) => {
    if (!user) {
      toast.error('Please sign in to save candidates');
      return;
    }

    setIsSaving(true);
    try {
      if (!db) throw new Error('Database not initialized');

      // Create a unique ID for the candidate
      const candidateId = `enrich_${user.uid}_${Date.now()}`;

      const candidateData = {
        user_id: user.uid,
        name,
        linkedin_url: profileLinkedIn || null,
        job_title: jobTitle || null,
        company: company || null,
        location: location || null,
        work_email: data.work_email || null,
        personal_emails: data.personal_emails || [],
        mobile_phone: data.mobile_phone || null,
        phone_numbers: data.phone_numbers || [],
        source: 'manual_enrichment',
        enrichment_source: 'nymeria',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to saved_candidates collection
      const candidateRef = doc(db, 'saved_candidates', candidateId);
      await setDoc(candidateRef, candidateData);

      // Link to project
      const projectCandidateId = `proj_${projectId}_${candidateId}`;
      const projectCandidateRef = doc(db, 'project_candidates', projectCandidateId);
      await setDoc(projectCandidateRef, {
        project_id: projectId,
        candidate_id: candidateId,
        added_by: user.uid,
        created_at: new Date().toISOString()
      });

      setSavedToProject(projectId);
      toast.success(`Saved to ${projectName}`);
    } catch (error) {
      console.error('Error saving candidate:', error);
      toast.error('Could not save candidate. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const CopyButton = ({ value, fieldName }: { value: string; fieldName: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 hover:bg-gray-100"
      onClick={() => copyToClipboard(value, fieldName)}
    >
      {copiedField === fieldName ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4 text-gray-500" />
      )}
    </Button>
  );

  return (
    <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-2xl font-bold border-2 border-black">
              {name.charAt(0).toUpperCase()}
            </div>

            <div>
              <CardTitle className="text-xl font-bold text-gray-900">{name}</CardTitle>
              {jobTitle && (
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <Briefcase className="h-4 w-4" />
                  {jobTitle}
                  {company && <span className="text-gray-400"> at {company}</span>}
                </p>
              )}
              {location && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-4 w-4" />
                  {location}
                </p>
              )}
            </div>
          </div>

          {/* Save to Project dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isSaving}
                className="border-2 border-gray-300 hover:border-purple-500"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Folder className="h-4 w-4 mr-2" />
                )}
                Save to Project
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {projects && projects.length > 0 ? (
                projects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => handleSaveToProject(project.id, project.name)}
                    className="cursor-pointer"
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    {project.name}
                    {savedToProject === project.id && (
                      <Check className="h-4 w-4 ml-auto text-green-600" />
                    )}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>
                  No projects available
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
            <Check className="h-5 w-5" />
            Contact Information
          </h3>

          <div className="space-y-3">
            {/* Work Email */}
            {data.work_email && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Work Email:</span>
                  <a
                    href={`mailto:${data.work_email}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {data.work_email}
                  </a>
                  <Badge variant="secondary" className="text-xs">Work</Badge>
                </div>
                <CopyButton value={data.work_email} fieldName="work_email" />
              </div>
            )}

            {/* Personal Emails */}
            {data.personal_emails && data.personal_emails.length > 0 && (
              data.personal_emails.map((email, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Personal Email:</span>
                    <a
                      href={`mailto:${email}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {email}
                    </a>
                    <Badge variant="outline" className="text-xs">Personal</Badge>
                  </div>
                  <CopyButton value={email} fieldName={`personal_email_${idx}`} />
                </div>
              ))
            )}

            {/* Phone */}
            {(data.mobile_phone || (data.phone_numbers && data.phone_numbers.length > 0)) && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Phone:</span>
                  <a
                    href={`tel:${data.mobile_phone || data.phone_numbers?.[0]}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {data.mobile_phone || data.phone_numbers?.[0]}
                  </a>
                </div>
                <CopyButton
                  value={data.mobile_phone || data.phone_numbers?.[0] || ''}
                  fieldName="phone"
                />
              </div>
            )}

            {/* No contact info message */}
            {!data.work_email && !data.personal_emails?.length && !data.mobile_phone && !data.phone_numbers?.length && (
              <p className="text-sm text-gray-500">No contact information available</p>
            )}
          </div>
        </div>

        {/* Additional Info */}
        {(data.industry || data.company_size) && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {data.industry && (
              <div>
                <span className="text-gray-500">Industry:</span>
                <span className="ml-2 font-medium">{data.industry}</span>
              </div>
            )}
            {data.company_size && (
              <div>
                <span className="text-gray-500">Company Size:</span>
                <span className="ml-2 font-medium">{data.company_size}</span>
              </div>
            )}
          </div>
        )}

        {/* LinkedIn Button */}
        {profileLinkedIn && (
          <Button
            variant="outline"
            className="w-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() => window.open(profileLinkedIn, '_blank')}
          >
            <Linkedin className="h-4 w-4 mr-2" />
            View LinkedIn Profile
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
});

EnrichmentResultCard.displayName = 'EnrichmentResultCard';

export default EnrichmentResultCard;
