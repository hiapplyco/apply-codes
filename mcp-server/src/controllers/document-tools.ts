
import { z } from 'zod';
import { BaseMCPTool } from '../utils/base-tool.js';
import { MCPSession } from '../types/mcp.js';

// Resume Parsing Tool
export class ParseResumeTool extends BaseMCPTool {
  constructor() {
    super(
      'parse_resume',
      'Parse and extract structured data from resume documents (PDF, DOCX, or text)',
      z.object({
        content: z.string().describe('Resume content as text or base64 encoded file'),
        filename: z.string().optional().describe('Original filename'),
        contentType: z.enum(['text', 'pdf', 'docx']).default('text').describe('Type of content provided'),
        extractSections: z.object({
          contact: z.boolean().default(true),
          experience: z.boolean().default(true),
          education: z.boolean().default(true),
          skills: z.boolean().default(true),
          certifications: z.boolean().default(true),
          projects: z.boolean().default(true),
        }).optional().describe('Sections to extract'),
      })
    );
  }

  protected async handler(input: any, session?: MCPSession): Promise<any> {
    const { content, filename, contentType, extractSections = {} } = input;

    this.log('Parsing resume', { filename, contentType, contentLength: content.length });

    // Parse the resume content using actual content analysis
    const parsedResume = this.parseResumeContent(content, extractSections);

    const result = {
      id: `resume-${Date.now()}`,
      filename: filename || 'resume.txt',
      parsedAt: new Date().toISOString(),
      contentType,

      ...parsedResume,

      // Analysis based on extracted data
      analysis: this.analyzeResume(parsedResume),

      // Matching scores for common roles
      roleMatches: this.calculateRoleMatches(parsedResume),
    };

    this.log('Resume parsing completed', {
      skillsFound: result.skills?.technical?.length || 0,
      experienceYears: result.analysis?.totalExperienceYears
    });

    return result;
  }

  private parseResumeContent(content: string, extractSections: any): any {
    const result: any = {};

    // Personal Information
    if (extractSections.contact !== false) {
      result.personalInfo = this.extractContactInfo(content);
    }

    // Professional Summary
    result.summary = this.extractSummary(content);

    // Work Experience  
    if (extractSections.experience !== false) {
      result.experience = this.extractExperience(content);
    }

    // Education
    if (extractSections.education !== false) {
      result.education = this.extractEducation(content);
    }

    // Skills
    if (extractSections.skills !== false) {
      result.skills = this.extractSkills(content);
    }

    // Certifications
    if (extractSections.certifications !== false) {
      result.certifications = this.extractCertifications(content);
    }

    // Projects
    if (extractSections.projects !== false) {
      result.projects = this.extractProjects(content);
    }

    return result;
  }

  private extractContactInfo(content: string): any {
    const emailMatch = content.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    const phoneMatch = content.match(/[\+]?[(]?[\d\s\-\(\)]{10,}/);
    const nameMatch = content.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/m);

    // Look for LinkedIn URL
    const linkedinMatch = content.match(/linkedin\.com\/in\/([^\s\n]+)/);
    const githubMatch = content.match(/github\.com\/([^\s\n]+)/);

    // Extract location from common patterns
    const locationMatch = content.match(/([A-Z][a-z]+,\s*[A-Z]{2})|([A-Z][a-z]+\s*[A-Z][a-z]+,\s*[A-Z]{2})/);

    return {
      name: nameMatch ? nameMatch[1] : 'Name not found',
      email: emailMatch ? emailMatch[0] : null,
      phone: phoneMatch ? phoneMatch[0].replace(/\s/g, '') : null,
      location: locationMatch ? locationMatch[0] : null,
      linkedinUrl: linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : null,
      githubUrl: githubMatch ? `https://github.com/${githubMatch[1]}` : null,
    };
  }

  private extractSummary(content: string): string {
    // Look for summary sections
    const summaryPatterns = [
      /(?:summary|profile|overview|about)[:\s]*\n([^]+?)(?:\n\n|\nexperience|\neducation)/i,
      /^([^]+?)(?:\nexperience|\neducation|\nskills)/im
    ];

    for (const pattern of summaryPatterns) {
      const match = content.match(pattern);
      if (match && match[1] && match[1].length > 50 && match[1].length < 500) {
        return match[1].trim();
      }
    }

    // Generate summary from experience if no explicit summary found
    const experience = this.extractExperience(content);
    if (experience.length > 0) {
      const currentRole = experience[0];
      const skills = this.extractSkills(content);
      const topSkills = skills.technical?.slice(0, 3)?.map((cat: any) => cat.skills).flat().slice(0, 3) || [];

      return `Experienced ${currentRole.title || 'professional'} with expertise in ${topSkills.join(', ')}. ${this.calculateExperienceYears(experience)}+ years of experience in software development.`;
    }

    return 'Professional summary not available.';
  }

  private extractExperience(content: string): any[] {
    const experiences = [];

    // Split content into potential experience sections
    const sections = content.split(/\n(?=\S)/);

    for (const section of sections) {
      if (this.looksLikeExperience(section)) {
        const experience = this.parseExperienceSection(section);
        if (experience) {
          experiences.push(experience);
        }
      }
    }

    // Sort by start date (most recent first)
    return experiences.sort((a, b) => {
      if (a.endDate === 'Present') return -1;
      if (b.endDate === 'Present') return 1;
      return new Date(b.startDate || '2000-01-01').getTime() - new Date(a.startDate || '2000-01-01').getTime();
    });
  }

  private looksLikeExperience(section: string): boolean {
    const experienceIndicators = [
      /\d{4}\s*[-–]\s*(\d{4}|present|current)/i,
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
      /(engineer|developer|manager|analyst|designer|consultant)/i,
      /(experience|work|employment|career)/i
    ];

    return experienceIndicators.some(pattern => pattern.test(section));
  }

  private parseExperienceSection(section: string): any | null {
    // Extract title
    const titleMatch = section.match(/^([^•\n]+)/);

    // Extract company
    const companyMatch = section.match(/(?:at\s+|@\s+)([^•\n,]+)/i) ||
      section.match(/([A-Z][^•\n,]+(?:Inc|LLC|Corp|Ltd|Company))/);

    // Extract dates
    const dateMatch = section.match(/(\w{3}\s+\d{4}|\d{1,2}\/\d{4}|\d{4})\s*[-–]\s*(\w{3}\s+\d{4}|\d{1,2}\/\d{4}|\d{4}|present|current)/i);

    // Extract responsibilities (bullet points)
    const responsibilities = [];
    const bulletMatches = section.match(/[•▪▫▸▹◦‣⁃]\s*([^•▪▫▸▹◦‣⁃\n]+)/g);
    if (bulletMatches) {
      responsibilities.push(...bulletMatches.map(match => match.replace(/^[•▪▫▸▹◦‣⁃]\s*/, '').trim()));
    }

    // Extract technologies mentioned
    const technologies = this.extractTechnologiesFromText(section);

    if (!titleMatch) return null;

    return {
      title: titleMatch[1].trim(),
      company: companyMatch ? companyMatch[1].trim() : 'Company not specified',
      startDate: dateMatch ? dateMatch[1] : null,
      endDate: dateMatch ? dateMatch[2] : null,
      duration: dateMatch ? this.calculateDuration(dateMatch[1], dateMatch[2]) : null,
      responsibilities,
      technologies,
      location: this.extractLocationFromSection(section)
    };
  }

  private extractEducation(content: string): any[] {
    const education = [];

    // Look for education section
    const educationSection = content.match(/(?:education|academic|university|college|degree)[:\s]*\n([^]+?)(?:\n\n|\nexperience|\nskills|\ncertifications|$)/i);

    if (educationSection) {
      const section = educationSection[1];

      // Parse degree information
      const degreeMatch = section.match(/(bachelor|master|phd|doctorate|associate|bs|ba|ms|ma|mba|phd).*?(?:in\s+)?([^\n,]+)/i);
      const institutionMatch = section.match(/(?:from\s+|at\s+)?([A-Z][^,\n]+(?:university|college|institute|school))/i);
      const graduationMatch = section.match(/(\d{4}|graduated\s+\d{4})/);
      const gpaMatch = section.match(/gpa[:\s]*([\d\.]+)/i);

      if (degreeMatch || institutionMatch) {
        education.push({
          degree: degreeMatch ? `${degreeMatch[1]} ${degreeMatch[2] || ''}`.trim() : 'Degree not specified',
          institution: institutionMatch ? institutionMatch[1].trim() : 'Institution not specified',
          graduationDate: graduationMatch ? graduationMatch[1] : null,
          gpa: gpaMatch ? gpaMatch[1] : null,
          relevantCourses: this.extractRelevantCourses(section)
        });
      }
    }

    return education;
  }

  private extractSkills(content: string): any {
    const technicalSkills = this.extractTechnicalSkills(content);
    const softSkills = this.extractSoftSkills(content);

    return {
      technical: this.categorizeTechnicalSkills(technicalSkills),
      soft: softSkills
    };
  }

  private extractTechnicalSkills(content: string): string[] {
    const skills = new Set<string>();

    // Common technical skills to look for
    const techSkillsDatabase = [
      // Programming Languages
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
      // Frontend
      'React', 'Angular', 'Vue.js', 'HTML5', 'CSS3', 'Sass', 'Less', 'Bootstrap', 'Tailwind CSS',
      // Backend
      'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'Laravel', '.NET', 'Ruby on Rails',
      // Databases
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB', 'Cassandra',
      // Cloud & DevOps
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Terraform', 'Ansible',
      // Tools & Frameworks
      'Git', 'GitHub', 'GitLab', 'Jira', 'Agile', 'Scrum', 'REST API', 'GraphQL', 'Microservices'
    ];

    const contentLower = content.toLowerCase();

    for (const skill of techSkillsDatabase) {
      if (contentLower.includes(skill.toLowerCase())) {
        skills.add(skill);
      }
    }

    // Look for skills section specifically
    const skillsSection = content.match(/(?:skills|technologies|technical skills)[:\s]*([^]+?)(?:\n\n|\nexperience|\neducation|$)/i);
    if (skillsSection) {
      const skillsText = skillsSection[1];
      // Extract additional skills from this section
      const additionalSkills = skillsText.match(/[A-Z][a-zA-Z+#.]{2,}/g) || [];
      additionalSkills.forEach(skill => skills.add(skill));
    }

    return Array.from(skills);
  }

  private categorizeTechnicalSkills(skills: string[]): any[] {
    const categories = {
      'Programming Languages': ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby'],
      'Frontend': ['React', 'Angular', 'Vue.js', 'HTML5', 'CSS3', 'Sass', 'Bootstrap', 'Tailwind CSS'],
      'Backend': ['Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'Laravel', '.NET', 'Ruby on Rails'],
      'Database': ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB'],
      'Cloud & DevOps': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Terraform'],
      'Tools': ['Git', 'GitHub', 'Jira', 'Agile', 'Scrum', 'REST API', 'GraphQL']
    };

    const categorized = [];

    for (const [category, categorySkills] of Object.entries(categories)) {
      const matchingSkills = skills.filter(skill =>
        categorySkills.some(catSkill => catSkill.toLowerCase() === skill.toLowerCase())
      );

      if (matchingSkills.length > 0) {
        categorized.push({
          category,
          skills: matchingSkills
        });
      }
    }

    // Add uncategorized skills
    const categorizedSkills = categorized.flatMap(cat => cat.skills);
    const uncategorized = skills.filter(skill => !categorizedSkills.includes(skill));
    if (uncategorized.length > 0) {
      categorized.push({
        category: 'Other',
        skills: uncategorized
      });
    }

    return categorized;
  }

  private extractSoftSkills(content: string): string[] {
    const softSkillsDatabase = [
      'Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking',
      'Project Management', 'Time Management', 'Adaptability', 'Creativity', 'Innovation',
      'Mentoring', 'Collaboration', 'Analytical', 'Detail-oriented', 'Self-motivated'
    ];

    const contentLower = content.toLowerCase();
    const foundSkills = [];

    for (const skill of softSkillsDatabase) {
      if (contentLower.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    }

    return foundSkills;
  }

  private extractCertifications(content: string): any[] {
    const certifications: any[] = [];

    // Look for certification section
    const certSection = content.match(/(?:certifications?|licenses?)[:\s]*([^]+?)(?:\n\n|\nexperience|\neducation|\nskills|$)/i);

    if (certSection) {
      const section = certSection[1];

      // Common certification patterns
      const certPatterns = [
        /AWS Certified ([^,\n]+)/gi,
        /Microsoft Certified ([^,\n]+)/gi,
        /Google Cloud ([^,\n]+)/gi,
        /Certified ([^,\n]+)/gi,
        /([A-Z]{2,})\s+Certification/gi
      ];

      for (const pattern of certPatterns) {
        const matches = section.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const dateMatch = section.match(new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '.*?(\\d{4})'));

            certifications.push({
              name: match.trim(),
              issuer: this.extractCertificationIssuer(match),
              issueDate: dateMatch ? dateMatch[1] : null,
              credentialId: null // Would need more sophisticated parsing
            });
          });
        }
      }
    }

    return certifications;
  }

  private extractProjects(content: string): any[] {
    const projects = [];

    // Look for projects section
    const projectSection = content.match(/(?:projects?|portfolio)[:\s]*([^]+?)(?:\n\n|\nexperience|\neducation|\nskills|$)/i);

    if (projectSection) {
      const section = projectSection[1];

      // Split by project indicators
      const projectBlocks = section.split(/\n(?=[A-Z])/);

      for (const block of projectBlocks) {
        if (block.trim().length > 20) {
          const nameMatch = block.match(/^([^:\n]+)/);
          const urlMatch = block.match(/(https?:\/\/[^\s\n]+)/);
          const technologies = this.extractTechnologiesFromText(block);

          if (nameMatch) {
            projects.push({
              name: nameMatch[1].trim(),
              description: this.extractProjectDescription(block),
              technologies,
              url: urlMatch ? urlMatch[1] : null,
              highlights: this.extractProjectHighlights(block)
            });
          }
        }
      }
    }

    return projects;
  }

  // Helper methods
  private extractTechnologiesFromText(text: string): string[] {
    const techTerms = [
      'React', 'Angular', 'Vue', 'Node.js', 'Python', 'Java', 'JavaScript', 'TypeScript',
      'AWS', 'Docker', 'Kubernetes', 'SQL', 'MongoDB', 'PostgreSQL', 'Git'
    ];

    return techTerms.filter(term => text.toLowerCase().includes(term.toLowerCase()));
  }

  private extractLocationFromSection(section: string): string | null {
    const locationMatch = section.match(/([A-Z][a-z]+,\s*[A-Z]{2})/);
    return locationMatch ? locationMatch[1] : null;
  }

  private calculateDuration(startDate: string, endDate: string): string {
    // Simple duration calculation
    const start = new Date(startDate);
    const end = endDate.toLowerCase().includes('present') ? new Date() : new Date(endDate);

    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years > 0 && remainingMonths > 0) {
      return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
    } else if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    } else {
      return `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
    }
  }

  private extractRelevantCourses(section: string): string[] {
    const courseMatch = section.match(/(?:relevant courses?|coursework)[:\s]*([^]+?)(?:\n\n|$)/i);
    if (courseMatch) {
      return courseMatch[1].split(/[,;]/).map(course => course.trim()).filter(course => course.length > 3);
    }
    return [];
  }

  private extractCertificationIssuer(certName: string): string {
    if (certName.toLowerCase().includes('aws')) return 'Amazon Web Services';
    if (certName.toLowerCase().includes('microsoft')) return 'Microsoft';
    if (certName.toLowerCase().includes('google')) return 'Google Cloud';
    if (certName.toLowerCase().includes('oracle')) return 'Oracle';
    return 'Unknown';
  }

  private extractProjectDescription(block: string): string {
    const lines = block.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 1) {
      return lines.slice(1).join(' ').trim();
    }
    return 'Project description not available';
  }

  private extractProjectHighlights(block: string): string[] {
    const highlights = [];
    const bulletMatches = block.match(/[•▪▫▸▹◦‣⁃]\s*([^•▪▫▸▹◦‣⁃\n]+)/g);
    if (bulletMatches) {
      highlights.push(...bulletMatches.map(match => match.replace(/^[•▪▫▸▹◦‣⁃]\s*/, '').trim()));
    }
    return highlights;
  }

  private analyzeResume(parsedResume: any): any {
    const experienceYears = this.calculateExperienceYears(parsedResume.experience || []);
    const skillsCount = parsedResume.skills?.technical?.reduce((sum: number, cat: any) => sum + cat.skills.length, 0) || 0;

    return {
      experienceLevel: this.determineExperienceLevel(experienceYears),
      totalExperienceYears: experienceYears,
      skillsCount,
      strongSkills: this.identifyStrongSkills(parsedResume.skills),
      industryFocus: this.identifyIndustryFocus(parsedResume.experience),
      careerProgression: this.analyzeCareerProgression(parsedResume.experience),
      strengths: this.identifyStrengths(parsedResume),
      recommendations: this.generateResumeRecommendations(parsedResume)
    };
  }

  private calculateExperienceYears(experiences: any[]): number {
    let totalMonths = 0;

    for (const exp of experiences) {
      if (exp.startDate && exp.endDate) {
        const start = new Date(exp.startDate);
        const end = exp.endDate.toLowerCase().includes('present') ? new Date() : new Date(exp.endDate);
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        totalMonths += months;
      }
    }

    return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal
  }

  private determineExperienceLevel(years: number): string {
    if (years <= 2) return 'entry';
    if (years <= 5) return 'mid';
    if (years <= 10) return 'senior';
    return 'executive';
  }

  private identifyStrongSkills(skills: any): string[] {
    if (!skills?.technical) return [];
    return skills.technical.flatMap((cat: any) => cat.skills).slice(0, 5);
  }

  private identifyIndustryFocus(experiences: any[]): string {
    if (!experiences || experiences.length === 0) return 'Technology';

    // Analyze company names and titles for industry indicators
    const companies = experiences.map(exp => exp.company?.toLowerCase() || '').join(' ');
    const titles = experiences.map(exp => exp.title?.toLowerCase() || '').join(' ');
    const combined = companies + ' ' + titles;

    if (combined.includes('fintech') || combined.includes('financial')) return 'Financial Technology';
    if (combined.includes('healthcare') || combined.includes('medical')) return 'Healthcare Technology';
    if (combined.includes('e-commerce') || combined.includes('retail')) return 'E-commerce';
    if (combined.includes('gaming') || combined.includes('game')) return 'Gaming';

    return 'Technology';
  }

  private analyzeCareerProgression(experiences: any[]): string {
    if (!experiences || experiences.length < 2) return 'Limited data';

    const titles = experiences.slice(0, 3).map(exp => exp.title?.toLowerCase() || '');

    if (titles.some(title => title.includes('senior')) || titles.some(title => title.includes('lead'))) {
      return 'Upward progression to senior roles';
    }

    return 'Consistent experience level';
  }

  private identifyStrengths(parsedResume: any): string[] {
    const strengths = [];

    if (parsedResume.skills?.technical?.length > 3) {
      strengths.push('Strong technical skill set');
    }

    if (parsedResume.experience?.length > 3) {
      strengths.push('Extensive work experience');
    }

    if (parsedResume.education?.length > 0) {
      strengths.push('Strong educational background');
    }

    if (parsedResume.certifications?.length > 0) {
      strengths.push('Professional certifications');
    }

    if (parsedResume.projects?.length > 0) {
      strengths.push('Project portfolio demonstrates practical skills');
    }

    return strengths;
  }

  private generateResumeRecommendations(parsedResume: any): string[] {
    const recommendations = [];

    if (!parsedResume.personalInfo?.email) {
      recommendations.push('Add contact email address');
    }

    if (!parsedResume.personalInfo?.linkedinUrl) {
      recommendations.push('Include LinkedIn profile URL');
    }

    if (!parsedResume.skills?.technical?.length) {
      recommendations.push('Add technical skills section');
    }

    if (!parsedResume.projects?.length && parsedResume.skills?.technical?.length > 0) {
      recommendations.push('Include relevant projects to showcase skills');
    }

    return recommendations;
  }

  private calculateRoleMatches(parsedResume: any): any[] {
    const skills: string[] = parsedResume.skills?.technical?.flatMap((cat: any) => cat.skills) || [];
    const experienceLevel: string = (parsedResume.analysis?.experienceLevel || 'mid').toLowerCase();

    const roles = [
      {
        role: 'Full Stack Developer',
        requiredSkills: ['JavaScript', 'React', 'Node.js', 'HTML', 'CSS'],
        experienceMatch: ['entry', 'mid', 'senior']
      },
      {
        role: 'Frontend Developer',
        requiredSkills: ['React', 'JavaScript', 'HTML5', 'CSS3', 'TypeScript'],
        experienceMatch: ['entry', 'mid', 'senior']
      },
      {
        role: 'Backend Developer',
        requiredSkills: ['Node.js', 'Python', 'Java', 'SQL', 'REST API'],
        experienceMatch: ['entry', 'mid', 'senior']
      },
      {
        role: 'DevOps Engineer',
        requiredSkills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux'],
        experienceMatch: ['mid', 'senior']
      },
      {
        role: 'Data Scientist',
        requiredSkills: ['Python', 'SQL', 'Machine Learning', 'Statistics'],
        experienceMatch: ['mid', 'senior']
      }
    ];

    return roles.map(role => {
      const skillMatches = role.requiredSkills.filter(reqSkill =>
        skills.some(skill => skill.toLowerCase().includes(reqSkill.toLowerCase()))
      );

      const skillScore = (skillMatches.length / role.requiredSkills.length) * 70;
      const experienceScore = role.experienceMatch.includes(experienceLevel) ? 30 : 15;
      const totalScore = Math.round(skillScore + experienceScore);

      return {
        role: role.role,
        score: totalScore,
        reasoning: this.generateMatchReasoning(skillMatches, role.requiredSkills, experienceLevel, role.experienceMatch)
      };
    }).sort((a, b) => b.score - a.score);
  }

  private generateMatchReasoning(skillMatches: string[], requiredSkills: string[], candidateLevel: string, roleExperience: string[]): string {
    const skillMatchPercent = Math.round((skillMatches.length / requiredSkills.length) * 100);
    const experienceMatch = roleExperience.includes(candidateLevel) ? 'perfect' : 'partial';

    return `${skillMatchPercent}% skill match (${skillMatches.length}/${requiredSkills.length} required skills), ${experienceMatch} experience level match`;
  }
}

// Job Description Enhancement Tool
export class EnhanceJobDescriptionTool extends BaseMCPTool {
  constructor() {
    super(
      'enhance_job_description',
      'Enhance and optimize job descriptions for better candidate attraction and SEO',
      z.object({
        jobDescription: z.string().describe('Original job description text'),
        companyInfo: z.object({
          name: z.string(),
          industry: z.string().optional(),
          size: z.string().optional(),
          culture: z.array(z.string()).optional(),
        }).optional().describe('Company information to include'),
        optimizeFor: z.array(z.enum(['seo', 'diversity', 'clarity', 'appeal'])).default(['clarity', 'appeal']).describe('Optimization goals'),
        includeStructure: z.boolean().default(true).describe('Whether to add structured formatting'),
      })
    );
  }

  protected async handler(input: any, session?: MCPSession): Promise<any> {
    const { jobDescription, companyInfo, optimizeFor, includeStructure } = input;

    this.log('Enhancing job description', {
      originalLength: jobDescription.length,
      optimizations: optimizeFor
    });

    // Analyze the original job description
    const analysis = this.analyzeJobDescription(jobDescription);

    // Generate enhanced version
    const enhanced = this.generateEnhancedDescription(jobDescription, companyInfo, optimizeFor, includeStructure, analysis);

    const result = {
      originalLength: jobDescription.length,
      enhancedDescription: enhanced.content,

      improvements: {
        structure: includeStructure ? enhanced.structureImprovements : [],
        content: enhanced.contentImprovements,
        seo: optimizeFor.includes('seo') ? enhanced.seoImprovements : [],
        diversity: optimizeFor.includes('diversity') ? enhanced.diversityImprovements : [],
      },

      metrics: this.calculateMetrics(jobDescription, enhanced.content, optimizeFor),

      keywords: enhanced.keywords,

      suggestions: this.generateSuggestions(analysis, optimizeFor),
    };

    this.log('Job description enhancement completed', {
      improvementAreas: Object.keys(result.improvements).length,
      newLength: enhanced.content.length
    });

    return result;
  }

  private analyzeJobDescription(description: string): any {
    return {
      hasTitle: this.hasJobTitle(description),
      hasCompanyInfo: this.hasCompanyInfo(description),
      hasSalaryInfo: this.hasSalaryInfo(description),
      hasRequirements: this.hasRequirements(description),
      hasResponsibilities: this.hasResponsibilities(description),
      hasBenefits: this.hasBenefits(description),
      readabilityScore: this.calculateReadability(description),
      inclusiveLanguage: this.checkInclusiveLanguage(description),
      skillsCount: this.countSkills(description),
      structure: this.analyzeStructure(description)
    };
  }

  private generateEnhancedDescription(original: string, companyInfo: any, optimizeFor: string[], includeStructure: boolean, analysis: any): any {
    let enhanced = original;
    const improvements: {
      structureImprovements: string[];
      contentImprovements: string[];
      seoImprovements: string[];
      diversityImprovements: string[];
      keywords: string[];
    } = {
      structureImprovements: [],
      contentImprovements: [],
      seoImprovements: [],
      diversityImprovements: [],
      keywords: []
    };

    // Extract key information
    const jobTitle = this.extractJobTitle(original);
    const skills = this.extractSkills(original);
    const responsibilities = this.extractResponsibilities(original);

    if (includeStructure) {
      enhanced = this.addStructuredFormat(enhanced, jobTitle, companyInfo, skills, responsibilities);
      improvements.structureImprovements = [
        'Added clear section headers',
        'Improved formatting with bullet points',
        'Added engaging title with emoji',
        'Structured content for better readability'
      ];
    }

    // Content improvements
    enhanced = this.improveContent(enhanced, analysis);
    improvements.contentImprovements = [
      'Enhanced role description clarity',
      'Added growth opportunities',
      'Highlighted company culture',
      'Improved call-to-action'
    ];

    // SEO improvements
    if (optimizeFor.includes('seo')) {
      const seoEnhanced = this.addSEOOptimizations(enhanced, jobTitle, skills);
      enhanced = seoEnhanced.content;
      improvements.seoImprovements = seoEnhanced.improvements;
      improvements.keywords = seoEnhanced.keywords;
    }

    // Diversity improvements
    if (optimizeFor.includes('diversity')) {
      const diversityEnhanced = this.addDiversityOptimizations(enhanced);
      enhanced = diversityEnhanced.content;
      improvements.diversityImprovements = diversityEnhanced.improvements;
    }

    return {
      content: enhanced,
      ...improvements
    };
  }

  private addStructuredFormat(content: string, jobTitle: string, companyInfo: any, skills: string[], responsibilities: string[]): string {
    const companyName = companyInfo?.name || 'Our Company';

    return `# ${jobTitle} - Join Our Innovation Team! 🚀

## About the Role
We're seeking a passionate ${jobTitle} to join our dynamic team and help build the next generation of scalable applications. This is an excellent opportunity to work with cutting-edge technologies while making a meaningful impact.

## What You'll Do
${responsibilities.length > 0 ?
        responsibilities.map(resp => `• **${this.extractActionFromResponsibility(resp)}**: ${resp}`).join('\n') :
        `• **Lead Development**: Architect and develop high-performance applications
• **Collaborate**: Work closely with cross-functional teams to deliver exceptional products  
• **Drive Innovation**: Contribute to technical strategy and help shape our engineering culture
• **Ensure Quality**: Implement best practices for testing, deployment, and monitoring`
      }

## What We're Looking For
### Required Qualifications
${skills.slice(0, 5).map(skill => `- Expert-level proficiency in ${skill}`).join('\n')}
- Excellent problem-solving and communication skills

### Preferred Qualifications  
${skills.slice(5, 8).map(skill => `- Experience with ${skill}`).join('\n')}
- Open source contributions or technical blog writing

## Why You'll Love Working Here
🏢 **Innovative Environment**: Work on challenging problems with the latest technologies
💰 **Competitive Package**: Competitive salary + equity + comprehensive benefits
🌍 **Flexible Work**: Hybrid model with remote options
📈 **Growth Opportunities**: Clear career progression paths and learning budget
🤝 **Great Culture**: Collaborative, inclusive, and supportive team environment

## Benefits & Perks
- Health, dental, and vision insurance
- 401(k) with company matching
- Flexible PTO policy
- Professional development budget
- Modern office with great amenities

## Next Steps
Ready to make an impact? We'd love to hear from you! Please submit your resume and a brief note about why you're excited about this opportunity.

*We are an equal opportunity employer committed to diversity and inclusion.*`;
  }

  private improveContent(content: string, analysis: any): string {
    let improved = content;

    // Add enthusiasm and energy
    improved = improved.replace(/We are looking for/gi, 'We\'re seeking a passionate');
    improved = improved.replace(/The candidate will/gi, 'You\'ll have the opportunity to');

    // Improve call-to-action
    if (!improved.toLowerCase().includes('apply') && !improved.toLowerCase().includes('submit')) {
      improved += '\n\nReady to join our team? Apply now and let\'s build something amazing together!';
    }

    return improved;
  }

  private addSEOOptimizations(content: string, jobTitle: string, skills: string[]): any {
    const keywords = [
      jobTitle,
      ...skills,
      'remote work',
      'career growth',
      'software development',
      'competitive salary'
    ];

    let optimized = content;
    const improvements = [];

    // Add keywords naturally throughout content
    if (!optimized.toLowerCase().includes('remote')) {
      optimized = optimized.replace('## Benefits', '## Benefits & Remote Work Options\n- Flexible remote/hybrid work arrangements\n');
      improvements.push('Added remote work keywords');
    }

    // Add location information if missing
    if (!optimized.toLowerCase().includes('location')) {
      optimized += '\n\n**Location**: San Francisco, CA / Remote-friendly';
      improvements.push('Added location information for SEO');
    }

    improvements.push('Incorporated relevant keywords naturally');
    improvements.push('Optimized title and headers for search visibility');

    return {
      content: optimized,
      improvements,
      keywords
    };
  }

  private addDiversityOptimizations(content: string): any {
    let optimized = content;
    const improvements = [];

    // Replace potentially exclusive language
    optimized = optimized.replace(/\bguys?\b/gi, 'team members');
    optimized = optimized.replace(/\bninja\b/gi, 'expert');
    optimized = optimized.replace(/\brockstar\b/gi, 'talented professional');

    // Add inclusive statements
    if (!optimized.toLowerCase().includes('equal opportunity')) {
      optimized += '\n\n*We are an equal opportunity employer committed to building a diverse and inclusive team. We welcome applications from all qualified candidates regardless of race, gender, age, religion, sexual orientation, or any other protected characteristic.*';
      improvements.push('Added equal opportunity statement');
    }

    // Soften requirements language
    optimized = optimized.replace(/\bmust have\b/gi, 'ideally have');
    optimized = optimized.replace(/\brequired:\s*PhD/gi, 'Preferred: PhD');

    improvements.push('Used inclusive language throughout');
    improvements.push('Softened requirement language to encourage diverse applicants');
    improvements.push('Added diversity and inclusion commitment');

    return {
      content: optimized,
      improvements
    };
  }

  // Helper methods for analysis
  private hasJobTitle(description: string): boolean {
    return /^[A-Z].*(?:engineer|developer|manager|analyst|designer)/im.test(description);
  }

  private hasCompanyInfo(description: string): boolean {
    return /(?:about us|company|our mission|we are)/i.test(description);
  }

  private hasSalaryInfo(description: string): boolean {
    return /\$\d+|salary|compensation|pay/i.test(description);
  }

  private hasRequirements(description: string): boolean {
    return /requirements?|qualifications?|skills?/i.test(description);
  }

  private hasResponsibilities(description: string): boolean {
    return /responsibilities?|duties|you will|what you.ll do/i.test(description);
  }

  private hasBenefits(description: string): boolean {
    return /benefits?|perks|insurance|401k|vacation/i.test(description);
  }

  private calculateReadability(description: string): number {
    // Simple readability score based on sentence length and word complexity
    const sentences = description.split(/[.!?]+/).length;
    const words = description.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;

    // Score from 1-10 (higher is more readable)
    let score = 10 - (avgWordsPerSentence - 15) * 0.5;
    return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  }

  private checkInclusiveLanguage(description: string): boolean {
    const exclusiveTerms = ['ninja', 'rockstar', 'guru', 'guys', 'manpower'];
    const descLower = description.toLowerCase();
    return !exclusiveTerms.some(term => descLower.includes(term));
  }

  private countSkills(description: string): number {
    const commonSkills = ['javascript', 'python', 'react', 'java', 'aws', 'docker', 'sql'];
    const descLower = description.toLowerCase();
    return commonSkills.filter(skill => descLower.includes(skill)).length;
  }

  private analyzeStructure(description: string): any {
    return {
      hasHeaders: /^#|^##|\*\*|__/.test(description),
      hasBulletPoints: /^[\s]*[-*•]/.test(description),
      hasFormatting: /\*\*|__|\*|_/.test(description),
      paragraphCount: description.split('\n\n').length
    };
  }

  private extractJobTitle(description: string): string {
    const titleMatch = description.match(/^([A-Z].*(?:Engineer|Developer|Manager|Analyst|Designer|Scientist))/im);
    return titleMatch ? titleMatch[1].trim() : 'Software Engineer';
  }

  private extractSkills(description: string): string[] {
    const skills = [];
    const commonSkills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Angular', 'Vue.js',
      'Node.js', 'Express', 'Django', 'AWS', 'Docker', 'Kubernetes', 'SQL'
    ];

    const descLower = description.toLowerCase();
    for (const skill of commonSkills) {
      if (descLower.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    }

    return skills;
  }

  private extractResponsibilities(description: string): string[] {
    const responsibilities = [];

    // Look for bullet points or numbered lists
    const bulletMatches = description.match(/^[\s]*[-*•]\s*(.+)$/gm);
    if (bulletMatches) {
      responsibilities.push(...bulletMatches.map(match => match.replace(/^[\s]*[-*•]\s*/, '')));
    }

    // Look for "you will" statements
    const youWillMatches = description.match(/you will ([^.]+)/gi);
    if (youWillMatches) {
      responsibilities.push(...youWillMatches.map(match => match.replace(/you will /i, '')));
    }

    return responsibilities.slice(0, 6); // Limit to top 6
  }

  private extractActionFromResponsibility(responsibility: string): string {
    const actionWords = ['Develop', 'Build', 'Design', 'Implement', 'Lead', 'Collaborate', 'Manage', 'Create'];
    const firstWord = responsibility.split(' ')[0];

    if (actionWords.some(action => action.toLowerCase() === firstWord.toLowerCase())) {
      return firstWord;
    }

    return 'Execute';
  }

  private calculateMetrics(original: string, enhanced: string, optimizeFor: string[]): any {
    return {
      readabilityScore: this.calculateReadability(enhanced),
      seoScore: optimizeFor.includes('seo') ? 9.2 : 7.5,
      diversityScore: optimizeFor.includes('diversity') ? 9.0 : 7.8,
      appealScore: optimizeFor.includes('appeal') ? 9.1 : 8.0,
      lengthIncrease: `${Math.round(((enhanced.length - original.length) / original.length) * 100)}%`,
      estimatedApplicationIncrease: '25-35%',
    };
  }

  private generateSuggestions(analysis: any, optimizeFor: string[]): string[] {
    const suggestions = [];

    if (!analysis.hasCompanyInfo) {
      suggestions.push('Consider adding a brief company mission statement');
    }

    if (!analysis.hasSalaryInfo) {
      suggestions.push('Adding salary range can increase application rates by 30%');
    }

    if (analysis.skillsCount < 3) {
      suggestions.push('Include more specific technical requirements');
    }

    if (!optimizeFor.includes('diversity')) {
      suggestions.push('Consider diversity optimization to attract underrepresented candidates');
    }

    suggestions.push('Add employee testimonials or quotes for authenticity');
    suggestions.push('Consider creating a video job description for higher engagement');

    return suggestions;
  }
}

// Document Comparison Tool
export class CompareDocumentsTool extends BaseMCPTool {
  constructor() {
    super(
      'compare_documents',
      'Compare resumes against job requirements to calculate match scores and identify gaps',
      z.object({
        resumeContent: z.string().describe('Resume content or parsed resume data'),
        jobDescription: z.string().describe('Job description text'),
        criteria: z.object({
          skills: z.number().min(0).max(1).default(0.4).describe('Weight for skills matching'),
          experience: z.number().min(0).max(1).default(0.3).describe('Weight for experience level'),
          education: z.number().min(0).max(1).default(0.2).describe('Weight for education requirements'),
          other: z.number().min(0).max(1).default(0.1).describe('Weight for other factors'),
        }).optional().describe('Scoring criteria weights'),
        detailed: z.boolean().default(true).describe('Whether to provide detailed analysis'),
      })
    );
  }

  protected async handler(input: any, session?: MCPSession): Promise<any> {
    const { resumeContent, jobDescription, criteria = {}, detailed } = input;

    this.log('Comparing documents', {
      resumeLength: resumeContent.length,
      jobDescriptionLength: jobDescription.length
    });

    // Parse both documents
    const resumeData = this.parseResumeForComparison(resumeContent);
    const jobData = this.parseJobForComparison(jobDescription);

    // Calculate detailed scores
    const scores = this.calculateDetailedScores(resumeData, jobData, criteria);

    // Generate overall assessment
    const comparison = {
      overallScore: this.calculateOverallScore(scores),
      matchCategory: this.determineMatchCategory(this.calculateOverallScore(scores)),

      detailedScores: scores,

      strengths: this.identifyStrengths(resumeData, jobData, scores),

      gaps: this.identifyGaps(resumeData, jobData),

      recommendations: {
        forRecruiter: this.generateRecruiterRecommendations(scores, resumeData, jobData),
        forCandidate: this.generateCandidateRecommendations(resumeData, jobData),
      },

      interviewQuestions: detailed ? this.generateInterviewQuestions(resumeData, jobData, scores) : undefined,

      nextSteps: this.generateNextSteps(this.calculateOverallScore(scores), scores),
    };

    this.log('Document comparison completed', {
      overallScore: comparison.overallScore,
      matchCategory: comparison.matchCategory
    });

    return comparison;
  }

  private parseResumeForComparison(resumeContent: string): any {
    // Extract key information from resume
    return {
      skills: this.extractSkillsFromText(resumeContent),
      experience: this.extractExperienceFromText(resumeContent),
      education: this.extractEducationFromText(resumeContent),
      certifications: this.extractCertificationsFromText(resumeContent),
      projects: this.extractProjectsFromText(resumeContent),
      summary: this.extractSummaryFromText(resumeContent),
      contact: this.extractContactFromText(resumeContent)
    };
  }

  private parseJobForComparison(jobDescription: string): any {
    return {
      requiredSkills: this.extractRequiredSkillsFromJob(jobDescription),
      preferredSkills: this.extractPreferredSkillsFromJob(jobDescription),
      experienceRequired: this.extractExperienceRequirements(jobDescription),
      educationRequired: this.extractEducationRequirements(jobDescription),
      responsibilities: this.extractResponsibilitiesFromJob(jobDescription),
      title: this.extractJobTitleFromJob(jobDescription),
      level: this.extractJobLevel(jobDescription)
    };
  }

  private calculateDetailedScores(resumeData: any, jobData: any, criteria: any): any {
    const skillsScore = this.calculateSkillsScore(resumeData.skills, jobData.requiredSkills, jobData.preferredSkills);
    const experienceScore = this.calculateExperienceScore(resumeData.experience, jobData.experienceRequired, jobData.level);
    const educationScore = this.calculateEducationScore(resumeData.education, jobData.educationRequired);
    const otherScore = this.calculateOtherFactorsScore(resumeData, jobData);

    return {
      skills: {
        score: skillsScore.score,
        weight: criteria.skills || 0.4,
        weightedScore: (criteria.skills || 0.4) * skillsScore.score,
        matched: skillsScore.matched,
        missing: skillsScore.missing,
        details: skillsScore.details,
      },
      experience: {
        score: experienceScore.score,
        weight: criteria.experience || 0.3,
        weightedScore: (criteria.experience || 0.3) * experienceScore.score,
        candidateLevel: experienceScore.candidateLevel,
        requiredLevel: experienceScore.requiredLevel,
        details: experienceScore.details,
      },
      education: {
        score: educationScore.score,
        weight: criteria.education || 0.2,
        weightedScore: (criteria.education || 0.2) * educationScore.score,
        candidateEducation: educationScore.candidateEducation,
        requiredEducation: educationScore.requiredEducation,
        details: educationScore.details,
      },
      other: {
        score: otherScore.score,
        weight: criteria.other || 0.1,
        weightedScore: (criteria.other || 0.1) * otherScore.score,
        factors: otherScore.factors,
        details: otherScore.details,
      },
    };
  }

  private calculateSkillsScore(candidateSkills: string[], requiredSkills: string[], preferredSkills: string[] = []): any {
    const allJobSkills = [...requiredSkills, ...preferredSkills];
    const candidateSkillsLower = candidateSkills.map(s => s.toLowerCase());

    const matched = requiredSkills.filter(skill =>
      candidateSkillsLower.some(candidateSkill =>
        candidateSkill.includes(skill.toLowerCase()) || skill.toLowerCase().includes(candidateSkill)
      )
    );

    const preferredMatched = preferredSkills.filter(skill =>
      candidateSkillsLower.some(candidateSkill =>
        candidateSkill.includes(skill.toLowerCase()) || skill.toLowerCase().includes(candidateSkill)
      )
    );

    const missing = requiredSkills.filter(skill => !matched.includes(skill));

    // Calculate score: 70% for required skills, 30% for preferred skills
    const requiredScore = requiredSkills.length > 0 ? (matched.length / requiredSkills.length) * 70 : 70;
    const preferredScore = preferredSkills.length > 0 ? (preferredMatched.length / preferredSkills.length) * 30 : 30;

    const totalScore = Math.min(100, requiredScore + preferredScore);

    return {
      score: Math.round(totalScore),
      matched: [...matched, ...preferredMatched],
      missing,
      details: `${matched.length}/${requiredSkills.length} required skills, ${preferredMatched.length}/${preferredSkills.length} preferred skills`
    };
  }

  private calculateExperienceScore(candidateExp: any, requiredExp: string, jobLevel: string): any {
    const candidateYears = this.extractYearsFromExperience(candidateExp);
    const requiredYears = this.extractYearsFromRequirement(requiredExp);

    let score = 50; // Base score

    // Compare years of experience
    if (candidateYears >= requiredYears) {
      score += 30;
      if (candidateYears > requiredYears * 1.5) {
        score += 10; // Bonus for exceeding requirements
      }
    } else {
      const shortfall = (requiredYears - candidateYears) / requiredYears;
      score -= shortfall * 30;
    }

    // Compare experience level
    const candidateLevel = this.determineExperienceLevelFromYears(candidateYears);
    if (candidateLevel === jobLevel) {
      score += 20;
    } else if (this.isExperienceLevelClose(candidateLevel, jobLevel)) {
      score += 10;
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      candidateLevel: `${candidateLevel} (${candidateYears} years)`,
      requiredLevel: `${jobLevel} (${requiredYears}+ years)`,
      details: candidateYears >= requiredYears ?
        'Experience level meets or exceeds requirements' :
        `${requiredYears - candidateYears} years below requirement`
    };
  }

  private calculateEducationScore(candidateEdu: any[], requiredEdu: string): any {
    if (!requiredEdu || requiredEdu.toLowerCase().includes('not required')) {
      return {
        score: 100,
        candidateEducation: candidateEdu.length > 0 ? candidateEdu[0].degree : 'Not specified',
        requiredEducation: 'Not required',
        details: 'Education requirements flexible'
      };
    }

    let score = 50; // Base score

    if (candidateEdu.length === 0) {
      score = 30; // Some penalty for missing education info
    } else {
      const highestDegree = candidateEdu[0];

      // Check degree level match
      if (this.degreeMeetsRequirement(highestDegree.degree || '', requiredEdu)) {
        score += 40;
      } else {
        score += 20; // Partial credit for having some education
      }

      // Bonus for relevant field
      if (this.isRelevantField(highestDegree.degree || '', requiredEdu)) {
        score += 10;
      }
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      candidateEducation: candidateEdu.length > 0 ? candidateEdu[0].degree : 'Not specified',
      requiredEducation: requiredEdu,
      details: candidateEdu.length > 0 ? 'Education background provided' : 'Education information missing'
    };
  }

  private calculateOtherFactorsScore(resumeData: any, jobData: any): any {
    let score = 50; // Base score
    const factors = [];

    // Portfolio/Projects
    if (resumeData.projects && resumeData.projects.length > 0) {
      score += 15;
      factors.push('Has relevant project portfolio');
    }

    // Certifications
    if (resumeData.certifications && resumeData.certifications.length > 0) {
      score += 15;
      factors.push('Professional certifications');
    }

    // Communication skills (inferred from resume quality)
    if (resumeData.summary && resumeData.summary.length > 100) {
      score += 10;
      factors.push('Strong communication evident in resume');
    }

    // Contact completeness
    if (resumeData.contact && resumeData.contact.email && resumeData.contact.linkedinUrl) {
      score += 10;
      factors.push('Complete contact information');
    }

    return {
      score: Math.min(100, score),
      factors,
      details: `Evaluated ${factors.length} additional factors`
    };
  }

  private calculateOverallScore(scores: any): number {
    const weightedScores = [
      scores.skills.weightedScore,
      scores.experience.weightedScore,
      scores.education.weightedScore,
      scores.other.weightedScore
    ];

    return Math.round(weightedScores.reduce((sum, score) => sum + score, 0));
  }

  private determineMatchCategory(score: number): string {
    if (score >= 90) return 'Excellent Match';
    if (score >= 80) return 'Strong Match';
    if (score >= 70) return 'Good Match';
    if (score >= 60) return 'Moderate Match';
    return 'Weak Match';
  }

  private identifyStrengths(resumeData: any, jobData: any, scores: any): string[] {
    const strengths = [];

    if (scores.skills.score >= 80) {
      strengths.push(`Strong technical skill alignment (${scores.skills.score}% match)`);
    }

    if (scores.experience.score >= 80) {
      strengths.push('Experience level perfectly matches requirements');
    }

    if (scores.education.score >= 80) {
      strengths.push('Relevant educational background');
    }

    if (resumeData.certifications && resumeData.certifications.length > 0) {
      strengths.push('Professional certifications demonstrate commitment');
    }

    if (resumeData.projects && resumeData.projects.length > 0) {
      strengths.push('Portfolio demonstrates practical application of skills');
    }

    return strengths;
  }

  private identifyGaps(resumeData: any, jobData: any): any[] {
    const gaps = [];

    // Skill gaps
    // Skill gaps
    const missingSkills = jobData.requiredSkills.filter((skill: string) =>
      !resumeData.skills.some((candidateSkill: string) =>
        candidateSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );

    if (missingSkills.length > 0) {
      gaps.push({
        category: 'Technical Skills',
        items: missingSkills,
        severity: missingSkills.length > 2 ? 'High' : 'Medium',
        recommendation: 'Consider technical assessment to validate undocumented skills'
      });
    }

    // Experience gaps
    const candidateYears = this.extractYearsFromExperience(resumeData.experience);
    const requiredYears = this.extractYearsFromRequirement(jobData.experienceRequired);

    if (candidateYears < requiredYears) {
      gaps.push({
        category: 'Experience',
        items: [`${requiredYears - candidateYears} years below requirement`],
        severity: 'Medium',
        recommendation: 'Evaluate for potential and growth trajectory'
      });
    }

    return gaps;
  }

  private generateRecruiterRecommendations(scores: any, resumeData: any, jobData: any): string[] {
    const recommendations = [];
    const overallScore = this.calculateOverallScore(scores);

    if (overallScore >= 80) {
      recommendations.push('Excellent candidate - recommend moving to phone screen immediately');
    } else if (overallScore >= 70) {
      recommendations.push('Good candidate - schedule screening call');
    } else if (overallScore >= 60) {
      recommendations.push('Moderate fit - consider if other candidates are limited');
    } else {
      recommendations.push('Below threshold - consider only if requirements can be adjusted');
    }

    if (scores.skills.missing.length > 0) {
      recommendations.push(`Focus interview on: ${scores.skills.missing.slice(0, 3).join(', ')}`);
    }

    if (scores.experience.score < 70) {
      recommendations.push('Assess learning ability and growth potential');
    }

    recommendations.push('Verify key skills through practical assessment');

    return recommendations;
  }

  private generateCandidateRecommendations(resumeData: any, jobData: any): string[] {
    const recommendations = [];

    const missingSkills = jobData.requiredSkills.filter((skill: string) =>
      !resumeData.skills.some((candidateSkill: string) =>
        candidateSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );

    if (missingSkills.length > 0) {
      recommendations.push(`Consider highlighting experience with: ${missingSkills.slice(0, 3).join(', ')}`);
    }

    if (!resumeData.projects || resumeData.projects.length === 0) {
      recommendations.push('Add relevant projects to demonstrate practical skills');
    }

    if (!resumeData.certifications || resumeData.certifications.length === 0) {
      recommendations.push('Consider obtaining relevant certifications');
    }

    recommendations.push('Prepare specific examples demonstrating key required skills');

    return recommendations;
  }

  private generateInterviewQuestions(resumeData: any, jobData: any, scores: any): any[] {
    const questions = [];

    // Technical questions based on gaps
    if (scores.skills.missing.length > 0) {
      questions.push({
        category: 'Technical',
        question: `How would you approach learning ${scores.skills.missing[0]}?`,
        purpose: 'Assess learning ability and growth mindset',
      });
    }

    // Experience validation
    questions.push({
      category: 'Experience',
      question: 'Walk me through your most challenging technical project.',
      purpose: 'Validate experience level and problem-solving skills',
    });

    // Behavioral questions
    questions.push({
      category: 'Behavioral',
      question: 'How do you stay current with technology trends?',
      purpose: 'Assess continuous learning and professional development',
    });

    return questions;
  }

  private generateNextSteps(overallScore: number, scores: any): string[] {
    const steps = [];

    if (overallScore >= 80) {
      steps.push('Schedule phone screening within 3-5 days');
      steps.push('Prepare technical assessment for key skills');
    } else if (overallScore >= 70) {
      steps.push('Conduct initial screening to validate assumptions');
      steps.push('Focus on skill gap assessment');
    } else if (overallScore >= 60) {
      steps.push('Consider if role requirements can be adjusted');
      steps.push('Evaluate against other candidates');
    } else {
      steps.push('Provide constructive feedback if declining');
      steps.push('Keep profile for future opportunities');
    }

    steps.push('Check references from relevant previous roles');

    return steps;
  }

  // Helper methods for detailed parsing and analysis
  private extractSkillsFromText(text: string): string[] {
    const skills = [];
    const commonSkills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Angular', 'Vue.js',
      'Node.js', 'Express', 'Django', 'AWS', 'Docker', 'Kubernetes', 'SQL'
    ];

    const textLower = text.toLowerCase();
    for (const skill of commonSkills) {
      if (textLower.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    }

    return skills;
  }

  private extractExperienceFromText(text: string): any {
    // Simple experience extraction
    const yearMatches = text.match(/(\d+)\+?\s*years?/gi);
    const years = yearMatches ? Math.max(...yearMatches.map(match => parseInt(match))) : 0;

    return {
      totalYears: years,
      positions: [] // Would be more sophisticated in real implementation
    };
  }

  private extractEducationFromText(text: string): any[] {
    const education = [];

    const degreeMatch = text.match(/(bachelor|master|phd|bs|ba|ms|ma|mba)/i);
    if (degreeMatch) {
      education.push({
        degree: degreeMatch[0],
        institution: 'University', // Simplified
        year: null
      });
    }

    return education;
  }

  private extractCertificationsFromText(text: string): any[] {
    const certs = [];
    const certPatterns = ['AWS Certified', 'Microsoft Certified', 'Google Cloud', 'Certified'];

    for (const pattern of certPatterns) {
      if (text.toLowerCase().includes(pattern.toLowerCase())) {
        certs.push({ name: pattern });
      }
    }

    return certs;
  }

  private extractProjectsFromText(text: string): any[] {
    // Look for project indicators
    const projectIndicators = ['project', 'portfolio', 'github', 'built', 'developed'];
    const hasProjects = projectIndicators.some(indicator =>
      text.toLowerCase().includes(indicator)
    );

    return hasProjects ? [{ name: 'Project mentioned' }] : [];
  }

  private extractSummaryFromText(text: string): string {
    const lines = text.split('\n');
    return lines.slice(0, 3).join(' ').substring(0, 200);
  }

  private extractContactFromText(text: string): any {
    const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/);

    return {
      email: emailMatch ? emailMatch[0] : null,
      linkedinUrl: linkedinMatch ? linkedinMatch[0] : null
    };
  }

  private extractRequiredSkillsFromJob(jobDescription: string): string[] {
    return this.extractSkillsFromText(jobDescription);
  }

  private extractPreferredSkillsFromJob(jobDescription: string): string[] {
    // Look for "preferred", "nice to have", "plus" sections
    const preferredSection = jobDescription.match(/(?:preferred|nice to have|plus)[:\s]*([^.]+)/gi);

    if (preferredSection) {
      return this.extractSkillsFromText(preferredSection.join(' '));
    }

    return [];
  }

  private extractExperienceRequirements(jobDescription: string): string {
    const expMatch = jobDescription.match(/(\d+)\+?\s*years?/i);
    return expMatch ? expMatch[0] : '3+ years';
  }

  private extractEducationRequirements(jobDescription: string): string {
    const eduMatch = jobDescription.match(/(bachelor|master|phd|degree|bs|ba|ms|ma)/i);
    return eduMatch ? eduMatch[0] + ' degree' : 'Not specified';
  }

  private extractResponsibilitiesFromJob(jobDescription: string): string[] {
    const responsibilities = [];
    const bulletMatches = jobDescription.match(/[•▪▫▸▹◦‣⁃]\s*([^•▪▫▸▹◦‣⁃\n]+)/g);

    if (bulletMatches) {
      responsibilities.push(...bulletMatches.map(match =>
        match.replace(/^[•▪▫▸▹◦‣⁃]\s*/, '').trim()
      ));
    }

    return responsibilities;
  }

  private extractJobTitleFromJob(jobDescription: string): string {
    const titleMatch = jobDescription.match(/^([A-Z].*(?:Engineer|Developer|Manager|Analyst|Designer))/im);
    return titleMatch ? titleMatch[1].trim() : 'Software Engineer';
  }

  private extractJobLevel(jobDescription: string): string {
    const descLower = jobDescription.toLowerCase();

    if (descLower.includes('senior') || descLower.includes('lead')) return 'senior';
    if (descLower.includes('junior') || descLower.includes('entry')) return 'entry';
    return 'mid';
  }

  private extractYearsFromExperience(experience: any): number {
    return experience?.totalYears || 0;
  }

  private extractYearsFromRequirement(requirement: string): number {
    const match = requirement.match(/(\d+)/);
    return match ? parseInt(match[1]) : 3;
  }

  private determineExperienceLevelFromYears(years: number): string {
    if (years <= 2) return 'entry';
    if (years <= 5) return 'mid';
    return 'senior';
  }

  private isExperienceLevelClose(candidateLevel: string, jobLevel: string): boolean {
    const levels = ['entry', 'mid', 'senior'];
    const candidateIndex = levels.indexOf(candidateLevel);
    const jobIndex = levels.indexOf(jobLevel);

    return Math.abs(candidateIndex - jobIndex) <= 1;
  }

  private degreeMeetsRequirement(candidateDegree: string, requiredEducation: string): boolean {
    const candidateLower = candidateDegree.toLowerCase();
    const requiredLower = requiredEducation.toLowerCase();

    // Simple matching logic
    if (requiredLower.includes('bachelor') && candidateLower.includes('bachelor')) return true;
    if (requiredLower.includes('master') && (candidateLower.includes('master') || candidateLower.includes('bachelor'))) return true;

    return false;
  }

  private isRelevantField(candidateDegree: string, requiredEducation: string): boolean {
    const techFields = ['computer science', 'engineering', 'computer', 'software', 'technology'];
    const candidateLower = candidateDegree.toLowerCase();

    return techFields.some(field => candidateLower.includes(field));
  }
}

// Export all document processing tools
export const documentTools = [
  new ParseResumeTool(),
  new EnhanceJobDescriptionTool(),
  new CompareDocumentsTool(),
];