
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
      throw new Error("Failed to create calendar event");
    }

    return true;
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return false;
  }
};

export const connectGoogleCalendar = () => {
  window.location.href = `${API_BASE_URL}/auth/google`;
};
