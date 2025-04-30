
import { Github } from "lucide-react";
import { googleLoginUrl } from "@/api/auth";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const LoginView = () => {
  const { error } = useAuth();
  
  // Function to get appropriate error message based on error code
  const getErrorMessage = (errorCode: string | null) => {
    switch(errorCode) {
      case "AUTH_FAILED":
        return "Authentication failed. Please try logging in again.";
      case "SERVER_ERROR":
        return "Unable to connect to authentication server. Please try again later.";
      default:
        return "An unknown error occurred. Please try again.";
    }
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
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{getErrorMessage(error)}</AlertDescription>
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
            <span>Sign in with Google</span>
          </a>
          
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Sign in to start chatting with your AI assistant
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginView;
