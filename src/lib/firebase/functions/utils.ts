
import { auth } from "@/lib/firebase";

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
      "[firebase-functions] Missing VITE_FIREBASE_FUNCTION_BASE_URL and VITE_FIREBASE_PROJECT_ID; HTTP callable endpoints may fail."
    );
    return "";
  }

  return `https://${DEFAULT_REGION}-${PROJECT_ID}.cloudfunctions.net`;
};

const getIdToken = async (): Promise<string | null> => {
  if (!auth?.currentUser) {
    return null;
  }

  try {
    return await auth.currentUser.getIdToken();
  } catch (error) {
    console.error("[firebase-functions] Failed to fetch Firebase ID token:", error);
    return null;
  }
};

export const callHttpFunction = async <TResponse = unknown>(name: string, options: {
    method?: string;
    body?: Json | FormData | Blob | ArrayBufferView | ArrayBuffer;
    headers?: Record<string, string>;
    isFormData?: boolean;
  } = {}): Promise<TResponse> => {
    const { method = "POST", body, headers = {}, isFormData = false } = options;

    const baseUrl = resolveHttpFunctionBaseUrl();
    if (!baseUrl) {
        throw new Error(
            "Firebase HTTP Function base URL not configured. Set VITE_FIREBASE_FUNCTION_BASE_URL or VITE_FIREBASE_PROJECT_ID."
        );
    }
    const token = await getIdToken();

    const requestHeaders: Record<string, string> = { ...headers };

    if (!isFormData && body !== undefined && !(body instanceof Blob) && !(body instanceof ArrayBuffer) && !(body instanceof ArrayBufferView)) {
      requestHeaders["Content-Type"] = requestHeaders["Content-Type"] || "application/json";
    }

    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    const requestBody =
      body === undefined
        ? undefined
        : isFormData || body instanceof Blob || body instanceof ArrayBuffer || body instanceof ArrayBufferView
          ? (body as BodyInit)
          : typeof body === "string"
            ? body
            : JSON.stringify(body);

    const response = await fetch(`${baseUrl}/${name}`, {
      method,
      headers: requestHeaders,
      body: requestBody
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
  }