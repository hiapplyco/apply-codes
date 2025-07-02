// Test fixtures for parse-document function tests

export const testUserId = 'test-user-123';

// File content fixtures
export const fileContents = {
  pdf: `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/MediaBox [0 0 612 792]
/Contents 5 0 R
>>
endobj
Sample PDF content with resume data`,

  word: `PK
Sample Word document content
Project Proposal: AI Integration
Author: Jane Smith
Date: 2024-01-15`,

  excel: `PK
Sample Excel spreadsheet content
Sales Data Q1-Q4 2024
Total Revenue: $1,500,000
Growth: 25%`,

  text: `Plain text resume

John Doe
Software Engineer

Experience:
- Senior Developer at Tech Corp (2020-2024)
- Mid-level Developer at StartupXYZ (2018-2020)

Skills:
- JavaScript, TypeScript, Python
- React, Node.js, PostgreSQL
- AWS, Docker, Kubernetes

Education:
- BS Computer Science, University of Example (2018)`,

  largeText: 'x'.repeat(1000000), // 1MB of text

  malformed: `This is not a valid PDF file
It contains random text that should fail processing`,
};

// File metadata fixtures
export const fileMetadata = {
  pdf: {
    name: 'resume.pdf',
    type: 'application/pdf',
    size: 50000
  },
  word: {
    name: 'proposal.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 75000
  },
  excel: {
    name: 'sales-data.xlsx',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 100000
  },
  text: {
    name: 'notes.txt',
    type: 'text/plain',
    size: 2000
  },
  unsupported: {
    name: 'video.mp4',
    type: 'video/mp4',
    size: 5000000
  },
  noExtension: {
    name: 'document',
    type: 'application/octet-stream',
    size: 10000
  }
};

// Expected responses
export const expectedResponses = {
  successPdf: {
    success: true,
    text: 'Extracted PDF content: Resume of John Doe, Software Engineer with 5 years experience.',
    message: 'Document processed successfully'
  },
  successWord: {
    success: true,
    text: 'Extracted Word content: Project proposal for new AI initiative.',
    message: 'Document processed successfully'
  },
  successExcel: {
    success: true,
    text: 'Extracted Excel content: Sales data Q1-Q4 2024, Total revenue: $1.5M',
    message: 'Document processed successfully'
  },
  successText: {
    success: true,
    text: fileContents.text,
    message: 'Text file processed successfully'
  },
  errorNoFile: {
    success: false,
    error: 'No file found: Please select a file to upload.',
    details: 'No file uploaded or missing user ID'
  },
  errorProcessingFailed: {
    success: false,
    error: 'File processing error: Google was unable to process the file. Please try a different file format.',
    details: 'Document processing failed: File processing failed on Google\'s end.'
  },
  errorTimeout: {
    success: false,
    error: 'Processing timeout: The file took too long to process. Please try a smaller file.',
    details: 'Document processing failed: File processing timed out.'
  },
  errorUpload: {
    success: false,
    error: 'Upload error: Failed to upload the file to Google. Please check your internet connection.',
    details: 'Document processing failed: Failed to upload file to Google'
  }
};

// Error scenarios
export const errorScenarios = {
  missingFile: {
    formData: {
      userId: testUserId
      // file is missing
    }
  },
  missingUserId: {
    formData: {
      file: fileMetadata.pdf
      // userId is missing
    }
  },
  largeFile: {
    formData: {
      file: {
        ...fileMetadata.pdf,
        size: 100 * 1024 * 1024 // 100MB
      },
      userId: testUserId
    }
  },
  unsupportedType: {
    formData: {
      file: fileMetadata.unsupported,
      userId: testUserId
    }
  }
};

// CORS headers that should be present in all responses
export const expectedCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Prompt templates for different file types
export const expectedPrompts = {
  pdf: 'System: You are an expert in parsing PDF documents. Your task is to accurately extract all text content, including headers, footers, tables, and lists. Preserve the original structure and formatting as closely as possible. Pay special attention to details like contact information, skills, experience, and job requirements.',
  word: 'System: You are an expert in parsing Word documents. Your task is to accurately extract all text content, including tables, lists, and formatting. Preserve the original structure and formatting as closely as possible. Pay special attention to details like contact information, skills, experience, and job requirements.',
  excel: 'System: You are an expert in parsing spreadsheet documents. Your task is to accurately extract all data, including formulas, charts, and tables. Preserve the original structure and formatting as closely as possible. Pay special attention to maintaining the relationships between data points.',
  default: 'Extract all text from the document, preserving the original structure, formatting, and any relevant details.'
};

// Performance benchmarks
export const performanceBenchmarks = {
  maxProcessingTime: 30000, // 30 seconds max for file processing
  maxPollingAttempts: 10,
  pollingInterval: 2000,
  maxFileSize: 50 * 1024 * 1024 // 50MB
};

// Mock Gemini file states for testing
export const geminiFileStates = {
  processing: 'PROCESSING',
  active: 'ACTIVE',
  failed: 'FAILED'
};

// Test case categories
export const testCategories = {
  unitTests: [
    'Prompt generation based on file types',
    'File type detection',
    'Error message formatting',
    'CORS header generation'
  ],
  integrationTests: [
    'Complete file upload flow',
    'Text file processing',
    'PDF processing with Gemini',
    'Word document processing',
    'Excel spreadsheet processing',
    'File state polling mechanism',
    'Cleanup after processing'
  ],
  errorHandlingTests: [
    'Missing file error',
    'Missing user ID error',
    'Gemini upload failure',
    'File processing timeout',
    'File state FAILED',
    'Supabase storage failure',
    'Large file handling',
    'Unsupported file type'
  ],
  performanceTests: [
    'Processing time within limits',
    'Polling doesn\'t exceed max attempts',
    'Memory usage for large files'
  ],
  securityTests: [
    'CORS headers present',
    'No sensitive data in logs',
    'Proper error sanitization'
  ]
};