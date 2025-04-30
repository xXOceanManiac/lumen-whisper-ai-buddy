
import { Github } from "lucide-react";
import { googleLoginUrl } from "@/api/auth";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const LoginView = () => {
  const { error, lastAuthCheck } = useAuth();
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Function to get appropriate error message based on error code
  const getErrorMessage = (errorCode: string | null) => {
    switch(errorCode) {
      case "AUTH_FAILED":
        return "Authentication failed. Please try logging in again.";
      case "UNAUTHORIZED":
        return "Your session has expired. Please log in again.";
      case "SERVER_ERROR":
        return "Unable to connect to authentication server. Please try again later.";
      case "NETWORK_ERROR":
        return "Network error when connecting to authentication server. Please check your connection and try again.";
      default:
        return "An unknown error occurred. Please try again.";
    }
  };
  
  // Show retry button after a delay for network/server errors
  useEffect(() => {
    if (error === "NETWORK_ERROR" || error === "SERVER_ERROR") {
      const timer = setTimeout(() => setShowRetryButton(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  // Function to retry authentication
  const handleRetry = () => {
    setIsRetrying(true);
    // Reload page to retry authentication
    window.location.reload();
  };

  return (
    <motion.div 
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-100 to-white dark:from-gray-900 dark:to-gray-800 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome to Lumen
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Your AI assistant powered by OpenAI
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription className="flex flex-col items-center">
              <span>{getErrorMessage(error)}</span>
              {showRetryButton && (
                <Button 
                  onClick={handleRetry}
                  className="mt-2"
                  disabled={isRetrying}
                >
                  {isRetrying ? "Retrying..." : "Retry Connection"}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-8">
          <a
            href={googleLoginUrl}
            className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 dark:bg-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 font-medium rounded-lg px-6 py-3 shadow-md transition-colors duration-200"
          >
            <svg 
              className="w-5 h-5 text-red-500" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 488 512"
              fill="currentColor"
            >
              <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
            </svg>
            <span>Continue with Google</span>
          </a>
          
          {lastAuthCheck && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Last authentication check: {new Date(lastAuthCheck).toLocaleTimeString()}
            </p>
          )}
          
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Sign in to start chatting with your AI assistant
          </p>
          
          {error === "NETWORK_ERROR" && (
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Note: The authentication server at lumen-backend-main.onrender.com might be in sleep mode and taking time to wake up. Please be patient and retry in a moment.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default LoginView;
