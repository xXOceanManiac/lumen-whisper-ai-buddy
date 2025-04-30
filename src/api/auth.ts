
// Authentication API utilities

interface User {
  googleId: string;
  name?: string;
  email?: string;
  picture?: string;
}

const API_BASE_URL = "https://lumen-backend-main.onrender.com";

export async function checkAuth(): Promise<{ authenticated: boolean; user?: User; statusCode?: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/whoami`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return { authenticated: true, user: data.user, statusCode: response.status };
    }
    
    return { authenticated: false, statusCode: response.status };
  } catch (error) {
    console.error("Authentication check failed:", error);
    return { authenticated: false };
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
