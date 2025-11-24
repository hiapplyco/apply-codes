import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ExternalLink, Globe } from 'lucide-react';

interface FirecrawlResultProps {
  content: string;
  sourceUrl?: string;
  compact?: boolean;
  className?: string;
}

export function FirecrawlResult({
  content,
  sourceUrl,
  compact = false,
  className = ''
}: FirecrawlResultProps) {
  // Extract domain from source URL
  const getDomain = () => {
    if (!sourceUrl) return null;
    try {
      const url = sourceUrl.startsWith('http') ? sourceUrl : `https://${sourceUrl}`;
      return new URL(url).hostname;
    } catch (e) {
      return sourceUrl.replace(/^https?:\/\//, '').split('/')[0];
    }
  };

  const domain = getDomain();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Source Header (if not compact) */}
      {domain && !compact && (
        <div className="flex items-start gap-2 pb-3 border-b border-blue-200">
          <Globe className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Scraped from</h3>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-700 hover:text-blue-900 underline inline-flex items-center gap-1"
            >
              {domain}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Main Content with Markdown Rendering */}
      <div className={`prose prose-sm max-w-none ${compact ? 'prose-compact' : ''}`}>
        <ReactMarkdown
          components={{
            // Customize link rendering
            a: ({ node, children, href, ...props }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-600 transition-colors inline-flex items-center gap-1"
                {...props}
              >
                {children}
                <ExternalLink className="w-3 h-3 inline" />
              </a>
            ),
            // Customize paragraph rendering
            p: ({ node, children, ...props }) => (
              <p className="mb-3 text-gray-800 leading-relaxed" {...props}>
                {children}
              </p>
            ),
            // Customize heading rendering
            h1: ({ node, children, ...props }) => (
              <h1 className="text-xl font-bold text-gray-900 mb-3 mt-4" {...props}>
                {children}
              </h1>
            ),
            h2: ({ node, children, ...props }) => (
              <h2 className="text-lg font-semibold text-gray-900 mb-2 mt-3" {...props}>
                {children}
              </h2>
            ),
            h3: ({ node, children, ...props }) => (
              <h3 className="text-base font-semibold text-gray-800 mb-2 mt-2" {...props}>
                {children}
              </h3>
            ),
            // Customize list rendering
            ul: ({ node, children, ...props }) => (
              <ul className="list-disc list-inside mb-3 space-y-1 text-gray-800" {...props}>
                {children}
              </ul>
            ),
            ol: ({ node, children, ...props }) => (
              <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-800" {...props}>
                {children}
              </ol>
            ),
            // Customize code rendering
            code: ({ node, inline, children, ...props }) =>
              inline ? (
                <code
                  className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              ) : (
                <code
                  className="block bg-gray-50 text-gray-800 p-3 rounded-lg text-sm font-mono overflow-x-auto border border-gray-200"
                  {...props}
                >
                  {children}
                </code>
              ),
            // Customize blockquote rendering
            blockquote: ({ node, children, ...props }) => (
              <blockquote
                className="border-l-4 border-blue-400 pl-4 italic text-gray-700 my-3"
                {...props}
              >
                {children}
              </blockquote>
            ),
            // Customize table rendering
            table: ({ node, children, ...props }) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border border-gray-300" {...props}>
                  {children}
                </table>
              </div>
            ),
            thead: ({ node, children, ...props }) => (
              <thead className="bg-gray-100" {...props}>
                {children}
              </thead>
            ),
            th: ({ node, children, ...props }) => (
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold" {...props}>
                {children}
              </th>
            ),
            td: ({ node, children, ...props }) => (
              <td className="border border-gray-300 px-4 py-2" {...props}>
                {children}
              </td>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {/* Compact Source Link */}
      {domain && compact && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Globe className="w-3 h-3" />
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-700 underline"
          >
            {domain}
          </a>
        </div>
      )}
    </div>
  );
}
