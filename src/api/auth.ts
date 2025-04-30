
// Authentication API utilities

interface User {
  googleId: string;
  name?: string;
  email?: string;
  picture?: string;
}

const API_BASE_URL = "https://lumen-backend-main.fly.dev";

export async function checkAuth(): Promise<{ authenticated: boolean; user?: User; statusCode?: number; errorType?: string }> {
  try {
    console.log("Checking authentication status...");
    
    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_BASE_URL}/auth/whoami`, {
      method: 'GET',
      credentials: 'include', // Required to include session cookie
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log("Auth check response status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Logged in as", data.user);
      return { authenticated: true, user: data.user, statusCode: response.status };
    }
    
    // Return specific error type based on status code
    let errorType = "AUTH_FAILED";
    if (response.status >= 500) {
      errorType = "SERVER_ERROR";
    } else if (response.status === 401 || response.status === 403) {
      errorType = "UNAUTHORIZED";
    }
    
    console.log(`Authentication failed with status ${response.status}, error type: ${errorType}`);
    return { authenticated: false, statusCode: response.status, errorType };
  } catch (error) {
    console.error("Authentication check network error:", error);
    return { authenticated: false, errorType: "NETWORK_ERROR" };
  }
}

export async function getOpenAIKey(googleId: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/get-openai-key?googleId=${googleId}`, {
      method: 'GET',
      credentials: 'include', // Required to include session cookie
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.apiKey;
    }
    
    return null;
  } catch (error) {
    console.error("Failed to fetch OpenAI API key:", error);
    return null;
  }
}

export async function saveOpenAIKey(googleId: string, apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/save-openai-key`, {
      method: 'POST',
      credentials: 'include', // Required to include session cookie
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ googleId, openaiApiKey: apiKey })
    });
    
    return response.ok;
  } catch (error) {
    console.error("Failed to save OpenAI API key:", error);
    return false;
  }
}

export const googleLoginUrl = `${API_BASE_URL}/auth/google`;

export async function logout(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'GET',
      credentials: 'include' // Required to include session cookie
    });
    
    return response.ok;
  } catch (error) {
    console.error("Logout error:", error);
    return false;
  }
}
