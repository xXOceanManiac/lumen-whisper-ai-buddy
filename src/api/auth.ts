// Authentication API utilities
import { supabase } from "@/integrations/supabase/client";

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
    
    // Try fetching from Supabase first
    const { data: supabaseData, error: supabaseError } = await supabase
      .from('openai_keys')
      .select('key_content')
      .eq('google_id', googleId)
      .maybeSingle();
    
    if (supabaseError) {
      console.error(`❌ Supabase error fetching OpenAI key: ${supabaseError.message}`);
    }
    
    if (supabaseData?.key_content) {
      const key = supabaseData.key_content.trim();
      
      // Validate key format
      if (!key.startsWith('sk-') || key.length < 48) {
        console.error(`❌ Invalid API key format retrieved from Supabase: ${key.substring(0, 5)}...`);
        return null;
      }
      
      console.log(`✅ Successfully retrieved OpenAI key from Supabase (${key.length} chars)`);
      console.log(`Key format: ${key.substring(0, 5)}...${key.slice(-4)}`);
      return key;
    }
    
    // If not in Supabase, fall back to backend API
    console.log(`⚠️ Key not found in Supabase, trying backend API`);
    
    const response = await fetch(`${API_BASE_URL}/api/get-openai-key?googleId=${encodeURIComponent(googleId)}`, {
      method: 'GET',
      credentials: 'include', // Required to include session cookie
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.apiKey) {
        const key = data.apiKey.trim();
        
        // Validate key format
        if (!key.startsWith('sk-') || key.length < 48) {
          console.error(`❌ Invalid API key format retrieved from API: ${key.substring(0, 5)}...`);
          return null;
        }
        
        console.log(`✅ Successfully retrieved OpenAI key from API (${key.length} chars)`);
        console.log(`Key format: ${key.substring(0, 5)}...${key.slice(-4)}`);
        
        // Store the key in Supabase for future use
        try {
          // Generate a simple IV for encryption purposes
          const iv = generateSimpleIV();
          
          const { error } = await supabase
            .from('openai_keys')
            .upsert({ 
              google_id: googleId, 
              key_content: key,
              iv: iv
            });
          
          if (error) {
            console.error(`❌ Failed to save key to Supabase: ${error.message}`);
          } else {
            console.log(`✅ Successfully saved key to Supabase`);
          }
        } catch (err) {
          console.error(`❌ Error saving key to Supabase: ${err}`);
        }
        
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

// Helper function to validate OpenAI API key format
export const validateOpenAIKey = (key: string): boolean => {
  const trimmedKey = key ? key.trim() : '';
  
  if (!trimmedKey) return false;
  
  // OpenAI keys must start with "sk-" and be at least 48 characters long
  if (!trimmedKey.startsWith('sk-') || trimmedKey.length < 48) {
    return false;
  }
  
  return true;
};

export async function saveOpenAIKey(googleId: string, apiKey: string): Promise<boolean> {
  try {
    console.log(`🔄 Saving OpenAI key for googleId: ${googleId.substring(0, 5)}...`);
    
    // Validate and trim the API key
    const trimmedKey = apiKey.trim();
    if (!validateOpenAIKey(trimmedKey)) {
      console.error("❌ Invalid API key format. Key must start with 'sk-' and be at least 48 characters long.");
      return false;
    }
    
    console.log(`Key format valid: starts with "sk-" = true, length = ${trimmedKey.length}`);
    
    // Generate a simple IV for encryption purposes
    const iv = generateSimpleIV();
    
    // Save to Supabase
    try {
      const { error } = await supabase
        .from('openai_keys')
        .upsert({ 
          google_id: googleId, 
          key_content: trimmedKey,
          iv: iv
        });
      
      if (error) {
        console.error(`❌ Failed to save key to Supabase: ${error.message}`);
      } else {
        console.log(`✅ Successfully saved key to Supabase`);
      }
    } catch (err) {
      console.error(`❌ Error saving key to Supabase: ${err}`);
    }
    
    // Also save to backend API as backup
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
      // We still return true if Supabase save was successful
      return true;
    }
  } catch (error) {
    console.error("❌ Error saving OpenAI API key:", error);
    // Return true to allow for local storage fallback
    return true;
  }
}

// Helper function to generate a simple IV for encryption purposes
function generateSimpleIV(): string {
  // Generate a random string to use as IV
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const length = 16; // Standard IV length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
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
