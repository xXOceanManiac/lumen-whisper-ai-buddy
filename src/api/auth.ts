
// Authentication API utilities

interface User {
  googleId: string;
  name?: string;
  email?: string;
  picture?: string;
}

const API_BASE_URL = "https://lumen-backend-main.onrender.com";

export async function checkAuth(): Promise<{ authenticated: boolean; user?: User; statusCode?: number; errorType?: string }> {
  try {
    console.log("Checking authentication status...");
    const response = await fetch(`${API_BASE_URL}/auth/whoami`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    console.log("Auth check response status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("Authentication successful, user data received");
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
      credentials: 'include',
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

export const googleLoginUrl = `${API_BASE_URL}/auth/google`;

export function logout(): void {
  // Redirect to logout endpoint or clear local state
  window.location.href = `${API_BASE_URL}/auth/logout`;
}
