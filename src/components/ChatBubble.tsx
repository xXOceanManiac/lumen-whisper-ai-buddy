
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

  // Format date for calendar display
  const formatEventTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`${bubbleClass} animate-fade-in`}>
      <div className="text-sm">{message.content}</div>
      
      {message.calendarEvent && (
        <div className="mt-2 p-2 bg-primary/10 rounded-md border border-primary/30">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Calendar size={16} />
            <span>{message.calendarEvent.description?.includes("Auto-added by Lumen reminder") ? "Reminder Added" : "Calendar Event Added"}</span>
          </div>
          <div className="mt-1 text-sm">
            <div><strong>{message.calendarEvent.summary || message.calendarEvent.title}</strong></div>
            <div className="text-xs mt-1 text-gray-500">
              {formatEventTime(message.calendarEvent.start.dateTime)} {
                message.calendarEvent.description?.includes("Auto-added by Lumen reminder") 
                ? "" 
                : `- ${formatEventTime(message.calendarEvent.end.dateTime)}`
              }
            </div>
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
