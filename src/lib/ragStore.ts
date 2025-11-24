

import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { processTextExtraction } from './firebase/functions/processTextExtraction';
import { db } from './firebase';

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

    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      // Insert in batches to avoid timeouts
      const batchSize = 100;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batchChunks = chunks.slice(i, i + batchSize);
        const batch = writeBatch(db);

        batchChunks.forEach(chunk => {
          const chunkRef = doc(collection(db, 'document_chunks'));
          batch.set(chunkRef, {
            document_id: chunk.documentId,
            chunk_id: chunk.id,
            content: chunk.content,
            metadata: chunk.metadata,
            embedding: chunk.embedding || null,
            created_at: serverTimestamp()
          });
        });

        await batch.commit();
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
      const data = await processTextExtraction({
        extractionType: 'embeddings',
        options: {
          texts: chunks.map(c => c.content)
        }
      });

      const error = null;
      
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
      // Generate embedding for query using Firebase Functions
      const { functionBridge } = await import('./function-bridge');

      const embeddingData = await functionBridge.processTextExtraction({
        extractionType: 'embeddings',
        options: {
          texts: [query]
        }
      });

      const embeddingError = null;
      
      if (embeddingError || !embeddingData?.embeddings?.[0]) {
        console.error('Failed to generate query embedding:', embeddingError);
        // Fallback to text search
        return this.fallbackTextSearch(query, limit);
      }
      
      const queryEmbedding = embeddingData.embeddings[0];
      
      // Note: Firestore doesn't have native vector search.
      // This would need to be implemented using a vector database like Pinecone or custom solution
      console.warn('Vector similarity search requires external vector database in Firestore setup');

      // Fallback to text search for now
      const result = await this.fallbackTextSearch(query, limit);
      return result;
      
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
    searchQuery: string,
    limitCount: number
  ): Promise<VectorSearchResult[]> {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      // Get all document chunks and filter client-side
      const chunksRef = collection(db, 'document_chunks');
      const chunksSnapshot = await getDocs(chunksRef);

      const filteredChunks = chunksSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(chunk =>
          chunk.content?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, limitCount)
        .map((chunk: any) => ({
          chunk: {
            id: chunk.chunk_id,
            documentId: chunk.document_id,
            content: chunk.content,
            metadata: chunk.metadata
          },
          similarity: 0.5 // Default similarity for text search
        }));

      return filteredChunks;
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
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      // Create searchable content
      const searchableContent = this.createResumeSearchIndex(resumeId, parsedResume);

      // Create chunks for RAG
      const chunks = this.createChunks(searchableContent, resumeId);

      // Generate embeddings if available
      const chunksWithEmbeddings = await this.generateEmbeddings(chunks);

      // Store the parsed resume
      const resumeRef = doc(db, 'parsed_resumes', resumeId);
      await addDoc(collection(db, 'parsed_resumes'), {
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
        },
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      // Store chunks for vector search
      await this.storeChunks(chunksWithEmbeddings);

    } catch (error) {
      console.error('Failed to store resume:', error);
      throw new Error('Failed to store parsed resume in database');
    }
  }
}
