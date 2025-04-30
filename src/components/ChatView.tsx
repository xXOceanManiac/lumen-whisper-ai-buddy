
import { useState, useRef, useEffect } from "react";
import { Message } from "@/types";
import { callOpenAIChat } from "@/utils/openai";
import { getOpenAIKey, logout } from "@/api/auth";
import { Send, LogOut } from "lucide-react";
import ChatMessage from "./ChatMessage";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface ChatViewProps {
  user: {
    googleId: string;
    name?: string;
    picture?: string;
    email?: string;
  };
}

const ChatView = ({ user }: ChatViewProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [openaiKey, setOpenaiKey] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch OpenAI key on component mount
  useEffect(() => {
    const fetchOpenAIKey = async () => {
      if (user.googleId) {
        const key = await getOpenAIKey(user.googleId);
        setOpenaiKey(key);
        
        if (!key) {
          toast({
            title: "API Key Missing",
            description: "Could not retrieve your OpenAI API key.",
            variant: "destructive",
          });
        }
      }
    };
    
    fetchOpenAIKey();
    
    // Add initial greeting message
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Hello! I'm your AI assistant. How can I help you today?",
        timestamp: Date.now()
      }
    ]);
  }, [user.googleId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isProcessing) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);
    
    try {
      // Check if we have OpenAI API key
      if (!openaiKey) {
        toast({
          title: "API Key Required",
          description: "OpenAI API key not found. Please try logging in again.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      // Call OpenAI API
      const response = await callOpenAIChat([...messages, userMessage], openaiKey);
      
      if (response.success && response.data) {
        setMessages(prev => [...prev, response.data]);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to get a response from AI.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <motion.div
      className="flex flex-col h-screen bg-white dark:bg-gray-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Chat Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          {user.picture && (
            <img 
              src={user.picture} 
              alt={user.name || "User"} 
              className="w-8 h-8 rounded-full"
            />
          )}
          <div className="flex flex-col">
            <h1 className="text-lg font-medium text-gray-900 dark:text-white">
              {user.name || "AI Assistant"}
            </h1>
            {user.email && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            )}
          </div>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Logout"
        >
          <LogOut size={18} />
          <span className="text-sm">Logout</span>
        </button>
      </header>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isProcessing}
            className="flex-1 p-3 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="p-3 rounded-full bg-primary text-white disabled:opacity-50 hover:bg-primary/90"
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default ChatView;
