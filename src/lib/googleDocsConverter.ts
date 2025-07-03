/**
 * Google Docs Content Conversion Utilities
 * 
 * Converts HTML content from Tiptap editor to Google Docs API format
 * with proper formatting preservation for headers, lists, bold, italic, etc.
 */

import { GoogleDocsRequest, GoogleDocsTextStyle, GoogleDocsParagraphStyle } from './GoogleDocsService';

// HTML parsing interface
interface HtmlElement {
  tagName: string;
  attributes: { [key: string]: string };
  children: (HtmlElement | string)[];
  textContent?: string;
}

// Content conversion context
interface ConversionContext {
  currentIndex: number;
  requests: GoogleDocsRequest[];
  listStack: Array<{ type: 'ul' | 'ol'; level: number }>;
  inList: boolean;
  listId?: string;
}

/**
 * Main HTML to Google Docs converter class
 */
export class GoogleDocsConverter {
  private static readonly HEADING_STYLES: { [key: string]: GoogleDocsParagraphStyle } = {
    h1: { namedStyleType: 'HEADING_1' },
    h2: { namedStyleType: 'HEADING_2' },
    h3: { namedStyleType: 'HEADING_3' },
    h4: { namedStyleType: 'HEADING_4' },
    h5: { namedStyleType: 'HEADING_5' },
    h6: { namedStyleType: 'HEADING_6' }
  };

  private static readonly TEXT_STYLES: { [key: string]: Partial<GoogleDocsTextStyle> } = {
    strong: { bold: true },
    b: { bold: true },
    em: { italic: true },
    i: { italic: true },
    u: { underline: true },
    s: { strikethrough: true },
    del: { strikethrough: true }
  };

  /**
   * Convert HTML content to Google Docs requests
   */
  static async convertHtmlToGoogleDocs(htmlContent: string): Promise<GoogleDocsRequest[]> {
    try {
      // Parse HTML content
      const parsedContent = this.parseHtml(htmlContent);
      
      // Initialize conversion context
      const context: ConversionContext = {
        currentIndex: 1, // Start at index 1 (after document start)
        requests: [],
        listStack: [],
        inList: false
      };

      // Convert parsed content to Google Docs requests
      await this.convertElements(parsedContent, context);

      return context.requests;
    } catch (error) {
      console.error('Error converting HTML to Google Docs:', error);
      // Fallback to plain text conversion
      return this.convertPlainText(htmlContent);
    }
  }

  /**
   * Parse HTML content into structured elements
   */
  private static parseHtml(html: string): HtmlElement[] {
    // Simple HTML parser - in production, you might want to use a proper HTML parser
    const elements: HtmlElement[] = [];
    
    // Remove HTML tags but preserve structure for basic parsing
    const cleanHtml = html.replace(/\n\s*\n/g, '\n').trim();
    
    // For this implementation, we'll use a simple regex-based approach
    // In a production environment, consider using a proper HTML parser like jsdom
    const tagPattern = /<(\w+)([^>]*)>(.*?)<\/\1>|<(\w+)([^>]*)\/?>/gs;
    const textPattern = /([^<]+)/g;
    
    let lastIndex = 0;
    let match;
    
    while ((match = tagPattern.exec(cleanHtml)) !== null) {
      // Add text before tag if any
      if (match.index > lastIndex) {
        const textBefore = cleanHtml.slice(lastIndex, match.index).trim();
        if (textBefore) {
          elements.push({
            tagName: 'text',
            attributes: {},
            children: [],
            textContent: textBefore
          });
        }
      }
      
      const tagName = match[1] || match[4];
      const attributes = this.parseAttributes(match[2] || match[5] || '');
      const content = match[3] || '';
      
      elements.push({
        tagName: tagName.toLowerCase(),
        attributes,
        children: content ? this.parseHtml(content) : [],
        textContent: content ? content.replace(/<[^>]*>/g, '') : undefined
      });
      
      lastIndex = tagPattern.lastIndex;
    }
    
    // Add remaining text
    if (lastIndex < cleanHtml.length) {
      const remainingText = cleanHtml.slice(lastIndex).trim();
      if (remainingText) {
        elements.push({
          tagName: 'text',
          attributes: {},
          children: [],
          textContent: remainingText
        });
      }
    }
    
    return elements;
  }

  /**
   * Parse HTML attributes
   */
  private static parseAttributes(attrString: string): { [key: string]: string } {
    const attributes: { [key: string]: string } = {};
    const attrPattern = /(\w+)=["']([^"']*)["']/g;
    let match;
    
    while ((match = attrPattern.exec(attrString)) !== null) {
      attributes[match[1]] = match[2];
    }
    
    return attributes;
  }

  /**
   * Convert parsed elements to Google Docs requests
   */
  private static async convertElements(elements: HtmlElement[], context: ConversionContext): Promise<void> {
    for (const element of elements) {
      await this.convertElement(element, context);
    }
  }

  /**
   * Convert single element to Google Docs request
   */
  private static async convertElement(element: HtmlElement, context: ConversionContext): Promise<void> {
    const { tagName, textContent, children, attributes } = element;
    
    switch (tagName) {
      case 'text':
        if (textContent) {
          await this.insertText(textContent, context);
        }
        break;
        
      case 'p':
        await this.convertParagraph(element, context);
        break;
        
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        await this.convertHeading(element, context);
        break;
        
      case 'ul':
      case 'ol':
        await this.convertList(element, context);
        break;
        
      case 'li':
        await this.convertListItem(element, context);
        break;
        
      case 'strong':
      case 'b':
      case 'em':
      case 'i':
      case 'u':
      case 's':
      case 'del':
        await this.convertStyledText(element, context);
        break;
        
      case 'a':
        await this.convertLink(element, context);
        break;
        
      case 'br':
        await this.insertLineBreak(context);
        break;
        
      default:
        // For unknown tags, just process children
        if (children && children.length > 0) {
          await this.convertElements(children, context);
        } else if (textContent) {
          await this.insertText(textContent, context);
        }
    }
  }

  /**
   * Convert paragraph element
   */
  private static async convertParagraph(element: HtmlElement, context: ConversionContext): Promise<void> {
    const startIndex = context.currentIndex;
    
    // Insert paragraph content
    if (element.children && element.children.length > 0) {
      await this.convertElements(element.children, context);
    } else if (element.textContent) {
      await this.insertText(element.textContent, context);
    }
    
    // Add paragraph break
    await this.insertText('\n', context);
    
    // Apply paragraph style if needed
    const endIndex = context.currentIndex;
    if (endIndex > startIndex) {
      // Apply normal paragraph style
      context.requests.push({
        updateParagraphStyle: {
          range: { startIndex, endIndex: endIndex - 1 },
          paragraphStyle: { namedStyleType: 'NORMAL_TEXT' },
          fields: 'namedStyleType'
        }
      });
    }
  }

  /**
   * Convert heading element
   */
  private static async convertHeading(element: HtmlElement, context: ConversionContext): Promise<void> {
    const startIndex = context.currentIndex;
    
    // Insert heading content
    if (element.children && element.children.length > 0) {
      await this.convertElements(element.children, context);
    } else if (element.textContent) {
      await this.insertText(element.textContent, context);
    }
    
    // Add paragraph break
    await this.insertText('\n', context);
    
    const endIndex = context.currentIndex;
    
    // Apply heading style
    const headingStyle = this.HEADING_STYLES[element.tagName];
    if (headingStyle && endIndex > startIndex) {
      context.requests.push({
        updateParagraphStyle: {
          range: { startIndex, endIndex: endIndex - 1 },
          paragraphStyle: headingStyle,
          fields: 'namedStyleType'
        }
      });
    }
  }

  /**
   * Convert list element
   */
  private static async convertList(element: HtmlElement, context: ConversionContext): Promise<void> {
    const listType = element.tagName as 'ul' | 'ol';
    const level = context.listStack.length;
    
    // Generate unique list ID
    const listId = `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to list stack
    context.listStack.push({ type: listType, level });
    context.inList = true;
    context.listId = listId;
    
    // Process list items
    if (element.children && element.children.length > 0) {
      await this.convertElements(element.children, context);
    }
    
    // Remove from list stack
    context.listStack.pop();
    context.inList = context.listStack.length > 0;
    if (context.listStack.length > 0) {
      context.listId = `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } else {
      context.listId = undefined;
    }
  }

  /**
   * Convert list item element
   */
  private static async convertListItem(element: HtmlElement, context: ConversionContext): Promise<void> {
    if (!context.inList) return;
    
    const startIndex = context.currentIndex;
    
    // Insert list item content
    if (element.children && element.children.length > 0) {
      await this.convertElements(element.children, context);
    } else if (element.textContent) {
      await this.insertText(element.textContent, context);
    }
    
    // Add paragraph break
    await this.insertText('\n', context);
    
    const endIndex = context.currentIndex;
    
    // Apply list formatting
    if (endIndex > startIndex && context.listId) {
      const currentList = context.listStack[context.listStack.length - 1];
      
      context.requests.push({
        updateParagraphStyle: {
          range: { startIndex, endIndex: endIndex - 1 },
          paragraphStyle: {
            namedStyleType: 'NORMAL_TEXT',
            // Note: In a full implementation, you'd need to handle Google Docs list formatting
            // This is a simplified version
          },
          fields: 'namedStyleType'
        }
      });
    }
  }

  /**
   * Convert styled text element
   */
  private static async convertStyledText(element: HtmlElement, context: ConversionContext): Promise<void> {
    const startIndex = context.currentIndex;
    
    // Insert text content
    if (element.children && element.children.length > 0) {
      await this.convertElements(element.children, context);
    } else if (element.textContent) {
      await this.insertText(element.textContent, context);
    }
    
    const endIndex = context.currentIndex;
    
    // Apply text style
    const textStyle = this.TEXT_STYLES[element.tagName];
    if (textStyle && endIndex > startIndex) {
      context.requests.push({
        updateTextStyle: {
          range: { startIndex, endIndex },
          textStyle: textStyle as GoogleDocsTextStyle,
          fields: Object.keys(textStyle).join(',')
        }
      });
    }
  }

  /**
   * Convert link element
   */
  private static async convertLink(element: HtmlElement, context: ConversionContext): Promise<void> {
    const startIndex = context.currentIndex;
    const url = element.attributes.href;
    
    // Insert link text
    if (element.children && element.children.length > 0) {
      await this.convertElements(element.children, context);
    } else if (element.textContent) {
      await this.insertText(element.textContent, context);
    }
    
    const endIndex = context.currentIndex;
    
    // Apply link style
    if (url && endIndex > startIndex) {
      context.requests.push({
        updateTextStyle: {
          range: { startIndex, endIndex },
          textStyle: {
            link: { url },
            foregroundColor: { 
              color: { 
                rgbColor: { red: 0.1, green: 0.4, blue: 0.8 } 
              } 
            }
          },
          fields: 'link,foregroundColor'
        }
      });
    }
  }

  /**
   * Insert text at current position
   */
  private static async insertText(text: string, context: ConversionContext): Promise<void> {
    if (!text) return;
    
    context.requests.push({
      insertText: {
        location: { index: context.currentIndex },
        text: text
      }
    });
    
    context.currentIndex += text.length;
  }

  /**
   * Insert line break
   */
  private static async insertLineBreak(context: ConversionContext): Promise<void> {
    await this.insertText('\n', context);
  }

  /**
   * Fallback plain text conversion
   */
  private static convertPlainText(html: string): GoogleDocsRequest[] {
    // Remove HTML tags and get plain text
    const plainText = html.replace(/<[^>]*>/g, '').trim();
    
    if (!plainText) return [];
    
    return [{
      insertText: {
        location: { index: 1 },
        text: plainText
      }
    }];
  }
}

/**
 * Utility functions for specific content types
 */
export class ContentTemplateConverter {
  /**
   * Convert job description content with specific formatting
   */
  static async convertJobDescription(htmlContent: string): Promise<GoogleDocsRequest[]> {
    const requests = await GoogleDocsConverter.convertHtmlToGoogleDocs(htmlContent);
    
    // Add job description specific formatting
    // This could include consistent heading styles, bullet point formatting, etc.
    
    return requests;
  }

  /**
   * Convert analysis report content
   */
  static async convertAnalysisReport(htmlContent: string): Promise<GoogleDocsRequest[]> {
    const requests = await GoogleDocsConverter.convertHtmlToGoogleDocs(htmlContent);
    
    // Add analysis report specific formatting
    // This could include table formatting, chart placeholders, etc.
    
    return requests;
  }

  /**
   * Convert general content with enhanced formatting
   */
  static async convertEnhancedContent(htmlContent: string): Promise<GoogleDocsRequest[]> {
    const requests = await GoogleDocsConverter.convertHtmlToGoogleDocs(htmlContent);
    
    // Add enhanced formatting options
    // This could include improved typography, spacing, etc.
    
    return requests;
  }
}

/**
 * Tiptap-specific conversion utilities
 */
export class TiptapConverter {
  /**
   * Convert Tiptap JSON to Google Docs format
   */
  static async convertTiptapJson(tiptapJson: any): Promise<GoogleDocsRequest[]> {
    // Convert Tiptap JSON structure to HTML first
    const html = this.tiptapJsonToHtml(tiptapJson);
    
    // Then convert HTML to Google Docs
    return GoogleDocsConverter.convertHtmlToGoogleDocs(html);
  }

  /**
   * Convert Tiptap JSON to HTML
   */
  private static tiptapJsonToHtml(json: any): string {
    if (!json || !json.content) return '';
    
    return this.processContent(json.content);
  }

  /**
   * Process Tiptap content array
   */
  private static processContent(content: any[]): string {
    return content.map(node => this.processNode(node)).join('');
  }

  /**
   * Process individual Tiptap node
   */
  private static processNode(node: any): string {
    if (!node || !node.type) return '';
    
    switch (node.type) {
      case 'paragraph':
        return `<p>${node.content ? this.processContent(node.content) : ''}</p>`;
        
      case 'heading':
        const level = node.attrs?.level || 1;
        return `<h${level}>${node.content ? this.processContent(node.content) : ''}</h${level}>`;
        
      case 'bulletList':
        return `<ul>${node.content ? this.processContent(node.content) : ''}</ul>`;
        
      case 'orderedList':
        return `<ol>${node.content ? this.processContent(node.content) : ''}</ol>`;
        
      case 'listItem':
        return `<li>${node.content ? this.processContent(node.content) : ''}</li>`;
        
      case 'text':
        let text = node.text || '';
        
        // Apply marks (formatting)
        if (node.marks) {
          for (const mark of node.marks) {
            switch (mark.type) {
              case 'bold':
                text = `<strong>${text}</strong>`;
                break;
              case 'italic':
                text = `<em>${text}</em>`;
                break;
              case 'underline':
                text = `<u>${text}</u>`;
                break;
              case 'link':
                text = `<a href="${mark.attrs.href}">${text}</a>`;
                break;
            }
          }
        }
        
        return text;
        
      case 'hardBreak':
        return '<br>';
        
      default:
        // For unknown node types, try to process content
        return node.content ? this.processContent(node.content) : '';
    }
  }
}