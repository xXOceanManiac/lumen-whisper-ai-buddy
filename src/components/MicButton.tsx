
import { Mic, MicOff } from "lucide-react";
import { useEffect, useState } from "react";

interface MicButtonProps {
  isListening: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const MicButton = ({ isListening, onClick, disabled = false }: MicButtonProps) => {
  const [ripples, setRipples] = useState<{ id: number; scale: number }[]>([]);

  // Create ripple effect when listening
  useEffect(() => {
    if (!isListening) return;

    const interval = setInterval(() => {
      const newRipple = {
        id: Date.now(),
        scale: 1,
      };
      
      setRipples((prev) => [...prev, newRipple]);
      
      // Remove old ripples
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 2000);
    }, 2000);

    return () => clearInterval(interval);
  }, [isListening]);

  return (
    <div className="relative flex items-center justify-center">
      {ripples.map(({ id }) => (
        <div 
          key={id}
          className="absolute rounded-full bg-lumen-purple/20 animate-[wave_2s_ease-out]"
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      ))}
      
      <button
        className={`mic-button ${isListening ? 'mic-button-active' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${isListening ? 'bg-red-500' : 'bg-lumen-purple'} hover:shadow-[0_0_15px_rgba(155,135,245,0.5)]`}
        onClick={onClick}
        disabled={disabled}
        aria-label={isListening ? 'Stop listening' : 'Start listening'}
      >
        {isListening ? <Mic size={24} /> : <MicOff size={24} />}
      </button>
    </div>
  );
};

export default MicButton;
