// Unused imports removed - keeping file for potential future use

// Mock classes and interfaces
export interface MockFile {
  name: string;
  type: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export class MockFormData {
  private data: Map<string, any> = new Map();

  append(name: string, value: any): void {
    this.data.set(name, value);
  }

  get(name: string): any {
    return this.data.get(name);
  }

  set(name: string, value: any): void {
    this.data.set(name, value);
  }
}

export class MockRequest {
  method: string;
  private _formData: MockFormData;

  constructor(method: string, formData?: MockFormData) {
    this.method = method;
    this._formData = formData || new MockFormData();
  }

  async formData(): Promise<MockFormData> {
    return this._formData;
  }
}

export class MockResponse {
  body: string;
  status: number;
  headers: Headers;

  constructor(body: string | null, init?: ResponseInit) {
    this.body = body || '';
    this.status = init?.status || 200;
    this.headers = new Headers(init?.headers);
  }

  async json() {
    return JSON.parse(this.body);
  }
}

// Mock Supabase client
export function createMockSupabaseClient(options: {
  uploadError?: Error;
  uploadSuccess?: boolean;
} = {}) {
  return {
    storage: {
      from: (_bucket: string) => ({
        upload: async (_path: string, _data: ArrayBuffer, _options: any) => {
          if (options.uploadError) {
            return { error: options.uploadError };
          }
          return { error: null };
        }
      })
    }
  };
}

// Mock Google AI classes
export class MockGoogleGenerativeAI {
  constructor(_apiKey: string) {}

  getGenerativeModel(_options: { model: string }) {
    return new MockGenerativeModel();
  }
}

export class MockGenerativeModel {
  async generateContent(parts: any[]): Promise<{ response: { text: () => string } }> {
    // Return different content based on the prompt
    const prompt = parts.find(p => p.text)?.text || '';
    
    if (prompt.includes('PDF')) {
      return {
        response: {
          text: () => 'Extracted PDF content: Resume of John Doe, Software Engineer with 5 years experience.'
        }
      };
    } else if (prompt.includes('Word')) {
      return {
        response: {
          text: () => 'Extracted Word content: Project proposal for new AI initiative.'
        }
      };
    } else if (prompt.includes('spreadsheet')) {
      return {
        response: {
          text: () => 'Extracted Excel content: Sales data Q1-Q4 2024, Total revenue: $1.5M'
        }
      };
    }
    
    return {
      response: {
        text: () => 'Extracted content from document.'
      }
    };
  }
}

export class MockGoogleAIFileManager {
  private pollCount: number = 0;
  private maxPollsBeforeActive: number = 2;
  private shouldFail: boolean = false;
  private shouldTimeout: boolean = false;

  constructor(_apiKey: string, options?: {
    shouldFail?: boolean;
    shouldTimeout?: boolean;
    maxPollsBeforeActive?: number;
  }) {
    this.shouldFail = options?.shouldFail || false;
    this.shouldTimeout = options?.shouldTimeout || false;
    this.maxPollsBeforeActive = options?.maxPollsBeforeActive || 2;
  }

  async uploadFile(_blob: Blob, metadata: any) {
    if (this.shouldFail) {
      throw new Error('Failed to upload file to Google');
    }

    return {
      file: {
        name: `files/${crypto.randomUUID()}`,
        mimeType: metadata.mimeType,
        uri: `gs://generativeai-downloads/files/${crypto.randomUUID()}`,
        state: 'PROCESSING',
        displayName: metadata.displayName
      }
    };
  }

  async getFile(_options: { name: string }) {
    this.pollCount++;
    
    if (this.shouldTimeout) {
      return { state: 'PROCESSING' };
    }
    
    if (this.pollCount > this.maxPollsBeforeActive) {
      return { state: 'ACTIVE' };
    }
    
    return { state: 'PROCESSING' };
  }

  async deleteFile(_options: { name: string }) {
    // Mock deletion
    return true;
  }
}

// Helper to create mock file
export function createMockFile(name: string, type: string, content: string): MockFile {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  
  return {
    name,
    type,
    size: data.length,
    arrayBuffer: async () => data.buffer as ArrayBuffer
  };
}

// Helper to setup environment variables
export function setupTestEnv() {
  Deno.env.set('SUPABASE_URL', 'https://test.supabase.co');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-key');
  Deno.env.set('GEMINI_API_KEY', 'test-gemini-key');
}

// Helper to cleanup environment variables
export function cleanupTestEnv() {
  Deno.env.delete('SUPABASE_URL');
  Deno.env.delete('SUPABASE_SERVICE_ROLE_KEY');
  Deno.env.delete('GEMINI_API_KEY');
}

// Helper to create FormData with file
export function createFormDataWithFile(file: MockFile, userId: string): MockFormData {
  const formData = new MockFormData();
  formData.set('file', file);
  formData.set('userId', userId);
  return formData;
}

// Helper to parse response
export async function parseResponse(response: MockResponse) {
  const contentType = response.headers.get('Content-Type');
  if (contentType?.includes('application/json')) {
    return await response.json();
  }
  return response.body;
}

// Timer utility for performance tests
export class Timer {
  private startTime: number;
  
  constructor() {
    this.startTime = Date.now();
  }
  
  elapsed(): number {
    return Date.now() - this.startTime;
  }
}

// Mock setTimeout for testing polling
export function mockSetTimeout() {
  const originalSetTimeout = globalThis.setTimeout;
  let timeoutCalls = 0;
  
  globalThis.setTimeout = ((callback: Function, _delay: number) => {
    timeoutCalls++;
    // Execute immediately in tests
    callback();
    return timeoutCalls;
  }) as any;
  
  return {
    restore: () => {
      globalThis.setTimeout = originalSetTimeout;
    },
    getCallCount: () => timeoutCalls
  };
}