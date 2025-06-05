
import { CalendarEvent, Message } from "@/types";
import { Calendar } from "lucide-react";

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble = ({ message }: ChatBubbleProps) => {
  const isUser = message.role === 'user';
  const bubbleClass = isUser ? 'bubble-user' : 'bubble-assistant';
  
  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for calendar display (clean, readable format)
  const formatEventTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString([], { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  // Clean event summary for voice-friendly display
  const getEventSummary = (event: CalendarEvent) => {
    const title = event.summary || event.title || "Event";
    const time = formatEventTime(event.start.dateTime);
    const isReminder = event.description?.includes("Auto-added by Lumen reminder");
    
    if (isReminder) {
      return `Reminder: ${title} • ${time}`;
    }
    return `${title} • ${time}`;
  };

  return (
    <div className={`${bubbleClass} animate-fade-in`}>
      <div className="text-sm">{message.content}</div>
      
      {message.calendarEvent && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400 mb-2">
            <Calendar size={16} />
            <span>Added to Calendar</span>
          </div>
          <div className="text-sm">
            <div className="font-semibold text-gray-900 dark:text-white mb-1">
              {getEventSummary(message.calendarEvent)}
            </div>
            {message.calendarEvent.location && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                📍 {message.calendarEvent.location}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-1 text-right">
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
};

export default ChatBubble;
