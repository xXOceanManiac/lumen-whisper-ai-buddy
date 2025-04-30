
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { googleLoginUrl, logout } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogIn } from "lucide-react";

const LogoutView = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const performLogout = async () => {
      try {
        setIsLoggingOut(true);
        const success = await logout();
        
        if (success) {
          toast({
            title: "Signed Out",
            description: "You've been successfully signed out.",
          });
        } else {
          setError("Could not complete logout process.");
          toast({
            title: "Logout Error",
            description: "There was an issue signing you out.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Logout error:", error);
        setError("Network error while trying to log out.");
        toast({
          title: "Connection Error",
          description: "Could not connect to the authentication server.",
          variant: "destructive",
        });
      } finally {
        setIsLoggingOut(false);
      }
    };

    performLogout();
  }, [toast]);

  return (
    <motion.div 
      className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-md w-full space-y-8 text-center p-8 rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700">
        {isLoggingOut ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
            <p className="text-lg">Signing you out...</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-white">
                You've been signed out
              </h1>
              <p className="text-lg text-gray-300">
                Your session has ended. Thanks for using Lumen!
              </p>
            </div>

            {error && (
              <div className="p-4 my-4 bg-red-900/30 border border-red-800 rounded-lg text-left">
                <p className="font-medium">Error</p>
                <p className="text-sm text-gray-300">{error}</p>
              </div>
            )}

            <div className="mt-8">
              <Button
                asChild
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-3"
                size="lg"
              >
                <a href={googleLoginUrl}>
                  <LogIn className="w-5 h-5" />
                  <span>Log back in with Google</span>
                </a>
              </Button>
              
              <p className="mt-4 text-sm text-gray-400">
                Sign in again to start a new session
              </p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default LogoutView;
