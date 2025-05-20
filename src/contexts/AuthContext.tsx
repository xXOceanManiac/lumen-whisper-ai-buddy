
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

// Local Storage key for user data
const USER_STORAGE_KEY = 'lumen-user-data';
// Local Storage key for OpenAI API key
const OPENAI_KEY_STORAGE_KEY = 'lumen-openai-key';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [openaiKey, setOpenaiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAuthCheck, setLastAuthCheck] = useState<number | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const { toast } = useToast();

  // Save user data to localStorage
  const saveUserToStorage = (userData: User) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    console.log("User data saved to localStorage with googleId:", userData.googleId);
  };

  // Load user data from localStorage
  const loadUserFromStorage = (): User | null => {
    const userData = localStorage.getItem(USER_STORAGE_KEY);
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData) as User;
        console.log("User data loaded from localStorage with googleId:", parsedUser.googleId);
        return parsedUser;
      } catch (e) {
        console.error("Error parsing user data from localStorage:", e);
        return null;
      }
    }
    return null;
  };

  // Save OpenAI API key to localStorage
  const saveOpenAIKeyToStorage = (key: string) => {
    localStorage.setItem(OPENAI_KEY_STORAGE_KEY, key);
    console.log("OpenAI API key saved to localStorage:", key.slice(0, 5) + "...");
  };

  // Load OpenAI API key from localStorage
  const loadOpenAIKeyFromStorage = (): string | null => {
    const key = localStorage.getItem(OPENAI_KEY_STORAGE_KEY);
    if (key) {
      console.log("OpenAI API key loaded from localStorage:", key.slice(0, 5) + "...");
    }
    return key;
  };

  // Set OpenAI key with storage
  const handleSetOpenaiKey = (key: string) => {
    console.log("✅ Setting OpenAI API key:", key.slice(0, 5) + "...");
    setOpenaiKey(key);
    saveOpenAIKeyToStorage(key);
    setHasCompletedOnboarding(true);
  };

  // Function to fetch OpenAI API key
  const fetchOpenAIKey = async (userId: string): Promise<boolean> => {
    try {
      console.log("Fetching OpenAI API key for googleId:", userId);
      const apiKey = await getOpenAIKey(userId);
      
      if (apiKey) {
        console.log("✅ OpenAI key fetched:", apiKey.slice(0, 5) + "...");
        setOpenaiKey(apiKey);
        saveOpenAIKeyToStorage(apiKey);
        setHasCompletedOnboarding(true);
        return true;
      } else {
        console.log("❌ No OpenAI key found for user");
        return false;
      }
    } catch (error) {
      console.error("Error fetching OpenAI API key:", error);
      return false;
    }
  };

  // Function to refresh the OpenAI API key
  const refreshOpenAIKey = async (): Promise<boolean> => {
    if (!user?.googleId) return false;
    
    try {
      console.log("Refreshing OpenAI API key for googleId:", user.googleId);
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
        
        // Check if we have a saved user in localStorage
        const savedUser = loadUserFromStorage();
        // Load saved API key from localStorage
        const savedApiKey = loadOpenAIKeyFromStorage();
        
        // If we just got redirected from successful Google login, clean up URL parameter
        if (googleSuccess) {
          // Clean up URL without refreshing the page
          window.history.replaceState({}, document.title, window.location.pathname);
          console.log("Detected Google auth success, cleaned up URL params");
        }
        
        // Check authentication status
        const { authenticated, user: serverUser, errorType } = await checkAuth();
        
        setIsAuthenticated(authenticated);
        setLastAuthCheck(Date.now());
        
        if (authenticated && serverUser) {
          // Use server user data or existing data from localStorage if available
          const finalUser = serverUser;
          setUser(finalUser);
          setError(null);
          console.log("Authentication verified: user is authenticated with googleId:", finalUser.googleId);
          
          // Save user data to localStorage for persistence
          saveUserToStorage(finalUser);
          
          // Show success toast if we just completed Google authentication
          if (googleSuccess) {
            toast({
              title: "Authentication Successful",
              description: `Welcome, ${finalUser.name || 'User'}!`,
            });
          }
          
          // If we have a saved API key, restore it immediately for better UX
          if (savedApiKey) {
            setOpenaiKey(savedApiKey);
            setHasCompletedOnboarding(true);
            console.log("Restored OpenAI API key from localStorage:", savedApiKey.slice(0, 5) + "...");
          }
          
          // Fetch fresh OpenAI API key
          await fetchOpenAIKey(finalUser.googleId);
        } else if (savedUser && !googleSuccess) {
          // If we have a saved user but server authentication failed, and we're not in the middle
          // of a new authentication attempt, try to use the saved user data
          console.log("Using saved user data from localStorage with googleId:", savedUser.googleId);
          setUser(savedUser);
          setIsAuthenticated(true);
          
          // If we have a saved API key, restore it immediately
          if (savedApiKey) {
            setOpenaiKey(savedApiKey);
            setHasCompletedOnboarding(true);
            console.log("Restored OpenAI API key from localStorage:", savedApiKey.slice(0, 5) + "...");
          }
          
          // Try to fetch API key using the saved user ID
          await fetchOpenAIKey(savedUser.googleId);
        } else {
          setUser(null);
          setOpenaiKey(null);
          // Use the specific error type
          setError(errorType || "AUTH_FAILED");
          console.log(`Authentication failed: ${errorType || "AUTH_FAILED"}`);
          
          // Clear local storage on authentication failure
          localStorage.removeItem(USER_STORAGE_KEY);
          localStorage.removeItem(OPENAI_KEY_STORAGE_KEY);
          
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
        setOpenaiKey: handleSetOpenaiKey,
        setHasCompletedOnboarding,
        refreshOpenAIKey
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
