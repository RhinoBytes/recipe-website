/**
 * Utility functions for detecting and normalizing URLs
 */

/**
 * Result of URL detection with normalized URL
 */
export interface UrlDetectionResult {
  isUrl: boolean;
  normalizedUrl: string;
}

/**
 * Detects if a string is a valid URL and returns a normalized version
 * Handles www. prefixed URLs by prepending https://
 * 
 * @param source - The string to check
 * @returns Object with isUrl boolean and normalizedUrl string
 */
export function detectAndNormalizeUrl(source: string): UrlDetectionResult {
  const trimmed = source.trim();
  
  if (!trimmed) {
    return { isUrl: false, normalizedUrl: '' };
  }

  // Try to parse as URL directly
  try {
    const url = new URL(trimmed);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return { isUrl: true, normalizedUrl: trimmed };
    }
  } catch {
    // Not a valid URL, check if it starts with www.
    if (trimmed.startsWith('www.')) {
      try {
        new URL(`https://${trimmed}`);
        return { isUrl: true, normalizedUrl: `https://${trimmed}` };
      } catch {
        return { isUrl: false, normalizedUrl: trimmed };
      }
    }
  }

  return { isUrl: false, normalizedUrl: trimmed };
}
