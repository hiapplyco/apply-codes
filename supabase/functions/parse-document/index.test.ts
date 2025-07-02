import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { describe, it, beforeEach, afterEach } from "https://deno.land/std@0.168.0/testing/bdd.ts";
import {
  MockRequest,
  MockFormData,
  MockGoogleGenerativeAI,
  MockGoogleAIFileManager,
  createMockSupabaseClient,
  createMockFile,
  createFormDataWithFile,
  setupTestEnv,
  cleanupTestEnv,
  Timer,
  mockSetTimeout,
} from "./test-utils.ts";
import {
  testUserId,
  fileContents,
  expectedResponses,
  expectedCorsHeaders,
  expectedPrompts,
  performanceBenchmarks,
  geminiFileStates,
} from "./test-fixtures.ts";
import { handleRequest, Dependencies } from "./handler.ts";

describe("parse-document Edge Function", () => {
  let mockDeps: Dependencies;

  beforeEach(() => {
    setupTestEnv();
    // Reset mocks
    mockDeps = {
      supabaseClient: createMockSupabaseClient(),
      googleAI: new MockGoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!),
      fileManager: new MockGoogleAIFileManager(Deno.env.get('GEMINI_API_KEY')!),
    };
  });

  afterEach(() => {
    cleanupTestEnv();
  });

  describe("CORS Handling", () => {
    it("should handle OPTIONS request correctly", async () => {
      const req = new MockRequest("OPTIONS");
      const response = await handleRequest(req as any, mockDeps);
      
      assertEquals(response.status, 200);
      assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
      assertEquals(
        response.headers.get("Access-Control-Allow-Headers"),
        "authorization, x-client-info, apikey, content-type"
      );
    });

    it("should include CORS headers in all responses", async () => {
      const file = createMockFile("test.txt", "text/plain", "Hello World");
      const formData = createFormDataWithFile(file, testUserId);
      const req = new MockRequest("POST", formData);

      const response = await handleRequest(req as any, mockDeps);
      
      assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
      assertEquals(
        response.headers.get("Access-Control-Allow-Headers"),
        "authorization, x-client-info, apikey, content-type"
      );
    });
  });

  describe("Input Validation", () => {
    it("should reject request without file", async () => {
      const formData = new MockFormData();
      formData.set("userId", testUserId);
      const req = new MockRequest("POST", formData);

      const response = await handleRequest(req as any, mockDeps);
      const data = await response.json();

      assertEquals(response.status, 400);
      assertEquals(data.success, false);
      assertStringIncludes(data.error, "No file found");
    });

    it("should reject request without userId", async () => {
      const file = createMockFile("test.pdf", "application/pdf", fileContents.pdf);
      const formData = new MockFormData();
      formData.set("file", file);
      const req = new MockRequest("POST", formData);

      const response = await handleRequest(req as any, mockDeps);
      const data = await response.json();

      assertEquals(response.status, 400);
      assertEquals(data.success, false);
      assertStringIncludes(data.error, "No file found");
    });

    it("should reject request without both file and userId", async () => {
      const formData = new MockFormData();
      const req = new MockRequest("POST", formData);

      const response = await handleRequest(req as any, mockDeps);
      const data = await response.json();

      assertEquals(response.status, 400);
      assertEquals(data.success, false);
    });
  });

  describe("Text File Processing", () => {
    it("should process text files directly without Gemini", async () => {
      const file = createMockFile("notes.txt", "text/plain", fileContents.text);
      const formData = createFormDataWithFile(file, testUserId);
      const req = new MockRequest("POST", formData);

      const response = await handleRequest(req as any, mockDeps);
      const data = await response.json();

      assertEquals(response.status, 200);
      assertEquals(data.success, true);
      assertEquals(data.text, fileContents.text);
      assertStringIncludes(data.message, "Text file processed successfully");
      assertExists(data.filePath);
    });

    it("should handle empty text files", async () => {
      const file = createMockFile("empty.txt", "text/plain", "");
      const formData = createFormDataWithFile(file, testUserId);
      const req = new MockRequest("POST", formData);

      const response = await handleRequest(req as any, mockDeps);
      const data = await response.json();

      assertEquals(response.status, 200);
      assertEquals(data.success, true);
      assertEquals(data.text, "");
    });

    it("should handle large text files", async () => {
      const largeContent = fileContents.largeText;
      const file = createMockFile("large.txt", "text/plain", largeContent);
      const formData = createFormDataWithFile(file, testUserId);
      const req = new MockRequest("POST", formData);

      const timer = new Timer();
      const response = await handleRequest(req as any, mockDeps);
      const elapsed = timer.elapsed();

      const data = await response.json();
      assertEquals(response.status, 200);
      assertEquals(data.success, true);
      assertEquals(data.text.length, largeContent.length);
      // Should process quickly since it bypasses Gemini
      assertEquals(elapsed < 1000, true); // Less than 1 second
    });
  });

  describe("Document Processing with Gemini", () => {
    it("should process PDF files with correct prompt", async () => {
      const file = createMockFile("resume.pdf", "application/pdf", fileContents.pdf);
      const formData = createFormDataWithFile(file, testUserId);
      const req = new MockRequest("POST", formData);

      // Mock successful Gemini processing
      let capturedPrompt = "";
      mockDeps.googleAI.getGenerativeModel = () => ({
        generateContent: async (parts: any[]) => {
          capturedPrompt = parts.find(p => p.text)?.text || "";
          return {
            response: {
              text: () => expectedResponses.successPdf.text
            }
          };
        }
      });

      const response = await handleRequest(req as any, mockDeps);
      const data = await response.json();

      assertEquals(response.status, 200);
      assertEquals(data.success, true);
      assertEquals(data.text, expectedResponses.successPdf.text);
      assertStringIncludes(capturedPrompt, "PDF documents");
    });

    it("should process Word documents with correct prompt", async () => {
      const file = createMockFile(
        "proposal.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileContents.word
      );
      const formData = createFormDataWithFile(file, testUserId);
      const req = new MockRequest("POST", formData);

      let capturedPrompt = "";
      mockDeps.googleAI.getGenerativeModel = () => ({
        generateContent: async (parts: any[]) => {
          capturedPrompt = parts.find(p => p.text)?.text || "";
          return {
            response: {
              text: () => expectedResponses.successWord.text
            }
          };
        }
      });

      const response = await handleRequest(req as any, mockDeps);
      const data = await response.json();

      assertEquals(response.status, 200);
      assertEquals(data.success, true);
      assertStringIncludes(capturedPrompt, "Word documents");
    });

    it("should process Excel files with correct prompt", async () => {
      const file = createMockFile(
        "data.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileContents.excel
      );
      const formData = createFormDataWithFile(file, testUserId);
      const req = new MockRequest("POST", formData);

      let capturedPrompt = "";
      mockDeps.googleAI.getGenerativeModel = () => ({
        generateContent: async (parts: any[]) => {
          capturedPrompt = parts.find(p => p.text)?.text || "";
          return {
            response: {
              text: () => expectedResponses.successExcel.text
            }
          };
        }
      });

      const response = await handleRequest(req as any, mockDeps);
      const data = await response.json();

      assertEquals(response.status, 200);
      assertEquals(data.success, true);
      assertStringIncludes(capturedPrompt, "spreadsheet documents");
    });

    it("should use default prompt for unknown file types", async () => {
      const file = createMockFile("document", "application/octet-stream", "Unknown content");
      const formData = createFormDataWithFile(file, testUserId);
      const req = new MockRequest("POST", formData);

      let capturedPrompt = "";
      mockDeps.googleAI.getGenerativeModel = () => ({
        generateContent: async (parts: any[]) => {
          capturedPrompt = parts.find(p => p.text)?.text || "";
          return {
            response: {
              text: () => "Extracted content from document."
            }
          };
        }
      });

      const response = await handleRequest(req as any, mockDeps);
      const data = await response.json();

      assertEquals(response.status, 200);
      assertEquals(data.success, true);
      assertEquals(capturedPrompt, expectedPrompts.default);
    });
  });

  describe("File State Polling", () => {
    it("should poll until file becomes active", async () => {
      const file = createMockFile("test.pdf", "application/pdf", fileContents.pdf);
      const formData = createFormDataWithFile(file, testUserId);
      const req = new MockRequest("POST", formData);

      // Mock file manager that becomes active after 3 polls
      const fileManager = new MockGoogleAIFileManager(Deno.env.get('GEMINI_API_KEY')!, {
        maxPollsBeforeActive: 3
      });

      const timeoutMock = mockSetTimeout();
      
      mockDeps.fileManager = fileManager;

      const response = await handleRequest(req as any, mockDeps);
      const data = await response.json();

      assertEquals(response.status, 200);
      assertEquals(data.success, true);
      // Should have called setTimeout 4 times (initial state PROCESSING, then polls until ACTIVE)
      assertEquals(timeoutMock.getCallCount(), 4);

      timeoutMock.restore();
    });

    it("should handle file processing timeout", async () => {
      const file = createMockFile("test.pdf", "application/pdf", fileContents.pdf);
      const formData = createFormDataWithFile(file, testUserId);
      const req = new MockRequest("POST", formData);

      // Mock file manager that never becomes active
      const fileManager = new MockGoogleAIFileManager(Deno.env.get('GEMINI_API_KEY')!, {
        shouldTimeout: true
      });

      mockDeps.fileManager = fileManager;

      const response = await handleRequest(req as any, mockDeps);
      const data = await response.json();

      assertEquals(response.status, 400);
      assertEquals(data.success, false);
      assertStringIncludes(data.error, "Processing timeout");
    });

    it("should handle file processing failure", async () => {
      const file = createMockFile("test.pdf", "application/pdf", fileContents.pdf);
      const formData = createFormDataWithFile(file, testUserId);
      const req = new MockRequest("POST", formData);

      // Mock file manager that returns FAILED state
      const fileManager = new MockGoogleAIFileManager(Deno.env.get('GEMINI_API_KEY')!);
      fileManager.getFile = async () => ({ state: geminiFileStates.failed });

      mockDeps.fileManager = fileManager;

      const response = await handleRequest(req as any, mockDeps);
      const data = await response.json();

      assertEquals(response.status, 400);
      assertEquals(data.success, false);
      assertStringIncludes(data.error, "File processing error");
    });
  });

  describe("Error Handling", () => {
    it("should handle Gemini upload failure", async () => {
      const file = createMockFile("test.pdf", "application/pdf", fileContents.pdf);
      const formData = createFormDataWithFile(file, testUserId);
      const req = new MockRequest("POST", formData);

      // Mock file manager that fails to upload
      const fileManager = new MockGoogleAIFileManager(Deno.env.get('GEMINI_API_KEY')!, {
        shouldFail: true
      });

      mockDeps.fileManager = fileManager;

      const response = await handleRequest(req as any, mockDeps);
      const data = await response.json();

      assertEquals(response.status, 400);
      assertEquals(data.success, false);
      assertStringIncludes(data.error, "AI processing error");
    });

    it("should handle Supabase storage failure gracefully", async () => {
      const file = createMockFile("test.pdf", "application/pdf", fileContents.pdf);
      const formData = createFormDataWithFile(file, testUserId);
      const req = new MockRequest("POST", formData);

      // Mock Supabase client that fails to upload
      mockDeps.supabaseClient = createMockSupabaseClient({
        uploadError: new Error("Storage quota exceeded")
      });

      // Should continue processing even if storage fails
      const response = await handleRequest(req as any, mockDeps);
      const data = await response.json();

      // Should still succeed as storage failure is non-fatal
      assertEquals(response.status, 200);
      assertEquals(data.success, true);
    });

    it("should handle Gemini processing errors", async () => {
      const file = createMockFile("test.pdf", "application/pdf", fileContents.pdf);
      const formData = createFormDataWithFile(file, testUserId);
      const req = new MockRequest("POST", formData);

      // Mock Gemini that throws during content generation
      mockDeps.googleAI.getGenerativeModel = () => ({
        generateContent: async () => {
          throw new Error("Model overloaded");
        }
      });

      const response = await handleRequest(req as any, mockDeps);
      const data = await response.json();

      assertEquals(response.status, 400);
      assertEquals(data.success, false);
      assertStringIncludes(data.error, "An unexpected error occurred");
    });

    it("should provide user-friendly error messages", async () => {
      const scenarios = [
        {
          error: new Error("File size exceeds limit"),
          expectedMessage: "File too large"
        },
        {
          error: new Error("Network timeout during uploadFile"),
          expectedMessage: "Upload error"
        },
        {
          error: new Error("Gemini API rate limit exceeded"),
          expectedMessage: "AI processing error"
        }
      ];

      for (const scenario of scenarios) {
        const file = createMockFile("test.pdf", "application/pdf", fileContents.pdf);
        const formData = createFormDataWithFile(file, testUserId);
        const req = new MockRequest("POST", formData);

        // Mock failure
        mockDeps.fileManager.uploadFile = async () => {
          throw scenario.error;
        };

        const response = await handleRequest(req as any, mockDeps);
        const data = await response.json();

        assertEquals(data.success, false);
        assertStringIncludes(data.error, scenario.expectedMessage);
      }
    });
  });

  describe("File Cleanup", () => {
    it("should delete uploaded file after successful processing", async () => {
      const file = createMockFile("test.pdf", "application/pdf", fileContents.pdf);
      const formData = createFormDataWithFile(file, testUserId);
      const req = new MockRequest("POST", formData);

      let deleteFileCalled = false;
      let deletedFileName = "";

      const fileManager = new MockGoogleAIFileManager(Deno.env.get('GEMINI_API_KEY')!);
      fileManager.deleteFile = async (options: { name: string }) => {
        deleteFileCalled = true;
        deletedFileName = options.name;
        return true;
      };

      mockDeps.fileManager = fileManager;

      const response = await handleRequest(req as any, mockDeps);
      await response.json();

      assertEquals(deleteFileCalled, true);
      assertExists(deletedFileName);
    });

    it("should attempt cleanup even after processing errors", async () => {
      const file = createMockFile("test.pdf", "application/pdf", fileContents.pdf);
      const formData = createFormDataWithFile(file, testUserId);
      const req = new MockRequest("POST", formData);

      let deleteFileCalled = false;

      const fileManager = new MockGoogleAIFileManager(Deno.env.get('GEMINI_API_KEY')!);
      fileManager.deleteFile = async () => {
        deleteFileCalled = true;
        return true;
      };

      mockDeps.fileManager = fileManager;

      // Mock Gemini failure after file upload
      mockDeps.googleAI.getGenerativeModel = () => ({
        generateContent: async () => {
          throw new Error("Processing failed");
        }
      });

      const response = await handleRequest(req as any, mockDeps);
      await response.json();

      assertEquals(deleteFileCalled, true);
    });

    it("should handle cleanup failures gracefully", async () => {
      const file = createMockFile("test.pdf", "application/pdf", fileContents.pdf);
      const formData = createFormDataWithFile(file, testUserId);
      const req = new MockRequest("POST", formData);

      const fileManager = new MockGoogleAIFileManager(Deno.env.get('GEMINI_API_KEY')!);
      fileManager.deleteFile = async () => {
        throw new Error("Delete permission denied");
      };

      mockDeps.fileManager = fileManager;

      // Should not throw even if cleanup fails
      const response = await handleRequest(req as any, mockDeps);
      const data = await response.json();

      assertEquals(response.status, 200);
      assertEquals(data.success, true);
    });
  });

  describe("Performance Tests", () => {
    it("should process files within acceptable time limits", async () => {
      const file = createMockFile("test.pdf", "application/pdf", fileContents.pdf);
      const formData = createFormDataWithFile(file, testUserId);
      const req = new MockRequest("POST", formData);

      const timer = new Timer();
      const response = await handleRequest(req as any, mockDeps);
      const elapsed = timer.elapsed();

      await response.json();

      // Should complete within performance benchmark
      assertEquals(elapsed < performanceBenchmarks.maxProcessingTime, true);
    });

    it("should handle concurrent requests", async () => {
      const requests = [];
      
      for (let i = 0; i < 5; i++) {
        const file = createMockFile(`test${i}.pdf`, "application/pdf", fileContents.pdf);
        const formData = createFormDataWithFile(file, testUserId);
        const req = new MockRequest("POST", formData);
        requests.push(handleRequest(req as any, mockDeps));
      }

      const responses = await Promise.all(requests);
      const results = await Promise.all(responses.map(r => r.json()));

      // All requests should succeed
      for (const result of results) {
        assertEquals(result.success, true);
      }
    });
  });

  describe("Security Tests", () => {
    it("should not expose sensitive information in error messages", async () => {
      const file = createMockFile("test.pdf", "application/pdf", fileContents.pdf);
      const formData = createFormDataWithFile(file, testUserId);
      const req = new MockRequest("POST", formData);

      // Mock an error with sensitive information
      mockDeps.fileManager.uploadFile = async () => {
        throw new Error("API Key invalid: sk-1234567890abcdef");
      };

      const response = await handleRequest(req as any, mockDeps);
      const data = await response.json();

      assertEquals(response.status, 400);
      assertEquals(data.success, false);
      // Should not expose the API key
      assertEquals(data.error.includes("sk-1234567890abcdef"), false);
      assertEquals(data.details.includes("sk-1234567890abcdef"), false);
    });

    it("should validate file paths to prevent directory traversal", async () => {
      const file = createMockFile("../../../etc/passwd", "text/plain", "malicious");
      const formData = createFormDataWithFile(file, testUserId);
      const req = new MockRequest("POST", formData);

      const response = await handleRequest(req as any, mockDeps);
      const data = await response.json();

      // Text files are processed successfully, but path should be sanitized
      assertEquals(response.status, 200);
      assertEquals(data.success, true);
      // Should generate a safe file path
      assertEquals(data.filePath.includes(".."), false);
      assertExists(data.filePath);
      // Path should contain a UUID prefix
      assertStringIncludes(data.filePath, "-../../../etc/passwd");
    });

    it("should always include proper CORS headers", async () => {
      const testCases = [
        { method: "OPTIONS", expectedStatus: 200 },
        { method: "POST", expectedStatus: 400 }, // No data
        { method: "GET", expectedStatus: 400 },   // Wrong method
      ];

      for (const testCase of testCases) {
        const req = new MockRequest(testCase.method);
        const response = await handleRequest(req as any, mockDeps);

        assertEquals(
          response.headers.get("Access-Control-Allow-Origin"),
          expectedCorsHeaders["Access-Control-Allow-Origin"]
        );
      }
    });
  });

  describe("File Path Generation", () => {
    it("should generate unique file paths", async () => {
      const paths = new Set<string>();
      
      for (let i = 0; i < 10; i++) {
        const file = createMockFile("test.pdf", "application/pdf", fileContents.pdf);
        const formData = createFormDataWithFile(file, testUserId);
        const req = new MockRequest("POST", formData);

        const response = await handleRequest(req as any, mockDeps);
        const data = await response.json();

        assertEquals(paths.has(data.filePath), false);
        paths.add(data.filePath);
      }

      assertEquals(paths.size, 10);
    });

    it("should preserve original file extension", async () => {
      const extensions = [".pdf", ".docx", ".xlsx", ".txt"];
      
      for (const ext of extensions) {
        const file = createMockFile(`document${ext}`, "application/octet-stream", "content");
        const formData = createFormDataWithFile(file, testUserId);
        const req = new MockRequest("POST", formData);

        const response = await handleRequest(req as any, mockDeps);
        const data = await response.json();

        assertStringIncludes(data.filePath, ext);
      }
    });
  });
});

// Run tests with Deno test runner
if (import.meta.main) {
  Deno.test("parse-document function test suite", async () => {
    // Tests will run automatically
  });
}