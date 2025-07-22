import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical,
  MapPin, 
  Briefcase, 
  ExternalLink, 
  Mail, 
  User,
  Building,
  Star,
  Phone,
  Copy,
  Loader2,
  Plus,
  EyeOff,
  Maximize2
} from 'lucide-react';
import { SearchResult } from '../types';
import { toast } from 'sonner';
import { extractYearsOfExperience } from '../hooks/google-search/utils';
import { cn } from '@/lib/utils';

interface ContactInfo {
  work_email?: string;
  personal_emails?: string[];
  mobile_phone?: string;
  linkedin_username?: string;
  location_name?: string;
  job_title?: string;
  job_company_name?: string;
}

interface CompactProfileCardProps {
  result: SearchResult;
  index: number;
  onGetContactInfo: (profileUrl: string, profileName: string) => Promise<ContactInfo | null>;
  onSearchContacts: (name: string, company: string, location: string) => void;
  contactInfo?: ContactInfo | null;
  isLoadingContact?: boolean;
  jobId?: string | null;
  searchString?: string | null;
  projectId?: string | null;
  onOmit?: (profileId: string) => void;
  isOmitted?: boolean;
  onExpand?: () => void;
  viewMode?: 'grid' | 'list';
}

export const CompactProfileCard: React.FC<CompactProfileCardProps> = ({ 
  result, 
  onGetContactInfo,
  onSearchContacts,
  contactInfo,
  isLoadingContact,
  jobId = null,
  searchString = null,
  projectId = null,
  onOmit,
  isOmitted = false,
  onExpand,
  viewMode = 'grid'
}) => {
  const [localContactInfo, setLocalContactInfo] = useState<ContactInfo | null>(contactInfo || null);
  const [isEnriching, setIsEnriching] = useState(false);
  
  const { name, location, company } = React.useMemo(() => {
    const nameMatch = result.title?.match(/^([^-–—]+)/);
    const name = nameMatch ? nameMatch[1].trim() : result.title || 'Unknown';
    
    const locationMatch = result.snippet?.match(/Location:\s*([^·•]+)/i) || 
                         result.snippet?.match(/📍\s*([^·•]+)/);
    const location = locationMatch ? locationMatch[1].trim() : '';
    
    const companyMatch = result.snippet?.match(/(?:at|@)\s+([^·•\-]+?)(?:\s*[·•\-]|\s*$)/i);
    const company = companyMatch ? companyMatch[1].trim() : '';
    
    return { name, location, company };
  }, [result]);

  const yearsOfExperience = extractYearsOfExperience(result.snippet || '');

  const handleEnrichProfile = async () => {
    if (localContactInfo || isEnriching) return;
    
    setIsEnriching(true);
    try {
      const info = await onGetContactInfo(result.link, name);
      if (info) {
        setLocalContactInfo(info);
        toast.success('Contact information found!');
      } else {
        toast.error('No contact information found');
      }
    } catch (error) {
      toast.error('Failed to enrich profile');
    } finally {
      setIsEnriching(false);
    }
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${fieldName} copied to clipboard`);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleOmit = () => {
    if (onOmit) {
      onOmit(result.link);
      toast.success('Profile hidden from results');
    }
  };

  if (isOmitted) return null;

  return (
    <Card className={cn(
      "group hover:shadow-lg transition-all duration-200 border-2",
      viewMode === 'grid' ? "h-full flex flex-col" : "flex items-center p-4"
    )}>
      <div className={cn(
        "flex",
        viewMode === 'grid' ? "flex-col h-full" : "flex-row items-center gap-4 flex-1"
      )}>
        {/* Header Section */}
        <div className={cn(
          "flex items-start justify-between",
          viewMode === 'grid' ? "p-4 pb-2" : "flex-1"
        )}>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate pr-2">{name}</h3>
            <p className="text-sm text-gray-600 truncate">{result.title?.replace(name, '').replace(/^[\s-–—]+/, '')}</p>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {company && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Building className="w-3 h-3" />
                  <span className="truncate max-w-[120px]">{company}</span>
                </div>
              )}
              {location && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate max-w-[120px]">{location}</span>
                </div>
              )}
              {yearsOfExperience && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Briefcase className="w-3 h-3" />
                  <span>{yearsOfExperience}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => window.open(result.link, '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                View LinkedIn Profile
              </DropdownMenuItem>
              
              {onExpand && (
                <DropdownMenuItem onClick={onExpand}>
                  <Maximize2 className="w-4 h-4 mr-2" />
                  View Full Details
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleEnrichProfile} disabled={isEnriching || !!localContactInfo}>
                {isEnriching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Finding Contact Info...
                  </>
                ) : localContactInfo ? (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Info Available
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Get Contact Info
                  </>
                )}
              </DropdownMenuItem>
              
              {localContactInfo?.work_email && (
                <DropdownMenuItem onClick={() => copyToClipboard(localContactInfo.work_email!, 'Email')}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Email
                </DropdownMenuItem>
              )}
              
              {localContactInfo?.mobile_phone && (
                <DropdownMenuItem onClick={() => copyToClipboard(localContactInfo.mobile_phone!, 'Phone')}>
                  <Phone className="w-4 h-4 mr-2" />
                  Copy Phone
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => onSearchContacts(name, company, location)}>
                <Mail className="w-4 h-4 mr-2" />
                Search Other Sources
              </DropdownMenuItem>
              
              {onOmit && (
                <DropdownMenuItem onClick={handleOmit} className="text-red-600">
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide from Results
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Contact Info Section (if available) */}
        {localContactInfo && viewMode === 'grid' && (
          <div className="px-4 pb-4 pt-2 border-t mt-auto">
            <div className="space-y-1">
              {localContactInfo.work_email && (
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="w-3 h-3 text-gray-400" />
                  <span className="truncate text-gray-600">{localContactInfo.work_email}</span>
                </div>
              )}
              {localContactInfo.mobile_phone && (
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-600">{localContactInfo.mobile_phone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions for List View */}
        {viewMode === 'list' && (
          <div className="flex items-center gap-2">
            {localContactInfo ? (
              <div className="flex items-center gap-2 text-sm">
                {localContactInfo.work_email && (
                  <Badge variant="secondary" className="text-xs">
                    <Mail className="w-3 h-3 mr-1" />
                    Email
                  </Badge>
                )}
                {localContactInfo.mobile_phone && (
                  <Badge variant="secondary" className="text-xs">
                    <Phone className="w-3 h-3 mr-1" />
                    Phone
                  </Badge>
                )}
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleEnrichProfile}
                disabled={isEnriching}
              >
                {isEnriching ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <User className="w-3 h-3 mr-1" />
                    Get Contact
                  </>
                )}
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(result.link, '_blank')}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};