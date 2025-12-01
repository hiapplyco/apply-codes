import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GoogleDrive,
  FileText,
  Upload,
  Download,
  Share2,
  Copy,
  ExternalLink,
  Settings,
  Info,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Lock,
  Globe,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { functionBridge } from '@/lib/function-bridge';

interface GoogleDocsModalProps {
  content: string;
  onExport: () => Promise<void>;
  onClose: () => void;
  isExporting: boolean;
  currentDocUrl?: string;
}

interface ExportSettings {
  title: string;
  format: 'docx' | 'pdf' | 'html' | 'txt';
  sharing: 'private' | 'anyone_with_link' | 'domain';
  folder: string;
  description: string;
}

interface ShareSettings {
  permission: 'view' | 'comment' | 'edit';
  notifyCollaborators: boolean;
  message: string;
}

export function GoogleDocsModal({
  content,
  onExport,
  onClose,
  isExporting,
  currentDocUrl
}: GoogleDocsModalProps) {
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    title: `Apply Content - ${new Date().toLocaleDateString()}`,
    format: 'docx',
    sharing: 'private',
    folder: 'root',
    description: 'Generated content from Apply platform'
  });

  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    permission: 'edit',
    notifyCollaborators: true,
    message: 'Content created with Apply - please review and provide feedback'
  });

  const [isSharing, setIsSharing] = useState(false);
  const [shareEmails, setShareEmails] = useState('');
  const [availableFolders, setAvailableFolders] = useState<Array<{ id: string, name: string }>>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [shareUrl, setShareUrl] = useState(currentDocUrl || '');
  const [exportProgress, setExportProgress] = useState(0);

  const { currentAccount } = useGoogleAuth();

  // Load available folders
  useEffect(() => {
    if (currentAccount) {
      loadAvailableFolders();
    }
  }, [currentAccount, loadAvailableFolders]);

  const loadAvailableFolders = useCallback(async () => {
    if (!currentAccount) return;

    setLoadingFolders(true);
    try {
      const response = await functionBridge.getDriveFolders({
        accountId: currentAccount.id
      });

      setAvailableFolders([
        { id: 'root', name: 'My Drive' },
        ...(response.folders || [])
      ]);
    } catch (error) {
      console.error('Error loading folders:', error);
      toast.error('Failed to load Google Drive folders');
    } finally {
      setLoadingFolders(false);
    }
  }, [currentAccount]);

  const handleExportWithSettings = async () => {
    try {
      setExportProgress(25);

      const exportResult = await functionBridge.exportToGoogleDocs({
        content,
        title: exportSettings.title,
        format: exportSettings.format,
        sharing: exportSettings.sharing,
        folderId: exportSettings.folder,
        description: exportSettings.description,
        accountId: currentAccount?.id
      });

      setExportProgress(75);

      setShareUrl(exportResult.documentUrl);
      setExportProgress(100);

      toast.success('Content exported to Google Docs successfully!');

      // Auto-copy link if sharing is enabled
      if (exportSettings.sharing !== 'private') {
        navigator.clipboard.writeText(exportResult.documentUrl);
        toast.success('Document link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error exporting to Google Docs:', error);
      toast.error('Failed to export to Google Docs');
      setExportProgress(0);
    }
  };

  const handleShare = async () => {
    if (!shareUrl) {
      toast.error('Please export the document first');
      return;
    }

    if (!shareEmails.trim()) {
      toast.error('Please enter email addresses to share with');
      return;
    }

    setIsSharing(true);
    try {
      const emails = shareEmails.split(',').map(email => email.trim()).filter(email => email);

      await functionBridge.shareGoogleDoc({
        documentUrl: shareUrl,
        emails,
        permission: shareSettings.permission,
        notify: shareSettings.notifyCollaborators,
        message: shareSettings.message,
        accountId: currentAccount?.id
      });

      toast.success(`Document shared with ${emails.length} recipient(s)`);
      setShareEmails('');
    } catch (error) {
      console.error('Error sharing document:', error);
      toast.error('Failed to share document');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Document link copied to clipboard!');
    }
  };

  const getContentPreview = () => {
    const textContent = content.replace(/<[^>]*>/g, '');
    return textContent.length > 200 ? textContent.substring(0, 200) + '...' : textContent;
  };

  const getSharingIcon = () => {
    switch (exportSettings.sharing) {
      case 'private':
        return <Lock className="w-4 h-4" />;
      case 'anyone_with_link':
        return <Globe className="w-4 h-4" />;
      case 'domain':
        return <Users className="w-4 h-4" />;
      default:
        return <Lock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="export" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="export">Export Settings</TabsTrigger>
          <TabsTrigger value="share" disabled={!shareUrl}>Share Document</TabsTrigger>
          <TabsTrigger value="preview">Content Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GoogleDrive className="w-5 h-5" />
                <span>Export to Google Docs</span>
              </CardTitle>
              <CardDescription>
                Configure how your content will be exported to Google Drive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doc-title">Document Title</Label>
                <Input
                  id="doc-title"
                  value={exportSettings.title}
                  onChange={(e) => setExportSettings(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter document title..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-format">Export Format</Label>
                <Select
                  value={exportSettings.format}
                  onValueChange={(value: 'docx' | 'pdf' | 'html' | 'txt') =>
                    setExportSettings(prev => ({ ...prev, format: value }))
                  }
                >
                  <SelectTrigger id="doc-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="docx">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Google Docs (.docx)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="pdf">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>PDF Document</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="html">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>HTML File</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="txt">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Plain Text</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-folder">Destination Folder</Label>
                <Select
                  value={exportSettings.folder}
                  onValueChange={(value) => setExportSettings(prev => ({ ...prev, folder: value }))}
                  disabled={loadingFolders}
                >
                  <SelectTrigger id="doc-folder">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFolders.map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadingFolders && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Loading folders...</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-sharing">Sharing Settings</Label>
                <Select
                  value={exportSettings.sharing}
                  onValueChange={(value: 'private' | 'anyone_with_link' | 'domain') =>
                    setExportSettings(prev => ({ ...prev, sharing: value }))
                  }
                >
                  <SelectTrigger id="doc-sharing">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">
                      <div className="flex items-center space-x-2">
                        <Lock className="w-4 h-4" />
                        <span>Private (Only you)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="anyone_with_link">
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span>Anyone with link</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="domain">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>Anyone in organization</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-description">Description (Optional)</Label>
                <Textarea
                  id="doc-description"
                  value={exportSettings.description}
                  onChange={(e) => setExportSettings(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add a description for the document..."
                  className="min-h-[80px]"
                />
              </div>

              {exportProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Export Progress</span>
                    <span className="text-sm font-medium">{exportProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={handleExportWithSettings}
                  disabled={isExporting || !currentAccount}
                  className="flex-1"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Export to Google Docs
                    </>
                  )}
                </Button>
                {shareUrl && (
                  <Button
                    variant="outline"
                    onClick={handleCopyLink}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="share" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Share2 className="w-5 h-5" />
                <span>Share Document</span>
              </CardTitle>
              <CardDescription>
                Share your exported document with team members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {shareUrl && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>Document exported successfully!</span>
                      <div className="flex items-center space-x-2">
                        {getSharingIcon()}
                        <Badge variant="outline" className="text-xs">
                          {exportSettings.sharing.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="share-emails">Email Addresses</Label>
                <Input
                  id="share-emails"
                  value={shareEmails}
                  onChange={(e) => setShareEmails(e.target.value)}
                  placeholder="Enter email addresses separated by commas..."
                />
                <p className="text-xs text-gray-600">
                  Separate multiple email addresses with commas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="share-permission">Permission Level</Label>
                <Select
                  value={shareSettings.permission}
                  onValueChange={(value: 'view' | 'comment' | 'edit') =>
                    setShareSettings(prev => ({ ...prev, permission: value }))
                  }
                >
                  <SelectTrigger id="share-permission">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View Only</SelectItem>
                    <SelectItem value="comment">Can Comment</SelectItem>
                    <SelectItem value="edit">Can Edit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="share-message">Message (Optional)</Label>
                <Textarea
                  id="share-message"
                  value={shareSettings.message}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Add a message for the recipients..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notify-collaborators"
                  checked={shareSettings.notifyCollaborators}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, notifyCollaborators: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="notify-collaborators" className="text-sm">
                  Notify collaborators by email
                </Label>
              </div>

              <Button
                onClick={handleShare}
                disabled={isSharing || !shareUrl || !shareEmails.trim()}
                className="w-full"
              >
                {isSharing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Document
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Content Preview</span>
              </CardTitle>
              <CardDescription>
                Preview of the content that will be exported
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-sm text-gray-600 mb-2">Content Preview:</p>
                <p className="text-sm">{getContentPreview()}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Title:</p>
                  <p className="text-gray-600">{exportSettings.title}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Format:</p>
                  <p className="text-gray-600">{exportSettings.format.toUpperCase()}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Sharing:</p>
                  <div className="flex items-center space-x-2">
                    {getSharingIcon()}
                    <span className="text-gray-600">{exportSettings.sharing.replace('_', ' ')}</span>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Word Count:</p>
                  <p className="text-gray-600">{content.replace(/<[^>]*>/g, '').split(/\s+/).length} words</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        {shareUrl && (
          <Button
            variant="outline"
            onClick={() => window.open(shareUrl, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in Google Docs
          </Button>
        )}
      </div>
    </div>
  );
}
