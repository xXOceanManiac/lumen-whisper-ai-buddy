import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { checkAuth, getOpenAIKey, cleanupAuthRedirect, isPostAuthRedirect } from "@/api/auth";
import { useToast } from "@/hooks/use-toast";
import { saveOpenAIKey as saveOpenAIKeyToStorage, getOpenAIKey as getOpenAIKeyFromStorage, validateOpenAIKeyFormat } from "@/utils/localStorage";

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [openaiKey, setOpenaiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAuthCheck, setLastAuthCheck] = useState<number | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [authAttempted, setAuthAttempted] = useState(false);
  const [isRedirectedFromAuth, setIsRedirectedFromAuth] = useState(false);
  const { toast } = useToast();

  // Save user data to localStorage
  const saveUserToStorage = (userData: User) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    console.log("✅ User data saved to localStorage with googleId:", userData.googleId);
  };

  // Load user data from localStorage
  const loadUserFromStorage = (): User | null => {
    const userData = localStorage.getItem(USER_STORAGE_KEY);
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData) as User;
        console.log("✅ User data loaded from localStorage with googleId:", parsedUser.googleId);
        return parsedUser;
      } catch (e) {
        console.error("❌ Error parsing user data from localStorage:", e);
        return null;
      }
    }
    return null;
  };

  // Set OpenAI key with storage
  const handleSetOpenaiKey = (key: string) => {
    const trimmedKey = key ? key.trim() : '';
    
    if (!validateOpenAIKeyFormat(trimmedKey)) {
      console.error("❌ Invalid OpenAI API key format:", trimmedKey ? trimmedKey.substring(0, 7) + "..." : "null/empty");
      toast({
        title: "Invalid API Key",
        description: "API key should start with sk- and be at least 48 characters long",
        variant: "destructive",
      });
      return;
    }
    
    console.log(`✅ Setting OpenAI API key: ${trimmedKey.substring(0, 7)}... (${trimmedKey.length} chars)`);
    // Store the FULL unmodified key
    setOpenaiKey(trimmedKey);
    saveOpenAIKeyToStorage(trimmedKey);
    setHasCompletedOnboarding(true);
    
    // If we have a user, also save the key to backend
    if (user?.googleId) {
      saveKeyToServer(user.googleId, trimmedKey);
    } else {
      console.warn("⚠️ No user found when setting API key; key saved locally only");
    }
  };
  
  // Helper function to save key to server
  const saveKeyToServer = async (googleId: string, key: string): Promise<void> => {
    try {
      const success = await import('@/api/auth').then(module => module.saveOpenAIKey(googleId, key));
      if (success) {
        console.log("✅ API key successfully saved to server");
      } else {
        console.error("❌ Failed to save API key to server");
      }
    } catch (error) {
      console.error("❌ Error saving API key to server:", error);
    }
  };

  // Function to fetch OpenAI API key from backend
  const fetchOpenAIKey = async (userId: string): Promise<boolean> => {
    try {
      console.log("🔄 Fetching OpenAI API key for googleId:", userId);
      const apiKey = await getOpenAIKey(userId);
      
      if (apiKey && validateOpenAIKeyFormat(apiKey)) {
        console.log(`✅ OpenAI key fetched: ${apiKey.substring(0, 7)}... (${apiKey.length} chars)`);
        setOpenaiKey(apiKey);
        saveOpenAIKeyToStorage(apiKey);
        setHasCompletedOnboarding(true);
        return true;
      } else {
        console.log("❌ No valid OpenAI key found for user");
        // Important: We do NOT clear the existing key if the fetch fails
        // This allows fallback to locally stored key
        return false;
      }
    } catch (error) {
      console.error("❌ Error fetching OpenAI API key:", error);
      return false;
    }
  };

  // Function to refresh the OpenAI API key
  const refreshOpenAIKey = async (): Promise<boolean> => {
    if (!user?.googleId) return false;
    
    try {
      console.log("🔄 Refreshing OpenAI API key for googleId:", user.googleId);
      const success = await fetchOpenAIKey(user.googleId);
      
      if (success) {
        toast({
          title: "API Key Refreshed",
          description: "Your OpenAI API key has been refreshed successfully.",
        });
        return true;
      } else {
        // Don't show error toast here since we're falling back to the local key
        console.log("⚠️ Could not refresh API key from server, using locally stored key");
        return false;
      }
    } catch (error) {
      console.error("❌ Error refreshing OpenAI API key:", error);
      return false;
    }
  };

  // Primary authentication verification function with improved session handling
  const verifyAuthentication = async (isInitialLoad = false) => {
    try {
      console.log("🔄 Starting authentication verification...");
      
      // Record that auth has been attempted
      setAuthAttempted(true);
      
      // Check if we just got redirected from successful Google login
      const isPostRedirect = isPostAuthRedirect();
      if (isPostRedirect && !isRedirectedFromAuth) {
        console.log("✅ Detected post-auth redirect with loggedIn=true");
        setIsRedirectedFromAuth(true);
      }
      
      // Get saved user from localStorage for fallback
      const savedUser = loadUserFromStorage();
      
      // Load saved API key from localStorage
      const savedApiKey = getOpenAIKeyFromStorage();
      
      // Check authentication status with backend
      console.log("🔄 Checking authentication status with backend...");
      const { authenticated, user: serverUser, errorType } = await checkAuth();
      
      // Update last check timestamp
      setLastAuthCheck(Date.now());
      
      if (authenticated && serverUser) {
        // Successfully authenticated with backend
        console.log("✅ Authentication verified: user is authenticated with googleId:", serverUser.googleId);
        
        // Update auth state
        setIsAuthenticated(true);
        setUser(serverUser);
        setError(null);
        
        // Save to localStorage for persistence
        saveUserToStorage(serverUser);
        
        // If we were redirected from Google auth, show success toast
        if (isPostRedirect) {
          toast({
            title: "Authentication Successful",
            description: `Welcome, ${serverUser.name || 'User'}!`,
          });
          
          // Clean up URL now that we've processed the redirect
          cleanupAuthRedirect();
        }
        
        // If we have a saved API key, restore it immediately for better UX
        if (savedApiKey) {
          setOpenaiKey(savedApiKey);
          setHasCompletedOnboarding(true);
          console.log("✅ Restored OpenAI API key from localStorage:", savedApiKey.substring(0, 5) + "...");
        }
        
        // Fetch fresh OpenAI API key
        await fetchOpenAIKey(serverUser.googleId);
      } 
      else if (savedUser && !isPostRedirect && !isInitialLoad) {
        // Server authentication failed but we have saved user data and aren't in the middle of authentication
        // This is a fallback that allows offline use
        console.log("⚠️ Using saved user data from localStorage with googleId:", savedUser.googleId);
        setUser(savedUser);
        setIsAuthenticated(true);
        
        // If we have a saved API key, restore it
        if (savedApiKey) {
          setOpenaiKey(savedApiKey);
          setHasCompletedOnboarding(true);
          console.log("✅ Restored OpenAI API key from localStorage:", savedApiKey.substring(0, 5) + "...");
        }
      } 
      else {
        // Not authenticated
        console.error("❌ Authentication failed:", errorType || "AUTH_FAILED");
        
        // IMPORTANT FIX: Don't immediately reset user if this is a post-redirect - could be timing issue
        if (isPostRedirect) {
          console.log("⚠️ Auth failed after redirect, waiting for next check...");
          // Don't clear user/auth state yet if we're in post-redirect state
          // This gives time for cookies to be properly recognized
          
          // Clean up URL despite failure
          cleanupAuthRedirect();
          
          // Schedule another auth check after a brief delay
          setTimeout(() => {
            console.log("🔄 Retrying auth verification after redirect...");
            verifyAuthentication(false);
          }, 1500);
        } else {
          // Regular auth failure - not during redirect process
          setUser(null);
          setIsAuthenticated(false);
          setError(errorType || "AUTH_FAILED");
        }
      }
    } catch (err) {
      console.error("❌ Unexpected authentication verification error:", err);
      setUser(null);
      setIsAuthenticated(false);
      setError("UNEXPECTED_ERROR");
      
      toast({
        title: "Authentication Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Effect for initial authentication check
  useEffect(() => {
    const checkInitialAuth = async () => {
      await verifyAuthentication(true);
    };

    checkInitialAuth();
  }, []);
  
  // Additional effect to detect post-auth redirects
  useEffect(() => {
    // If we detect a post-auth redirect and haven't attempted auth yet, verify immediately
    if (isPostAuthRedirect() && !authAttempted && !isLoading) {
      console.log("🔄 Detected post-auth redirect, triggering immediate auth verification");
      verifyAuthentication();
    }
  }, [authAttempted, isLoading]);

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
