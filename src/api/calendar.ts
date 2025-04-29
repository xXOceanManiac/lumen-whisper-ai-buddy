
import { CalendarEvent } from "@/types";

const API_BASE_URL = "https://lumen-backend-30ab.onrender.com";

export const createCalendarEvent = async (
  event: CalendarEvent,
  apiKey: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/calendar/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event,
        apiKey,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        throw new Error("Authentication error: Please reconnect your Google Calendar.");
      }
      
      throw new Error(errorData.message || "Failed to create calendar event");
    }

    return true;
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return false;
  }
};

export const connectGoogleCalendar = () => {
  // Add a random state parameter to prevent CSRF attacks and ensure we get a fresh OAuth flow
  const state = Math.random().toString(36).substring(2);
  
  // Store state in localStorage for verification when returning from OAuth
  localStorage.setItem("googleOAuthState", state);
  
  // Redirect to Google OAuth endpoint with state parameter
  window.location.href = `${API_BASE_URL}/auth/google?state=${state}`;
};

export const checkGoogleCalendarAuth = async (apiKey: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/calendar/check-auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey,
      }),
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.authenticated === true;
  } catch (error) {
    console.error("Error checking calendar auth:", error);
    return false;
  }
}
