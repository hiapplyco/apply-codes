import { DocumentProcessor, DocumentUploadOptions } from './documentProcessing';
import { ResumeParser, ParsedResume } from './resumeParser';
import { NLPProcessor } from './nlpProcessor';
import { RAGStore } from './ragStore';
import { v4 as uuidv4 } from 'uuid';

export interface EnhancedDocumentResult {
  id: string;
  rawText: string;
  parsedData?: ParsedResume;
  entities?: any[];
  keyPhrases?: string[];
  complexity?: any;
  chunks?: any[];
  processingTime: number;
  confidence: number;
}

export class EnhancedDocumentProcessor {
  /**
   * Process a document with full extraction, parsing, and storage
   */
  static async processDocument(
    file: File,
    userId: string,
    options?: {
      enableNLP?: boolean;
      enableRAG?: boolean;
      storeInDatabase?: boolean;
      onProgress?: (status: string) => void;
    }
  ): Promise<EnhancedDocumentResult> {
    const startTime = Date.now();
    const documentId = uuidv4();
    
    const {
      enableNLP = true,
      enableRAG = true,
      storeInDatabase = true,
      onProgress
    } = options || {};
    
    try {
      // Step 1: Extract raw text
      onProgress?.('Extracting text from document...');
      const uploadOptions: DocumentUploadOptions = {
        file,
        userId,
        onProgress: (status) => onProgress?.(`Text extraction: ${status}`),
        onComplete: (content) => console.log('Text extraction completed'),
        onError: (error) => console.error('Text extraction error:', error)
      };
      
      const rawText = await DocumentProcessor.processDocument(uploadOptions);
      
      // Step 2: Parse resume structure (if applicable)
      let parsedData: ParsedResume | undefined;
      if (this.isLikelyResume(file.name, rawText)) {
        onProgress?.('Parsing resume structure...');
        parsedData = await ResumeParser.parseResume(file);
        
        // Normalize skills for better matching
        if (parsedData.skills) {
          parsedData.skills = ResumeParser.normalizeSkills(parsedData.skills);
        }
      }
      
      // Step 3: NLP Processing
      let entities: any[] = [];
      let keyPhrases: string[] = [];
      let complexity: any = {};
      
      if (enableNLP) {
        onProgress?.('Analyzing document with NLP...');
        
        // Extract entities
        entities = NLPProcessor.extractEntities(rawText);
        
        // Extract key phrases
        keyPhrases = NLPProcessor.extractKeyPhrases(rawText);
        
        // Calculate complexity
        complexity = NLPProcessor.calculateComplexity(rawText);
      }
      
      // Step 4: Create chunks for RAG
      let chunks: any[] = [];
      if (enableRAG) {
        onProgress?.('Creating searchable chunks...');
        
        if (parsedData) {
          // Use semantic chunking for resumes
          const sections = new Map<string, string>();
          sections.set('contact', JSON.stringify(parsedData.contactInfo));
          sections.set('summary', parsedData.summary);
          sections.set('skills', parsedData.skills.join(', '));
          sections.set('experience', parsedData.experience.map(e => e.raw).join('\n\n'));
          sections.set('education', parsedData.education.map(e => e.raw).join('\n\n'));
          
          chunks = RAGStore.createSemanticChunks(sections, documentId);
        } else {
          // Regular chunking for non-resume documents
          chunks = RAGStore.createChunks(rawText, documentId);
        }
        
        // Generate embeddings
        onProgress?.('Generating embeddings...');
        chunks = await RAGStore.generateEmbeddings(chunks);
      }
      
      // Step 5: Store in database
      if (storeInDatabase && enableRAG) {
        onProgress?.('Storing in database...');
        
        if (parsedData) {
          // Store as parsed resume
          await RAGStore.storeResume(documentId, parsedData, {
            name: file.name,
            size: file.size,
            type: file.type
          });
        } else {
          // Store chunks only
          await RAGStore.storeChunks(chunks);
        }
      }
      
      const processingTime = Date.now() - startTime;
      const confidence = parsedData?.metadata?.confidence || 
                        (entities.length > 0 ? 80 : 60);
      
      onProgress?.('Processing complete!');
      
      return {
        id: documentId,
        rawText,
        parsedData,
        entities,
        keyPhrases,
        complexity,
        chunks,
        processingTime,
        confidence
      };
      
    } catch (error) {
      console.error('Enhanced document processing failed:', error);
      throw error;
    }
  }
  
  /**
   * Check if a document is likely a resume
   */
  private static isLikelyResume(filename: string, content: string): boolean {
    // Check filename
    const resumeKeywords = ['resume', 'cv', 'curriculum'];
    const lowerFilename = filename.toLowerCase();
    if (resumeKeywords.some(keyword => lowerFilename.includes(keyword))) {
      return true;
    }
    
    // Check content for resume indicators
    const resumeIndicators = [
      'experience', 'education', 'skills', 'summary',
      'objective', 'qualifications', 'employment',
      '@', 'phone', 'email', 'linkedin'
    ];
    
    const lowerContent = content.toLowerCase();
    const matchCount = resumeIndicators.filter(indicator => 
      lowerContent.includes(indicator)
    ).length;
    
    return matchCount >= 4; // At least 4 indicators
  }
  
  /**
   * Search across stored documents
   */
  static async search(
    query: string,
    options?: {
      limit?: number;
      threshold?: number;
      documentType?: 'resume' | 'all';
    }
  ): Promise<any[]> {
    const { limit = 10, threshold = 0.7, documentType = 'all' } = options || {};
    
    try {
      // Use vector search
      const results = await RAGStore.searchSimilarChunks(query, limit, threshold);
      
      // If searching specifically for resumes, enhance results
      if (documentType === 'resume' && results.length > 0) {
        // Get full resume data for each result
        const documentIds = [...new Set(results.map(r => r.chunk.documentId))];
        
        // Fetch full resume data (requires Firestore resume storage implementation)
        // For now, return chunk results
        return results;
      }
      
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }
  
  /**
   * Match resume against job requirements
   */
  static async matchResumeToJob(
    resumeId: string,
    jobRequirements: string
  ): Promise<{
    overallScore: number;
    skillMatch: number;
    experienceMatch: number;
    educationMatch: number;
    matches: string[];
    gaps: string[];
  }> {
    try {
      // Extract requirements from job description
      const jobEntities = NLPProcessor.extractEntities(jobRequirements);
      const jobSkills = jobEntities
        .filter(e => e.type === 'SKILL')
        .map(e => e.text.toLowerCase());
      
      // Search for the resume
      const searchResults = await this.search(resumeId, { limit: 1 });
      if (searchResults.length === 0) {
        throw new Error('Resume not found');
      }
      
      // For now, return a mock result
      // In production, this would fetch the full resume and perform matching
      return {
        overallScore: 0.75,
        skillMatch: 0.8,
        experienceMatch: 0.7,
        educationMatch: 0.75,
        matches: ['JavaScript', 'React', 'Node.js'],
        gaps: ['Kubernetes', 'GraphQL']
      };
    } catch (error) {
      console.error('Resume matching failed:', error);
      throw error;
    }
  }
  
  /**
   * Batch process multiple documents
   */
  static async batchProcess(
    files: File[],
    userId: string,
    options?: {
      parallel?: boolean;
      maxConcurrent?: number;
      onProgress?: (current: number, total: number, status: string) => void;
    }
  ): Promise<EnhancedDocumentResult[]> {
    const { parallel = true, maxConcurrent = 3, onProgress } = options || {};
    const results: EnhancedDocumentResult[] = [];
    
    if (!parallel) {
      // Sequential processing
      for (let i = 0; i < files.length; i++) {
        onProgress?.(i + 1, files.length, `Processing ${files[i].name}...`);
        const result = await this.processDocument(files[i], userId);
        results.push(result);
      }
    } else {
      // Parallel processing with concurrency limit
      const chunks: File[][] = [];
      for (let i = 0; i < files.length; i += maxConcurrent) {
        chunks.push(files.slice(i, i + maxConcurrent));
      }
      
      let processed = 0;
      for (const chunk of chunks) {
        const chunkPromises = chunk.map(file => 
          this.processDocument(file, userId).then(result => {
            processed++;
            onProgress?.(processed, files.length, `Completed ${file.name}`);
            return result;
          })
        );
        
        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
      }
    }
    
    return results;
  }
}
