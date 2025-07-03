/**
 * Simple markdown to HTML converter for content generation
 * Handles common markdown elements like headers, lists, bold, italic, etc.
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // Handle headers (### -> h3, ## -> h2, # -> h1)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Handle bold text (**text** or __text__)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Handle italic text (*text* or _text_)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Handle unordered lists (- item or * item)
  html = html.replace(/^[\s]*[\-\*\+]\s+(.*$)/gim, '<li>$1</li>');
  
  // Wrap consecutive list items in <ul> tags
  html = html.replace(/(<li>.*<\/li>)/gs, (match) => {
    return `<ul>${match}</ul>`;
  });

  // Handle ordered lists (1. item)
  html = html.replace(/^[\s]*\d+\.\s+(.*$)/gim, '<li>$1</li>');
  
  // Wrap consecutive numbered list items in <ol> tags
  html = html.replace(/(<li>.*<\/li>)/gs, (match) => {
    // If it doesn't already have <ul> tags, wrap with <ol>
    if (!match.includes('<ul>')) {
      return `<ol>${match.replace(/<ul>|<\/ul>/g, '')}</ol>`;
    }
    return match;
  });

  // Handle line breaks (double newlines become paragraph breaks)
  html = html.replace(/\n\n/g, '</p><p>');
  
  // Handle single line breaks
  html = html.replace(/\n/g, '<br>');

  // Wrap content in paragraphs if not already wrapped
  if (!html.includes('<h1>') && !html.includes('<h2>') && !html.includes('<h3>') && 
      !html.includes('<ul>') && !html.includes('<ol>') && !html.includes('<p>')) {
    html = `<p>${html}</p>`;
  } else if (!html.startsWith('<')) {
    html = `<p>${html}`;
    if (!html.endsWith('</p>')) {
      html += '</p>';
    }
  }

  // Clean up any malformed HTML
  html = html.replace(/<p><\/p>/g, ''); // Remove empty paragraphs
  html = html.replace(/<p>(<h[1-6]>)/g, '$1'); // Don't wrap headers in paragraphs
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1'); // Don't wrap headers in paragraphs
  html = html.replace(/<p>(<ul>)/g, '$1'); // Don't wrap lists in paragraphs
  html = html.replace(/(<\/ul>)<\/p>/g, '$1'); // Don't wrap lists in paragraphs
  html = html.replace(/<p>(<ol>)/g, '$1'); // Don't wrap ordered lists in paragraphs
  html = html.replace(/(<\/ol>)<\/p>/g, '$1'); // Don't wrap ordered lists in paragraphs

  return html.trim();
}

/**
 * Enhanced markdown to HTML converter with better list handling
 */
export function advancedMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';

  // Split into lines for better processing
  const lines = markdown.split('\n');
  const result: string[] = [];
  let inList = false;
  let listType = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
      }
      result.push('');
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
      }
      result.push(`<h3>${line.substring(4)}</h3>`);
    } else if (line.startsWith('## ')) {
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
      }
      result.push(`<h2>${line.substring(3)}</h2>`);
    } else if (line.startsWith('# ')) {
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
      }
      result.push(`<h1>${line.substring(2)}</h1>`);
    }
    // Unordered lists
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList || listType !== 'ul') {
        if (inList) result.push(`</${listType}>`);
        result.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      const listItem = line.substring(2);
      result.push(`<li>${processInlineMarkdown(listItem)}</li>`);
    }
    // Ordered lists
    else if (/^\d+\.\s/.test(line)) {
      if (!inList || listType !== 'ol') {
        if (inList) result.push(`</${listType}>`);
        result.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      const listItem = line.replace(/^\d+\.\s/, '');
      result.push(`<li>${processInlineMarkdown(listItem)}</li>`);
    }
    // Regular paragraphs
    else {
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
      }
      result.push(`<p>${processInlineMarkdown(line)}</p>`);
    }
  }

  // Close any remaining lists
  if (inList) {
    result.push(`</${listType}>`);
  }

  return result.join('\n');
}

/**
 * Process inline markdown (bold, italic, etc.)
 */
function processInlineMarkdown(text: string): string {
  let result = text;
  
  // Bold (**text** or __text__)
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Italic (*text* or _text_)
  result = result.replace(/\*(.*?)\*/g, '<em>$1</em>');
  result = result.replace(/_(.*?)_/g, '<em>$1</em>');
  
  return result;
}