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
    console.log(`🔄 Fetching OpenAI key for googleId: ${googleId}`);
    
    const response = await fetch(`${API_BASE_URL}/api/get-openai-key?googleId=${googleId}`, {
      method: 'GET',
      credentials: 'include', // Required to include session cookie
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.apiKey) {
        console.log(`✅ Successfully retrieved OpenAI key: ${data.apiKey.slice(0, 5)}...`);
        console.log(`Key length: ${data.apiKey.length}`);
        return data.apiKey;
      } else {
        console.log("❌ API key not found in response data");
        return null;
      }
    } else {
      const errorText = await response.text();
      console.error(`❌ Failed to get OpenAI key: ${response.status}. Error: ${errorText || 'No error message'}`);
      return null;
    }
  } catch (error) {
    console.error("❌ Error fetching OpenAI API key:", error);
    return null;
  }
}

export async function saveOpenAIKey(googleId: string, apiKey: string): Promise<boolean> {
  try {
    console.log(`🔄 Saving OpenAI key for googleId: ${googleId.substring(0, 5)}...`);
    console.log(`Key format check: starts with "sk-" = ${apiKey.startsWith('sk-')}, length = ${apiKey.length}`);
    
    // Validate the API key format before sending
    if (!apiKey.startsWith('sk-') || apiKey.length < 30) {
      console.error("❌ Invalid API key format:", apiKey.slice(0, 5) + "...");
      return false;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/save-openai-key`, {
      method: 'POST',
      credentials: 'include', // Required to include session cookie
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ googleId, openaiApiKey: apiKey })
    });
    
    console.log("Save key response status:", response.status);
    
    if (response.ok) {
      const responseData = await response.json();
      console.log("✅ Successfully saved OpenAI key. Server response:", responseData);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`❌ Failed to save OpenAI key: ${response.status}. Error: ${errorText}`);
      
      // Even if the backend fails, we'll return true to allow for local storage fallback
      // This is a UX decision to prevent blocking the user if backend is unreachable
      return true;
    }
  } catch (error) {
    console.error("❌ Error saving OpenAI API key:", error);
    // Return true to allow for local storage fallback
    return true;
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
