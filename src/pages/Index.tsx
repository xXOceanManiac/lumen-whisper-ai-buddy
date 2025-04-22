
import { useEffect, useRef, useState } from "react";
import { Message, Settings } from "@/types";
import { getSettings, saveSettings, getChatHistory, saveChatHistory, defaultSettings } from "@/utils/localStorage";
import { startListening, stopListening, isSpeechRecognitionSupported } from "@/utils/speechToText";
import { speak, stopSpeaking, isSpeechSynthesisSupported } from "@/utils/textToSpeech";
import { startWakeWordDetection, stopWakeWordDetection } from "@/utils/wakeWord";
import { callOpenAIChat } from "@/utils/openai";

import ChatBubble from "@/components/ChatBubble";
import MicButton from "@/components/MicButton";
import AssistantHeader from "@/components/AssistantHeader";
import SettingsDrawer from "@/components/SettingsDrawer";
import VoiceActivationIndicator from "@/components/VoiceActivationIndicator";

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
  
  // Load settings and chat history
  useEffect(() => {
    setSettings(getSettings());
    setMessages(getChatHistory().messages);
  }, []);
  
  // Add system message if messages are empty
  useEffect(() => {
    if (messages.length === 0) {
      const systemMessage: Message = {
        id: "system-1",
        role: "assistant",
        content: "Hello! I'm Lumen, your AI assistant. How can I help you today?",
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
      // Call OpenAI API with streaming
      await callOpenAIChat(
        [...messages, userMessage],
        settings.openaiApiKey,
        // Streaming chunk handler
        (chunk) => {
          setStreamingResponse((prev) => prev + chunk);
        }
      );
      
      // After streaming complete, add the full message
      if (streamingResponse) {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: streamingResponse,
          timestamp: Date.now(),
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingResponse("");
        
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
  
  // Check if speech is supported
  const speechSupported = isSpeechRecognitionSupported();
  
  return (
    <div className="flex flex-col h-screen bg-lumen-lightGray">
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
          
          {/* Streaming response */}
          {streamingResponse && (
            <div className="bubble-assistant animate-fade-in">
              <div className="text-sm">{streamingResponse}</div>
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
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              placeholder={isListening ? "Listening..." : "Type a message..."}
              className="flex-1 p-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-lumen-blue focus:border-transparent outline-none"
              disabled={isListening || isProcessing}
              ref={textInputRef}
            />
            
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
          
          <div className="flex justify-center mt-2">
            <button
              onClick={handleClearChat}
              className="text-xs text-lumen-gray hover:text-lumen-blue"
            >
              Clear Chat
            </button>
          </div>
        </div>
      </main>
      
      {/* Settings Drawer */}
      <SettingsDrawer
        settings={settings}
        onSave={handleSaveSettings}
        onClose={() => setIsSettingsOpen(false)}
        isOpen={isSettingsOpen}
      />
    </div>
  );
};

export default Index;
