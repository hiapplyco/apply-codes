# Document Processing System

This document describes the enhanced document processing system, which combines best practices from Python-based resume parsing with a TypeScript implementation, optimized for our existing infrastructure. The system is designed to be asynchronous, scalable, and reliable.

## Architecture

The document upload system has been transformed from a synchronous, direct-processing approach to an asynchronous, storage-first architecture.

**Asynchronous Workflow:**
`Client → Supabase Storage → Storage Trigger → Edge Function → AI Processing → Database`

## Key Components

-   **Database Schema:** A `processed_documents` table tracks all document processing operations, storing status, extracted content, and error messages. A storage trigger function, `handle_document_upload()`, automatically initiates the processing workflow.
-   **Async Edge Function (`process-document-async`):** This function is triggered by storage events, downloads files from storage, processes them with the Gemini API, and updates the database with the results.
-   **Client-Side Library (`DocumentProcessor`):** A class that handles file validation, direct storage uploads, and polling for processing status.

## Features

### Multi-Format Support
-   **PDF**: Using PDF.js with fallback options.
-   **DOCX**: Optimized mammoth.js extraction.
-   **Images**: OCR with Tesseract.js.
-   **Plain Text**: Direct reading.

### Structured Resume Parsing
-   Contact information extraction (name, email, phone, location, social links).
-   Work experience parsing with company/title/date extraction.
-   Education detection with degree/institution/year.
-   Skills extraction with normalization.

### Advanced NLP Processing
-   Named Entity Recognition (PERSON, ORGANIZATION, LOCATION, DATE, SKILL, TITLE).
-   Key phrase extraction.
-   Technical term detection.

### RAG-Ready Storage
-   Semantic chunking with overlap for context preservation.
-   Vector embeddings generation.
-   JSONL export capability.
-   Searchable index creation.

## Usage

The `EnhancedDocumentProcessor` class provides a simple interface for processing documents.

### Basic Document Processing
```typescript
import { EnhancedDocumentProcessor } from '@/lib/enhancedDocumentProcessor';

const result = await EnhancedDocumentProcessor.processDocument(
  file,
  userId,
  {
    enableNLP: true,
    enableRAG: true,
    storeInDatabase: true,
    onProgress: (status) => console.log(status)
  }
);
```

### Batch Processing
```typescript
const results = await EnhancedDocumentProcessor.batchProcess(
  files,
  userId,
  {
    parallel: true,
    maxConcurrent: 3,
    onProgress: (current, total, status) => {
      console.log(`Processing ${current}/${total}: ${status}`);
    }
  }
);
```
