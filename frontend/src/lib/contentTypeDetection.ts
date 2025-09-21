/**
 * Content type detection utilities for handling different types of content
 * stored in knowledge graph pieces
 */

export type ContentType = 'json' | 'text' | 'markdown' | 'html' | 'unknown';

export interface ContentInfo {
  type: ContentType;
  isGraphData: boolean;
  rawContent: string;
  parsedContent?: any;
}

/**
 * Detects the content type based on the raw content string
 */
export function detectContentType(content: string): ContentType {
  if (!content || typeof content !== 'string') {
    return 'unknown';
  }

  const trimmed = content.trim();

  // Check for JSON
  if (isJSON(trimmed)) {
    return 'json';
  }

  // Check for Markdown (common patterns)
  if (isMarkdown(trimmed)) {
    return 'markdown';
  }

  // Check for HTML
  if (isHTML(trimmed)) {
    return 'html';
  }

  // Default to text
  return 'text';
}

/**
 * Checks if content is valid JSON
 */
function isJSON(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    return typeof parsed === 'object' && parsed !== null;
  } catch {
    return false;
  }
}

/**
 * Checks if content appears to be Markdown
 */
function isMarkdown(content: string): boolean {
  const markdownPatterns = [
    /^#{1,6}\s+.+$/m,           // Headers
    /^\*\s+.+$/m,               // Bullet lists
    /^\d+\.\s+.+$/m,            // Numbered lists
    /\[.+\]\(.+\)/m,            // Links
    /\*\*.+\*\*/m,              // Bold
    /_.+_/m,                    // Italic
    /```[\s\S]*```/m,           // Code blocks
    /^>\s+.+$/m,                // Blockquotes
    /^\|.*\|.*\|$/m,            // Tables
    /^---+$/m,                  // Horizontal rules
    /!\[.*\]\(.*\)/m,           // Images
    /`[^`]+`/m,                 // Inline code
    /^\s*[-*+]\s+.+$/m,         // Alternative bullet lists
    /^\s*\d+\.\s+.+$/m,         // Alternative numbered lists
  ];

  // Count how many markdown patterns are found
  const patternMatches = markdownPatterns.filter(pattern => pattern.test(content)).length;
  
  // If we find 2 or more markdown patterns, it's likely markdown
  // Also check if it's not JSON (to avoid false positives)
  return patternMatches >= 2 && !isJSON(content);
}

/**
 * Checks if content appears to be HTML
 */
function isHTML(content: string): boolean {
  const htmlPattern = /<[a-z][\s\S]*>/i;
  return htmlPattern.test(content);
}

/**
 * Checks if JSON content is graph data (has nodes and links/edges)
 */
export function isGraphData(content: any): boolean {
  if (!content || typeof content !== 'object') {
    return false;
  }

  // Check for common graph data structures
  const hasNodes = 'nodes' in content || 'entities' in content;
  const hasLinks = 'links' in content || 'edges' in content || 'relationships' in content;
  
  return hasNodes && hasLinks;
}

/**
 * Analyzes content and returns comprehensive content information
 */
export function analyzeContent(rawContent: string): ContentInfo {
  const type = detectContentType(rawContent);
  let parsedContent: any = undefined;
  let isGraphData = false;

  if (type === 'json') {
    try {
      parsedContent = JSON.parse(rawContent);
      isGraphData = isGraphData(parsedContent);
    } catch (error) {
      console.warn('Failed to parse JSON content:', error);
    }
  }

  return {
    type,
    isGraphData,
    rawContent,
    parsedContent
  };
}

/**
 * Formats content for display based on its type
 */
export function formatContentForDisplay(contentInfo: ContentInfo): string {
  const { type, rawContent, parsedContent } = contentInfo;

  switch (type) {
    case 'json':
      return JSON.stringify(parsedContent || rawContent, null, 2);
    case 'markdown':
    case 'html':
    case 'text':
    default:
      return rawContent;
  }
}
