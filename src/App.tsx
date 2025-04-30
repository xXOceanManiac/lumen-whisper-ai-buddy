
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginView from "./components/LoginView";
import ChatView from "./components/ChatView";
import OnboardingView from "./components/OnboardingView";
import LogoutView from "./components/LogoutView";
import { AnimatePresence } from "framer-motion";

const queryClient = new QueryClient();

const AuthenticatedApp = () => {
  const { isAuthenticated, user, isLoading, error, openaiKey, hasCompletedOnboarding } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-100 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Log authentication state to help with debugging
  console.log("Auth state:", { isAuthenticated, hasUser: !!user, error, hasCompletedOnboarding });

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/logout" element={<LogoutView />} />
        <Route
          path="/"
          element={
            isAuthenticated && user ? (
              hasCompletedOnboarding ? (
                <ChatView user={user} />
              ) : (
                <OnboardingView />
              )
            ) : (
              <LoginView />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AuthenticatedApp />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
