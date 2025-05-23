
import { CalendarEvent } from "@/types";

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

// New functions to handle Google Calendar authentication
export const connectGoogleCalendar = () => {
  // Generate a random state value for CSRF protection
  const state = Math.random().toString(36).substring(2, 15);
  
  // Store state in localStorage for validation on callback
  localStorage.setItem('googleOAuthState', state);
  
  // Redirect to the backend's OAuth endpoint
  const redirectUrl = `${API_BASE_URL}/api/calendar/connect?state=${state}`;
  window.location.href = redirectUrl;
};

export const checkGoogleCalendarAuth = async (apiKey: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/calendar/check-auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ apiKey }),
      credentials: 'include',
    });

    if (!response.ok) {
      return false;
    }

    const { authenticated } = await response.json();
    return !!authenticated;
  } catch (error) {
    console.error("❌ Error checking calendar auth:", error);
    return false;
  }
};

export const parseCalendarCommand = (text: string): { 
  isCalendarCommand: boolean;
  type: 'query' | 'create' | 'reminder' | null;
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
  
  // Check if this is a reminder request
  if (
    (lowerText.includes("remind") || lowerText.includes("reminder") || lowerText.includes("set a reminder")) &&
    (lowerText.includes("to") || lowerText.includes("for"))
  ) {
    return {
      isCalendarCommand: true,
      type: 'reminder'
    };
  }
  
  // Check if this is a calendar event creation command
  if (
    (lowerText.includes("add") || lowerText.includes("create") || lowerText.includes("schedule")) &&
    (lowerText.includes("event") || lowerText.includes("meeting") || lowerText.includes("appointment")) &&
    (lowerText.includes("calendar") || lowerText.includes("schedule"))
  ) {
    return { 
      isCalendarCommand: true, 
      type: 'create'
    };
  }
  
  return { isCalendarCommand: false, type: null };
};

// New function to parse reminder text into structured data
export const parseReminderText = (text: string): {
  success: boolean;
  task?: string;
  dateTime?: Date;
  error?: string;
} => {
  try {
    const lowerText = text.toLowerCase();
    
    // Try to extract task content
    let task: string | undefined;
    
    // Common patterns for reminder requests
    const reminderPatterns = [
      // "remind me to X at/on Y"
      /remind\s+(?:me\s+)?to\s+(.*?)(?:\s+(?:at|on|by|tomorrow|today|next|this)\s+.*|$)/i,
      // "set a reminder to X at/on Y"
      /set\s+(?:a\s+)?reminder\s+(?:for\s+|to\s+)?(.*?)(?:\s+(?:at|on|by|tomorrow|today|next|this)\s+.*|$)/i,
      // "add a reminder for X at/on Y"
      /add\s+(?:a\s+)?reminder\s+(?:for\s+|to\s+)?(.*?)(?:\s+(?:at|on|by|tomorrow|today|next|this)\s+.*|$)/i,
    ];
    
    for (const pattern of reminderPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        task = match[1].trim();
        if (task.endsWith('.')) task = task.slice(0, -1);
        break;
      }
    }
    
    if (!task) {
      return {
        success: false,
        error: "Couldn't understand what you want to be reminded about."
      };
    }
    
    // Try to extract date/time information
    let dateTime: Date | undefined;
    const now = new Date();
    
    // Extract time patterns
    const timePatterns = [
      // "at X am/pm"
      { regex: /at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?/i, handler: (match: RegExpMatchArray) => {
        let hours = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const ampm = match[3]?.toLowerCase();
        
        if (ampm === 'pm' && hours < 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
        
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
      }},
      // "at noon/midnight"
      { regex: /at\s+(noon|midnight)/i, handler: (match: RegExpMatchArray) => {
        const time = match[1].toLowerCase();
        const date = new Date();
        if (time === 'noon') date.setHours(12, 0, 0, 0);
        else date.setHours(0, 0, 0, 0);
        return date;
      }},
      // "tomorrow at X"
      { regex: /tomorrow\s+at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?/i, handler: (match: RegExpMatchArray) => {
        let hours = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const ampm = match[3]?.toLowerCase();
        
        if (ampm === 'pm' && hours < 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
        
        const date = new Date();
        date.setDate(date.getDate() + 1);
        date.setHours(hours, minutes, 0, 0);
        return date;
      }},
      // "today at X"
      { regex: /today\s+at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?/i, handler: (match: RegExpMatchArray) => {
        let hours = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const ampm = match[3]?.toLowerCase();
        
        if (ampm === 'pm' && hours < 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
        
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
      }},
      // "on Friday at X"
      { regex: /on\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?/i, handler: (match: RegExpMatchArray) => {
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
          .indexOf(match[1].toLowerCase());
        
        let hours = parseInt(match[2]);
        const minutes = match[3] ? parseInt(match[3]) : 0;
        const ampm = match[4]?.toLowerCase();
        
        if (ampm === 'pm' && hours < 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
        
        const date = new Date();
        const currentDay = date.getDay();
        const daysToAdd = (7 + dayOfWeek - currentDay) % 7 || 7; // If today, jump to next week
        
        date.setDate(date.getDate() + daysToAdd);
        date.setHours(hours, minutes, 0, 0);
        return date;
      }},
      // Simple pattern for just times like "3pm"
      { regex: /\b(\d{1,2})\s*(am|pm)\b/i, handler: (match: RegExpMatchArray) => {
        let hours = parseInt(match[1]);
        const ampm = match[2].toLowerCase();
        
        if (ampm === 'pm' && hours < 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
        
        const date = new Date();
        date.setHours(hours, 0, 0, 0);
        return date;
      }}
    ];
    
    for (const pattern of timePatterns) {
      const match = text.match(pattern.regex);
      if (match) {
        dateTime = pattern.handler(match);
        break;
      }
    }
    
    // If no specific time pattern matched, check for general date references
    if (!dateTime) {
      if (lowerText.includes('tomorrow')) {
        dateTime = new Date();
        dateTime.setDate(dateTime.getDate() + 1);
        dateTime.setHours(9, 0, 0, 0); // Default to 9am for tomorrow
      } else if (lowerText.includes('next week')) {
        dateTime = new Date();
        dateTime.setDate(dateTime.getDate() + 7);
        dateTime.setHours(9, 0, 0, 0); // Default to 9am
      } else if (lowerText.includes('next month')) {
        dateTime = new Date();
        dateTime.setMonth(dateTime.getMonth() + 1);
        dateTime.setHours(9, 0, 0, 0); // Default to 9am
      }
    }
    
    if (!dateTime) {
      return {
        success: false,
        task,
        error: "Couldn't understand when you want to be reminded."
      };
    }
    
    // If the time is in the past, assume it's for tomorrow
    if (dateTime < now) {
      // Only adjust if it seems like it was intended for today
      const hourDifference = (now.getTime() - dateTime.getTime()) / (1000 * 60 * 60);
      if (hourDifference < 24) {
        dateTime.setDate(dateTime.getDate() + 1);
      }
    }
    
    return {
      success: true,
      task,
      dateTime
    };
  } catch (error) {
    console.error("Error parsing reminder text:", error);
    return {
      success: false,
      error: "I couldn't parse your reminder request. Please try again with a specific time."
    };
  }
};

// Helper function to format dates for calendar API
export const formatDateForCalendar = (date: Date): string => {
  return date.toISOString();
};

// Helper function to create a formatted reminder event
export const createReminderEvent = async (
  googleId: string,
  task: string,
  dateTime: Date
): Promise<CalendarEvent> => {
  const start = formatDateForCalendar(dateTime);
  
  // For reminders, end time is the same as start time
  const end = start;
  
  // Create the event
  return createCalendarEvent(
    googleId,
    task, // Summary is the task itself
    "Auto-added by Lumen reminder", // Description
    start,
    end
  );
};
