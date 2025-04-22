
import { Message } from "@/types";

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

  return (
    <div className={`${bubbleClass} animate-fade-in`}>
      <div className="text-sm">{message.content}</div>
      <div className="text-xs text-gray-500 mt-1 text-right">
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
};

export default ChatBubble;
