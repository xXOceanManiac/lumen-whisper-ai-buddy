
import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { checkAuth } from "@/api/auth";

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
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  isLoading: true,
  error: null
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Check if we just got redirected from successful Google login
        const urlParams = new URLSearchParams(window.location.search);
        const googleSuccess = urlParams.get('google') === 'success';
        
        // If we just got redirected from successful Google login, clear the URL parameter
        if (googleSuccess) {
          // Clean up URL without refreshing the page
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        // Check authentication status
        const { authenticated, user } = await checkAuth();
        
        setIsAuthenticated(authenticated);
        if (authenticated && user) {
          setUser(user);
          setError(null);
        } else {
          setUser(null);
          // More specific error for failed authentication
          setError("AUTH_FAILED");
        }
      } catch (err) {
        // More specific error for network or server issues
        setError("SERVER_ERROR");
        console.error("Auth verification error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};
