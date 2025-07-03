import { useState, useCallback } from 'react';

interface ShareableLink {
  id: string;
  url: string;
  expiresAt: Date;
  isPublic: boolean;
  permissions: {
    canView: boolean;
    canExport: boolean;
    canComment: boolean;
  };
}

interface ShareOptions {
  expiryDays: number;
  isPublic: boolean;
  permissions: {
    canView: boolean;
    canExport: boolean;
    canComment: boolean;
  };
}

export const useDashboardSharing = (jobId: string) => {
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [shareableLinks, setShareableLinks] = useState<ShareableLink[]>([]);

  const generateShareableLink = useCallback(async (options: ShareOptions): Promise<ShareableLink> => {
    setIsGeneratingLink(true);
    
    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const linkId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/dashboard/shared/${linkId}`;
      
      const shareableLink: ShareableLink = {
        id: linkId,
        url: shareUrl,
        expiresAt: new Date(Date.now() + options.expiryDays * 24 * 60 * 60 * 1000),
        isPublic: options.isPublic,
        permissions: options.permissions
      };

      setShareableLinks(prev => [...prev, shareableLink]);
      
      // In a real app, this would be stored in the database
      // For now, we'll store in localStorage
      const existingLinks = JSON.parse(localStorage.getItem(`dashboard_shares_${jobId}`) || '[]');
      existingLinks.push(shareableLink);
      localStorage.setItem(`dashboard_shares_${jobId}`, JSON.stringify(existingLinks));
      
      return shareableLink;
    } catch (error) {
      console.error('Failed to generate shareable link:', error);
      throw error;
    } finally {
      setIsGeneratingLink(false);
    }
  }, [jobId]);

  const revokeShareableLink = useCallback(async (linkId: string) => {
    try {
      // Remove from state
      setShareableLinks(prev => prev.filter(link => link.id !== linkId));
      
      // Remove from localStorage
      const existingLinks = JSON.parse(localStorage.getItem(`dashboard_shares_${jobId}`) || '[]');
      const filteredLinks = existingLinks.filter((link: ShareableLink) => link.id !== linkId);
      localStorage.setItem(`dashboard_shares_${jobId}`, JSON.stringify(filteredLinks));
      
      // In a real app, this would call an API to invalidate the link
      console.log(`Revoked shareable link: ${linkId}`);
    } catch (error) {
      console.error('Failed to revoke shareable link:', error);
      throw error;
    }
  }, [jobId]);

  const copyToClipboard = useCallback(async (url: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        textArea.remove();
        return success;
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }, []);

  const generateEmbedCode = useCallback((shareableLink: ShareableLink, width = '100%', height = '600px') => {
    return `<iframe 
  src="${shareableLink.url}?embed=true" 
  width="${width}" 
  height="${height}" 
  frameborder="0" 
  allowfullscreen>
</iframe>`;
  }, []);

  const shareViaEmail = useCallback((shareableLink: ShareableLink, recipient: string, message?: string) => {
    const subject = `Recruitment Dashboard - Job ${jobId}`;
    const body = `${message || 'Please find the recruitment dashboard link below:'}\n\n${shareableLink.url}\n\nThis link will expire on ${shareableLink.expiresAt.toLocaleDateString()}.`;
    
    const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  }, [jobId]);

  const shareViaSlack = useCallback((shareableLink: ShareableLink, message?: string) => {
    const slackMessage = `${message || 'Recruitment Dashboard Update'}\n${shareableLink.url}`;
    const slackUrl = `https://slack.com/app_redirect?channel=&team=&tab=&message=${encodeURIComponent(slackMessage)}`;
    window.open(slackUrl, '_blank');
  }, []);

  const shareViaTeams = useCallback((shareableLink: ShareableLink, message?: string) => {
    const teamsMessage = `${message || 'Recruitment Dashboard Update'} ${shareableLink.url}`;
    const teamsUrl = `https://teams.microsoft.com/share?msgText=${encodeURIComponent(teamsMessage)}`;
    window.open(teamsUrl, '_blank');
  }, []);

  const loadExistingLinks = useCallback(() => {
    try {
      const existingLinks = JSON.parse(localStorage.getItem(`dashboard_shares_${jobId}`) || '[]');
      const validLinks = existingLinks.filter((link: ShareableLink) => 
        new Date(link.expiresAt) > new Date()
      );
      setShareableLinks(validLinks);
      
      // Update localStorage to remove expired links
      if (validLinks.length !== existingLinks.length) {
        localStorage.setItem(`dashboard_shares_${jobId}`, JSON.stringify(validLinks));
      }
    } catch (error) {
      console.error('Failed to load existing links:', error);
    }
  }, [jobId]);

  const getShareableLink = useCallback((linkId: string): ShareableLink | undefined => {
    return shareableLinks.find(link => link.id === linkId);
  }, [shareableLinks]);

  const updateLinkPermissions = useCallback(async (
    linkId: string, 
    permissions: ShareableLink['permissions']
  ) => {
    try {
      setShareableLinks(prev => 
        prev.map(link => 
          link.id === linkId 
            ? { ...link, permissions }
            : link
        )
      );
      
      // Update localStorage
      const existingLinks = JSON.parse(localStorage.getItem(`dashboard_shares_${jobId}`) || '[]');
      const updatedLinks = existingLinks.map((link: ShareableLink) => 
        link.id === linkId 
          ? { ...link, permissions }
          : link
      );
      localStorage.setItem(`dashboard_shares_${jobId}`, JSON.stringify(updatedLinks));
    } catch (error) {
      console.error('Failed to update link permissions:', error);
      throw error;
    }
  }, [jobId]);

  return {
    shareableLinks,
    isGeneratingLink,
    generateShareableLink,
    revokeShareableLink,
    copyToClipboard,
    generateEmbedCode,
    shareViaEmail,
    shareViaSlack,
    shareViaTeams,
    loadExistingLinks,
    getShareableLink,
    updateLinkPermissions
  };
};