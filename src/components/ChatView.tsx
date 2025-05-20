import { useState, useRef, useEffect } from "react";
import { Message } from "@/types";
import { callChatApi } from "@/api/chat";
import { useAuth } from "@/contexts/AuthContext";
import { Send, LogOut, RefreshCw } from "lucide-react";
import ChatMessage from "./ChatMessage";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import ApiKeySettings from "./ApiKeySettings";

interface User {
  googleId: string;
  name?: string;
  email?: string;
  picture?: string;
}

interface ChatViewProps {
  user?: User; // Making the user prop optional
}

const ChatView = ({ user }: ChatViewProps = {}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshingKey, setIsRefreshingKey] = useState(false);
  
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Use the AuthContext to get authentication data - fix the duplicate declaration
  const { user: authUser, openaiKey, refreshOpenAIKey } = useAuth();
  
  // Ensure we're using the user from props or from auth context
  const currentUser = user || authUser;

  // Add initial greeting message
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Hello! I'm your AI assistant. How can I help you today?",
        timestamp: Date.now()
      }
    ]);
  }, []);
  
  // Log when OpenAI API key changes
  useEffect(() => {
    if (openaiKey) {
      console.log("✅ OpenAI key available in ChatView:", openaiKey.slice(0, 5) + "...");
    } else {
      console.log("❌ No OpenAI key available in ChatView");
    }
  }, [openaiKey]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleLogout = () => {
    navigate('/logout');
  };

  const handleRefreshApiKey = async () => {
    setIsRefreshingKey(true);
    try {
      console.log("🔄 Starting OpenAI key refresh");
      const success = await refreshOpenAIKey();
      if (success) {
        console.log("✅ OpenAI key refreshed successfully");
        console.log("🔑 Current openaiKey after refresh:", openaiKey ? openaiKey.slice(0, 5) + "..." : "null");
        toast({
          title: "API Key Refreshed",
          description: "Your OpenAI API key has been successfully refreshed.",
        });
      } else {
        console.log("❌ Failed to refresh OpenAI key");
        toast({
          title: "Refresh Failed",
          description: "Could not refresh your API key. Please check your account settings.",
          variant: "destructive",
        });
      }
    } finally {
      setIsRefreshingKey(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("🔥 handleSubmit triggered");
    console.log("🔑 openaiKey present at submit:", openaiKey ? openaiKey.slice(0, 5) + "..." : "null");
    
    if (!input.trim() || isProcessing) {
      console.log("❌ Empty input or already processing, cancelling submission");
      return;
    }
    
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
        console.error("❌ No OpenAI API key found");
        toast({
          title: "API Key Required",
          description: "No OpenAI API key found. Please refresh your key or check your account settings.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      // Get the user's googleId
      const googleId = currentUser?.googleId;
      
      if (!googleId) {
        console.error("❌ No googleId available for chat API call");
        toast({
          title: "Authentication Error",
          description: "User ID not found. Please try logging out and back in.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      // Detailed logging of the message submission
      console.log("📩 Submitting message with:", {
        googleId,
        input,
        openaiKeyPrefix: openaiKey.slice(0, 5) + "...",
        messages: [...messages, userMessage].map(msg => ({
          role: msg.role,
          content: msg.content.substring(0, 50) + (msg.content.length > 50 ? "..." : "")
        }))
      });
      
      // Call backend Chat API with googleId
      console.log("🔄 Calling chat API...");
      const response = await callChatApi([...messages, userMessage], openaiKey, googleId);
      console.log("✅ Chat API response received");
      
      // Create assistant message from response
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: response.content,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Handle calendar event if present
      if (response.calendarEvent) {
        // You can add calendar event handling here in the future
        console.log("📅 Calendar event detected:", response.calendarEvent);
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
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
          {currentUser?.picture && (
            <img 
              src={currentUser.picture} 
              alt={currentUser.name || "User"} 
              className="w-8 h-8 rounded-full"
            />
          )}
          <div className="flex flex-col">
            <h1 className="text-lg font-medium text-gray-900 dark:text-white">
              {currentUser?.name || "AI Assistant"}
            </h1>
            {currentUser?.email && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentUser.email}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ApiKeySettings />
          <button
            onClick={handleRefreshApiKey}
            disabled={isRefreshingKey}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mr-2 disabled:opacity-50"
            aria-label="Refresh API Key"
          >
            <RefreshCw size={18} className={isRefreshingKey ? "animate-spin" : ""} />
            <span className="text-sm">Refresh Key</span>
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Logout"
          >
            <LogOut size={18} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
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
