import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, ArrowRight, Volume2, VolumeX, Square } from "lucide-react";
import { Button } from "@/components/ui/design-system/Button";
import { useChat } from "@/context/ChatContext";
import { generateResponse, Message } from "@/lib/chat-service";
import { useTTS } from "@/hooks/useTTS";

const QUICK_SUGGESTIONS = [
    "What does Apply do?",
    "Help me hire a developer",
    "What's your pricing?",
    "Career advice for veterans",
];

const SIGNUP_MESSAGE_THRESHOLD = 5;

export const ChatWidget = () => {
    const { isOpen, closeChat } = useChat();
    const { speak, stop: stopTTS, isSpeaking, isEnabled: ttsEnabled, toggleEnabled: toggleTTS } = useTTS();
    const prevMessageCountRef = useRef(1); // track to auto-speak new assistant messages
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! I'm Apply Chatbot, here to answer any questions about recruitment, AI-powered hiring, or how Apply, Co. can help build your workforce.\n\nWhat are you working on?",
        },
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [userMessageCount, setUserMessageCount] = useState(0);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const lastSendTime = useRef(0);

    const showSignupCTA = userMessageCount >= SIGNUP_MESSAGE_THRESHOLD;

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, scrollToBottom]);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => inputRef.current?.focus(), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Auto-speak new assistant messages when TTS is enabled
    useEffect(() => {
        if (messages.length > prevMessageCountRef.current) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === 'assistant' && ttsEnabled) {
                speak(lastMsg.content);
            }
        }
        prevMessageCountRef.current = messages.length;
    }, [messages, ttsEnabled, speak]);

    const handleSendMessage = async (content?: string) => {
        const messageText = (content || inputValue).trim();
        if (!messageText || isTyping) return;

        // Client-side throttle: 2s between messages
        const now = Date.now();
        if (now - lastSendTime.current < 2000) return;
        lastSendTime.current = now;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
        setIsTyping(true);
        setShowSuggestions(false);
        setUserMessageCount(prev => prev + 1);

        try {
            const allMessages = [...messages, userMessage];
            const response = await generateResponse(messageText, allMessages);
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm having trouble connecting right now. Please try again in a moment!",
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="fixed bottom-24 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(8px)" }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(8px)" }}
                        transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
                        className="pointer-events-auto w-full max-w-[400px] h-[65vh] md:h-[540px] bg-background/80 backdrop-blur-xl border border-border/40 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="relative px-4 py-3 flex justify-between items-center border-b border-border/30 bg-gradient-to-r from-electric-purple/10 via-violet-500/8 to-electric-cyan/5">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-electric-purple to-violet-600 flex items-center justify-center shadow-[0_0_14px_rgba(139,92,246,0.4)]">
                                        <Sparkles className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                                </div>
                                <div>
                                    <span className="font-semibold text-sm text-foreground">Apply Chatbot</span>
                                    <p className="text-[11px] text-muted-foreground">Here to answer any questions</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {/* TTS toggle */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={isSpeaking ? stopTTS : toggleTTS}
                                    className={`h-8 w-8 rounded-full transition-all ${
                                        isSpeaking
                                            ? 'text-electric-purple bg-electric-purple/10 hover:bg-electric-purple/20'
                                            : ttsEnabled
                                                ? 'text-electric-purple hover:bg-white/10'
                                                : 'text-muted-foreground hover:bg-white/10'
                                    }`}
                                    title={isSpeaking ? 'Stop speaking' : ttsEnabled ? 'Disable voice' : 'Enable voice'}
                                >
                                    {isSpeaking ? (
                                        <Square className="h-3.5 w-3.5 fill-current" />
                                    ) : ttsEnabled ? (
                                        <Volume2 className="h-4 w-4" />
                                    ) : (
                                        <VolumeX className="h-4 w-4" />
                                    )}
                                </Button>
                                {/* Close */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={closeChat}
                                    className="h-8 w-8 rounded-full hover:bg-white/10"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                                            msg.role === 'user'
                                                ? 'bg-electric-purple/15 text-foreground rounded-2xl rounded-br-sm border border-electric-purple/20'
                                                : 'bg-accent/40 text-foreground rounded-2xl rounded-bl-sm border border-border/20'
                                        }`}
                                    >
                                        <MessageContent content={msg.content} />
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-accent/40 px-4 py-3 rounded-2xl rounded-bl-sm border border-border/20">
                                        <div className="flex gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-electric-purple/60 rounded-full animate-bounce" />
                                            <span className="w-1.5 h-1.5 bg-electric-purple/60 rounded-full animate-bounce [animation-delay:0.15s]" />
                                            <span className="w-1.5 h-1.5 bg-electric-purple/60 rounded-full animate-bounce [animation-delay:0.3s]" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Signup CTA — appears after threshold */}
                            {showSignupCTA && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex justify-center py-1"
                                >
                                    <div className="bg-gradient-to-r from-electric-purple/10 to-electric-cyan/10 border border-electric-purple/20 rounded-xl px-4 py-3 text-center max-w-[92%] backdrop-blur-sm">
                                        <p className="text-xs font-medium text-foreground mb-2">
                                            Unlock live candidate search, market data & AI tools
                                        </p>
                                        <Button
                                            variant="neubrutalist"
                                            size="sm"
                                            className="rounded-full text-xs px-4 h-7"
                                            onClick={() => window.location.href = '/login'}
                                        >
                                            Sign up free <ArrowRight className="ml-1 h-3 w-3" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Suggestions */}
                        <AnimatePresence>
                            {showSuggestions && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="px-3 pb-2 overflow-hidden"
                                >
                                    <div className="flex flex-wrap gap-1.5">
                                        {QUICK_SUGGESTIONS.map((suggestion) => (
                                            <button
                                                key={suggestion}
                                                onClick={() => handleSendMessage(suggestion)}
                                                className="text-[11px] px-2.5 py-1.5 rounded-full border border-border/40 bg-accent/20 hover:bg-electric-purple/10 hover:border-electric-purple/30 text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input */}
                        <div className="px-3 py-3 border-t border-border/30 bg-background/50">
                            <div className="flex gap-2 items-center">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask about hiring, agents, or careers..."
                                    maxLength={500}
                                    className="flex-1 bg-accent/20 border border-border/30 rounded-xl px-3.5 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-electric-purple/40 focus:ring-1 focus:ring-electric-purple/20 transition-all"
                                />
                                <Button
                                    variant="neubrutalist"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl shrink-0"
                                    onClick={() => handleSendMessage()}
                                    disabled={isTyping || !inputValue.trim()}
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/** Simple markdown-like renderer for chat messages */
function MessageContent({ content }: { content: string }) {
    const lines = content.split('\n');

    return (
        <div className="space-y-1.5">
            {lines.map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-1" />;

                // Bullet points
                if (/^[-•]\s/.test(line)) {
                    return (
                        <div key={i} className="flex gap-1.5 items-start pl-1">
                            <span className="text-electric-purple mt-1.5 text-[8px]">●</span>
                            <span>{renderBold(line.replace(/^[-•]\s/, ''))}</span>
                        </div>
                    );
                }

                return <p key={i}>{renderBold(line)}</p>;
            })}
        </div>
    );
}

/** Render **bold** text within a string */
function renderBold(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
    });
}
