
import { saveAs } from "file-saver";
import { SearchResult } from "../../types";

/**
 * Cleans a search string by removing LinkedIn site restrictions
 */
export const cleanSearchString = (searchString: string): string => {
  return searchString
    .replace(/site:linkedin\.com\/in\//g, '')
    .replace(/\s+site:linkedin\.com\s*/g, ' ')
    .trim();
};

/**
 * Adds LinkedIn site restriction if not already present
 */
export const prepareSearchString = (searchString: string, searchType: string): string => {
  const cleanString = cleanSearchString(searchString);
  
  // If it's a candidate search and doesn't already have the LinkedIn site restriction, add it
  if ((searchType === 'candidates' || searchType === 'candidates-at-company') && 
      !searchString.includes('site:linkedin.com/in/')) {
    console.log("🔍 [CRITICAL] Adding site:linkedin.com/in/ to search string");
    return `${cleanString} site:linkedin.com/in/`;
  }
  
  // If it already includes the site restriction, return as is
  if (searchString.includes('site:linkedin.com/in/')) {
    console.log("🔍 [DEBUG] Search string already includes site:linkedin.com/in/");
    return searchString;
  }
  
  console.log("🔍 [DEBUG] Using search string as-is:", cleanString);
  return cleanString;
};

/**
 * Extracts location information from a snippet
 */
export const extractLocationFromSnippet = (snippet: string): string => {
  if (!snippet) return '';
  
  // Clean snippet from common non-location elements first
  let cleanSnippet = snippet
    .replace(/\d+\+?\s*years?\s+of\s+experience/gi, '')
    .replace(/\d+\s*connections?\s+on\s+LinkedIn/gi, '')
    .replace(/View\s+\w+['']s?\s+profile/gi, '')
    .replace(/\b(?:experience\s+with|skilled\s+in|expert\s+in)\b.*/gi, ''); // Remove tech skills

  // PRIORITY 1: Explicit residence indicators (highest priority)
  const residencePatterns = [
    /(?:lives?\s+in|based\s+in|located\s+in|resident\s+of|from)\s+([^·,;.]+?)(?:\s*[·,;.]|$)/gi,
    /([^·,;.]+)\s*-?\s*based/gi, // "NYC-based" or "NYC based"
    /([^·,;.]+)\s*area\s*resident/gi,
  ];
  
  for (const pattern of residencePatterns) {
    const matches = [...cleanSnippet.matchAll(pattern)];
    for (const match of matches) {
      if (match[1]) {
        const location = cleanLocation(match[1]);
        if (isValidLocation(location)) {
          return location;
        }
      }
    }
  }
  
  // PRIORITY 2: Avoid work/company location indicators 
  // Remove work-related context before further parsing
  const workContext = /(?:works?\s+at|employed\s+(?:at|by)|consultant\s+at|contractor\s+at)\s+[^·,;.]+/gi;
  cleanSnippet = cleanSnippet.replace(workContext, '');
  
  // PRIORITY 3: Standard location patterns (but context-aware)
  const locationPatterns = [
    // US format: "City, ST" 
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*,\s*([A-Z]{2})\b/g,
    // Metro area formats
    /\b((?:Greater\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Area|Metro|Metropolitan\s+Area))\b/gi,
    // Bay Area special case
    /\b((?:San Francisco\s+)?Bay\s+Area)\b/gi,
    // International format "City, Country"
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
  ];
  
  // Extract all potential locations and filter out work/education contexts
  const foundLocations: string[] = [];
  
  for (const pattern of locationPatterns) {
    const matches = [...cleanSnippet.matchAll(pattern)];
    for (const match of matches) {
      let location = '';
      
      // Handle different match group structures
      if (match[1] && match[2]) {
        // City, State or City, Country format
        location = `${match[1]}, ${match[2]}`;
      } else if (match[1]) {
        location = match[1];
      }
      
      if (location) {
        const cleaned = cleanLocation(location);
        if (isValidLocation(cleaned) && !isWorkEducationContext(match.input!, match.index!)) {
          foundLocations.push(cleaned);
        }
      }
    }
  }
  
  // Return the first valid location found
  if (foundLocations.length > 0) {
    return foundLocations[0];
  }
  
  // PRIORITY 4: Fallback - last element after · (but be more careful)
  const parts = cleanSnippet.split('·').map(part => part.trim());
  if (parts.length > 1) {
    // Look for the best location candidate, preferring later parts (more likely to be personal)
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      const cleaned = cleanLocation(part);
      
      if (isValidLocation(cleaned) && !isJobTitle(cleaned) && !isTechSkill(cleaned)) {
        return cleaned;
      }
    }
  }
  
  return '';
};

// Helper function to clean location strings
function cleanLocation(location: string): string {
  return location
    .replace(/\s*\d+\s*connections?.*$/gi, '') // Remove connection counts
    .replace(/\s*\d+\+?\s*years?.*$/gi, '') // Remove years of experience
    .replace(/^[^a-zA-Z]*/, '') // Remove leading non-alphabetic chars
    .replace(/[^a-zA-Z\s,.-]*$/, '') // Remove trailing non-location chars
    .trim();
}

// Helper function to validate if string looks like a location
function isValidLocation(location: string): boolean {
  if (!location || location.length < 2 || location.length > 50) return false;
  
  // Must contain alphabetic characters
  if (!/[a-zA-Z]/.test(location)) return false;
  
  // Exclude obvious non-locations
  const nonLocationPatterns = [
    /^\d+$/, // Just numbers
    /^(experience|years?|connections?|linkedin|profile)$/gi,
    /^(engineer|developer|manager|analyst|consultant|director)$/gi,
    /^(software|web|mobile|data|senior|junior|lead)$/gi,
    /^(react|javascript|python|java|aws|azure|ai|ml)$/gi,
  ];
  
  return !nonLocationPatterns.some(pattern => pattern.test(location));
}

// Helper function to check if location is in work/education context
function isWorkEducationContext(text: string, index: number): boolean {
  const beforeContext = text.substring(Math.max(0, index - 50), index).toLowerCase();
  const afterContext = text.substring(index, Math.min(text.length, index + 50)).toLowerCase();
  
  const workEducationKeywords = [
    'works at', 'employed at', 'consultant at', 'contractor at',
    'studied at', 'graduated from', 'university', 'college',
    'company', 'corporation', 'inc', 'llc', 'ltd'
  ];
  
  return workEducationKeywords.some(keyword => 
    beforeContext.includes(keyword) || afterContext.includes(keyword)
  );
}

// Helper function to check if string looks like a job title
function isJobTitle(text: string): boolean {
  const jobTitleKeywords = [
    'engineer', 'developer', 'manager', 'analyst', 'consultant',
    'director', 'coordinator', 'specialist', 'architect', 'lead',
    'senior', 'junior', 'principal', 'staff', 'head of'
  ];
  
  const lowerText = text.toLowerCase();
  return jobTitleKeywords.some(keyword => lowerText.includes(keyword));
}

// Helper function to check if string is a tech skill
function isTechSkill(text: string): boolean {
  const techSkills = [
    'react', 'javascript', 'python', 'java', 'nodejs', 'aws', 'azure',
    'docker', 'kubernetes', 'typescript', 'angular', 'vue', 'ai', 'ml',
    'machine learning', 'data science', 'blockchain', 'devops'
  ];
  
  const lowerText = text.toLowerCase();
  return techSkills.some(skill => lowerText.includes(skill));
}

/**
 * Validates and cleans LinkedIn profile URLs
 */
export const validateLinkedInUrl = (url: string): string => {
  if (!url) return '';
  
  try {
    // Parse the URL to validate it's a proper URL
    const parsedUrl = new URL(url);
    
    // Must be a LinkedIn domain
    if (!parsedUrl.hostname.includes('linkedin.com')) {
      return '';
    }
    
    // Must be a profile URL pattern
    const profilePattern = /\/in\/[\w-]+\/?$/;
    if (!profilePattern.test(parsedUrl.pathname)) {
      return '';
    }
    
    // Clean up the URL - remove tracking parameters and ensure proper format
    const cleanPath = parsedUrl.pathname.replace(/\/$/, ''); // Remove trailing slash
    const cleanUrl = `https://www.linkedin.com${cleanPath}`;
    
    return cleanUrl;
  } catch (error) {
    // Invalid URL format
    console.warn('Invalid LinkedIn URL:', url);
    return '';
  }
};

/**
 * Exports search results to CSV file
 */
export const exportResultsToCSV = (results: SearchResult[]): void => {
  if (!results || results.length === 0) return;

  // Format the current date for the filename
  const date = new Date().toISOString().split('T')[0];
  
  // Define CSV headers
  const headers = [
    'Name',
    'Title',
    'Location',
    'Profile URL',
    'Snippet'
  ].join(',');
  
  // Convert results to CSV rows
  const csvRows = results.map(result => {
    return [
      `"${(result.name || '').replace(/"/g, '""')}"`,
      `"${(result.jobTitle || '').replace(/"/g, '""')}"`,
      `"${(result.location || '').replace(/"/g, '""')}"`,
      `"${result.profileUrl || result.link || ''}"`,
      `"${(result.snippet || '').replace(/"/g, '""')}"`
    ].join(',');
  });
  
  // Combine headers and rows
  const csvContent = [headers, ...csvRows].join('\n');
  
  // Create and download the CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `linkedin-search-results-${date}.csv`);
  
  console.log(`Exported ${results.length} results to CSV`);
};
