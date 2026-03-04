import { useState, useRef, useEffect, useCallback } from 'react';

const ELEVEN_LABS_API_KEY = import.meta.env.VITE_ELEVEN_LABS_API_KEY as string | undefined;
const ELEVEN_LABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel — clear, professional
const ELEVEN_LABS_MODEL = 'eleven_flash_v2_5'; // Ultra-low latency (~75ms)

interface UseTTSReturn {
    speak: (text: string) => Promise<void>;
    stop: () => void;
    isSpeaking: boolean;
    isEnabled: boolean;
    toggleEnabled: () => void;
}

/** Strip markdown for natural-sounding speech */
function cleanTextForTTS(text: string): string {
    return text
        .replace(/\*\*([^*]+)\*\*/g, '$1')   // **bold** → plain
        .replace(/^[-•●]\s?/gm, '')           // bullet markers
        .replace(/\n{2,}/g, '. ')             // paragraph breaks → pause
        .replace(/\n/g, ' ')                  // line breaks → space
        .replace(/\s{2,}/g, ' ')              // collapse whitespace
        .trim();
}

export function useTTS(): UseTTSReturn {
    const [isEnabled, setIsEnabled] = useState(() => {
        try { return sessionStorage.getItem('apply-tts') === '1'; } catch { return false; }
    });
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current = null;
        }
        window.speechSynthesis?.cancel();
        abortRef.current?.abort();
        abortRef.current = null;
        setIsSpeaking(false);
    }, []);

    const toggleEnabled = useCallback(() => {
        setIsEnabled(prev => {
            const next = !prev;
            try { sessionStorage.setItem('apply-tts', next ? '1' : '0'); } catch { /* noop */ }
            if (!next) stop();
            return next;
        });
    }, [stop]);

    // ─── ElevenLabs (Primary) ─────────────────────────────

    const speakWithElevenLabs = useCallback(async (text: string): Promise<boolean> => {
        if (!ELEVEN_LABS_API_KEY) return false;

        const cleaned = cleanTextForTTS(text);
        if (!cleaned) return false;

        try {
            abortRef.current = new AbortController();

            const response = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_LABS_VOICE_ID}/stream`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'xi-api-key': ELEVEN_LABS_API_KEY,
                    },
                    body: JSON.stringify({
                        text: cleaned,
                        model_id: ELEVEN_LABS_MODEL,
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.75,
                        },
                    }),
                    signal: abortRef.current.signal,
                }
            );

            if (!response.ok) return false;

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;

            return new Promise<boolean>((resolve) => {
                audio.onended = () => {
                    URL.revokeObjectURL(url);
                    audioRef.current = null;
                    setIsSpeaking(false);
                    resolve(true);
                };
                audio.onerror = () => {
                    URL.revokeObjectURL(url);
                    audioRef.current = null;
                    setIsSpeaking(false);
                    resolve(false);
                };
                audio.play().catch(() => {
                    URL.revokeObjectURL(url);
                    resolve(false);
                });
            });
        } catch {
            return false;
        }
    }, []);

    // ─── Web Speech API (Fallback) ────────────────────────

    const speakWithWebSpeech = useCallback((text: string): Promise<boolean> => {
        const cleaned = cleanTextForTTS(text);
        if (!cleaned || !window.speechSynthesis) return Promise.resolve(false);

        return new Promise<boolean>((resolve) => {
            const utterance = new SpeechSynthesisUtterance(cleaned);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            // Try to pick a good English voice
            const voices = window.speechSynthesis.getVoices();
            const preferred = voices.find(v =>
                v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Samantha'))
            ) ?? voices.find(v => v.lang.startsWith('en'));
            if (preferred) utterance.voice = preferred;

            utterance.onend = () => { setIsSpeaking(false); resolve(true); };
            utterance.onerror = () => { setIsSpeaking(false); resolve(false); };

            window.speechSynthesis.speak(utterance);
        });
    }, []);

    // ─── Public speak (waterfall) ─────────────────────────

    const speak = useCallback(async (text: string) => {
        if (!isEnabled) return;
        stop();
        setIsSpeaking(true);

        // ElevenLabs → Web Speech API fallback
        const ok = await speakWithElevenLabs(text);
        if (!ok) {
            await speakWithWebSpeech(text);
        }
    }, [isEnabled, stop, speakWithElevenLabs, speakWithWebSpeech]);

    // Cleanup on unmount
    useEffect(() => {
        return () => stop();
    }, [stop]);

    return { speak, stop, isSpeaking, isEnabled, toggleEnabled };
}
