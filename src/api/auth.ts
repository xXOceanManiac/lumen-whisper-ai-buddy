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
      credentials: 'include',  // Ensure cookies are included in the request
    });

    if (!response.ok) {
      console.error('Logout failed:', response.status, response.statusText);
      return false;
    }

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
      credentials: 'include',  // Critical: Include cookies with the request
      body: JSON.stringify({ remember: rememberAuth }),
    });

    if (!response.ok) {
      console.error('Authentication check failed:', response.status, response.statusText);

      // Handle HTML responses (which indicate routing issues)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.error('Received HTML instead of JSON. API route may be misconfigured.');
        return { authenticated: false, user: null, errorType: "API_MISCONFIGURED" };
      }

      let errorType = "AUTH_FAILED";
      try {
        const errorData = await response.json();
        errorType = errorData.errorType || errorType;
      } catch (parseError) {
        console.error('Failed to parse error message from response:', parseError);
      }
      return { authenticated: false, user: null, errorType: errorType };
    }

    const data = await response.json();
    return { authenticated: data.authenticated, user: data.user, errorType: null };
  } catch (error) {
    console.error('Error checking authentication:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return { authenticated: false, user: null, errorType: "AUTH_FAILED" };
  }
};

// Function to save the OpenAI API key to the backend
export const saveOpenAIKey = async (googleId: string, openaiApiKey: string): Promise<boolean> => {
  try {
    const response = await fetch('https://lumen-backend-main.fly.dev/api/save-openai-key', {
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

    if (data.openaiApiKey) {
      console.log("✅ Successfully retrieved OpenAI API key");
      return data.openaiApiKey;
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
  return key && key.startsWith('sk-') && key.length >= 30;
};

// Add a function to check if the backend is responding properly
export const pingAuthEndpoint = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/ping', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.error('Auth endpoint ping failed:', response.status, response.statusText);
      return false;
    }
    
    const data = await response.json();
    console.log('Auth endpoint ping response:', data);
    return true;
  } catch (error) {
    console.error('Auth endpoint ping error:', error);
    return false;
  }
};
