/**
 * Gemini Image Generation Service
 *
 * Uses Google Gemini's native image generation capabilities (nano-banana-pro)
 * Models: gemini-2.5-flash-image (nano banana), gemini-3-pro-image-preview (nano banana pro)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { functionBridge } from './function-bridge';

// Image generation configuration
interface ImageGenerationConfig {
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  imageSize?: '256' | '512' | '1024' | '1K' | '2K';
  style?: 'photorealistic' | 'illustration' | 'corporate' | 'modern';
  saveToStorage?: boolean;
  userId?: string;
}

// Generated image result
interface GeneratedImage {
  base64Data: string;
  mimeType: string;
  dataUrl: string;
  storageUrl?: string;
  storagePath?: string;
}

// Singleton instance for Gemini client
let geminiClient: GoogleGenerativeAI | null = null;

/**
 * Initialize or get the Gemini client with the API key from Firebase
 */
async function getGeminiClient(): Promise<GoogleGenerativeAI> {
  if (geminiClient) {
    return geminiClient;
  }

  try {
    const keyResponse = await functionBridge.getGeminiKey();
    if (!keyResponse?.secret) {
      throw new Error('Failed to retrieve Gemini API key');
    }

    geminiClient = new GoogleGenerativeAI(keyResponse.secret);
    return geminiClient;
  } catch (error) {
    console.error('[gemini-image] Failed to initialize Gemini client:', error);
    throw error;
  }
}

/**
 * Generate an image using Gemini's nano-banana-pro model
 *
 * @param config - Image generation configuration
 * @returns Promise<GeneratedImage> - Base64 encoded image data
 */
export async function generateImage(config: ImageGenerationConfig): Promise<GeneratedImage> {
  const { prompt, aspectRatio = '16:9', style = 'corporate' } = config;

  console.log('[gemini-image] Generating image with prompt:', prompt.substring(0, 100) + '...');

  try {
    const client = await getGeminiClient();

    // Use gemini-2.5-flash-image for image generation (nano banana)
    const model = client.getGenerativeModel({
      model: 'gemini-2.5-flash-preview-05-20',
      generationConfig: {
        // @ts-expect-error - responseModalities is a valid config option for image generation
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    // Enhance prompt with style guidance for professional recruitment images
    const enhancedPrompt = buildEnhancedPrompt(prompt, style, aspectRatio);

    const result = await model.generateContent(enhancedPrompt);
    const response = result.response;

    // Extract image from response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No candidates in response');
    }

    const parts = candidates[0].content?.parts;
    if (!parts || parts.length === 0) {
      throw new Error('No parts in response');
    }

    // Find the image part
    for (const part of parts) {
      if ('inlineData' in part && part.inlineData) {
        const { data, mimeType } = part.inlineData;
        return {
          base64Data: data,
          mimeType: mimeType || 'image/png',
          dataUrl: `data:${mimeType || 'image/png'};base64,${data}`,
        };
      }
    }

    throw new Error('No image data found in response');
  } catch (error) {
    console.error('[gemini-image] Image generation failed:', error);
    throw error;
  }
}

/**
 * Generate a LinkedIn post image for recruitment content
 */
export async function generateLinkedInImage(jobContext: {
  jobTitle: string;
  location?: string;
  companyName?: string;
  industry?: string;
}): Promise<GeneratedImage> {
  const { jobTitle, location, companyName, industry } = jobContext;

  // Build a prompt optimized for LinkedIn recruitment posts
  const prompt = buildLinkedInImagePrompt(jobTitle, location, companyName, industry);

  return generateImage({
    prompt,
    aspectRatio: '16:9', // LinkedIn optimal aspect ratio
    style: 'corporate',
  });
}

/**
 * Build an enhanced prompt with style guidance
 */
function buildEnhancedPrompt(
  basePrompt: string,
  style: string,
  aspectRatio: string
): string {
  const styleGuides: Record<string, string> = {
    photorealistic: 'photorealistic, high-quality photography, natural lighting, professional',
    illustration: 'modern illustration style, clean lines, vibrant colors',
    corporate: 'professional corporate photography, clean modern office environment, warm lighting, diverse workplace',
    modern: 'modern minimalist design, clean aesthetic, professional',
  };

  const aspectGuides: Record<string, string> = {
    '16:9': 'landscape orientation, wide composition',
    '1:1': 'square composition',
    '9:16': 'portrait orientation, vertical composition',
    '4:3': 'classic landscape ratio',
    '3:4': 'classic portrait ratio',
  };

  return `${basePrompt}. Style: ${styleGuides[style] || styleGuides.corporate}. ${aspectGuides[aspectRatio] || ''} Do not include any text, words, or letters in the image.`;
}

/**
 * Build a prompt specifically for LinkedIn recruitment images
 */
function buildLinkedInImagePrompt(
  jobTitle: string,
  location?: string,
  companyName?: string,
  industry?: string
): string {
  // Determine setting based on industry/role
  const setting = getSettingForRole(jobTitle, industry);

  // Build location context
  const locationContext = location ? `, ${location} area` : '';

  // Build the prompt
  const prompts = [
    `Professional ${setting} environment${locationContext}`,
    'Diverse team of professionals collaborating',
    'Modern workplace with natural lighting',
    'Warm, inviting corporate atmosphere',
    'Clean, uncluttered composition',
    'Photorealistic, high quality',
    'No text or words in the image',
  ];

  return prompts.join('. ');
}

/**
 * Get appropriate setting based on job role and industry
 */
function getSettingForRole(jobTitle: string, industry?: string): string {
  const title = jobTitle.toLowerCase();

  // Healthcare roles
  if (title.includes('nurse') || title.includes('medical') || title.includes('health') ||
      title.includes('clinical') || title.includes('therapist') || title.includes('physician')) {
    return 'healthcare clinic or hospital';
  }

  // Tech roles
  if (title.includes('software') || title.includes('developer') || title.includes('engineer') ||
      title.includes('data') || title.includes('tech')) {
    return 'modern tech office';
  }

  // Finance roles
  if (title.includes('finance') || title.includes('accounting') || title.includes('analyst')) {
    return 'corporate finance office';
  }

  // Sales/Marketing
  if (title.includes('sales') || title.includes('marketing') || title.includes('business')) {
    return 'dynamic business environment';
  }

  // Default to modern office
  return 'modern professional office';
}

/**
 * Convert base64 image to a blob URL for display
 */
export function base64ToBlob(base64Data: string, mimeType: string): Blob {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/**
 * Create an object URL from a generated image
 */
export function createImageObjectUrl(image: GeneratedImage): string {
  const blob = base64ToBlob(image.base64Data, image.mimeType);
  return URL.createObjectURL(blob);
}

/**
 * Save a generated image to Firebase Storage
 */
export async function saveImageToStorage(
  image: GeneratedImage,
  userId: string,
  contentType: string = 'linkedin-post'
): Promise<{ storageUrl: string; storagePath: string }> {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  const timestamp = Date.now();
  const extension = image.mimeType.includes('png') ? 'png' : 'jpg';
  const fileName = `${contentType}_${timestamp}.${extension}`;
  const storagePath = `users/${userId}/generated-images/${fileName}`;

  try {
    const storageRef = ref(storage, storagePath);
    const blob = base64ToBlob(image.base64Data, image.mimeType);

    await uploadBytes(storageRef, blob, {
      contentType: image.mimeType,
      customMetadata: {
        generatedAt: new Date().toISOString(),
        contentType,
      },
    });

    const storageUrl = await getDownloadURL(storageRef);

    console.log('[gemini-image] Image saved to Firebase Storage:', storagePath);
    return { storageUrl, storagePath };
  } catch (error) {
    console.error('[gemini-image] Failed to save image to storage:', error);
    throw error;
  }
}

/**
 * Download an image from a data URL or storage URL
 */
export function downloadImage(imageUrl: string, fileName: string = 'linkedin-post-image.png'): void {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copy image to clipboard
 */
export async function copyImageToClipboard(image: GeneratedImage): Promise<boolean> {
  try {
    const blob = base64ToBlob(image.base64Data, image.mimeType);
    await navigator.clipboard.write([
      new ClipboardItem({
        [image.mimeType]: blob,
      }),
    ]);
    console.log('[gemini-image] Image copied to clipboard');
    return true;
  } catch (error) {
    console.error('[gemini-image] Failed to copy image to clipboard:', error);
    return false;
  }
}

export type { ImageGenerationConfig, GeneratedImage };
