import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/design-system/Button";
import { useChat } from "@/context/ChatContext";
import { generateResponse, Message } from "@/lib/chat-service";

export const ChatWidget = () => {
    const { isOpen, toggleChat, closeChat } = useChat();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Welcome to Apply, Co. I'm your AI Trainer. I can teach you how to build custom agents or connect you with human experts. How can I help you start?",
        },
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue,
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
        setIsTyping(true);

        try {
            const response = await generateResponse(userMessage.content);
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Chat error:", error);
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
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="pointer-events-auto w-full max-w-[350px] h-[60vh] md:h-[500px] bg-background border-2 border-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-electric-purple p-4 flex justify-between items-center border-b-2 border-border">
                            <div className="flex items-center gap-2 text-white">
                                <Bot className="h-6 w-6" />
                                <span className="font-bold font-display">AI Trainer</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={closeChat} className="text-white hover:bg-white/20">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] p-3 rounded-none border border-border ${msg.role === 'user'
                                            ? 'bg-electric-purple/10 text-foreground'
                                            : 'bg-accent text-foreground'
                                            }`}
                                    >
                                        <p className="text-sm">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-accent p-3 border border-border">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
                                            <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce delay-75" />
                                            <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce delay-150" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t-2 border-border bg-background">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask about building agents..."
                                    className="flex-1 bg-transparent border-b-2 border-border focus:border-electric-purple outline-none px-2 py-1 text-sm"
                                />
                                <Button variant="neubrutalist" size="icon" onClick={handleSendMessage} disabled={isTyping}>
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
