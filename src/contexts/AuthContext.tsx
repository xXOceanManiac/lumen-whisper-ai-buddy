
import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { checkAuth } from "@/api/auth";
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
  isLoading: boolean;
  error: string | null;
  lastAuthCheck: number | null;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  isLoading: true,
  error: null,
  lastAuthCheck: null
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAuthCheck, setLastAuthCheck] = useState<number | null>(null);
  const { toast } = useToast();

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
        } else {
          setUser(null);
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
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, error, lastAuthCheck }}>
      {children}
    </AuthContext.Provider>
  );
};
