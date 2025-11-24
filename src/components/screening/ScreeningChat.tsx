
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Send, X } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
}

interface ScreeningChatProps {
  open: boolean;
  onClose: () => void;
  sessionId: string | null;
}

export const ScreeningChat = ({ open, onClose, sessionId }: ScreeningChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [senderName, setSenderName] = useState('You');

  // Simulate fetching user name
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const user = auth?.currentUser;
        if (user?.email) {
          const name = user.email.split('@')[0];
          setSenderName(name);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserName();
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate receiving messages
  useEffect(() => {
    if (open && sessionId) {
      // Simulated welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        sender: 'System',
        content: 'Welcome to the screening chat! You can use this space to communicate during the interview.',
        timestamp: new Date()
      };
      
      // Only add the welcome message if it doesn't already exist
      if (!messages.some(msg => msg.id === 'welcome')) {
        setMessages([welcomeMessage]);
      }
    }
  }, [open, sessionId, messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    if (!sessionId) {
      toast.error('Cannot send message: session not initialized');
      return;
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: senderName,
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    // Here you would typically send the message to a backend service
    // For example, using a websocket connection or an API call
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <Sheet open={open} onOpenChange={open => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0 bg-white">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Chat</SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>
        
        <div className="flex flex-col h-[calc(100vh-8rem)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex flex-col ${message.sender === senderName ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center mb-1">
                  <span className="text-xs font-medium text-gray-500 mr-2">
                    {message.sender}
                  </span>
                  <span className="text-xs text-gray-400">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div 
                  className={`px-4 py-2 rounded-lg max-w-[80%] ${
                    message.sender === senderName 
                      ? 'bg-purple-100 text-gray-800' 
                      : message.sender === 'System'
                        ? 'bg-gray-100 text-gray-800 italic'
                        : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!inputValue.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
