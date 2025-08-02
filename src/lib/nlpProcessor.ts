// Advanced NLP processing for document extraction
export interface Entity {
  text: string;
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'DATE' | 'SKILL' | 'TITLE';
  confidence: number;
  position: { start: number; end: number };
}

export interface SentenceAnalysis {
  text: string;
  entities: Entity[];
  sentiment?: number;
  keywords: string[];
}

export class NLPProcessor {
  private static readonly TITLE_KEYWORDS = [
    'engineer', 'developer', 'manager', 'director', 'analyst', 'designer',
    'architect', 'lead', 'senior', 'junior', 'specialist', 'consultant',
    'coordinator', 'administrator', 'scientist', 'researcher', 'professor'
  ];
  
  private static readonly SKILL_PATTERNS = [
    // Programming languages
    /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|Ruby|Go|Rust|Swift|Kotlin|PHP|Scala|R|MATLAB)\b/gi,
    // Frameworks and libraries
    /\b(React|Angular|Vue|Node\.js|Express|Django|Flask|Spring|Rails|Laravel|\.NET|FastAPI)\b/gi,
    // Databases
    /\b(MySQL|PostgreSQL|MongoDB|Redis|Elasticsearch|Cassandra|DynamoDB|Firebase|SQLite)\b/gi,
    // Cloud and DevOps
    /\b(AWS|Azure|GCP|Docker|Kubernetes|Jenkins|GitLab|CircleCI|Terraform|Ansible)\b/gi,
    // Data Science and ML
    /\b(TensorFlow|PyTorch|Scikit-learn|Pandas|NumPy|Keras|NLTK|SpaCy|OpenCV)\b/gi,
    // Other technical skills
    /\b(REST|GraphQL|Microservices|CI\/CD|Agile|Scrum|Git|Linux|Machine Learning|Deep Learning)\b/gi
  ];
  
  private static readonly COMPANY_INDICATORS = [
    'Inc', 'LLC', 'Corp', 'Corporation', 'Company', 'Ltd', 'Limited',
    'Group', 'Partners', 'Associates', 'Consulting', 'Solutions', 'Technologies'
  ];
  
  /**
   * Extract named entities from text using pattern matching and heuristics
   */
  static extractEntities(text: string): Entity[] {
    const entities: Entity[] = [];
    
    // Extract person names (simple heuristic - capitalized words at beginning)
    const lines = text.split('\n');
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      if (line.length > 0 && line.length < 50) {
        const words = line.split(/\s+/);
        if (words.length >= 2 && words.length <= 4) {
          const isName = words.every(word => 
            /^[A-Z][a-z]+$/.test(word) || word.length <= 3
          );
          if (isName && !this.containsKeyword(line, [...this.TITLE_KEYWORDS, ...this.COMPANY_INDICATORS])) {
            const startPos = text.indexOf(line);
            entities.push({
              text: line,
              type: 'PERSON',
              confidence: 0.7,
              position: { start: startPos, end: startPos + line.length }
            });
            break; // Only take first probable name
          }
        }
      }
    }
    
    // Extract organizations
    const orgPattern = new RegExp(
      `\\b([A-Z][\\w\\s&]+(?:\\s+(?:${this.COMPANY_INDICATORS.join('|')}))?)\\b`,
      'g'
    );
    
    let match;
    while ((match = orgPattern.exec(text)) !== null) {
      const org = match[1].trim();
      if (org.length > 3 && this.isLikelyOrganization(org)) {
        entities.push({
          text: org,
          type: 'ORGANIZATION',
          confidence: 0.8,
          position: { start: match.index, end: match.index + org.length }
        });
      }
    }
    
    // Extract locations
    const locationPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*([A-Z]{2}|\w+)\b/g;
    while ((match = locationPattern.exec(text)) !== null) {
      const location = match[0];
      entities.push({
        text: location,
        type: 'LOCATION',
        confidence: 0.7,
        position: { start: match.index, end: match.index + location.length }
      });
    }
    
    // Extract dates
    const datePatterns = [
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\b/gi,
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
      /\b\d{4}\s*-\s*\d{4}\b/g,
      /\b(Present|Current)\b/gi
    ];
    
    for (const pattern of datePatterns) {
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type: 'DATE',
          confidence: 0.9,
          position: { start: match.index, end: match.index + match[0].length }
        });
      }
    }
    
    // Extract skills
    for (const pattern of this.SKILL_PATTERNS) {
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type: 'SKILL',
          confidence: 0.95,
          position: { start: match.index, end: match.index + match[0].length }
        });
      }
    }
    
    // Extract job titles
    const titlePattern = new RegExp(
      `\\b((?:Senior|Junior|Lead|Staff|Principal|Chief)?\\s*(?:${this.TITLE_KEYWORDS.join('|')})[\\w\\s]*)\\b`,
      'gi'
    );
    
    while ((match = titlePattern.exec(text)) !== null) {
      const title = match[1].trim();
      if (title.length > 5) {
        entities.push({
          text: title,
          type: 'TITLE',
          confidence: 0.85,
          position: { start: match.index, end: match.index + title.length }
        });
      }
    }
    
    // Deduplicate entities by text and type
    const seen = new Set<string>();
    return entities.filter(entity => {
      const key = `${entity.type}:${entity.text.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  
  /**
   * Extract key phrases and concepts from text
   */
  static extractKeyPhrases(text: string, maxPhrases: number = 20): string[] {
    const phrases: Map<string, number> = new Map();
    
    // Split into sentences
    const sentences = text.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      // Extract noun phrases (simplified)
      const nounPhrasePattern = /\b([A-Z][a-z]+(?:\s+[A-Z]?[a-z]+){0,2})\b/g;
      const matches = sentence.match(nounPhrasePattern) || [];
      
      for (const phrase of matches) {
        if (phrase.length > 5 && !this.isCommonWord(phrase)) {
          const normalized = phrase.toLowerCase();
          phrases.set(normalized, (phrases.get(normalized) || 0) + 1);
        }
      }
      
      // Extract technical terms
      const techTerms = this.extractTechnicalTerms(sentence);
      for (const term of techTerms) {
        phrases.set(term.toLowerCase(), (phrases.get(term.toLowerCase()) || 0) + 2); // Higher weight
      }
    }
    
    // Sort by frequency and return top phrases
    return Array.from(phrases.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxPhrases)
      .map(([phrase]) => phrase);
  }
  
  /**
   * Analyze sentences for entity extraction and keyword identification
   */
  static analyzeSentences(text: string): SentenceAnalysis[] {
    const sentences = this.splitIntoSentences(text);
    const analyses: SentenceAnalysis[] = [];
    
    for (const sentence of sentences) {
      const entities = this.extractEntities(sentence);
      const keywords = this.extractKeywords(sentence);
      
      analyses.push({
        text: sentence,
        entities,
        keywords,
        sentiment: this.calculateSimpleSentiment(sentence)
      });
    }
    
    return analyses;
  }
  
  /**
   * Extract technical terms from text
   */
  private static extractTechnicalTerms(text: string): string[] {
    const terms: string[] = [];
    
    // Common technical patterns
    const patterns = [
      /\b[A-Z]+(?:\.[A-Z]+)*\b/g, // Acronyms like API, CI/CD
      /\b\w+\.js\b/gi, // .js frameworks
      /\b\w+#\b/g, // C#, F#
      /\b\w+\+\+\b/g, // C++
      /\b[A-Z][a-z]+[A-Z][a-z]+\b/g, // CamelCase terms
    ];
    
    for (const pattern of patterns) {
      const matches = text.match(pattern) || [];
      terms.push(...matches);
    }
    
    return [...new Set(terms)]; // Deduplicate
  }
  
  /**
   * Split text into sentences
   */
  private static splitIntoSentences(text: string): string[] {
    // Simple sentence splitter - can be improved with better NLP libraries
    return text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 10);
  }
  
  /**
   * Extract keywords from a sentence
   */
  private static extractKeywords(sentence: string): string[] {
    const keywords: string[] = [];
    const words = sentence.split(/\s+/);
    
    for (const word of words) {
      const cleaned = word.replace(/[^\w]/g, '').toLowerCase();
      if (cleaned.length > 3 && !this.isCommonWord(cleaned)) {
        keywords.push(cleaned);
      }
    }
    
    return keywords;
  }
  
  /**
   * Simple sentiment calculation (-1 to 1)
   */
  private static calculateSimpleSentiment(text: string): number {
    const positive = [
      'excellent', 'outstanding', 'exceptional', 'proficient', 'expert',
      'achieved', 'improved', 'enhanced', 'successful', 'innovative'
    ];
    
    const negative = [
      'failed', 'poor', 'lacking', 'insufficient', 'problem', 'issue'
    ];
    
    const lower = text.toLowerCase();
    let score = 0;
    
    for (const word of positive) {
      if (lower.includes(word)) score += 0.2;
    }
    
    for (const word of negative) {
      if (lower.includes(word)) score -= 0.2;
    }
    
    return Math.max(-1, Math.min(1, score));
  }
  
  /**
   * Check if a word is common (stopword)
   */
  private static isCommonWord(word: string): boolean {
    const stopwords = [
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have',
      'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
      'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they',
      'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one',
      'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out',
      'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when'
    ];
    
    return stopwords.includes(word.toLowerCase());
  }
  
  /**
   * Check if text contains any of the keywords
   */
  private static containsKeyword(text: string, keywords: string[]): boolean {
    const lower = text.toLowerCase();
    return keywords.some(keyword => lower.includes(keyword.toLowerCase()));
  }
  
  /**
   * Check if a string is likely an organization name
   */
  private static isLikelyOrganization(text: string): boolean {
    // Has company indicator
    if (this.COMPANY_INDICATORS.some(indicator => text.includes(indicator))) {
      return true;
    }
    
    // Multiple capitalized words
    const words = text.split(/\s+/);
    const capitalizedCount = words.filter(word => /^[A-Z]/.test(word)).length;
    
    return capitalizedCount >= 2 && words.length >= 2;
  }
  
  /**
   * Calculate text complexity score
   */
  static calculateComplexity(text: string): {
    readabilityScore: number;
    avgSentenceLength: number;
    avgWordLength: number;
    technicalDensity: number;
  } {
    const sentences = this.splitIntoSentences(text);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    const avgSentenceLength = sentences.length > 0 
      ? words.length / sentences.length 
      : 0;
    
    const avgWordLength = words.length > 0
      ? words.reduce((sum, word) => sum + word.length, 0) / words.length
      : 0;
    
    // Count technical terms
    const technicalTerms = this.extractTechnicalTerms(text);
    const technicalDensity = words.length > 0
      ? technicalTerms.length / words.length
      : 0;
    
    // Simple readability score (inverse of complexity)
    const readabilityScore = Math.max(0, Math.min(100,
      100 - (avgSentenceLength * 2 + avgWordLength * 5 + technicalDensity * 100)
    ));
    
    return {
      readabilityScore,
      avgSentenceLength,
      avgWordLength,
      technicalDensity
    };
  }
}