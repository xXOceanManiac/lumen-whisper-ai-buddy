
import { getRememberAuth } from "@/utils/localStorage";

// Google login URL for OAuth authentication
export const googleLoginUrl = '/api/auth/google/login';

// Function to log out the user
export const logout = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Logout failed:', response.status, response.statusText);
      return false;
    }
    
    // Clear any local storage related to authentication
    localStorage.removeItem('lumen-user-data');
    
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};

// Function to check authentication status
export const checkAuth = async () => {
  try {
    const rememberAuth = getRememberAuth();
    const response = await fetch('/api/check-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ remember: rememberAuth }),
    });

    if (!response.ok) {
      // If the response status is not in the 200-299 range, it's an error
      console.error('Authentication check failed:', response.status, response.statusText);
      
      // Attempt to parse the error message from the response body
      let errorType = "AUTH_FAILED"; // Default error type
      try {
        const errorData = await response.json();
        errorType = errorData.errorType || errorType; // Use specific error type from the backend if available
      } catch (parseError) {
        console.error('Failed to parse error message from response:', parseError);
        // If parsing fails, use the default error type
      }
      
      return { authenticated: false, user: null, errorType: errorType };
    }

    const data = await response.json();
    return { authenticated: data.authenticated, user: data.user, errorType: null };
  } catch (error) {
    console.error('Error checking authentication:', error);
    return { authenticated: false, user: null, errorType: "AUTH_FAILED" };
  }
};

// Function to save the OpenAI API key to the backend
export const saveOpenAIKey = async (googleId: string, openaiApiKey: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/save-openai-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ googleId, openaiApiKey }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to save OpenAI API key:", errorData.error || response.statusText);
      return false;
    }
    
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("Error saving OpenAI API key:", error);
    return false;
  }
};

// Function to get the OpenAI API key from the backend
export const getOpenAIKey = async (googleId: string): Promise<string | null> => {
  try {
    console.log(`🔑 Fetching OpenAI API key for user with googleId: ${googleId}`);
    const response = await fetch(`https://lumen-backend-main.fly.dev/api/get-openai-key?googleId=${googleId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Failed to get OpenAI API key:", errorData.error || response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    if (data.apiKey) {
      console.log("✅ Successfully retrieved OpenAI API key");
      return data.apiKey;
    } else {
      console.error("❌ No API key returned from server");
      return null;
    }
  } catch (error) {
    console.error("❌ Error fetching OpenAI API key:", error);
    return null;
  }
};

// Function to validate an OpenAI API key format
export const validateOpenAIKey = (key: string): boolean => {
  // Basic validation: should start with "sk-" and be at least 30 chars long
  return key && key.startsWith('sk-') && key.length >= 30;
};
