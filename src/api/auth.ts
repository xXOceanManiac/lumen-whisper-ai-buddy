// Authentication API utilities
import { supabase } from "@/integrations/supabase/client";

interface User {
  googleId: string;
  name?: string;
  email?: string;
  picture?: string;
}

const API_BASE_URL = "https://lumen-backend-main.fly.dev";

// Helper function to validate OpenAI API key format
export const validateOpenAIKey = (key: string): boolean => {
  const trimmedKey = key ? key.trim() : '';
  
  if (!trimmedKey) return false;
  
  // OpenAI keys must start with "sk-" (including newer sk-proj-* keys) and be at least 48 characters long
  // SK-Proj keys can be 164+ characters
  if (!trimmedKey.startsWith('sk-') || trimmedKey.length < 48) {
    return false;
  }
  
  return true;
};

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
    
    // Call backend API to get the OpenAI key - No more Supabase direct call or client-side decryption
    const response = await fetch(`${API_BASE_URL}/api/get-openai-key?googleId=${encodeURIComponent(googleId)}`, {
      method: 'GET',
      credentials: 'include', // Required to include session cookie
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.apiKey) {
        const key = data.apiKey.trim();
        
        // Validate key format
        if (!validateOpenAIKey(key)) {
          console.error(`❌ Invalid API key format retrieved from API`);
          return null;
        }
        
        console.log(`✅ Successfully retrieved OpenAI key from API (${key.length} chars)`);
        console.log(`Key format: ${key.substring(0, 7)}...`);
        
        return key;
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
    
    // Validate and trim the API key
    const trimmedKey = apiKey.trim();
    if (!validateOpenAIKey(trimmedKey)) {
      console.error("❌ Invalid API key format. Key must start with 'sk-' and be at least 48 characters long.");
      return false;
    }
    
    console.log(`Key format valid: starts with "${trimmedKey.substring(0, 7)}" and length = ${trimmedKey.length}`);
    
    // Save to backend API which will handle encryption and storage
    const response = await fetch(`${API_BASE_URL}/api/save-openai-key`, {
      method: 'POST',
      credentials: 'include', // Required to include session cookie
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ googleId, openaiApiKey: trimmedKey })
    });
    
    console.log("Save key response status:", response.status);
    
    if (response.ok) {
      const responseData = await response.json();
      console.log("✅ Successfully saved OpenAI key. Server response:", responseData);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`❌ Failed to save OpenAI key to API: ${response.status}. Error: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Error saving OpenAI API key:", error);
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
