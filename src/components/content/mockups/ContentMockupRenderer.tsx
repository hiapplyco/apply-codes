/**
 * ContentMockupRenderer
 *
 * Router component that maps content types to their appropriate mockup components.
 * Handles prop transformation and metadata extraction for each content type.
 */

import { LinkedInPostMockup } from './LinkedInPostMockup';
import { EmailMockup } from './EmailMockup';
import { DocumentMockup } from './DocumentMockup';
import { InterviewQuestionsMockup } from './InterviewQuestionsMockup';
import { cn } from '@/lib/utils';

// Image data structure for download/copy functionality
interface ImageData {
  base64Data: string;
  mimeType: string;
  dataUrl: string;
}

export interface GeneratedContent {
  type: string;
  content: string;
  metadata?: {
    imageUrl?: string;
    imageData?: ImageData;
    imageStorageUrl?: string;
    imageStoragePath?: string;
    hashtags?: string[];
    subject?: string;
    jobTitle?: string;
    companyName?: string;
    senderName?: string;
    senderEmail?: string;
    recipientName?: string;
    recipientEmail?: string;
  };
}

interface ContentMockupRendererProps {
  contentType: string;
  content: GeneratedContent;
  className?: string;
}

// Content type mapping
const CONTENT_TYPE_MAP: Record<string, string> = {
  'Job Description': 'document',
  'LinkedIn Job Post': 'linkedin',
  'Cold Outreach Email': 'email',
  'Interview Questions': 'questions',
  'Rejection Letter': 'email',
  'Offer Letter': 'document',
};

export function ContentMockupRenderer({
  contentType,
  content,
  className,
}: ContentMockupRendererProps) {
  const mockupType = CONTENT_TYPE_MAP[contentType] || 'document';
  const { content: textContent, metadata = {} } = content;

  // Extract common metadata
  const jobTitle = metadata.jobTitle || extractJobTitle(textContent) || 'Position';
  const companyName = metadata.companyName || 'Your Company';

  switch (mockupType) {
    case 'linkedin':
      return (
        <LinkedInPostMockup
          content={textContent}
          authorName={metadata.senderName || 'Talent Acquisition'}
          authorTitle="Recruiter"
          companyName={companyName}
          imageUrl={metadata.imageUrl}
          imageData={metadata.imageData}
          hashtags={metadata.hashtags || extractHashtags(textContent)}
          className={cn("w-full", className)}
        />
      );

    case 'email':
      const isRejection = contentType === 'Rejection Letter';
      const isOutreach = contentType === 'Cold Outreach Email';
      return (
        <EmailMockup
          content={textContent}
          subject={metadata.subject || extractSubject(textContent, contentType)}
          senderName={metadata.senderName || (isRejection ? 'HR Team' : 'Talent Acquisition')}
          senderEmail={metadata.senderEmail || 'recruiting@company.com'}
          recipientName={metadata.recipientName || 'Candidate'}
          recipientEmail={metadata.recipientEmail || 'candidate@email.com'}
          isOutreach={isOutreach}
          className={cn("w-full", className)}
        />
      );

    case 'questions':
      return (
        <InterviewQuestionsMockup
          content={textContent}
          jobTitle={jobTitle}
          className={cn("w-full", className)}
        />
      );

    case 'document':
    default:
      const documentType = contentType === 'Job Description'
        ? 'job-description'
        : contentType === 'Offer Letter'
          ? 'offer-letter'
          : 'generic';
      return (
        <DocumentMockup
          content={textContent}
          title={contentType}
          documentType={documentType}
          companyName={companyName}
          className={cn("w-full", className)}
        />
      );
  }
}

// Helper functions for metadata extraction

function extractJobTitle(content: string): string | null {
  // Look for common patterns
  const patterns = [
    /Job Title:\s*(.+?)(?:\n|$)/i,
    /Position:\s*(.+?)(?:\n|$)/i,
    /Role:\s*(.+?)(?:\n|$)/i,
    /^#\s*(.+?)(?:\n|$)/m,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) return match[1].trim();
  }

  return null;
}

function extractHashtags(content: string): string[] {
  const matches = content.match(/#\w+/g) || [];
  return matches.map(h => h.slice(1));
}

function extractSubject(content: string, contentType: string): string {
  // Try to find subject line in content
  const subjectMatch = content.match(/Subject:\s*(.+?)(?:\n|$)/i);
  if (subjectMatch) return subjectMatch[1].trim();

  // Generate default subject based on content type
  switch (contentType) {
    case 'Cold Outreach Email':
      return 'Exciting Career Opportunity';
    case 'Rejection Letter':
      return 'Update on Your Application';
    default:
      return 'Important Message';
  }
}

export default ContentMockupRenderer;
