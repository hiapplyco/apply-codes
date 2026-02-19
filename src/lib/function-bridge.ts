import { auth, functions as firebaseFunctions } from "./firebase";
import { httpsCallable } from "firebase/functions";

interface BooleanSearchPayload {
  description: string;
  jobTitle?: string;
  userId?: string;
  contextItems?: any[];
}

interface BooleanSearchResponse {
  success: boolean;
  searchString?: string;
  error?: string;
}

/**
 * Payload for sophisticated boolean search generation with re-roll support
 */
interface SophisticatedBooleanPayload {
  jobContext: {
    title: string;
    specialty?: string;
    location: {
      city: string;
      state: string;
      workArrangement: string;
    };
    employmentType: string;
    level?: string;
    mustHaveSkills: string[];
    niceToHaveSkills: string[];
    technicalSkills: string[];
    certifications: string[];
    licensure: string[];
    keywords: string[];
    experienceYears?: number;
    industry?: string;
  };
  generatedDescription: string;
  contextItems?: Array<{
    id: string;
    type: string;
    title: string;
    content: string;
    summary?: string;
    source_url?: string;
    metadata?: Record<string, any>;
  }>;
  previousGenerations?: string[];
  variant?: 'strict' | 'balanced' | 'broad';
  isReroll?: boolean;
}

interface BooleanExplanation {
  components: Array<{
    type: string;
    purpose: string;
    terms: string[];
  }>;
  willInclude: string[];
  willExclude: string[];
  proTips: string[];
}

interface SophisticatedBooleanResponse {
  success: boolean;
  searchString?: string;
  explanation?: BooleanExplanation;
  variant?: string;
  error?: string;
}

type Json = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

const DEFAULT_REGION = import.meta.env.VITE_FIREBASE_REGION || "us-central1";
const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || "";
const EXPLICIT_HTTP_BASE_URL = import.meta.env.VITE_FIREBASE_FUNCTION_BASE_URL || "";

const resolveHttpFunctionBaseUrl = (): string => {
  if (EXPLICIT_HTTP_BASE_URL) {
    return EXPLICIT_HTTP_BASE_URL.replace(/\/$/, "");
  }

  if (!PROJECT_ID) {
    console.warn(
      "[function-bridge] Missing VITE_FIREBASE_FUNCTION_BASE_URL and VITE_FIREBASE_PROJECT_ID; HTTP callable endpoints may fail."
    );
    return "";
  }

  return `https://${DEFAULT_REGION}-${PROJECT_ID}.cloudfunctions.net`;
};

class FunctionBridge {
  private readonly httpBaseUrl = resolveHttpFunctionBaseUrl();

  isUsingFirebase(): boolean {
    return !!firebaseFunctions;
  }

  enableFirebase(): boolean {
    return this.isUsingFirebase();
  }

  disableFirebase(): boolean {
    return this.isUsingFirebase();
  }

  private async getIdToken(): Promise<string | null> {
    if (!auth?.currentUser) {
      return null;
    }

    try {
      return await auth.currentUser.getIdToken();
    } catch (error) {
      console.error("[function-bridge] Failed to fetch Firebase ID token:", error);
      return null;
    }
  }

  private ensureFunctions(): asserts firebaseFunctions is NonNullable<typeof firebaseFunctions> {
    if (!firebaseFunctions) {
      throw new Error("Firebase Functions not configured");
    }
  }

  private ensureHttpBaseUrl(): string {
    if (!this.httpBaseUrl) {
      throw new Error(
        "Firebase HTTP Function base URL not configured. Set VITE_FIREBASE_FUNCTION_BASE_URL or VITE_FIREBASE_PROJECT_ID."
      );
    }
    return this.httpBaseUrl;
  }

  private async callCallable<TRequest = unknown, TResponse = unknown>(
    name: string,
    payload: TRequest
  ): Promise<TResponse> {
    this.ensureFunctions();

    try {
      const callable = httpsCallable<TRequest, TResponse>(firebaseFunctions, name);
      const result = await callable(payload);
      return result.data;
    } catch (error) {
      console.error(`[function-bridge] Callable ${name} failed:`, error);
      throw error;
    }
  }

  private async callHttpFunction<TResponse = unknown>(name: string, options: {
    method?: string;
    body?: Json | FormData | Blob | ArrayBufferView | ArrayBuffer;
    headers?: Record<string, string>;
    isFormData?: boolean;
    timeoutMs?: number;
  } = {}): Promise<TResponse> {
    const { method = "POST", body, headers = {}, isFormData = false, timeoutMs = 60000 } = options;

    const baseUrl = this.ensureHttpBaseUrl();
    const token = await this.getIdToken();

    const requestHeaders: Record<string, string> = { ...headers };

    // Check if body is a binary type (Blob, ArrayBuffer, or TypedArray)
    const isBinaryBody = body instanceof Blob || body instanceof ArrayBuffer || (body !== undefined && ArrayBuffer.isView(body));

    if (!isFormData && body !== undefined && !isBinaryBody) {
      requestHeaders["Content-Type"] = requestHeaders["Content-Type"] || "application/json";
    }

    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    const requestBody =
      body === undefined
        ? undefined
        : isFormData || isBinaryBody
          ? (body as BodyInit)
          : typeof body === "string"
            ? body
            : JSON.stringify(body);

    // Add timeout via AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/${name}`, {
        method,
        headers: requestHeaders,
        body: requestBody,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return response.json() as Promise<TResponse>;
      }

      return (await response.text()) as unknown as TResponse;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`Request to ${name} timed out after ${timeoutMs / 1000}s`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async invokeCallable<TRequest = unknown, TResponse = unknown>(
    name: string,
    payload: TRequest
  ): Promise<TResponse> {
    return this.callCallable<TRequest, TResponse>(name, payload);
  }

  async invokeHttp<TResponse = unknown>(
    name: string,
    payload?: Json | FormData | Blob | ArrayBufferView | ArrayBuffer,
    options: {
      method?: string;
      headers?: Record<string, string>;
      isFormData?: boolean;
    } = {}
  ): Promise<TResponse> {
    return this.callHttpFunction<TResponse>(name, {
      body: payload,
      method: options.method,
      headers: options.headers,
      isFormData: options.isFormData
    });
  }

  async generateBooleanSearch(payload: BooleanSearchPayload): Promise<BooleanSearchResponse> {
    const result = await this.callCallable<BooleanSearchPayload, BooleanSearchResponse>(
      "generateBooleanSearch",
      payload
    );

    if (!result.success || !result.searchString) {
      return {
        success: false,
        error: result.error || "Failed to generate boolean search"
      };
    }

    return result;
  }

  /**
   * Generate a sophisticated boolean search string with re-roll support
   *
   * Features:
   * - Uses structured jobContext for precise targeting
   * - Supports 3 variants: strict, balanced, broad
   * - Re-roll with history-based deduplication
   * - Returns explanation of boolean components
   */
  async generateSophisticatedBoolean(payload: SophisticatedBooleanPayload): Promise<SophisticatedBooleanResponse> {
    try {
      const result = await this.callHttpFunction<SophisticatedBooleanResponse>(
        "generateSophisticatedBoolean",
        { body: payload }
      );

      if (!result.success || !result.searchString) {
        return {
          success: false,
          error: result.error || "Failed to generate sophisticated boolean search"
        };
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error("[function-bridge] generateSophisticatedBoolean failed:", {
        error,
        payload: { title: payload.jobContext?.title, variant: payload.variant },
        timestamp: new Date().toISOString()
      });

      // PRODUCTION: No fallbacks - return error for proper UI handling
      return {
        success: false,
        error: `Boolean generation failed: ${errorMessage}. Please try again.`
      };
    }
  }

  // REMOVED: Local fallback boolean generation
  // Per production guidelines: No fallbacks - errors must be handled explicitly in the UI

  async enrichProfile(payload: any): Promise<any> {
    return this.callCallable("enrichProfile", payload);
  }

  async analyzeCandidate(payload: any): Promise<any> {
    return this.callCallable("analyzeCandidate", payload);
  }

  async processJobRequirements(payload: any): Promise<any> {
    return this.callCallable("processJobRequirements", payload);
  }

  async processJobRequirementsV2(payload: any): Promise<any> {
    return this.callHttpFunction("processJobRequirementsV2", { body: payload });
  }

  async sendOutreachEmail(payload: any): Promise<any> {
    return this.callCallable("sendOutreachEmail", payload);
  }

  async createCheckoutSession(payload: any): Promise<any> {
    return this.callCallable("createCheckoutSession", payload);
  }

  async transcribeAudio(payload: any): Promise<any> {
    return this.callCallable("transcribeAudio", payload);
  }

  async perplexitySearch(payload: any): Promise<any> {
    return this.callHttpFunction("perplexitySearch", { body: payload });
  }

  async parseDocument(formData: FormData): Promise<any> {
    return this.callHttpFunction("parseDocument", { body: formData, isFormData: true });
  }

  async searchContacts(payload: any): Promise<any> {
    return this.callHttpFunction("searchContacts", { body: payload });
  }

  async getContactInfo(payload: any): Promise<any> {
    return this.callHttpFunction("getContactInfo", { body: payload });
  }

  async chatAssistant(payload: any): Promise<any> {
    return this.callHttpFunction("chatAssistant", { body: payload });
  }

  async enhanceJobDescription(payload: any): Promise<any> {
    return this.callHttpFunction("enhanceJobDescription", { body: payload });
  }

  async extractNlpTerms(payload: any): Promise<any> {
    return this.callHttpFunction("extractNlpTerms", { body: payload });
  }

  async analyzeCompensation(payload: any): Promise<any> {
    return this.callHttpFunction("analyzeCompensation", { body: payload });
  }

  async generateContent(payload: any): Promise<any> {
    return this.callHttpFunction("generateContent", { body: payload });
  }

  /**
   * Generate a comprehensive job description using Gemini AI
   * Synthesizes form template data with uploaded context items
   */
  async generateJobDescription(payload: {
    template: any;
    contextItems?: any[];
    config?: {
      tone?: string;
      format?: string;
    };
  }): Promise<{
    success: boolean;
    description?: string;
    metadata?: {
      generatedAt: string;
      contextItemsUsed: number;
      model: string;
    };
    error?: string;
  }> {
    return this.callHttpFunction("generateJobDescription", { body: payload });
  }

  async geminiApi(payload: any): Promise<any> {
    return this.callHttpFunction("geminiApi", { body: payload });
  }

  async extractJobContext(payload: {
    content: string;
    contentType: 'text' | 'file' | 'url' | 'search' | 'location';
    metadata?: Record<string, any>;
  }): Promise<{
    success: boolean;
    data?: any;
    extractionMeta?: {
      confidence: number;
      fields_extracted: number;
      fields_inferred: number;
      source_type: string;
    };
    error?: string;
  }> {
    return this.callHttpFunction("extractJobContext", { body: payload });
  }

  /**
   * Extract document content using Gemini's native multimodal capabilities
   * Supports: PDF, DOCX, DOC, TXT, Images (JPG, PNG)
   * Returns structured job template data directly from Gemini
   */
  async extractDocumentGemini(payload: {
    fileData: string; // Base64 encoded file data
    mimeType?: string;
    fileName?: string;
    additionalContext?: string;
  }): Promise<{
    success: boolean;
    data?: any;
    metadata?: {
      confidence: number;
      documentType: string;
      rawTextSummary: string | null;
      fileName: string;
      mimeType: string;
      processedAt: string;
    };
    error?: string;
    raw?: string;
  }> {
    return this.callHttpFunction("extractDocumentGemini", { body: payload });
  }

  /**
   * Optimize job template using Gemini
   * Deduplicates, enhances, and optimizes all fields after context is added
   */
  async optimizeJobTemplate(payload: {
    currentTemplate: any;
    newContext?: string | any;
    contextType?: string;
    userEditedFields?: string[];
  }): Promise<{
    success: boolean;
    data?: any;
    summary?: {
      fields_updated: string[];
      fields_added: string[];
      duplicates_removed: number;
      enhancements_made: string[];
      confidence: number;
    };
    error?: string;
  }> {
    return this.callHttpFunction("optimizeJobTemplate", { body: payload });
  }

  async summarizeJob(payload: any): Promise<any> {
    return this.callHttpFunction("summarizeJob", { body: payload });
  }

  async explainBoolean(payload: any): Promise<any> {
    return this.callHttpFunction("explainBoolean", { body: payload });
  }

  async analyzeResume(payload: any): Promise<any> {
    const formData = new FormData();
    if (payload.file) {
      formData.append("file", payload.file);
    }
    if (payload.resumeText) {
      formData.append("resumeText", payload.resumeText);
    }
    if (payload.jobDescription) {
      formData.append("jobDescription", payload.jobDescription);
    }
    if (payload.userId) {
      formData.append("userId", payload.userId);
    }

    return this.callHttpFunction("analyzeResume", { body: formData, isFormData: true });
  }

  async generateInterviewQuestions(payload: any): Promise<any> {
    return this.callHttpFunction("generateInterviewQuestions", { body: payload });
  }

  async handleInterview(payload: any): Promise<any> {
    return this.callHttpFunction("handleInterview", { body: payload });
  }

  async linkedinSearch(payload: any): Promise<any> {
    return this.callHttpFunction("linkedinSearch", { body: payload });
  }

  async hunterIoSearch(payload: any): Promise<any> {
    return this.callHttpFunction("hunterIoSearch", { body: payload });
  }

  async githubProfile(payload: any): Promise<any> {
    return this.callHttpFunction("githubProfile", { body: payload });
  }

  async clearbitEnrichment(payload: any): Promise<any> {
    return this.callHttpFunction("clearbitEnrichment", { body: payload });
  }

  async waterfallEnrich(payload: any): Promise<any> {
    return this.callHttpFunction("waterfallEnrich", { body: payload });
  }

  async pdlSearch(payload: any): Promise<any> {
    return this.callHttpFunction("pdlSearch", { body: payload });
  }

  async sendEmail(payload: any): Promise<any> {
    return this.callHttpFunction("sendEmail", { body: payload });
  }

  async scheduleInterview(payload: any): Promise<any> {
    return this.callHttpFunction("scheduleInterview", { body: payload });
  }

  async processTextExtraction(payload: any): Promise<any> {
    const formData = new FormData();
    if (payload.file) {
      formData.append("file", payload.file);
    }
    if (payload.extractionType) {
      formData.append("extractionType", payload.extractionType);
    }
    if (payload.options) {
      formData.append("options", JSON.stringify(payload.options));
    }
    if (payload.userId) {
      formData.append("userId", payload.userId);
    }
    if (payload.preserveFormatting !== undefined) {
      formData.append("preserveFormatting", String(payload.preserveFormatting));
    }
    if (payload.extractTables !== undefined) {
      formData.append("extractTables", String(payload.extractTables));
    }
    if (payload.ocrEnabled !== undefined) {
      formData.append("ocrEnabled", String(payload.ocrEnabled));
    }
    if (payload.language) {
      formData.append("language", payload.language);
    }
    if (payload.outputFormat) {
      formData.append("outputFormat", payload.outputFormat);
    }
    if (payload.storagePath) {
      formData.append("storagePath", payload.storagePath);
    }
    if (payload.storageUrl) {
      formData.append("storageUrl", payload.storageUrl);
    }

    return this.callHttpFunction("processTextExtraction", { body: formData, isFormData: true });
  }

  async generateEmailTemplates(payload: any): Promise<any> {
    return this.callHttpFunction("generateEmailTemplates", { body: payload });
  }

  async generateDashboardMetrics(payload: any): Promise<any> {
    return this.callHttpFunction("generateDashboardMetrics", { body: payload });
  }

  async firecrawlUrl(payload: any): Promise<any> {
    return this.callHttpFunction("firecrawlUrl", { body: payload });
  }

  async generateLinkedinAnalysis(payload: any): Promise<any> {
    return this.callHttpFunction("generateLinkedinAnalysis", { body: payload });
  }

  async generateLinkedinPost(payload: any): Promise<any> {
    return this.callHttpFunction("createLinkedinPost", { body: payload });
  }

  async createDailyRoom(payload: any = {}): Promise<any> {
    return this.callHttpFunction("createDailyRoom", { body: payload });
  }

  async getDailyKey(): Promise<{ secret: string }> {
    return this.callHttpFunction("getDailyKey");
  }

  async getGeminiKey(): Promise<{ secret: string }> {
    return this.callHttpFunction("getGeminiKey");
  }

  async getGoogleCseKey(): Promise<{ secret: string; engineId: string }> {
    return this.callHttpFunction("getGoogleCseKey");
  }

  async exportToGoogleDocs(payload: any): Promise<any> {
    return this.callHttpFunction("exportToGoogleDocs", { body: payload });
  }

  async importFromGoogleDocs(payload: any): Promise<any> {
    return this.callHttpFunction("importFromGoogleDocs", { body: payload });
  }

  async getDriveFolders(payload: any): Promise<any> {
    return this.callHttpFunction("getDriveFolders", { body: payload });
  }

  async shareGoogleDoc(payload: any): Promise<any> {
    return this.callHttpFunction("shareGoogleDoc", { body: payload });
  }

  async processKickoffCall(payload: any): Promise<any> {
    return this.callHttpFunction("processKickoffCall", { body: payload });
  }

  async processRecording(payload: any): Promise<any> {
    return this.callHttpFunction("processRecording", { body: payload });
  }

  async saveContextItem(payload: any): Promise<any> {
    return this.callHttpFunction("saveContextItem", { body: payload });
  }

  async summarizeTitle(payload: any): Promise<any> {
    return this.callHttpFunction("summarizeTitle", { body: payload });
  }

  async testOrchestration(payload: any): Promise<any> {
    return this.callHttpFunction("testOrchestration", { body: payload });
  }

  async textToSpeech(payload: any): Promise<any> {
    return this.callHttpFunction("textToSpeech", { body: payload });
  }

  async generateClarvidaReport(payload: any): Promise<any> {
    return this.callHttpFunction("generateClarvidaReport", { body: payload });
  }



  async initializeDailyBot(): Promise<{ websocket_url: string }> {
    return this.callHttpFunction("initializeDailyBot");
  }

  async initializeInterviewGuidance(): Promise<{ websocket_url: string }> {
    return this.callHttpFunction("interviewGuidanceWs");
  }

  async exchangeGoogleToken(payload: { code: string; redirectUri: string }): Promise<any> {
    return this.callHttpFunction("exchangeGoogleToken", { body: payload });
  }

  async refreshGoogleToken(payload: { refreshToken: string }): Promise<any> {
    return this.callHttpFunction("refreshGoogleToken", { body: payload });
  }

  async revokeGoogleToken(payload: { accessToken: string }): Promise<any> {
    return this.callHttpFunction("revokeGoogleToken", { body: payload });
  }
}

export const functionBridge = new FunctionBridge();

export const enableFirebaseFunctions = () => functionBridge.enableFirebase();
export const disableFirebaseFunctions = () => functionBridge.disableFirebase();
export const isUsingFirebaseFunctions = () => functionBridge.isUsingFirebase();

// Function Bridge initialized - Direct Firebase mode
