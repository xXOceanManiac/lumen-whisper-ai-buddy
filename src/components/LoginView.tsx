
import { FaGoogle } from "lucide-react";
import { googleLoginUrl } from "@/api/auth";
import { motion } from "framer-motion";

const LoginView = () => {
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

        <div className="mt-8">
          <a
            href={googleLoginUrl}
            className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 dark:bg-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 font-medium rounded-lg px-6 py-3 shadow-md transition-colors duration-200"
          >
            <FaGoogle className="w-5 h-5 text-red-500" />
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
