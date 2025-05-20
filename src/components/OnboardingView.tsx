
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { saveOpenAIKey } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Loader, ArrowRight, Key } from "lucide-react";

type Step = 'welcome' | 'apiKey' | 'success';

const OnboardingView = () => {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, setOpenaiKey, setHasCompletedOnboarding } = useAuth();
  const { toast } = useToast();

  const handleNext = () => {
    if (currentStep === 'welcome') {
      setCurrentStep('apiKey');
    }
  };

  const handleSubmitApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim() || !user?.googleId) {
      toast({
        title: "Error",
        description: "Please enter a valid API key.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Log the googleId before saving the API key
      console.log("Saving API key for googleId:", user.googleId);
      const success = await saveOpenAIKey(user.googleId, apiKey.trim());
      
      if (success) {
        setOpenaiKey(apiKey.trim());
        setHasCompletedOnboarding(true);
        setCurrentStep('success');
        
        toast({
          title: "Success",
          description: "Your OpenAI API key has been saved.",
        });
        
        // Automatically transition to chat after success
        setTimeout(() => {
          setHasCompletedOnboarding(true);
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: "Failed to save your API key. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-center"
          >
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Welcome to Lumen
            </h1>
            <p className="text-lg text-gray-300">
              Your personal AI assistant powered by OpenAI
            </p>
            <div className="p-6 bg-gray-800/50 rounded-lg text-left max-w-md mx-auto">
              <h2 className="text-xl font-medium mb-4">To get started, you'll need:</h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/20 p-1 mt-1">
                    <Key size={16} className="text-primary" />
                  </div>
                  <span>Your own OpenAI API key to ensure your conversations remain private and personalized</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/20 p-1 mt-1">
                    <Key size={16} className="text-primary" />
                  </div>
                  <span>You can get an API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-primary hover:underline">OpenAI's website</a></span>
                </li>
              </ul>
            </div>
            <Button
              onClick={handleNext}
              className="mt-6 w-full flex items-center justify-center gap-2"
              size="lg"
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </Button>
          </motion.div>
        );
        
      case 'apiKey':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-md mx-auto"
          >
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Enter Your OpenAI API Key
              </h1>
              <p className="text-gray-300 mt-2">
                Your key stays on your device and is only used to make API calls to OpenAI.
              </p>
            </div>
            
            <form onSubmit={handleSubmitApiKey} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300">
                  OpenAI API Key
                </label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-400">
                  Your API key is stored securely and never shared.
                </p>
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !apiKey.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader size={16} className="mr-2 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save API Key</span>
                )}
              </Button>
            </form>
            
            <div className="text-xs text-center text-gray-400">
              <p>
                Need an API key? <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  Get one from OpenAI
                </a>
              </p>
            </div>
          </motion.div>
        );
        
      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-center"
          >
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                You're All Set!
              </h1>
              <p className="text-lg text-gray-300 mt-2">
                Your API key has been saved successfully.
              </p>
              <p className="text-gray-400 mt-4">
                Taking you to the chat...
              </p>
            </div>
            <div className="flex justify-center">
              <div className="h-2 w-24 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2 }}
                />
              </div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      <div className="max-w-lg w-full space-y-8">
        {renderStep()}
      </div>
    </div>
  );
};

export default OnboardingView;
