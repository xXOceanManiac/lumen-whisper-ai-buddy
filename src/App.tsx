
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Add a state to check if browser supports required APIs
  const [supported, setSupported] = useState({
    webSpeech: false,
    webAudio: false,
    checked: false,
  });

  // Check browser support on mount
  useEffect(() => {
    const checkSupport = () => {
      const webSpeechSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      const webAudioSupported = !!(window.AudioContext);
      
      setSupported({
        webSpeech: webSpeechSupported,
        webAudio: webAudioSupported,
        checked: true,
      });
    };

    checkSupport();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
