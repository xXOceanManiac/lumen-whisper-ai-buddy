import { useState, useRef, useEffect } from "react";
import { Message } from "@/types";
import { callChatApi } from "@/api/chat";
import { useAuth } from "@/contexts/AuthContext";
import { Send, LogOut, RefreshCw, Calendar, Mic } from "lucide-react";
import ChatMessage from "./ChatMessage";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import ApiKeySettings from "./ApiKeySettings";
import CalendarEventsList from "./CalendarEventsList";
import DailyBriefing from "./DailyBriefing";
import AlfredConfirmation from "./AlfredConfirmation";
import { fetchCalendarEvents } from "@/api/calendar";
import { useCalendar } from "@/hooks/useCalendar";

interface User {
  googleId: string;
  name?: string;
  email?: string;
  picture?: string;
}

interface ChatViewProps {
  user?: User;
}

const ChatView = ({ user }: ChatViewProps = {}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshingKey, setIsRefreshingKey] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDailyBriefing, setShowDailyBriefing] = useState(false);
  const [alfredConfirmation, setAlfredConfirmation] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Use the AuthContext to get authentication data
  const { user: authUser, openaiKey, refreshOpenAIKey } = useAuth();
  const { events, isLoading: isCalendarLoading, refreshEvents } = useCalendar();
  
  // Ensure we're using the user from props or from auth context
  const currentUser = user || authUser;

  // Add initial greeting message with Alfred personality
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Good day, Sir. I'm your AI assistant. How may I be of service today? I can assist with your calendar or answer any questions you may have.",
        timestamp: Date.now()
      }
    ]);
  }, []);
  
  // Log when OpenAI API key changes
  useEffect(() => {
    if (openaiKey) {
      console.log("✅ OpenAI key available in ChatView:", openaiKey.substring(0, 5) + "..." + openaiKey.slice(-4));
    } else {
      console.log("❌ No OpenAI key available in ChatView");
    }
  }, [openaiKey]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingResponse]);
  
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
        console.log("🔑 Current openaiKey after refresh:", openaiKey ? openaiKey.substring(0, 5) + "..." + openaiKey.slice(-4) : "null");
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
  
  // Enhanced text formatting function with paragraph breaks
  const formatStreamingContent = (current: string, newChunk: string): string => {
    if (!newChunk.trim()) return current;
    
    const lastChar = current.slice(-1);
    const firstChar = newChunk.charAt(0);
    
    // Check for paragraph breaks - when previous content ends with sentence-ending punctuation 
    // and new chunk starts with capital letter
    if (/[.!?]$/.test(current) && /^[A-Z]/.test(newChunk) && !current.endsWith('\n\n')) {
      return current + '\n\n' + newChunk;
    }
    
    // Check if we need a space between words - when last char is letter/number AND first char is letter/number
    // AND current content doesn't end with space/punctuation
    const needsSpace = 
      /[a-zA-Z0-9]/.test(lastChar) && 
      /[a-zA-Z0-9]/.test(firstChar) && 
      !/[\s\.,!?;:]$/.test(current);
    
    return current + (needsSpace ? ' ' : '') + newChunk;
  };

  // Alfred-style response formatter
  const formatAlfredResponse = (content: string): string => {
    // Convert casual responses to Alfred-style formal responses
    const alfredPhrases = {
      "I've added": "I have added",
      "I'll": "I shall",
      "I can": "I am able to",
      "Thanks": "Very good, Sir",
      "You're welcome": "At your service, Sir",
      "Got it": "Understood, Sir",
      "Done": "Completed, Sir",
      "Sure": "Certainly, Sir"
    };

    let formatted = content;
    Object.entries(alfredPhrases).forEach(([casual, formal]) => {
      formatted = formatted.replace(new RegExp(casual, 'gi'), formal);
    });

    // Add "Sir" to appropriate responses
    if (formatted.includes("added to your calendar") || formatted.includes("scheduled")) {
      formatted = formatted.replace(/\.$/, ", Sir.");
    }

    return formatted;
  };

  // Check for calendar confirmation in responses
  const checkForCalendarConfirmation = (content: string): boolean => {
    return content.toLowerCase().includes("added to your calendar") || 
           content.toLowerCase().includes("scheduled") ||
           content.toLowerCase().includes("event created");
  };

  const handleToggleCalendar = () => {
    setShowCalendar(prev => !prev);
    if (!showCalendar) {
      refreshEvents();
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("🔥 handleSubmit triggered");
    
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
    setStreamingResponse(""); // Clear any previous streaming content
    
    try {
      // Check if we have OpenAI API key
      if (!openaiKey) {
        console.error("❌ No OpenAI API key found");
        toast({
          title: "API Key Required",
          description: "No OpenAI API key found. Please add your API key in settings.",
          variant: "destructive",
        });
        setIsProcessing(false);
        
        // Add error message to chat
        const errorMessage: Message = {
          id: "error-" + Date.now().toString(),
          role: "assistant",
          content: "Could not retrieve or use your OpenAI key. Please try reconnecting your key in settings.",
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }
      
      // Validate OpenAI API key format
      if (!openaiKey.startsWith('sk-') || openaiKey.length < 30) {
        console.error("❌ Invalid OpenAI API key format:", openaiKey.substring(0, 5) + "...");
        toast({
          title: "Invalid API Key",
          description: "Your API key appears to be invalid. Please update it in settings.",
          variant: "destructive",
        });
        setIsProcessing(false);
        
        // Add error message to chat
        const errorMessage: Message = {
          id: "error-" + Date.now().toString(),
          role: "assistant",
          content: "Your OpenAI API key appears to be invalid. Please update it in settings.",
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, errorMessage]);
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
        
        // Add error message to chat
        const errorMessage: Message = {
          id: "error-" + Date.now().toString(),
          role: "assistant",
          content: "Authentication error. Please try logging out and back in.",
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }
      
      // Detailed logging of the message submission
      console.log("📩 Submitting message with:", {
        googleId,
        input,
        openaiKeyPrefix: openaiKey.substring(0, 5) + "...",
        openaiKeySuffix: "..." + openaiKey.slice(-4),
        openaiKeyLength: openaiKey.length,
        messages: [...messages, userMessage].map(msg => ({
          role: msg.role,
          content: msg.content.substring(0, 50) + (msg.content.length > 50 ? "..." : "")
        }))
      });
      
      // Call backend Chat API with googleId and streaming support
      console.log("🔄 Calling chat API with streaming...");
      try {
        const response = await callChatApi(
          [...messages, userMessage], 
          openaiKey, 
          googleId,
          (chunk) => {
            // Use the improved spacing function with paragraph breaks
            setStreamingResponse(prev => formatStreamingContent(prev, chunk));
          }
        );
        
        console.log("✅ Chat API streaming response completed");
        
        // Apply Alfred-style formatting
        let cleanedContent = formatAlfredResponse(response.content
          .replace(/\s{2,}/g, ' ')
          .replace(/,([^\s"])/g, ', $1')
          .replace(/([.!?])([A-Z])/g, '$1\n\n$2'));
        
        setStreamingResponse("");
        
        if (!response || !cleanedContent) {
          console.error("❌ Invalid or empty response from chat API");
          throw new Error("Invalid response from chat API");
        }
        
        // Create assistant message from response
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: cleanedContent,
          timestamp: Date.now()
        };
        
        // Handle calendar event if present
        if (response.calendarEvent) {
          assistantMessage.calendarEvent = response.calendarEvent;
          console.log("📅 Calendar event detected:", response.calendarEvent);
          
          setTimeout(() => {
            refreshEvents();
          }, 1000);
          
          const isReminder = response.calendarEvent.description?.includes("Auto-added by Lumen reminder");
          
          // Show Alfred confirmation
          setAlfredConfirmation(`Right away, Sir. "${response.calendarEvent.summary}" has been added to your calendar.`);
          
          toast({
            title: isReminder ? "Reminder Set" : "Calendar Event",
            description: `"${response.calendarEvent.summary}" added to your calendar.`,
          });
        } else if (checkForCalendarConfirmation(cleanedContent)) {
          // Show Alfred confirmation for calendar-related responses
          setAlfredConfirmation("Calendar event processed successfully, Sir.");
        }
        
        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error("❌ Error processing chat API response:", error);
        throw error; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      
      // Add error message to chat
      const errorMessage: Message = {
        id: "error-" + Date.now().toString(),
        role: "assistant",
        content: "Could not retrieve or use your OpenAI key. Please try reconnecting your key in settings.",
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Something went wrong. Please check your API key and try again.",
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
      {/* Alfred confirmation overlay */}
      {alfredConfirmation && (
        <AlfredConfirmation
          message={alfredConfirmation}
          onDismiss={() => setAlfredConfirmation(null)}
        />
      )}

      {/* Daily Briefing Modal */}
      {showDailyBriefing && (
        <DailyBriefing onClose={() => setShowDailyBriefing(false)} />
      )}

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
          <button
            onClick={() => setShowDailyBriefing(true)}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mr-2"
            aria-label="Daily Briefing"
          >
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Briefing</span>
          </button>
          <button
            onClick={handleToggleCalendar}
            className={`flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mr-2 ${showCalendar ? 'text-primary' : ''}`}
            aria-label={showCalendar ? "Hide Calendar" : "Show Calendar"}
          >
            <Calendar size={18} />
            <span className="text-sm">{showCalendar ? "Hide Calendar" : "Calendar"}</span>
          </button>
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
      
      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className={`flex flex-col ${showCalendar ? 'w-2/3' : 'w-full'}`}>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            
            {/* Streaming response with improved styling */}
            {streamingResponse && (
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0 mr-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                    AI
                  </div>
                </div>
                <div className="flex-1 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg max-w-[80%] animate-fade-in">
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
                    {streamingResponse}
                  </p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area with Mic Icon */}
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
                type="button"
                disabled={true}
                className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 disabled:opacity-50 cursor-not-allowed"
                aria-label="Voice input (coming soon)"
                title="Voice input - Coming soon"
              >
                <Mic size={20} />
              </button>
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
        </div>
        
        {/* Calendar Panel */}
        {showCalendar && (
          <div className="w-1/3 border-l border-gray-200 dark:border-gray-800 overflow-y-auto p-4">
            <h3 className="text-lg font-medium mb-4">Your Calendar</h3>
            <CalendarEventsList />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatView;
