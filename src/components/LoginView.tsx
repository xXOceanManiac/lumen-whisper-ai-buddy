
import { useAuth } from "@/contexts/AuthContext";
import { googleLoginUrl, isPostAuthRedirect } from "@/api/auth";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import LumenLogo from "./LumenLogo";

const LoginView = () => {
  const { lastAuthCheck, isLoading, verifyAuthentication } = useAuth();
  const [loginUrl] = useState(googleLoginUrl);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [processingAuth, setProcessingAuth] = useState(false);

  useEffect(() => {
    // Check if we were redirected back with loggedIn=true
    const wasRedirected = isPostAuthRedirect();
    
    if (wasRedirected && !loginAttempted) {
      console.log("📣 Detected return from Google auth with loggedIn=true");
      setLoginAttempted(true);
      setProcessingAuth(true);
      
      // Explicitly verify authentication
      verifyAuthentication().finally(() => {
        setProcessingAuth(false);
      });
    }
  }, [loginAttempted, verifyAuthentication]);

  return (
    <motion.div 
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-100 to-white dark:from-gray-900 dark:to-gray-800 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <LumenLogo size={100} className="mx-auto" />
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome to Lumen
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Your AI assistant powered by OpenAI
          </p>
        </div>

        <div className="mt-8">
          <a
            href={loginUrl}
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

          {(loginAttempted || processingAuth) && (
            <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {processingAuth ? "Verifying authentication status..." : "Login detected! Checking session..."}
              </p>
              {processingAuth && (
                <div className="mt-2 flex justify-center">
                  <div className="animate-spin w-5 h-5 border-2 border-yellow-600 dark:border-yellow-300 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          )}
          
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Sign in to start chatting with your AI assistant
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginView;
