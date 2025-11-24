import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  MapPin, 
  Briefcase, 
  Building2, 
  User,
  Mail,
  Phone,
  Globe,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Star
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { EnrichedInfoModal } from '../enriched-info-modal/EnrichedInfoModal';
import { Profile, EnrichedProfileData } from '@/components/search/types';
import { cn } from '@/lib/utils';
import { functionBridge } from '@/lib/function-bridge';

interface ProfileCardProps {
  profile: any;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

// Helper function to parse LinkedIn snippet data
const parseLinkedInSnippet = (snippet: string, title: string) => {
  if (!snippet) return { jobTitle: '', company: '', location: '' };
  
  // LinkedIn snippets typically follow patterns like:
  // "Job Title - Company Name - Location · Experience..."
  // "Name · Job Title at Company · Location"
  
  // Remove the name from the beginning if it matches the title
  const nameFromTitle = title?.split(' | ')[0] || '';
  let cleanSnippet = snippet;
  
  // Remove name if it starts the snippet
  if (cleanSnippet.startsWith(nameFromTitle)) {
    cleanSnippet = cleanSnippet.substring(nameFromTitle.length).trim();
  }
  
  // Remove leading · or - 
  cleanSnippet = cleanSnippet.replace(/^[·\-\s]+/, '').trim();
  
  // Try to extract structured data
  let jobTitle = '';
  let company = '';
  let location = '';
  
  // Pattern 1: "Job Title at Company · Location"
  const atPattern = /^([^·]+?)\s+at\s+([^·]+)(?:\s*·\s*(.+))?/;
  const atMatch = cleanSnippet.match(atPattern);
  
  if (atMatch) {
    jobTitle = atMatch[1].trim();
    company = atMatch[2].trim();
    location = atMatch[3]?.split('·')[0]?.trim() || '';
  } else {
    // Pattern 2: "Job Title - Company - Location"
    const dashParts = cleanSnippet.split(/\s*[-–]\s*/);
    
    if (dashParts.length >= 2) {
      jobTitle = dashParts[0].trim();
      company = dashParts[1].trim();
      
      // Location might be after a · or the third dash part
      const remainingText = dashParts.slice(2).join(' ');
      const dotParts = remainingText.split('·');
      location = dotParts[0]?.trim() || '';
    } else {
      // Pattern 3: Look for location patterns after ·
      const parts = cleanSnippet.split('·');
      
      if (parts.length > 0) {
        // First part is usually job/company info
        const firstPart = parts[0].trim();
        
        // Try to separate job title and company
        if (firstPart.includes(' at ')) {
          const [job, comp] = firstPart.split(' at ');
          jobTitle = job.trim();
          company = comp.trim();
        } else {
          jobTitle = firstPart;
        }
        
        // Look for location in remaining parts
        for (let i = 1; i < parts.length; i++) {
          const part = parts[i].trim();
          // Check if this looks like a location (contains comma, or common location keywords)
          if (part.includes(',') || 
              part.match(/\b(Area|Greater|Metro|City|Bay|County)\b/i) ||
              part.match(/\b[A-Z][a-z]+\s*,\s*[A-Z]{2}\b/)) {
            location = part.split('·')[0].trim();
            break;
          }
        }
      }
    }
  }
  
  // Clean up location - remove experience info
  if (location) {
    location = location.split('·')[0].split('•')[0].trim();
    location = location.replace(/\s*\d+\+?\s*years?\s*.*$/i, '').trim();
    location = location.replace(/\s*\d+\s*connections?\s*.*$/i, '').trim();
  }
  
  return { jobTitle, company, location };
};

export const ProfileCardV2: React.FC<ProfileCardProps> = ({ 
  profile: originalProfile,
  isExpanded: externalIsExpanded,
  onToggleExpand: externalToggleExpand
}) => {
  const [showModal, setShowModal] = useState(false);
  const [enrichedData, setEnrichedData] = useState<EnrichedProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalExpanded, setInternalExpanded] = useState(false);
  const { toast } = useToast();
  
  // Use external expand state if provided, otherwise use internal
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalExpanded;
  const toggleExpand = externalToggleExpand || (() => setInternalExpanded(!internalExpanded));
  
  // Parse the snippet to extract structured data
  const { jobTitle, company, location } = parseLinkedInSnippet(
    originalProfile.snippet || '', 
    originalProfile.profile_name || originalProfile.title || ''
  );
  
  // Convert the original profile to the Profile type with parsed data
  const profile: Profile = {
    name: originalProfile.profile_name || originalProfile.name || '',
    title: jobTitle || originalProfile.profile_title || originalProfile.jobTitle || '',
    location: location || originalProfile.profile_location || originalProfile.location || '',
    profile_name: originalProfile.profile_name || originalProfile.name || '',
    profile_title: jobTitle || originalProfile.profile_title || originalProfile.jobTitle || '',
    profile_location: location || originalProfile.profile_location || originalProfile.location || '',
    profile_url: originalProfile.profile_url || originalProfile.link || '',
    snippet: originalProfile.snippet || '',
  };
  
  const handleEnrichProfile = async () => {
    setShowModal(true);
    
    if (!enrichedData && !loading) {
      setLoading(true);
      setError(null);
      
      try {
        const data = await functionBridge.getContactInfo({
          profileUrl: profile.profile_url
        });

        const payload = (data as any)?.data ?? data;

        if (!payload) {
          setEnrichedData(null);
          toast({
            title: "No contact information available",
            description: "We could not find contact information for this profile yet."
          });
          return;
        }

        const enrichedProfileData: EnrichedProfileData = {
          name: profile.profile_name,
          profile: profile,
          ...payload,
        };
        
        setEnrichedData(enrichedProfileData);
        toast({
          title: "Contact information ready",
          description: "Enriched profile details are now available in the modal."
        });
      } catch (err) {
        console.error('Error enriching profile:', err);
        setError(typeof err === 'object' && err !== null && 'message' in err 
          ? (err as Error).message 
          : 'Error retrieving contact information');
        toast({
          title: "Error",
          description: "Could not retrieve contact information",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Extract profile completeness if available
  const completeness = originalProfile.snippet?.match(/(\d+)%\s*Complete/i)?.[1];
  
  return (
    <>
      <Card className={cn(
        "group hover:shadow-md transition-all duration-200 border border-gray-200",
        "bg-white hover:bg-gray-50/50",
        isExpanded && "shadow-md bg-gray-50/50"
      )}>
        <div className="p-4">
          {/* Header Section */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Name and Profile Completeness */}
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-semibold text-blue-700 hover:underline cursor-pointer truncate">
                  <a 
                    href={profile.profile_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    {profile.profile_name}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                </h3>
                {completeness && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {completeness}% Complete
                  </span>
                )}
              </div>
              
              {/* Job Title and Company */}
              <div className="space-y-1">
                {profile.profile_title && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Briefcase className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="font-medium">{profile.profile_title}</span>
                  </div>
                )}
                
                {company && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span>{company}</span>
                  </div>
                )}
                
                {profile.profile_location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span>{profile.profile_location}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Expand/Collapse Button */}
            <Button
              onClick={toggleExpand}
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 rounded-full",
                "hover:bg-gray-200 transition-colors"
              )}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              )}
            </Button>
          </div>

          {/* Expanded Content */}
          {isExpanded && profile.snippet && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600 leading-relaxed">
                {profile.snippet}
              </p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <a 
                href={profile.profile_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-700 hover:text-blue-800 hover:underline font-medium"
              >
                View LinkedIn Profile
              </a>
            </div>
            
            <Button 
              onClick={handleEnrichProfile}
              disabled={loading}
              size="sm"
              className={cn(
                "bg-purple-600 hover:bg-purple-700 text-white",
                "shadow-sm hover:shadow transition-all",
                "font-medium"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Mail className="h-3.5 w-3.5 mr-1.5" />
                  Get Contact Info
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Contact Info Modal */}
      <EnrichedInfoModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        profile={profile}
        profileData={enrichedData}
        isLoading={loading}
        error={error}
      />
    </>
  );
};

// Export a list component for multiple profiles
export const ProfilesListV2 = ({ profiles }: { profiles: any[] }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  return (
    <div className="space-y-3">
      {profiles.map((profile, index) => {
        const profileId = profile.profile_url || profile.link || `profile-${index}`;
        return (
          <ProfileCardV2 
            key={profileId}
            profile={profile}
            isExpanded={expandedId === profileId}
            onToggleExpand={() => setExpandedId(expandedId === profileId ? null : profileId)}
          />
        );
      })}
    </div>
  );
};
