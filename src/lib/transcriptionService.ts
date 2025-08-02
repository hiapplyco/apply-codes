import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export interface TranscriptionResult {
  text: string;
  duration?: number;
  language?: string;
  confidence?: number;
}

export class TranscriptionService {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      // Convert blob to base64
      const base64Audio = await this.blobToBase64(audioBlob);
      
      const prompt = `
        Transcribe the following audio accurately. 
        If there are multiple speakers, indicate speaker changes.
        Format the transcription clearly with proper punctuation.
        If you detect any specific language, mention it.
      `;

      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: audioBlob.type || 'audio/webm',
            data: base64Audio
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();

      return {
        text: text.trim(),
        duration: await this.getAudioDuration(audioBlob),
        language: this.detectLanguage(text)
      };
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  async transcribeVideo(videoBlob: Blob): Promise<TranscriptionResult> {
    try {
      // For video, we'll extract audio and transcribe
      // Gemini can also process video directly for richer context
      const base64Video = await this.blobToBase64(videoBlob);
      
      const prompt = `
        Transcribe all spoken content from this video.
        Include speaker identifications if multiple people are speaking.
        Also note any important visual context that relates to the conversation.
        Format the transcription with timestamps if possible.
      `;

      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: videoBlob.type || 'video/webm',
            data: base64Video
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();

      return {
        text: text.trim(),
        duration: await this.getVideoDuration(videoBlob),
        language: this.detectLanguage(text)
      };
    } catch (error) {
      console.error('Video transcription error:', error);
      throw new Error('Failed to transcribe video');
    }
  }

  async transcribeFile(file: File): Promise<TranscriptionResult> {
    const fileType = file.type;
    
    if (fileType.startsWith('audio/')) {
      return this.transcribeAudio(file);
    } else if (fileType.startsWith('video/')) {
      return this.transcribeVideo(file);
    } else {
      throw new Error('Unsupported file type for transcription');
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async getAudioDuration(blob: Blob): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.src = URL.createObjectURL(blob);
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(audio.src);
        resolve(audio.duration);
      });
    });
  }

  private async getVideoDuration(blob: Blob): Promise<number> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(blob);
      video.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      });
    });
  }

  private detectLanguage(text: string): string {
    // Simple language detection - in production, use a proper library
    const patterns = {
      english: /\b(the|is|are|was|were|have|has|had|will|would|can|could)\b/i,
      spanish: /\b(el|la|los|las|es|son|está|están)\b/i,
      french: /\b(le|la|les|est|sont|avec|dans|pour)\b/i,
      german: /\b(der|die|das|ist|sind|haben|werden)\b/i,
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }

    return 'unknown';
  }

  async extractKeyPoints(transcription: string): Promise<string[]> {
    try {
      const prompt = `
        Extract the key points from this transcription.
        Return a bulleted list of the most important topics discussed.
        Focus on actionable items, decisions, and important information.
        
        Transcription:
        ${transcription}
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse bullet points
      const points = text
        .split('\n')
        .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
        .map(line => line.replace(/^[•\-]\s*/, '').trim());

      return points;
    } catch (error) {
      console.error('Key point extraction error:', error);
      return [];
    }
  }
}