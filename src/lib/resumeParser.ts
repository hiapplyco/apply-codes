import { ClientDocumentProcessor } from './documentProcessing';

// TypeScript implementation of resume parsing with structured extraction
export interface ContactInfo {
  name: string | null;
  emails: string[];
  phones: string[];
  locations: string[];
  linkedin?: string;
  github?: string;
  portfolio?: string;
  otherLinks: string[];
}

export interface WorkExperience {
  title: string;
  company: string;
  dates: string;
  description: string;
  raw: string;
}

export interface Education {
  degree: string | null;
  institution: string | null;
  year: string | null;
  raw: string;
}

export interface ParsedResume {
  id?: string;
  contactInfo: ContactInfo;
  summary: string;
  skills: string[];
  experience: WorkExperience[];
  education: Education[];
  certifications: string[];
  projects?: string[];
  rawText: string;
  metadata?: {
    sourceFile?: string;
    parsedAt?: string;
    confidence?: number;
  };
}

// Patterns for extraction
const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_PATTERN = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
const URL_PATTERN = /(https?:\/\/\S+|www\.\S+)/g;
const LINKEDIN_PATTERN = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/gi;
const GITHUB_PATTERN = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/gi;

// Section headers for detection
const SECTION_HEADERS = {
  summary: ['summary', 'professional summary', 'about', 'profile', 'objective'],
  experience: ['experience', 'work experience', 'employment history', 'professional experience'],
  education: ['education', 'academic', 'academic background', 'qualifications'],
  skills: ['skills', 'technical skills', 'competencies', 'technologies'],
  certifications: ['certifications', 'certificates', 'credentials'],
  projects: ['projects', 'portfolio', 'personal projects']
};

// Common skill delimiters
const SKILL_DELIMITERS = /[,/|•;]+/;

export class ResumeParser {
  /**
   * Extract contact information from resume text
   */
  private static extractContactInfo(text: string): ContactInfo {
    // Extract emails
    const emails = Array.from(new Set(text.match(EMAIL_PATTERN) || []));
    
    // Extract phone numbers
    const phoneMatches = Array.from(text.matchAll(PHONE_PATTERN));
    const phones = phoneMatches.map(match => {
      const [_, area, exchange, subscriber] = match;
      return `(${area}) ${exchange}-${subscriber}`;
    }).filter((v, i, a) => a.indexOf(v) === i); // Unique values
    
    // Extract URLs
    const urls = Array.from(new Set(text.match(URL_PATTERN) || []));
    const linkedin = urls.find(url => LINKEDIN_PATTERN.test(url));
    const github = urls.find(url => GITHUB_PATTERN.test(url));
    const portfolio = urls.find(url => 
      !LINKEDIN_PATTERN.test(url) && 
      !GITHUB_PATTERN.test(url) && 
      (url.includes('.io') || url.includes('.me') || url.includes('portfolio'))
    );
    const otherLinks = urls.filter(url => 
      url !== linkedin && url !== github && url !== portfolio
    );
    
    // Extract name (heuristic: first non-email line with 2-4 words)
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    let name: string | null = null;
    
    for (const line of lines.slice(0, 10)) { // Check first 10 lines
      if (line.length < 50 && 
          line.split(/\s+/).length >= 2 && 
          line.split(/\s+/).length <= 4 &&
          !EMAIL_PATTERN.test(line) &&
          !PHONE_PATTERN.test(line) &&
          !URL_PATTERN.test(line)) {
        name = line;
        break;
      }
    }
    
    // Extract locations (simple heuristic for now)
    const locationPatterns = [
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*([A-Z]{2})\b/g, // City, State
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*([A-Z][a-z]+)\b/g, // City, Country
    ];
    
    const locations: string[] = [];
    for (const pattern of locationPatterns) {
      const matches = Array.from(text.matchAll(pattern));
      matches.forEach(match => {
        const location = match[0];
        if (!locations.includes(location)) {
          locations.push(location);
        }
      });
    }
    
    return {
      name,
      emails,
      phones,
      locations,
      linkedin,
      github,
      portfolio,
      otherLinks
    };
  }
  
  /**
   * Split text into sections based on headers
   */
  private static splitIntoSections(text: string): Map<string, string> {
    const sections = new Map<string, string>();
    const lowerText = text.toLowerCase();
    
    // Find all section headers and their positions
    const headerPositions: Array<{type: string, header: string, index: number}> = [];
    
    for (const [type, headers] of Object.entries(SECTION_HEADERS)) {
      for (const header of headers) {
        // Look for headers at the beginning of lines
        const regex = new RegExp(`^\\s*${header}\\s*:?\\s*$`, 'gmi');
        const matches = Array.from(lowerText.matchAll(regex));
        
        matches.forEach(match => {
          if (match.index !== undefined) {
            headerPositions.push({
              type,
              header,
              index: match.index
            });
          }
        });
      }
    }
    
    // Sort by position
    headerPositions.sort((a, b) => a.index - b.index);
    
    // Extract sections
    for (let i = 0; i < headerPositions.length; i++) {
      const current = headerPositions[i];
      const next = headerPositions[i + 1];
      const endIndex = next ? next.index : text.length;
      
      const sectionContent = text.substring(current.index, endIndex).trim();
      // Remove the header line itself
      const contentLines = sectionContent.split('\n');
      if (contentLines.length > 1) {
        sections.set(current.type, contentLines.slice(1).join('\n').trim());
      }
    }
    
    // If no sections found, treat entire text as content
    if (sections.size === 0) {
      sections.set('full', text);
    }
    
    return sections;
  }
  
  /**
   * Extract skills from text
   */
  private static extractSkills(text: string, sections: Map<string, string>): string[] {
    const skills = new Set<string>();
    
    // First, try to extract from skills section
    const skillsSection = sections.get('skills') || '';
    
    if (skillsSection) {
      // Split by common delimiters and clean up
      const skillLines = skillsSection.split('\n');
      
      for (const line of skillLines) {
        const parts = line.split(SKILL_DELIMITERS);
        
        for (const part of parts) {
          const skill = part.trim()
            .replace(/^[-•*—\t]+/, '') // Remove bullets
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
          
          // Basic validation
          if (skill.length >= 2 && 
              skill.length <= 50 && 
              !skill.includes('@') && 
              !URL_PATTERN.test(skill)) {
            skills.add(skill);
          }
        }
      }
    }
    
    // Also look for skill keywords in the full text
    const commonSkills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
      'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask',
      'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD',
      'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision',
      'Agile', 'Scrum', 'Git', 'REST', 'GraphQL', 'Microservices'
    ];
    
    const textLower = text.toLowerCase();
    for (const skill of commonSkills) {
      if (textLower.includes(skill.toLowerCase())) {
        skills.add(skill);
      }
    }
    
    return Array.from(skills).sort();
  }
  
  /**
   * Extract work experience
   */
  private static extractExperience(text: string, sections: Map<string, string>): WorkExperience[] {
    const experiences: WorkExperience[] = [];
    const experienceSection = sections.get('experience') || '';
    
    if (!experienceSection) return experiences;
    
    // Split by double line breaks as rough entry separator
    const entries = experienceSection.split(/\n\s*\n/);
    
    for (const entry of entries) {
      if (entry.trim().length < 20) continue;
      
      const lines = entry.trim().split('\n').map(l => l.trim());
      if (lines.length === 0) continue;
      
      // Extract dates (looking for patterns like "Jan 2020 - Present")
      const datePattern = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|(?:Present|Current|\d{4})/gi;
      const dates = entry.match(datePattern) || [];
      const dateString = dates.join(' - ');
      
      // First line often contains title and company
      let title = '';
      let company = '';
      const firstLine = lines[0];
      
      // Common patterns: "Title at Company", "Title - Company", "Title | Company"
      const atPattern = /^(.+?)\s+(?:at|@)\s+(.+)$/i;
      const dashPattern = /^(.+?)\s*[-–]\s*(.+)$/;
      const pipePattern = /^(.+?)\s*\|\s*(.+)$/;
      
      let match = firstLine.match(atPattern) || 
                  firstLine.match(dashPattern) || 
                  firstLine.match(pipePattern);
      
      if (match) {
        title = match[1].trim();
        company = match[2].trim();
      } else {
        // Assume first line is title, second might be company
        title = firstLine;
        if (lines.length > 1) {
          company = lines[1];
        }
      }
      
      // Rest is description
      const descriptionStart = company && lines[1] === company ? 2 : 1;
      const description = lines.slice(descriptionStart).join(' ').trim();
      
      experiences.push({
        title,
        company,
        dates: dateString,
        description,
        raw: entry.trim()
      });
    }
    
    return experiences;
  }
  
  /**
   * Extract education
   */
  private static extractEducation(text: string, sections: Map<string, string>): Education[] {
    const education: Education[] = [];
    const educationSection = sections.get('education') || '';
    
    if (!educationSection) return education;
    
    const entries = educationSection.split(/\n\s*\n/);
    
    for (const entry of entries) {
      if (entry.trim().length < 10) continue;
      
      // Look for degree keywords
      const degreeKeywords = [
        'Bachelor', 'Master', 'PhD', 'Ph.D.', 'Doctor', 'Associate',
        'B.S.', 'B.A.', 'M.S.', 'M.A.', 'MBA', 'BSc', 'MSc'
      ];
      
      let degree: string | null = null;
      for (const keyword of degreeKeywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(entry)) {
          degree = keyword;
          break;
        }
      }
      
      // Look for institution (contains University, College, Institute, School)
      const institutionPattern = /(?:University|College|Institute|School|Academy)\s+(?:of\s+)?[\w\s]+/gi;
      const institutionMatch = entry.match(institutionPattern);
      const institution = institutionMatch ? institutionMatch[0] : null;
      
      // Extract year
      const yearPattern = /\b(19|20)\d{2}\b/;
      const yearMatch = entry.match(yearPattern);
      const year = yearMatch ? yearMatch[0] : null;
      
      education.push({
        degree,
        institution,
        year,
        raw: entry.trim()
      });
    }
    
    return education;
  }
  
  /**
   * Extract summary/objective
   */
  private static extractSummary(text: string, sections: Map<string, string>): string {
    // Check for summary section
    const summarySection = sections.get('summary');
    if (summarySection) {
      return summarySection.trim();
    }
    
    // Fallback: use first few lines if no explicit summary section
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const nonContactLines = lines.filter(line => 
      !EMAIL_PATTERN.test(line) && 
      !PHONE_PATTERN.test(line) &&
      !URL_PATTERN.test(line)
    );
    
    // Take first 3-5 non-contact lines as summary
    return nonContactLines.slice(0, 5).join(' ').trim();
  }
  
  /**
   * Extract certifications
   */
  private static extractCertifications(text: string, sections: Map<string, string>): string[] {
    const certifications = new Set<string>();
    const certSection = sections.get('certifications') || '';
    
    if (certSection) {
      const lines = certSection.split('\n');
      for (const line of lines) {
        const cert = line.trim()
          .replace(/^[-•*—\t]+/, '') // Remove bullets
          .trim();
        
        if (cert.length > 5 && cert.length < 200) {
          certifications.add(cert);
        }
      }
    }
    
    // Also look for common certification patterns in full text
    const certPatterns = [
      /(?:Certified|Certificate)\s+[\w\s]+/gi,
      /\b[A-Z]{2,}(?:\+|#)?\s*(?:Certified|Professional|Expert|Associate)/gi
    ];
    
    for (const pattern of certPatterns) {
      const matches = text.match(pattern) || [];
      matches.forEach(cert => {
        if (cert.length < 100) {
          certifications.add(cert.trim());
        }
      });
    }
    
    return Array.from(certifications);
  }
  
  /**
   * Main parsing method
   */
  static async parseResume(file: File): Promise<ParsedResume> {
    // Extract text using existing document processor
    const rawText = await ClientDocumentProcessor.extractText(file);
    
    // Split into sections
    const sections = this.splitIntoSections(rawText);
    
    // Extract structured data
    const contactInfo = this.extractContactInfo(rawText);
    const summary = this.extractSummary(rawText, sections);
    const skills = this.extractSkills(rawText, sections);
    const experience = this.extractExperience(rawText, sections);
    const education = this.extractEducation(rawText, sections);
    const certifications = this.extractCertifications(rawText, sections);
    
    return {
      contactInfo,
      summary,
      skills,
      experience,
      education,
      certifications,
      rawText,
      metadata: {
        sourceFile: file.name,
        parsedAt: new Date().toISOString(),
        confidence: this.calculateConfidence({ contactInfo, skills, experience, education })
      }
    };
  }
  
  /**
   * Calculate parsing confidence score
   */
  private static calculateConfidence(parsed: Partial<ParsedResume>): number {
    let score = 0;
    let maxScore = 0;
    
    // Contact info scoring
    if (parsed.contactInfo) {
      maxScore += 4;
      if (parsed.contactInfo.name) score += 1;
      if (parsed.contactInfo.emails.length > 0) score += 1;
      if (parsed.contactInfo.phones.length > 0) score += 1;
      if (parsed.contactInfo.linkedin || parsed.contactInfo.github) score += 1;
    }
    
    // Content scoring
    maxScore += 4;
    if (parsed.skills && parsed.skills.length > 0) score += 1;
    if (parsed.experience && parsed.experience.length > 0) score += 1;
    if (parsed.education && parsed.education.length > 0) score += 1;
    if (parsed.summary && parsed.summary.length > 50) score += 1;
    
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }
  
  /**
   * Normalize skills for better matching
   */
  static normalizeSkills(skills: string[]): string[] {
    const normalized = new Set<string>();
    
    const synonymMap: Record<string, string> = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'node': 'Node.js',
      'react.js': 'React',
      'vue.js': 'Vue',
      'angular.js': 'Angular',
      'mongo': 'MongoDB',
      'postgres': 'PostgreSQL',
      'k8s': 'Kubernetes',
      'ml': 'Machine Learning',
      'dl': 'Deep Learning',
      'ai': 'Artificial Intelligence',
      'ci/cd': 'CI/CD',
      'aws': 'AWS',
      'gcp': 'Google Cloud Platform'
    };
    
    for (const skill of skills) {
      const lower = skill.toLowerCase().trim();
      const normalized_skill = synonymMap[lower] || skill;
      normalized.add(normalized_skill);
    }
    
    return Array.from(normalized).sort();
  }
}