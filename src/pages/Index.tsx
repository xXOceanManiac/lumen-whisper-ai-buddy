
import { useEffect, useRef, useState } from "react";
import { CalendarEvent, Message, Settings } from "@/types";
import { getSettings, saveSettings, getChatHistory, saveChatHistory, defaultSettings } from "@/utils/localStorage";
import { startListening, stopListening, isSpeechRecognitionSupported } from "@/utils/speechToText";
import { speak, stopSpeaking, isSpeechSynthesisSupported } from "@/utils/textToSpeech";
import { startWakeWordDetection, stopWakeWordDetection } from "@/utils/wakeWord";
import { callChatApi } from "@/api/chat";
import { createCalendarEvent, connectGoogleCalendar, checkGoogleCalendarAuth } from "@/api/calendar";
import { useCalendar } from "@/hooks/useCalendar";
import { useAuth } from "@/contexts/AuthContext";

import ChatBubble from "@/components/ChatBubble";
import MicButton from "@/components/MicButton";
import AssistantHeader from "@/components/AssistantHeader";
import SettingsDrawer from "@/components/SettingsDrawer";
import VoiceActivationIndicator from "@/components/VoiceActivationIndicator";
import CalendarEventsList from "@/components/CalendarEventsList";
import { Calendar, Mic, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [calendarConfirmation, setCalendarConfirmation] = useState<{
    summary: string;
    description: string;
    start: string;
    end: string;
  } | null>(null);
  
  // Get user from Auth context
  const { user } = useAuth();
  const { refreshEvents } = useCalendar();
  
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
  
  // Check if user message is asking to add something to calendar
  const checkForCalendarAddRequest = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    return (
      lowerText.includes("add this to my calendar") || 
      lowerText.includes("add this to calendar") ||
      lowerText.includes("create a calendar") ||
      lowerText.includes("add to my calendar") ||
      lowerText.includes("put this on my calendar")
    );
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
    
    // If calendar confirmation is active, handle it separately
    if (calendarConfirmation) {
      const confirmText = text.toLowerCase();
      if (confirmText.includes("yes") || confirmText.includes("confirm") || confirmText.includes("sure")) {
        // User confirmed calendar event
        const { summary, description, start, end } = calendarConfirmation;
        
        // Add a message showing confirmation
        const userMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content: text,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setCurrentText("");
        setCalendarConfirmation(null);
        
        try {
          if (!user?.googleId) {
            throw new Error("User ID not available");
          }
          
          const event = await createCalendarEvent(
            user.googleId,
            summary,
            description,
            start,
            end
          );
          
          // Add confirmation message
          const confirmMessage: Message = {
            id: "calendar-" + Date.now().toString(),
            role: "assistant",
            content: `Great! I've added "${summary}" to your calendar on ${new Date(start).toLocaleDateString()} at ${new Date(start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.`,
            timestamp: Date.now(),
            calendarEvent: event,
          };
          
          setMessages((prev) => [...prev, confirmMessage]);
          refreshEvents();
          
        } catch (error) {
          console.error("Error creating calendar event:", error);
          
          const errorMessage: Message = {
            id: "error-" + Date.now().toString(),
            role: "assistant",
            content: "Sorry, I encountered an error creating the calendar event. Please try again.",
            timestamp: Date.now(),
          };
          
          setMessages((prev) => [...prev, errorMessage]);
        }
        return;
      } else {
        // User declined calendar event
        const userMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content: text,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMessage]);
        
        const declineMessage: Message = {
          id: "calendar-decline-" + Date.now().toString(),
          role: "assistant",
          content: "No problem. I've canceled adding this event to your calendar.",
          timestamp: Date.now(),
        };
        
        setMessages((prev) => [...prev, declineMessage]);
        setCurrentText("");
        setCalendarConfirmation(null);
        return;
      }
    }
    
    // Check if user is asking to add something to calendar
    if (checkForCalendarAddRequest(text)) {
      // Ask for confirmation with calendar details
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text,
        timestamp: Date.now(),
      };
      
      setMessages((prev) => [...prev, userMessage]);
      setCurrentText("");
      
      // Simple calendar event generation (in a real app, this would use more sophisticated NLP)
      // For demo purposes, we'll create a meeting tomorrow at noon
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      
      const end = new Date(tomorrow);
      end.setHours(13, 0, 0, 0);
      
      const eventDetails = {
        summary: "Meeting",
        description: "Added via Lumen",
        start: tomorrow.toISOString(),
        end: end.toISOString(),
      };
      
      setCalendarConfirmation(eventDetails);
      
      // Add confirmation request message
      const confirmMessage: Message = {
        id: "calendar-confirm-" + Date.now().toString(),
        role: "assistant",
        content: `I'll add an event to your calendar. Does this look correct?\n\nEvent: ${eventDetails.summary}\nWhen: ${new Date(eventDetails.start).toLocaleDateString()} at ${new Date(eventDetails.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\n\nPlease confirm with "Yes" or "No".`,
        timestamp: Date.now(),
      };
      
      setMessages((prev) => [...prev, confirmMessage]);
      
      return;
    }
    
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
        user?.googleId, // Use googleId from auth context
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
            refreshEvents();
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

  // Toggle calendar view
  const toggleCalendarView = () => {
    setShowCalendarView(prev => !prev);
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
        {showCalendarView ? (
          // Calendar View
          <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-900">
            <button 
              onClick={toggleCalendarView}
              className="mb-4 text-primary hover:underline flex items-center"
            >
              ← Back to chat
            </button>
            <CalendarPlugin />
          </div>
        ) : (
          // Chat Messages
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
        )}
        
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
            
            <div className="flex items-center gap-2">
              <button
                onClick={toggleCalendarView}
                className={`text-xs flex items-center gap-1 ${showCalendarView ? "text-lumen-purple" : "text-lumen-gray hover:text-lumen-purple"}`}
              >
                <Calendar size={12} />
                <span>{showCalendarView ? "Hide Calendar" : "View Calendar"}</span>
              </button>
              
              {!settings.googleCalendarConnected && (
                <button
                  onClick={handleConnectGoogleCalendar}
                  className="text-xs flex items-center gap-1 text-lumen-purple hover:text-lumen-lightPurple ml-3"
                >
                  <Calendar size={12} />
                  <span>Connect Google Calendar</span>
                </button>
              )}
            </div>
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
