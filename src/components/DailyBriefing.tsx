
import { useState } from "react";
import { CalendarEvent } from "@/types";
import { fetchTodayEvents } from "@/api/calendar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DailyBriefingProps {
  onClose: () => void;
}

const DailyBriefing = ({ onClose }: DailyBriefingProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadTodayEvents = async () => {
    if (!user?.googleId) return;
    
    setIsLoading(true);
    try {
      const todayEvents = await fetchTodayEvents(user.googleId);
      setEvents(todayEvents);
      
      toast({
        title: "Daily Briefing Ready",
        description: `Found ${todayEvents.length} events for today`,
      });
    } catch (error) {
      console.error("Failed to load today's events:", error);
      toast({
        title: "Briefing Error",
        description: "Unable to retrieve today's schedule",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Group events by hour
  const groupEventsByHour = (events: CalendarEvent[]) => {
    const grouped: { [hour: string]: CalendarEvent[] } = {};
    
    events.forEach(event => {
      // Fix: Extract dateTime from the start object
      const startDateTime = event.start?.dateTime || event.start;
      const startTime = new Date(startDateTime);
      const hour = startTime.getHours();
      const hourKey = hour.toString().padStart(2, '0') + ':00';
      
      if (!grouped[hourKey]) {
        grouped[hourKey] = [];
      }
      grouped[hourKey].push(event);
    });
    
    return grouped;
  };

  const groupedEvents = groupEventsByHour(events);
  const hours = Object.keys(groupedEvents).sort();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="bg-gray-900 border-gray-700 text-white w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-medium">Daily Briefing</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {!events.length && !isLoading && (
            <div className="text-center py-8">
              <button
                onClick={loadTodayEvents}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Load Today's Schedule
              </button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-400 mt-2">Retrieving your schedule...</p>
            </div>
          )}

          {events.length > 0 && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm mb-4">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>

              {hours.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No events scheduled for today, Sir.
                </div>
              ) : (
                hours.map(hour => (
                  <div key={hour} className="border-l-2 border-gray-700 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300 font-mono text-sm">{hour}</span>
                    </div>
                    <div className="space-y-2 ml-6">
                      {groupedEvents[hour].map((event, index) => (
                        <div 
                          key={index}
                          className="bg-gray-800 border border-gray-600 rounded-lg p-3 hover:bg-gray-750 transition-colors"
                        >
                          <h4 className="font-medium text-white mb-1">
                            {event.summary || event.title}
                          </h4>
                          {event.location && (
                            <div className="flex items-center gap-1 text-gray-400 text-sm">
                              <MapPin className="w-3 h-3" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.description && (
                            <p className="text-gray-400 text-sm mt-1">
                              {event.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DailyBriefing;
