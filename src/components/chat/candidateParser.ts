import type { LinkedInCandidate } from './LinkedInCandidateCard';

/**
 * Parses candidates from AI response content.
 * Handles JSON (code blocks, raw objects, arrays) and text format fallback.
 */
export function parseCandidatesFromContent(content: string): LinkedInCandidate[] | null {
  // Try to find JSON in content - handle both raw JSON and ```json code blocks
  try {
    // First try to extract from markdown code block
    const codeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    let jsonStr = '';

    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
      console.log('[CandidateParser] Found code block, extracted JSON length:', jsonStr.length);
    } else {
      // Try to find raw JSON with profiles array
      const rawMatch = content.match(/\{\s*"profiles"\s*:\s*\[[\s\S]*\]\s*\}/);
      if (rawMatch) {
        jsonStr = rawMatch[0];
        console.log('[CandidateParser] Found raw JSON, length:', jsonStr.length);
      }
    }

    if (jsonStr) {
      const parsed = JSON.parse(jsonStr);
      if (parsed.profiles && Array.isArray(parsed.profiles)) {
        console.log('[CandidateParser] Parsed', parsed.profiles.length, 'candidates');
        return parsed.profiles.map((p: any, idx: number) => ({
          id: p.id || `candidate-${idx}`,
          name: p.name || 'Unknown',
          title: p.title || p.jobTitle || '',
          company: p.company || '',
          location: p.location || '',
          profileUrl: p.profileUrl || p.link || '',
          summary: p.summary || p.snippet || '',
          skills: p.skills || [],
          matchScore: p.matchScore
        }));
      }
    }

    // Try direct array (no wrapper object)
    const arrayMatch = content.match(/\[\s*\{[\s\S]*"profileUrl"[\s\S]*\}\s*\]/);
    if (arrayMatch) {
      const arr = JSON.parse(arrayMatch[0]);
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.map((p: any, idx: number) => ({
          id: p.id || `candidate-${idx}`,
          name: p.name || 'Unknown',
          title: p.title || '',
          company: p.company || '',
          location: p.location || '',
          profileUrl: p.profileUrl || '',
          summary: p.summary || '',
          skills: p.skills || [],
          matchScore: p.matchScore
        }));
      }
    }
  } catch (e) {
    console.warn('Failed to parse candidate JSON:', e);
  }

  // Fallback: Parse text format
  const candidates: LinkedInCandidate[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('* ') && trimmed.includes('linkedin.com/in/')) {
      const parts = trimmed.substring(2).split(' - ');
      const urlPart = parts.find(p => p.includes('linkedin.com/in/'));

      if (urlPart) {
        const url = urlPart.trim();
        const otherParts = parts.filter(p => !p.includes('linkedin.com/in/'));

        const name = otherParts[0] || 'Unknown';
        const title = otherParts[1] || '';
        const skillsStr = otherParts.length > 2 ? otherParts[otherParts.length - 1] : '';
        const summary = otherParts.length > 3 ? otherParts[2] : '';

        candidates.push({
          id: url,
          name: name.replace('Name not available', 'LinkedIn Member'),
          title,
          company: '',
          location: '',
          profileUrl: url,
          summary,
          skills: skillsStr.split(',').map(s => s.trim()).filter(Boolean),
          matchScore: undefined
        });
      }
    }
  }

  return candidates.length > 0 ? candidates : null;
}

/**
 * Strips candidate data (JSON/text format) from message content for cleaner display.
 */
export function stripCandidateData(content: string): string {
  return content
    .replace(/```json[\s\S]*```/g, '')
    .replace(/\{\s*"profiles"\s*:\s*\[[\s\S]*\]\s*\}/g, '')
    .replace(/\* .*? - .*? - .*? - https:\/\/www\.linkedin\.com\/in\/.*/g, '')
    .replace(/\* .*? - .*? - https:\/\/www\.linkedin\.com\/in\/.*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
