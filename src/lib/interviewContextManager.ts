import type { InterviewContext, InterviewCompetency, TranscriptSegment } from '@/types/interview';

export class InterviewContextManager {
  private static readonly CONTEXT_WINDOW_SIZE = 10; // Number of transcript segments to keep
  private static readonly RESUME_SUMMARY_MAX_LENGTH = 500;
  
  /**
   * Compresses a resume into a concise summary for context
   */
  static compressResume(resumeText: string): string {
    if (!resumeText) return '';
    
    // Extract key information
    const lines = resumeText.split('\n').filter(line => line.trim());
    const summary: string[] = [];
    
    // Look for patterns indicating important sections
    const keyPatterns = {
      experience: /experience|work|employment/i,
      education: /education|degree|university|college/i,
      skills: /skills|technologies|expertise/i,
      achievements: /achievements|accomplishments|awards/i,
    };
    
    let currentSection = '';
    for (const line of lines) {
      for (const [section, pattern] of Object.entries(keyPatterns)) {
        if (pattern.test(line)) {
          currentSection = section;
          break;
        }
      }
      
      // Include lines that seem important based on current section
      if (currentSection && line.length > 10 && line.length < 200) {
        summary.push(line.trim());
      }
    }
    
    // Truncate to max length
    const fullSummary = summary.join(' ');
    return fullSummary.length > this.RESUME_SUMMARY_MAX_LENGTH
      ? fullSummary.substring(0, this.RESUME_SUMMARY_MAX_LENGTH) + '...'
      : fullSummary;
  }
  
  /**
   * Builds a hierarchical context for the AI model
   */
  static buildHierarchicalContext(
    context: InterviewContext,
    recentTranscripts: TranscriptSegment[],
    immediateTranscripts: TranscriptSegment[]
  ): string {
    const competenciesText = context.competencies
      .map(comp => `- ${comp.name} (${comp.category}, ${comp.coverageLevel}% covered)`)
      .join('\n');
    
    const recentText = recentTranscripts
      .map(t => `${t.speaker}: ${t.text}`)
      .join('\n');
    
    const immediateText = immediateTranscripts
      .map(t => `${t.speaker}: ${t.text}`)
      .join('\n');
    
    return `
INTERVIEW CONTEXT:
Position: ${context.jobRole}
Stage: ${context.stage}
Current Topic: ${context.currentTopic || 'General discussion'}

COMPETENCIES TO ASSESS:
${competenciesText}

CANDIDATE BACKGROUND:
${context.resumeSummary || 'No resume provided'}

RECENT CONVERSATION (last ${recentTranscripts.length} exchanges):
${recentText}

IMMEDIATE CONTEXT (last ${immediateTranscripts.length} exchanges):
${immediateText}
`.trim();
  }
  
  /**
   * Analyzes which competencies need more coverage
   */
  static identifyGapsInCoverage(competencies: InterviewCompetency[]): InterviewCompetency[] {
    return competencies
      .filter(comp => comp.required && comp.coverageLevel < 50)
      .sort((a, b) => a.coverageLevel - b.coverageLevel);
  }
  
  /**
   * Determines if a transcript segment relates to a competency
   */
  static extractCompetencyMentions(
    transcript: string,
    competencies: InterviewCompetency[]
  ): string[] {
    const mentionedIds: string[] = [];
    const lowerTranscript = transcript.toLowerCase();
    
    for (const competency of competencies) {
      // Check for direct mentions of competency name
      if (lowerTranscript.includes(competency.name.toLowerCase())) {
        mentionedIds.push(competency.id);
        continue;
      }
      
      // Check for keywords in competency description
      const keywords = competency.description
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 4); // Only meaningful words
      
      const matchCount = keywords.filter(keyword => 
        lowerTranscript.includes(keyword)
      ).length;
      
      // If multiple keywords match, consider it a mention
      if (matchCount >= 2) {
        mentionedIds.push(competency.id);
      }
    }
    
    return mentionedIds;
  }
  
  /**
   * Calculates coverage score based on transcript analysis
   */
  static calculateCoverageScore(
    competencyId: string,
    transcripts: TranscriptSegment[],
    competencies: InterviewCompetency[]
  ): number {
    const competency = competencies.find(c => c.id === competencyId);
    if (!competency) return 0;
    
    let mentionCount = 0;
    let qualityScore = 0;
    
    for (const transcript of transcripts) {
      const mentions = this.extractCompetencyMentions(transcript.text, [competency]);
      if (mentions.includes(competencyId)) {
        mentionCount++;
        
        // Higher quality if candidate is speaking about it
        if (transcript.speaker === 'candidate') {
          qualityScore += 2;
        } else {
          qualityScore += 1;
        }
        
        // Bonus for longer responses
        if (transcript.text.length > 100) {
          qualityScore += 1;
        }
      }
    }
    
    // Calculate coverage (0-100)
    const baseCoverage = Math.min((mentionCount * 20), 60); // Up to 60% from mentions
    const qualityBonus = Math.min((qualityScore * 5), 40); // Up to 40% from quality
    
    return Math.min(baseCoverage + qualityBonus, 100);
  }
  
  /**
   * Suggests the next best topic based on coverage gaps
   */
  static suggestNextTopic(
    competencies: InterviewCompetency[],
    currentStage: InterviewContext['stage']
  ): { competency: InterviewCompetency; reason: string } | null {
    const gaps = this.identifyGapsInCoverage(competencies);
    
    if (gaps.length === 0) {
      return null;
    }
    
    // Filter by appropriate stage
    const stageAppropriate = gaps.filter(comp => {
      if (currentStage === 'technical' && comp.category === 'technical') return true;
      if (currentStage === 'behavioral' && comp.category === 'behavioral') return true;
      if (currentStage === 'questions' && comp.category === 'cultural') return true;
      return false;
    });
    
    const targetCompetency = stageAppropriate[0] || gaps[0];
    
    const reason = targetCompetency.coverageLevel === 0
      ? `Haven't discussed ${targetCompetency.name} yet`
      : `Need more depth on ${targetCompetency.name} (only ${targetCompetency.coverageLevel}% covered)`;
    
    return { competency: targetCompetency, reason };
  }
}