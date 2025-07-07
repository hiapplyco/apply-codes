/// <reference lib="webworker" />

import type { InterviewCompetency } from '@/types/interview';

interface AnalysisRequest {
  type: 'analyze_transcript' | 'calculate_coverage' | 'extract_keywords';
  data: any;
}

interface AnalysisResponse {
  type: string;
  result: any;
  error?: string;
}

// Keyword extraction for competency matching
const extractKeywords = (text: string): string[] => {
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
    'in', 'with', 'to', 'for', 'of', 'as', 'by', 'that', 'this',
    'it', 'from', 'be', 'are', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));
};

// Analyze transcript for competency mentions
const analyzeTranscript = (transcript: string, competencies: InterviewCompetency[]) => {
  const keywords = extractKeywords(transcript);
  const mentionedCompetencies: Map<string, number> = new Map();

  for (const competency of competencies) {
    const competencyKeywords = [
      ...extractKeywords(competency.name),
      ...extractKeywords(competency.description),
    ];

    let matchScore = 0;
    for (const keyword of keywords) {
      if (competencyKeywords.some((ck) => ck.includes(keyword) || keyword.includes(ck))) {
        matchScore++;
      }
    }

    if (matchScore > 0) {
      mentionedCompetencies.set(competency.id, matchScore);
    }
  }

  return {
    mentionedCompetencies: Array.from(mentionedCompetencies.entries()),
    keywords: keywords.slice(0, 20), // Top 20 keywords
  };
};

// Calculate coverage score based on multiple factors
const calculateCoverage = (
  competencyId: string,
  transcripts: Array<{ text: string; speaker: string }>,
  competencies: InterviewCompetency[]
) => {
  const competency = competencies.find((c) => c.id === competencyId);
  if (!competency) return 0;

  let totalScore = 0;
  let candidateMentions = 0;
  let interviewerMentions = 0;

  for (const transcript of transcripts) {
    const analysis = analyzeTranscript(transcript.text, [competency]);
    const mentionScore = analysis.mentionedCompetencies[0]?.[1] || 0;

    if (mentionScore > 0) {
      totalScore += mentionScore;
      if (transcript.speaker === 'candidate') {
        candidateMentions += mentionScore * 2; // Weight candidate mentions higher
      } else {
        interviewerMentions += mentionScore;
      }
    }
  }

  // Calculate coverage based on multiple factors
  const baseCoverage = Math.min((totalScore * 10), 40); // Up to 40% from mentions
  const candidateBonus = Math.min((candidateMentions * 5), 30); // Up to 30% from candidate
  const depthBonus = transcripts.some(t => t.text.length > 200) ? 20 : 0; // 20% for depth
  const consistencyBonus = interviewerMentions > 0 && candidateMentions > 0 ? 10 : 0; // 10% for back-and-forth

  return Math.min(baseCoverage + candidateBonus + depthBonus + consistencyBonus, 100);
};

// Handle incoming messages
self.addEventListener('message', async (event: MessageEvent<AnalysisRequest>) => {
  const { type, data } = event.data;

  try {
    let result: any;

    switch (type) {
      case 'analyze_transcript':
        result = analyzeTranscript(data.transcript, data.competencies);
        break;

      case 'calculate_coverage':
        result = calculateCoverage(data.competencyId, data.transcripts, data.competencies);
        break;

      case 'extract_keywords':
        result = extractKeywords(data.text);
        break;

      default:
        throw new Error(`Unknown analysis type: ${type}`);
    }

    const response: AnalysisResponse = {
      type,
      result,
    };

    self.postMessage(response);
  } catch (error) {
    const response: AnalysisResponse = {
      type,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    self.postMessage(response);
  }
});

// Export types for TypeScript
export type { AnalysisRequest, AnalysisResponse };