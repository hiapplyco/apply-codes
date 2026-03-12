import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mail, X, Copy, Send, ExternalLink } from 'lucide-react';

interface EmailTemplatesSectionProps {
  emails: any[];
  onClear: () => void;
  onCopyToClipboard: (text: string) => void;
  onSendOutreach: (email: { candidate: string; subject: string; body: string; profileUrl: string }, index: number) => void;
}

export function EmailTemplatesSection({
  emails,
  onClear,
  onCopyToClipboard,
  onSendOutreach,
}: EmailTemplatesSectionProps) {
  if (emails.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 border-0 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Mail className="h-3.5 w-3.5 text-blue-600" />
          </div>
          Email Templates
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{emails.length}</Badge>
        </h2>
        <Button
          onClick={onClear}
          variant="outline"
          size="sm"
        >
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {emails.map((email, index) => (
          <div key={index} className="border rounded-lg bg-white">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">{'\u{1F4E7}'} {email.candidateName}</h3>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                    onClick={() => onCopyToClipboard(email.subject)}
                  >
                    Copy Subject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                    onClick={() => onCopyToClipboard(email.body)}
                  >
                    Copy Email
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Subject:</div>
                <div className="text-sm font-medium text-purple-600 bg-purple-50 p-2 rounded border">
                  {email.subject}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Email Body:</div>
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {email.body}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <a
                  href={email.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View LinkedIn Profile
                </a>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                    onClick={() => onCopyToClipboard(`Subject: ${email.subject}\n\n${email.body}`)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    className="h-6 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => onSendOutreach({
                      candidate: email.candidateName,
                      subject: email.subject,
                      body: email.body,
                      profileUrl: email.profileUrl
                    }, index)}
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
