
import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { checkAuth, getOpenAIKey } from "@/api/auth";
import { useToast } from "@/hooks/use-toast";

interface User {
  googleId: string;
  name?: string;
  email?: string;
  picture?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  openaiKey: string | null;
  isLoading: boolean;
  error: string | null;
  lastAuthCheck: number | null;
  hasCompletedOnboarding: boolean;
  setOpenaiKey: (key: string) => void;
  setHasCompletedOnboarding: (value: boolean) => void;
  refreshOpenAIKey: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  openaiKey: null,
  isLoading: true,
  error: null,
  lastAuthCheck: null,
  hasCompletedOnboarding: false,
  setOpenaiKey: () => {},
  setHasCompletedOnboarding: () => {},
  refreshOpenAIKey: async () => false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [openaiKey, setOpenaiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAuthCheck, setLastAuthCheck] = useState<number | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const { toast } = useToast();

  // Function to fetch OpenAI API key
  const fetchOpenAIKey = async (userId: string): Promise<boolean> => {
    try {
      const apiKey = await getOpenAIKey(userId);
      setOpenaiKey(apiKey);
      setHasCompletedOnboarding(apiKey !== null);
      return apiKey !== null;
    } catch (error) {
      console.error("Error fetching OpenAI API key:", error);
      return false;
    }
  };

  // Function to refresh the OpenAI API key
  const refreshOpenAIKey = async (): Promise<boolean> => {
    if (!user?.googleId) return false;
    
    try {
      const success = await fetchOpenAIKey(user.googleId);
      
      if (success) {
        toast({
          title: "API Key Refreshed",
          description: "Your OpenAI API key has been refreshed successfully.",
        });
        return true;
      } else {
        toast({
          title: "API Key Not Found",
          description: "No API key found for your account.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh your API key. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        console.log("Starting authentication verification...");
        // Check if we just got redirected from successful Google login
        const urlParams = new URLSearchParams(window.location.search);
        const googleSuccess = urlParams.get('google') === 'success';
        
        // If we just got redirected from successful Google login, clean up URL parameter
        if (googleSuccess) {
          // Clean up URL without refreshing the page
          window.history.replaceState({}, document.title, window.location.pathname);
          console.log("Detected Google auth success, cleaned up URL params");
        }
        
        // Check authentication status
        const { authenticated, user, errorType } = await checkAuth();
        
        setIsAuthenticated(authenticated);
        setLastAuthCheck(Date.now());
        
        if (authenticated && user) {
          setUser(user);
          setError(null);
          console.log("Authentication verified: user is authenticated");
          
          // Show success toast if we just completed Google authentication
          if (googleSuccess) {
            toast({
              title: "Authentication Successful",
              description: `Welcome, ${user.name || 'User'}!`,
            });
          }
          
          // Fetch OpenAI API key
          await fetchOpenAIKey(user.googleId);
        } else {
          setUser(null);
          setOpenaiKey(null);
          // Use the specific error type
          setError(errorType || "AUTH_FAILED");
          console.log(`Authentication failed: ${errorType || "AUTH_FAILED"}`);
          
          // Show error toast if Google authentication failed
          if (googleSuccess) {
            toast({
              title: "Authentication Failed",
              description: "Could not authenticate with Google. Please try again.",
              variant: "destructive",
            });
          }
        }
      } catch (err) {
        setUser(null);
        setOpenaiKey(null);
        setError("UNEXPECTED_ERROR");
        console.error("Unexpected authentication verification error:", err);
        
        // Show error toast for unexpected errors
        toast({
          title: "Authentication Error",
          description: "An unexpected error occurred. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        user, 
        openaiKey,
        isLoading, 
        error, 
        lastAuthCheck,
        hasCompletedOnboarding,
        setOpenaiKey,
        setHasCompletedOnboarding,
        refreshOpenAIKey
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
