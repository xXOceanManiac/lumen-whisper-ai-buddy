
import React from 'react';
import { CalendarEvent } from '@/types';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Loader2, Calendar } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { useCalendar } from '@/hooks/useCalendar';

const CalendarEventsList: React.FC = () => {
  const { events, isLoading, error, refreshEvents } = useCalendar();
  
  const formatEventTime = (event: CalendarEvent) => {
    try {
      const start = parseISO(event.start.dateTime);
      const end = parseISO(event.end.dateTime);
      
      const startDate = format(start, 'MMM d, yyyy');
      const endDate = format(end, 'MMM d, yyyy');
      
      const startTime = format(start, 'h:mm a');
      const endTime = format(end, 'h:mm a');
      
      if (startDate === endDate) {
        return `${startDate} · ${startTime} - ${endTime}`;
      } else {
        return `${startDate} ${startTime} - ${endDate} ${endTime}`;
      }
    } catch (err) {
      console.error("Error formatting event time:", err);
      return "Invalid date";
    }
  };
  
  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">Upcoming Events</CardTitle>
          <CardDescription>Your scheduled Google Calendar events</CardDescription>
        </div>
        <button
          onClick={() => refreshEvents()}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Refresh calendar events"
        >
          <Calendar className="h-5 w-5" />
        </button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px] pr-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading your calendar...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full py-8">
              <p className="text-center text-red-500 mb-2">{error}</p>
              <button 
                className="text-sm text-primary hover:underline" 
                onClick={() => refreshEvents()}
              >
                Try again
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8">
              <p className="text-center text-gray-500 dark:text-gray-400">
                No upcoming events found
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <Card key={event.id} className="overflow-hidden border">
                  <div className="px-4 py-3">
                    <h3 className="font-medium text-sm mb-1">{event.summary}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatEventTime(event)}
                    </p>
                    {event.description && (
                      <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-0 text-xs text-gray-500">
        {events.length > 0 && `Showing ${events.length} event${events.length === 1 ? '' : 's'}`}
      </CardFooter>
    </Card>
  );
};

export default CalendarEventsList;
