import { supabase } from "@/integrations/supabase/client";

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  embedding?: number[];
  metadata: {
    section?: string;
    pageNumber?: number;
    chunkIndex: number;
    tokens?: number;
  };
}

export interface VectorSearchResult {
  chunk: DocumentChunk;
  similarity: number;
}

export class RAGStore {
  private static readonly CHUNK_SIZE = 512; // tokens approximation
  private static readonly CHUNK_OVERLAP = 50; // tokens overlap
  
  /**
   * Split document into overlapping chunks for better context preservation
   */
  static createChunks(
    text: string, 
    documentId: string,
    metadata?: { section?: string; pageNumber?: number }
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    
    // Split by paragraphs first to maintain semantic boundaries
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (const paragraph of paragraphs) {
      const trimmedPara = paragraph.trim();
      if (!trimmedPara) continue;
      
      // Estimate tokens (rough: 1 token ≈ 4 chars)
      const paraTokens = Math.ceil(trimmedPara.length / 4);
      const currentTokens = Math.ceil(currentChunk.length / 4);
      
      // If adding this paragraph exceeds chunk size, save current chunk
      if (currentTokens + paraTokens > this.CHUNK_SIZE && currentChunk) {
        chunks.push({
          id: `${documentId}-chunk-${chunkIndex}`,
          documentId,
          content: currentChunk.trim(),
          metadata: {
            ...metadata,
            chunkIndex,
            tokens: Math.ceil(currentChunk.length / 4)
          }
        });
        
        // Start new chunk with overlap from previous
        const words = currentChunk.split(/\s+/);
        const overlapWords = words.slice(-this.CHUNK_OVERLAP);
        currentChunk = overlapWords.join(' ') + '\n\n' + trimmedPara;
        chunkIndex++;
      } else {
        // Add to current chunk
        currentChunk += (currentChunk ? '\n\n' : '') + trimmedPara;
      }
    }
    
    // Don't forget the last chunk
    if (currentChunk) {
      chunks.push({
        id: `${documentId}-chunk-${chunkIndex}`,
        documentId,
        content: currentChunk.trim(),
        metadata: {
          ...metadata,
          chunkIndex,
          tokens: Math.ceil(currentChunk.length / 4)
        }
      });
    }
    
    return chunks;
  }
  
  /**
   * Create semantic chunks based on document structure
   */
  static createSemanticChunks(
    sections: Map<string, string>,
    documentId: string
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    let globalIndex = 0;
    
    for (const [sectionName, content] of sections) {
      if (!content.trim()) continue;
      
      // Create chunks for this section
      const sectionChunks = this.createChunks(content, documentId, {
        section: sectionName
      });
      
      // Update indices to be globally unique
      for (const chunk of sectionChunks) {
        chunk.id = `${documentId}-chunk-${globalIndex}`;
        chunk.metadata.chunkIndex = globalIndex;
        chunks.push(chunk);
        globalIndex++;
      }
    }
    
    return chunks;
  }
  
  /**
   * Store document chunks in the database
   */
  static async storeChunks(chunks: DocumentChunk[]): Promise<void> {
    if (chunks.length === 0) return;
    
    try {
      // Prepare chunks for database insertion
      const dbChunks = chunks.map(chunk => ({
        document_id: chunk.documentId,
        chunk_id: chunk.id,
        content: chunk.content,
        metadata: chunk.metadata,
        embedding: chunk.embedding || null
      }));
      
      // Insert in batches to avoid timeouts
      const batchSize = 100;
      for (let i = 0; i < dbChunks.length; i += batchSize) {
        const batch = dbChunks.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('document_chunks')
          .insert(batch);
        
        if (error) {
          console.error('Error storing chunk batch:', error);
          throw error;
        }
      }
      
      console.log(`Stored ${chunks.length} chunks successfully`);
    } catch (error) {
      console.error('Failed to store chunks:', error);
      throw new Error('Failed to store document chunks in database');
    }
  }
  
  /**
   * Generate embeddings for chunks using edge function
   */
  static async generateEmbeddings(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    try {
      // Call edge function to generate embeddings
      const { data, error } = await supabase.functions.invoke('generate-embeddings', {
        body: {
          texts: chunks.map(c => c.content)
        }
      });
      
      if (error) {
        console.error('Embedding generation error:', error);
        return chunks; // Return without embeddings
      }
      
      // Attach embeddings to chunks
      if (data?.embeddings && Array.isArray(data.embeddings)) {
        chunks.forEach((chunk, index) => {
          if (data.embeddings[index]) {
            chunk.embedding = data.embeddings[index];
          }
        });
      }
      
      return chunks;
    } catch (error) {
      console.error('Failed to generate embeddings:', error);
      return chunks; // Return chunks without embeddings
    }
  }
  
  /**
   * Search for similar chunks using vector similarity
   */
  static async searchSimilarChunks(
    query: string,
    limit: number = 5,
    threshold: number = 0.7
  ): Promise<VectorSearchResult[]> {
    try {
      // Generate embedding for query
      const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke('generate-embeddings', {
        body: { texts: [query] }
      });
      
      if (embeddingError || !embeddingData?.embeddings?.[0]) {
        console.error('Failed to generate query embedding:', embeddingError);
        // Fallback to text search
        return this.fallbackTextSearch(query, limit);
      }
      
      const queryEmbedding = embeddingData.embeddings[0];
      
      // Perform vector similarity search
      const { data, error } = await supabase.rpc('search_similar_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit
      });
      
      if (error) {
        console.error('Vector search error:', error);
        return this.fallbackTextSearch(query, limit);
      }
      
      return (data || []).map((result: any) => ({
        chunk: {
          id: result.chunk_id,
          documentId: result.document_id,
          content: result.content,
          metadata: result.metadata
        },
        similarity: result.similarity
      }));
    } catch (error) {
      console.error('Search error:', error);
      return this.fallbackTextSearch(query, limit);
    }
  }
  
  /**
   * Fallback text-based search when vector search fails
   */
  private static async fallbackTextSearch(
    query: string,
    limit: number
  ): Promise<VectorSearchResult[]> {
    try {
      const { data, error } = await supabase
        .from('document_chunks')
        .select('*')
        .textSearch('content', query)
        .limit(limit);
      
      if (error) {
        console.error('Fallback search error:', error);
        return [];
      }
      
      return (data || []).map((chunk: any) => ({
        chunk: {
          id: chunk.chunk_id,
          documentId: chunk.document_id,
          content: chunk.content,
          metadata: chunk.metadata
        },
        similarity: 0.5 // Default similarity for text search
      }));
    } catch (error) {
      console.error('Fallback search failed:', error);
      return [];
    }
  }
  
  /**
   * Export chunks to JSONL format for external use
   */
  static exportToJSONL(chunks: DocumentChunk[]): string {
    return chunks
      .map(chunk => JSON.stringify({
        id: chunk.id,
        document_id: chunk.documentId,
        content: chunk.content,
        metadata: chunk.metadata
      }))
      .join('\n');
  }
  
  /**
   * Create a searchable index entry for a parsed resume
   */
  static createResumeSearchIndex(
    resumeId: string,
    parsedResume: any // ParsedResume type
  ): string {
    const searchableContent = [
      `Name: ${parsedResume.contactInfo.name || 'Unknown'}`,
      `Email: ${parsedResume.contactInfo.emails.join(', ')}`,
      `Phone: ${parsedResume.contactInfo.phones.join(', ')}`,
      `Location: ${parsedResume.contactInfo.locations.join(', ')}`,
      '',
      'SUMMARY:',
      parsedResume.summary,
      '',
      'SKILLS:',
      parsedResume.skills.join(', '),
      '',
      'EXPERIENCE:',
      ...parsedResume.experience.map((exp: any) => 
        `${exp.title} at ${exp.company} (${exp.dates})\n${exp.description}`
      ),
      '',
      'EDUCATION:',
      ...parsedResume.education.map((edu: any) => 
        `${edu.degree || 'Degree'} from ${edu.institution || 'Institution'} (${edu.year || 'Year'})`
      ),
      '',
      'CERTIFICATIONS:',
      parsedResume.certifications.join(', ')
    ].filter(Boolean).join('\n');
    
    return searchableContent;
  }
  
  /**
   * Store a parsed resume with full-text search and vector capabilities
   */
  static async storeResume(
    resumeId: string,
    parsedResume: any,
    originalFile: { name: string; size: number; type: string }
  ): Promise<void> {
    try {
      // Create searchable content
      const searchableContent = this.createResumeSearchIndex(resumeId, parsedResume);
      
      // Create chunks for RAG
      const chunks = this.createChunks(searchableContent, resumeId);
      
      // Generate embeddings if available
      const chunksWithEmbeddings = await this.generateEmbeddings(chunks);
      
      // Store the parsed resume
      const { error: resumeError } = await supabase
        .from('parsed_resumes')
        .insert({
          id: resumeId,
          contact_info: parsedResume.contactInfo,
          summary: parsedResume.summary,
          skills: parsedResume.skills,
          experience: parsedResume.experience,
          education: parsedResume.education,
          certifications: parsedResume.certifications,
          raw_text: parsedResume.rawText,
          searchable_content: searchableContent,
          metadata: {
            ...parsedResume.metadata,
            originalFile
          }
        });
      
      if (resumeError) {
        console.error('Error storing resume:', resumeError);
        throw resumeError;
      }
      
      // Store chunks for vector search
      await this.storeChunks(chunksWithEmbeddings);
      
    } catch (error) {
      console.error('Failed to store resume:', error);
      throw new Error('Failed to store parsed resume in database');
    }
  }
}