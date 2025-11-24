import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ExternalLink, Sparkles } from 'lucide-react';

interface PerplexityResultProps {
  content: string;
  citations?: string[];
  query?: string;
  compact?: boolean;
  className?: string;
}

export function PerplexityResult({
  content,
  citations = [],
  query,
  compact = false,
  className = ''
}: PerplexityResultProps) {
  // Extract citations from markdown links if not provided
  const extractedCitations = React.useMemo(() => {
    if (citations && citations.length > 0) {
      return citations;
    }

    // Parse markdown links from content
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links: string[] = [];
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      if (match[2] && !links.includes(match[2])) {
        links.push(match[2]);
      }
    }

    return links;
  }, [content, citations]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Query Header (if not compact) */}
      {query && !compact && (
        <div className="flex items-start gap-2 pb-3 border-b border-purple-200">
          <Sparkles className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-purple-900 mb-1">Search Query</h3>
            <p className="text-sm text-gray-700 italic">"{query}"</p>
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
                className="text-purple-600 hover:text-purple-800 underline decoration-purple-300 hover:decoration-purple-600 transition-colors inline-flex items-center gap-1"
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
                  className="bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded text-sm font-mono"
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
                className="border-l-4 border-purple-400 pl-4 italic text-gray-700 my-3"
                {...props}
              >
                {children}
              </blockquote>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {/* Citations Section */}
      {extractedCitations.length > 0 && !compact && (
        <div className="pt-3 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            Sources ({extractedCitations.length})
          </h4>
          <div className="space-y-1.5">
            {extractedCitations.map((citation, index) => {
              // Try to extract domain from URL
              let domain = citation;
              try {
                const url = new URL(citation);
                domain = url.hostname.replace('www.', '');
              } catch (e) {
                // If URL parsing fails, use the citation as-is
              }

              return (
                <a
                  key={index}
                  href={citation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-2 text-xs text-gray-600 hover:text-purple-700 transition-colors p-2 rounded hover:bg-purple-50"
                >
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-purple-100 text-purple-700 rounded-full text-[10px] font-semibold group-hover:bg-purple-200">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate group-hover:text-purple-900">
                      {domain}
                    </div>
                    <div className="text-gray-500 truncate text-[11px]">
                      {citation}
                    </div>
                  </div>
                  <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Compact Citations */}
      {extractedCitations.length > 0 && compact && (
        <div className="flex items-center gap-1 flex-wrap text-xs text-gray-500">
          <ExternalLink className="w-3 h-3" />
          <span>{extractedCitations.length} source{extractedCitations.length !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}
