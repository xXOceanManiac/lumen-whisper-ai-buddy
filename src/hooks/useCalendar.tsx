
import { useState, useEffect, useCallback } from "react";
import { CalendarEvent } from "@/types";
import { fetchCalendarEvents, createCalendarEvent } from "@/api/calendar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "./use-toast";

export const useCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const refreshEvents = useCallback(async () => {
    if (!user?.googleId) {
      setError("User not authenticated or missing Google ID");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const calendarEvents = await fetchCalendarEvents(user.googleId);
      setEvents(calendarEvents);
    } catch (err) {
      console.error("Failed to fetch calendar events:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch calendar events");
      toast({
        title: "Calendar Error",
        description: "Failed to fetch your calendar events",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.googleId, toast]);
  
  const addEvent = useCallback(async (
    summary: string,
    description: string = "",
    start: string,
    end: string
  ) => {
    if (!user?.googleId) {
      setError("User not authenticated or missing Google ID");
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newEvent = await createCalendarEvent(
        user.googleId,
        summary,
        description,
        start,
        end
      );
      
      // Update events list with new event
      setEvents(prev => [newEvent, ...prev]);
      
      toast({
        title: "Event Created",
        description: `"${summary}" added to your calendar`,
      });
      
      return newEvent;
    } catch (err) {
      console.error("Failed to create calendar event:", err);
      setError(err instanceof Error ? err.message : "Failed to create calendar event");
      toast({
        title: "Calendar Error",
        description: "Failed to create calendar event",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.googleId, toast]);
  
  // Load events when component mounts
  useEffect(() => {
    if (user?.googleId) {
      refreshEvents();
    }
  }, [user?.googleId, refreshEvents]);
  
  return {
    events,
    isLoading,
    error,
    refreshEvents,
    addEvent,
  };
};
