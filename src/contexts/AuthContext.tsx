
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
        const { authenticated, user } = await checkAuth();
        
        setIsAuthenticated(authenticated);
        if (authenticated && user) {
          setUser(user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setError("Failed to verify authentication status.");
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
