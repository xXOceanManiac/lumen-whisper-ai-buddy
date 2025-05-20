
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Message } from "@/types";
import { callChatApi } from "@/api/chat";
import { useToast } from "@/hooks/use-toast";
import ChatMessage from "./ChatMessage";

const ChatView: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, openaiKey, refreshOpenAIKey } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = user;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    console.log("🔥 handleSubmit triggered");

    const isInputValid = !!input.trim();
    console.log("💡 Submit enabled:", isInputValid, "Processing:", isProcessing);

    if (!isInputValid || isProcessing) return;

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
      if (!openaiKey) {
        console.warn("⛔ openaiKey is missing");
        toast({
          title: "API Key Required",
          description: "No OpenAI API key found. Please refresh your key or check your account settings.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      const googleId = currentUser?.googleId;

      if (!googleId) {
        console.warn("⚠️ No googleId! Cannot send chat request.");
        console.log("Current user data:", currentUser);
        toast({
          title: "Authentication Error",
          description: "Your login session is incomplete. Please try logging in again.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      console.log("📩 Submitting message with:", {
        googleId,
        openaiKey: openaiKey ? "** API KEY EXISTS **" : "** MISSING **",
        input,
        fullUser: currentUser,
        messages: [...messages, userMessage].map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });

      const response = await callChatApi([...messages, userMessage], openaiKey, googleId);

      console.log("✅ Response from backend:", response);

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: response.content,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (response.calendarEvent) {
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
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              disabled={isProcessing}
            />
            <button 
              type="submit" 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              disabled={isProcessing || !input.trim()}
            >
              {isProcessing ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
