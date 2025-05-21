
import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface LumenLogoProps {
  size?: number;
  className?: string;
}

const LumenLogo: React.FC<LumenLogoProps> = ({ size = 80, className = "" }) => {
  return (
    <motion.div 
      className={`inline-flex items-center justify-center ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
    >
      <div className="relative">
        {/* Background circle with pulse effect */}
        <motion.div 
          className="absolute inset-0 rounded-full bg-gradient-to-br from-lumen.softBlue to-lumen.lightPurple opacity-30"
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Main logo container */}
        <div className="relative w-full h-full flex items-center justify-center">
          <svg 
            width={size} 
            height={size} 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer ring */}
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              stroke="url(#lumen-ring-gradient)"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.2 }}
            />
            
            {/* Inner sparkle elements */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.7 }}
            >
              {/* Center star */}
              <motion.path
                d="M50 27L54.9 40.3L69 40.3L57.9 48.5L62.8 61.8L50 53.6L37.2 61.8L42.1 48.5L31 40.3L45.1 40.3L50 27Z"
                fill="url(#lumen-star-gradient)"
                stroke="white"
                strokeWidth="0.5"
                animate={{ 
                  rotate: [0, 15, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Orbit circles */}
              <motion.circle
                cx="50"
                cy="50"
                r="32"
                stroke="url(#lumen-orbit-gradient)"
                strokeWidth="0.75"
                strokeDasharray="2 3"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Small orbit dots */}
              <motion.circle 
                cx="50" cy="18" r="3" 
                fill="#D6BCFA"
                animate={{ 
                  opacity: [1, 0.5, 1],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              
              <motion.circle 
                cx="82" cy="50" r="2" 
                fill="#33C3F0"
                animate={{ 
                  opacity: [1, 0.5, 1],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              />
              
              <motion.circle 
                cx="50" cy="82" r="3" 
                fill="#9b87f5"
                animate={{ 
                  opacity: [1, 0.5, 1],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
              
              <motion.circle 
                cx="18" cy="50" r="2" 
                fill="#1EAEDB"
                animate={{ 
                  opacity: [1, 0.5, 1],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              />
            </motion.g>
            
            {/* Gradients */}
            <defs>
              <linearGradient id="lumen-ring-gradient" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                <stop stopColor="#9b87f5" />
                <stop offset="0.5" stopColor="#D6BCFA" />
                <stop offset="1" stopColor="#1EAEDB" />
              </linearGradient>
              
              <linearGradient id="lumen-star-gradient" x1="31" y1="27" x2="69" y2="61.8" gradientUnits="userSpaceOnUse">
                <stop stopColor="#9b87f5" />
                <stop offset="1" stopColor="#1EAEDB" />
              </linearGradient>
              
              <linearGradient id="lumen-orbit-gradient" x1="18" y1="18" x2="82" y2="82" gradientUnits="userSpaceOnUse">
                <stop stopColor="#D6BCFA" />
                <stop offset="1" stopColor="#33C3F0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </motion.div>
  );
};

export default LumenLogo;
