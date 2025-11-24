import { useState } from 'react';
import { toast } from 'sonner';
import { functionBridge } from '@/lib/function-bridge';

export interface EnrichedProfileData {
  work_email?: string;
  personal_emails?: string[];
  mobile_phone?: string;
  job_company_name?: string;
  industry?: string;
  job_title?: string;
  skills?: string[];
  profiles?: Array<{
    network: string;
    url: string;
    username: string;
  }>;
}

export interface Profile {
  profile_name: string;
  profile_title: string;
  profile_location: string;
  profile_url: string;
  relevance_score?: number;
}

export const useProfileEnrichment = () => {
  const [enrichedData, setEnrichedData] = useState<EnrichedProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const enrichProfile = async (profileUrl: string) => {
    if (!enrichedData && !loading) {
      setLoading(true);
      setError(null);
      
      let loadingToast: string | number | undefined;
      try {
        loadingToast = toast.loading("Fetching contact information...");
        const data = await functionBridge.enrichProfile({ profileUrl });
        const profileData = data?.data ?? data;
        setEnrichedData(profileData || null);
        
        if (profileData) {
          toast.success("Contact information found!");
          if (profileData.work_email) {
            toast.success(`Email: ${profileData.work_email}`);
          }
          if (profileData.mobile_phone) {
            toast.success(`Phone: ${profileData.mobile_phone}`);
          }
        } else {
          toast.error("No contact information found");
        }
      } catch (err) {
        console.error('Error enriching profile:', err);
        setError(typeof err === 'object' && err !== null && 'message' in err 
          ? (err as Error).message 
          : 'Error retrieving contact information');
        toast.error("Could not retrieve contact information");
      } finally {
        if (loadingToast !== undefined) {
          toast.dismiss(loadingToast);
        }
        setLoading(false);
      }
    }
    
    setShowModal(true);
  };

  return { 
    enrichedData, 
    loading, 
    error, 
    showModal, 
    setShowModal, 
    enrichProfile 
  };
};
