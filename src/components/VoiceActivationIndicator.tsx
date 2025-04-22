
import React, { useEffect, useState } from 'react';

interface VoiceActivationIndicatorProps {
  isActive: boolean;
}

const VoiceActivationIndicator = ({ isActive }: VoiceActivationIndicatorProps) => {
  const [displayStatus, setDisplayStatus] = useState(false);
  
  useEffect(() => {
    if (isActive) {
      setDisplayStatus(true);
      const timer = setTimeout(() => {
        setDisplayStatus(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isActive]);
  
  if (!displayStatus) return null;
  
  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-lumen-blue text-white px-4 py-2 rounded-full text-sm animate-fade-in shadow-lg z-50">
      <div className="flex items-center space-x-2">
        <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
        <span>Lumen is listening...</span>
      </div>
    </div>
  );
};

export default VoiceActivationIndicator;
