
import { CalendarEvent } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = "https://lumen-backend-main.fly.dev";

export const fetchCalendarEvents = async (googleId: string): Promise<CalendarEvent[]> => {
  try {
    console.log("🔄 Fetching calendar events for googleId:", googleId);
    
    const response = await fetch(`${API_BASE_URL}/api/calendar/events?googleId=${encodeURIComponent(googleId)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include', // Required for session cookies
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch calendar events");
    }

    const { events } = await response.json();
    console.log(`✅ Fetched ${events.length} calendar events`);
    return events;
  } catch (error) {
    console.error("❌ Error fetching calendar events:", error);
    throw error;
  }
};

export const createCalendarEvent = async (
  googleId: string,
  summary: string,
  description: string,
  start: string,
  end: string
): Promise<CalendarEvent> => {
  try {
    console.log("🔄 Creating calendar event:", { summary, start, end });
    
    const response = await fetch(`${API_BASE_URL}/api/calendar/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        googleId,
        summary,
        description,
        start,
        end,
      }),
      credentials: 'include', // Required for session cookies
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to create calendar event");
    }

    const event = await response.json();
    console.log("✅ Calendar event created:", event);
    return event;
  } catch (error) {
    console.error("❌ Error creating calendar event:", error);
    throw error;
  }
};

export const parseCalendarCommand = (text: string): { 
  isCalendarCommand: boolean;
  type: 'query' | 'create' | null;
  eventDetails?: {
    summary?: string;
    description?: string;
    start?: string;
    end?: string;
  }
} => {
  const lowerText = text.toLowerCase();
  
  // Check if this is a calendar query
  if (
    lowerText.includes("what's on my calendar") ||
    lowerText.includes("what is on my calendar") ||
    lowerText.includes("show my calendar") ||
    lowerText.includes("calendar events") ||
    lowerText.includes("upcoming events")
  ) {
    return { 
      isCalendarCommand: true, 
      type: 'query' 
    };
  }
  
  // Check if this is a calendar event creation command
  if (
    (lowerText.includes("add") || lowerText.includes("create") || lowerText.includes("schedule")) &&
    (lowerText.includes("event") || lowerText.includes("meeting") || lowerText.includes("appointment") || lowerText.includes("reminder")) &&
    (lowerText.includes("calendar") || lowerText.includes("schedule"))
  ) {
    // This is a basic implementation - in a production app, we would use a more sophisticated
    // natural language processing approach to extract event details
    
    // For now, we'll return that this is a calendar create command
    // The actual parsing will be handled by the LLM in the chat response
    return { 
      isCalendarCommand: true, 
      type: 'create',
      eventDetails: {
        // We'll let the backend/LLM extract these details
      }
    };
  }
  
  return { isCalendarCommand: false, type: null };
};
