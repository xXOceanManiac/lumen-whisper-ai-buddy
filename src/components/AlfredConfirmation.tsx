
import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

interface AlfredConfirmationProps {
  message: string;
  onDismiss: () => void;
}

const AlfredConfirmation = ({ message, onDismiss }: AlfredConfirmationProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Allow fade out animation
    }, 4000); // Show for 4 seconds

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    }`}>
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-white text-sm font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default AlfredConfirmation;
