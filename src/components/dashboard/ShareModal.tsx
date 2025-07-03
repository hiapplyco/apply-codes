import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Link, 
  Mail, 
  MessageSquare, 
  Users, 
  Code, 
  Eye, 
  Download, 
  MessageCircle, 
  X, 
  Copy, 
  Check, 
  Trash2,
  Clock,
  Globe,
  Lock,
  Loader
} from 'lucide-react';
import { Button } from '../ui/button';
import { useDashboardSharing } from '../../hooks/useDashboardSharing';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  dashboardTitle: string;
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

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  jobId,
  dashboardTitle
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'embed'>('create');
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    expiryDays: 30,
    isPublic: false,
    permissions: {
      canView: true,
      canExport: false,
      canComment: false
    }
  });
  const [emailRecipient, setEmailRecipient] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<any>(null);

  const {
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
    updateLinkPermissions
  } = useDashboardSharing(jobId);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      loadExistingLinks();
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, loadExistingLinks]);

  if (!isOpen) return null;

  const handleGenerateLink = async () => {
    try {
      const link = await generateShareableLink(shareOptions);
      setGeneratedLink(link);
      setActiveTab('manage');
    } catch (error) {
      console.error('Failed to generate link:', error);
    }
  };

  const handleCopyUrl = async (url: string) => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    }
  };

  const handleEmailShare = (link: any) => {
    if (emailRecipient) {
      shareViaEmail(link, emailRecipient, shareMessage);
      setEmailRecipient('');
      setShareMessage('');
    }
  };

  const expiryOptions = [
    { label: '24 hours', value: 1 },
    { label: '7 days', value: 7 },
    { label: '30 days', value: 30 },
    { label: '90 days', value: 90 },
    { label: '1 year', value: 365 }
  ];

  const tabs = [
    { id: 'create', label: 'Create Link', icon: Link },
    { id: 'manage', label: 'Manage Links', icon: Users },
    { id: 'embed', label: 'Embed Code', icon: Code }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-lg shadow-2xl border-2 border-black overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-black bg-gray-50">
          <div className="flex items-center space-x-3">
            <Share2 className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Share Dashboard</h2>
              <p className="text-gray-600">{dashboardTitle}</p>
            </div>
          </div>

          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-black bg-gray-50">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'create' && (
            <div className="space-y-6">
              {/* Share Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Link Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Link Settings</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expires In</label>
                    <select
                      value={shareOptions.expiryDays}
                      onChange={(e) => setShareOptions(prev => ({ ...prev, expiryDays: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      {expiryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={shareOptions.isPublic}
                        onChange={(e) => setShareOptions(prev => ({ ...prev, isPublic: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 border-2 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Public Link</span>
                    </label>
                    <p className="text-xs text-gray-600 ml-6">
                      {shareOptions.isPublic ? 'Anyone with the link can access' : 'Only people you share with can access'}
                    </p>
                  </div>
                </div>

                {/* Permissions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Permissions</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={shareOptions.permissions.canView}
                        onChange={(e) => setShareOptions(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, canView: e.target.checked }
                        }))}
                        className="w-4 h-4 text-purple-600 border-2 border-gray-300 rounded focus:ring-purple-500"
                        disabled // Always enabled
                      />
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Can View</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={shareOptions.permissions.canExport}
                        onChange={(e) => setShareOptions(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, canExport: e.target.checked }
                        }))}
                        className="w-4 h-4 text-purple-600 border-2 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <div className="flex items-center space-x-2">
                        <Download className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Can Export</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={shareOptions.permissions.canComment}
                        onChange={(e) => setShareOptions(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, canComment: e.target.checked }
                        }))}
                        className="w-4 h-4 text-purple-600 border-2 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Can Comment</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Generate Link Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleGenerateLink}
                  disabled={isGeneratingLink}
                  className="bg-purple-600 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-purple-700"
                >
                  {isGeneratingLink ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Generating Link...
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4 mr-2" />
                      Generate Shareable Link
                    </>
                  )}
                </Button>
              </div>

              {/* Generated Link Preview */}
              {generatedLink && (
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">Link Generated Successfully!</p>
                      <p className="text-xs text-green-700 mt-1 break-all">{generatedLink.url}</p>
                    </div>
                    <Button
                      onClick={() => handleCopyUrl(generatedLink.url)}
                      size="sm"
                      variant="outline"
                      className="ml-4 border-green-400 text-green-700 hover:bg-green-100"
                    >
                      {copiedUrl === generatedLink.url ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Active Shared Links</h3>
                <span className="text-sm text-gray-600">{shareableLinks.length} active links</span>
              </div>

              {shareableLinks.length === 0 ? (
                <div className="text-center py-8">
                  <Link className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No shared links yet</p>
                  <p className="text-sm text-gray-500">Create a link in the "Create Link" tab</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {shareableLinks.map(link => (
                    <div key={link.id} className="border-2 border-black rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {link.isPublic ? (
                              <Globe className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Lock className="w-4 h-4 text-gray-600" />
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {link.isPublic ? 'Public Link' : 'Private Link'}
                            </span>
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                              ID: {link.id.slice(-8)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 break-all mb-2">{link.url}</p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Expires: {link.expiresAt.toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {link.permissions.canView && <Eye className="w-3 h-3" />}
                              {link.permissions.canExport && <Download className="w-3 h-3" />}
                              {link.permissions.canComment && <MessageCircle className="w-3 h-3" />}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            onClick={() => handleCopyUrl(link.url)}
                            size="sm"
                            variant="outline"
                            className="border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          >
                            {copiedUrl === link.url ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                          
                          <Button
                            onClick={() => revokeShareableLink(link.id)}
                            size="sm"
                            variant="outline"
                            className="border-2 border-red-300 text-red-600 hover:bg-red-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Quick Share Options */}
                      <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-200">
                        <span className="text-xs text-gray-600">Quick share:</span>
                        <Button
                          onClick={() => shareViaEmail(link, '', 'Check out this recruitment dashboard:')}
                          size="sm"
                          variant="outline"
                          className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-2 py-1"
                        >
                          <Mail className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => shareViaSlack(link, 'Recruitment Dashboard Update:')}
                          size="sm"
                          variant="outline"
                          className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-2 py-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => shareViaTeams(link, 'Recruitment Dashboard Update:')}
                          size="sm"
                          variant="outline"
                          className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-2 py-1"
                        >
                          <Users className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'embed' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Embed Dashboard</h3>
                <p className="text-gray-600 mb-4">
                  Embed this dashboard in your website or application using the iframe code below.
                </p>
              </div>

              {shareableLinks.length > 0 ? (
                <div className="space-y-4">
                  {shareableLinks.map(link => (
                    <div key={link.id} className="border-2 border-black rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-900">
                          Embed Code (Link: {link.id.slice(-8)})
                        </span>
                        <Button
                          onClick={() => handleCopyUrl(generateEmbedCode(link))}
                          size="sm"
                          variant="outline"
                          className="border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                        >
                          {copiedUrl === generateEmbedCode(link) ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <code className="text-sm text-gray-800 break-all">
                          {generateEmbedCode(link)}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No shareable links available</p>
                  <p className="text-sm text-gray-500">Create a shareable link first to generate embed code</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t-2 border-black bg-gray-50">
          <div className="text-sm text-gray-600">
            Secure sharing with customizable permissions
          </div>
          
          <Button
            onClick={onClose}
            className="bg-gray-600 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-700"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};