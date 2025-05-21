import { useEffect, useRef, useState } from "react";
import { CalendarEvent, Message, Settings } from "@/types";
import { getSettings, saveSettings, getChatHistory, saveChatHistory, defaultSettings } from "@/utils/localStorage";
import { startListening, stopListening, isSpeechRecognitionSupported } from "@/utils/speechToText";
import { speak, stopSpeaking, isSpeechSynthesisSupported } from "@/utils/textToSpeech";
import { startWakeWordDetection, stopWakeWordDetection } from "@/utils/wakeWord";
import { callChatApi } from "@/api/chat";
import { createCalendarEvent, connectGoogleCalendar, checkGoogleCalendarAuth } from "@/api/calendar";

import ChatBubble from "@/components/ChatBubble";
import MicButton from "@/components/MicButton";
import AssistantHeader from "@/components/AssistantHeader";
import SettingsDrawer from "@/components/SettingsDrawer";
import VoiceActivationIndicator from "@/components/VoiceActivationIndicator";
import { Calendar, Mic, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wakeWordActive, setWakeWordActive] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState("");
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  
  // Toast notifications
  const { toast } = useToast();
  
  // Load settings and chat history
  useEffect(() => {
    setSettings(getSettings());
    setMessages(getChatHistory().messages);
    
    // Check for Google OAuth redirect/callback
    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth_success');
    const oauthError = urlParams.get('oauth_error');
    const state = urlParams.get('state');
    const storedState = localStorage.getItem('googleOAuthState');
    
    // Clear stored OAuth state regardless of outcome
    localStorage.removeItem('googleOAuthState');
    
    // Handle OAuth success
    if (oauthSuccess === 'true' && state && state === storedState) {
      // Update settings to show Google Calendar is connected
      const updatedSettings = {
        ...getSettings(),
        googleCalendarConnected: true
      };
      setSettings(updatedSettings);
      saveSettings(updatedSettings);
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Show success toast
      toast({
        title: "Google Calendar Connected",
        description: "You can now schedule events via voice or text.",
        duration: 5000,
      });
    } 
    // Handle OAuth error
    else if (oauthError || (oauthSuccess === 'true' && (!state || state !== storedState))) {
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Show error toast
      toast({
        title: "Google Calendar Connection Failed",
        description: oauthError || "Authentication error. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  }, []);
  
  // Add system message if messages are empty
  useEffect(() => {
    if (messages.length === 0) {
      const systemMessage: Message = {
        id: "system-1",
        role: "assistant",
        content: "Hello! I'm Lumen, your AI assistant. How can I help you today? You can ask me to schedule events on your calendar or ask me general questions.",
        timestamp: Date.now(),
      };
      setMessages([systemMessage]);
    }
  }, [messages]);
  
  // Save messages to localStorage when updated
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory({ messages, lastUpdated: Date.now() });
    }
  }, [messages]);
  
  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingResponse]);
  
  // Setup wake word detection
  useEffect(() => {
    if (settings.voiceActivation && wakeWordActive) {
      startWakeWordDetection(
        () => {
          // Wake word detected
          handleToggleListen();
        },
        (error) => {
          console.error("Wake word detection error:", error);
        }
      );
      
      return () => {
        stopWakeWordDetection();
      };
    }
  }, [settings.voiceActivation, wakeWordActive]);
  
  // Verify Google Calendar connection on settings load
  useEffect(() => {
    const verifyCalendarConnection = async () => {
      if (settings.googleCalendarConnected && settings.openaiApiKey) {
        const isAuthenticated = await checkGoogleCalendarAuth(settings.openaiApiKey);
        
        if (!isAuthenticated && settings.googleCalendarConnected) {
          // Update settings to show Google Calendar is disconnected
          const updatedSettings = {
            ...settings,
            googleCalendarConnected: false
          };
          setSettings(updatedSettings);
          saveSettings(updatedSettings);
          
          toast({
            title: "Google Calendar Disconnected",
            description: "Your Google Calendar connection has expired. Please reconnect.",
            variant: "destructive",
            duration: 5000,
          });
        }
      }
    };
    
    verifyCalendarConnection();
  }, [settings.googleCalendarConnected, settings.openaiApiKey]);
  
  // Enhanced text formatting function
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
  
  // Functions
  const handleToggleListen = () => {
    if (isListening) {
      stopListening();
      setIsListening(false);
      
      // If we have text, submit it
      if (currentText.trim()) {
        handleSendMessage(currentText);
      }
    } else {
      const success = startListening(
        // Interim results
        (text) => {
          setCurrentText(text);
        },
        // Final results
        (text) => {
          setCurrentText(text);
          // Auto submit after a short delay
          setTimeout(() => {
            handleSendMessage(text);
            setIsListening(false);
            stopListening();
          }, 500);
        },
        (error) => {
          console.error("Speech recognition error:", error);
          setIsListening(false);
        }
      );
      
      if (success) {
        setIsListening(true);
        setCurrentText("");
      } else {
        toast({
          title: "Speech Recognition Error",
          description: "Could not start listening. Check browser permissions.",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  };
  
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setCurrentText("");
    
    // If text input is focused, blur it
    if (document.activeElement === textInputRef.current) {
      textInputRef.current.blur();
    }
    
    // If no OpenAI API key, show error message
    if (!settings.openaiApiKey) {
      const errorMessage: Message = {
        id: "error-" + Date.now().toString(),
        role: "assistant",
        content: "Please add your OpenAI API key in the settings to continue.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }
    
    setIsProcessing(true);
    setStreamingResponse("");
    
    try {
      // Create a temporary ID for the streaming message
      const tempMessageId = "streaming-" + Date.now().toString();
      
      // Call chat API with streaming handler
      const response = await callChatApi(
        [...messages, userMessage],
        settings.openaiApiKey,
        "user-id", // Replace with actual user ID
        (chunk) => {
          // Use the improved formatting function for streaming response
          setStreamingResponse(prev => formatStreamingContent(prev, chunk));
        }
      );
      
      // Clear streaming response once complete
      setStreamingResponse("");
      
      // Enhanced final formatting with paragraph breaks
      let cleanedContent = response.content
        // Fix any double spaces
        .replace(/\s{2,}/g, ' ')
        // Fix comma spacing consistently
        .replace(/,([^\s"])/g, ', $1')
        // Add proper paragraph breaks
        .replace(/([.!?])([A-Z])/g, '$1\n\n$2');
      
      // Create the assistant message
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: cleanedContent,
        timestamp: Date.now(),
      };
      
      // If a calendar event was detected
      if (response.calendarEvent) {
        // Only try to create the event if Google Calendar is connected
        if (settings.googleCalendarConnected) {
          const eventCreated = await createCalendarEvent(
            response.calendarEvent,
            settings.openaiApiKey
          );
          
          if (eventCreated) {
            assistantMessage.calendarEvent = response.calendarEvent;
            toast({
              title: "Event Created",
              description: `Added "${response.calendarEvent.title}" to your calendar.`,
              duration: 3000,
            });
          } else {
            // Handle calendar event creation failure with reconnection prompt
            toast({
              title: "Failed to Create Event",
              description: "There may be an authentication issue. Please reconnect Google Calendar.",
              action: (
                <button
                  onClick={connectGoogleCalendar}
                  className="bg-primary text-white px-3 py-1 rounded-md text-xs"
                >
                  Reconnect
                </button>
              ),
              variant: "destructive",
              duration: 5000,
            });
            
            // Update settings to reflect disconnected state
            const updatedSettings = {
              ...settings,
              googleCalendarConnected: false
            };
            setSettings(updatedSettings);
            saveSettings(updatedSettings);
          }
        } else {
          // Prompt user to connect Google Calendar
          toast({
            title: "Google Calendar Not Connected",
            description: "Please connect your Google Calendar to add events.",
            action: (
              <button
                onClick={connectGoogleCalendar}
                className="bg-primary text-white px-3 py-1 rounded-md text-xs"
              >
                Connect
              </button>
            ),
            duration: 5000,
          });
        }
      }
      
      // Add assistant message to chat
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Speak the response if speech synthesis is supported
      if (isSpeechSynthesisSupported()) {
        setIsSpeaking(true);
        speak(
          assistantMessage.content,
          "",
          () => setIsSpeaking(true),
          () => setIsSpeaking(false),
          (error) => {
            console.error("Speech synthesis error:", error);
            setIsSpeaking(false);
          }
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      const errorMessage: Message = {
        id: "error-" + Date.now().toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    handleSendMessage(currentText);
  };
  
  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    setIsSettingsOpen(false);
    
    // If voice activation is enabled, activate wake word
    if (newSettings.voiceActivation) {
      setWakeWordActive(true);
    } else {
      setWakeWordActive(false);
      stopWakeWordDetection();
    }
  };
  
  const handleClearChat = () => {
    stopSpeaking();
    setMessages([]);
    saveChatHistory({ messages: [], lastUpdated: Date.now() });
  };
  
  // Handle Google Calendar connection
  const handleConnectGoogleCalendar = () => {
    // Clear any previous state
    localStorage.removeItem('googleOAuthState');
    connectGoogleCalendar();
  };
  
  // Check if speech is supported
  const speechSupported = isSpeechRecognitionSupported();
  
  return (
    <div className="flex flex-col h-screen bg-sidebar dark:bg-sidebar">
      <VoiceActivationIndicator isActive={isListening} />
      <AssistantHeader
        onOpenSettings={() => setIsSettingsOpen(true)}
        settings={settings}
        isProcessing={isProcessing}
      />
      
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Chat Messages */}
        <div className="chat-messages flex-1 overflow-y-auto">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          
          {/* Streaming response with improved styling */}
          {streamingResponse && (
            <div className="bubble-assistant animate-fade-in">
              <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                {streamingResponse}
              </div>
            </div>
          )}
          
          {/* Current text being spoken/recorded */}
          {isListening && currentText && (
            <div className="bubble-user animate-fade-in opacity-70">
              <div className="text-sm">{currentText}</div>
            </div>
          )}
          
          {/* Empty div for scrolling to bottom */}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="p-4 bg-sidebar border-t border-gray-200 dark:border-gray-800">
          <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              placeholder={isListening ? "Listening..." : "Type a message..."}
              className="flex-1 p-3 rounded-full border border-gray-300 dark:border-gray-700 dark:bg-sidebar-accent focus:ring-2 focus:ring-lumen-purple focus:border-transparent outline-none"
              disabled={isListening || isProcessing}
              ref={textInputRef}
            />
            
            <button
              type="submit"
              disabled={!currentText.trim() || isProcessing}
              className="p-3 rounded-full bg-lumen-purple text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lumen-purple/90 transition-colors"
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
            
            <MicButton
              isListening={isListening}
              onClick={handleToggleListen}
              disabled={!speechSupported || isProcessing || isSpeaking}
            />
          </form>
          
          {!speechSupported && (
            <div className="text-xs text-lumen-gray mt-2 text-center">
              Speech recognition is not supported in this browser.
            </div>
          )}
          
          <div className="flex justify-between mt-2">
            <button
              onClick={handleClearChat}
              className="text-xs text-lumen-gray hover:text-lumen-purple"
            >
              Clear Chat
            </button>
            
            {!settings.googleCalendarConnected && (
              <button
                onClick={handleConnectGoogleCalendar}
                className="text-xs flex items-center gap-1 text-lumen-purple hover:text-lumen-lightPurple"
              >
                <Calendar size={12} />
                <span>Connect Google Calendar</span>
              </button>
            )}
          </div>
        </div>
      </main>
      
      {/* Settings Drawer */}
      <SettingsDrawer
        settings={settings}
        onSave={handleSaveSettings}
        onClose={() => setIsSettingsOpen(false)}
        isOpen={isSettingsOpen}
        onConnectGoogleCalendar={handleConnectGoogleCalendar}
      />
    </div>
  );
};

export default Index;
