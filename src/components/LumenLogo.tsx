
import React from 'react';
import { motion } from 'framer-motion';

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
      {/* Main logo container */}
      <div className="relative w-full h-full flex items-center justify-center">
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Lotus flower design */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Central stem dots (optional) */}
            <motion.path
              d="M50 85V50"
              stroke="url(#lotus-stem-gradient)"
              strokeWidth="1"
              strokeDasharray="2 2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            />
            
            {/* Bottom Layer Petals */}
            {/* Bottom left */}
            <motion.path
              d="M30 60 C30 70, 45 80, 50 80 C55 80, 70 70, 70 60"
              fill="none"
              stroke="url(#lotus-outer-petal)"
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
            
            {/* Bottom left middle */}
            <motion.path
              d="M35 55 C35 65, 45 75, 50 75 C55 75, 65 65, 65 55"
              fill="none"
              stroke="url(#lotus-outer-petal)"
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            />
            
            {/* Middle Layer Petals */}
            {/* Left middle */}
            <motion.path
              d="M30 45 C35 60, 45 70, 50 70 C55 70, 65 60, 70 45"
              fill="none"
              stroke="url(#lotus-middle-petal)"
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            />
            
            {/* Inner middle */}
            <motion.path
              d="M35 40 C40 55, 45 65, 50 65 C55 65, 60 55, 65 40"
              fill="none"
              stroke="url(#lotus-middle-petal)"
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            />
            
            {/* Top Layer Petals */}
            {/* Inner top */}
            <motion.path
              d="M40 30 C45 45, 48 55, 50 55 C52 55, 55 45, 60 30"
              fill="none"
              stroke="url(#lotus-inner-petal)"
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            />
            
            {/* Center top petal */}
            <motion.path
              d="M50 15 L45 35 C45 40, 48 50, 50 50 C52 50, 55 40, 55 35 L50 15"
              fill="url(#lotus-center-petal)"
              strokeWidth="1"
              stroke="url(#lotus-inner-petal)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            />
            
            {/* Left top petal */}
            <motion.path
              d="M30 25 L40 35 C42 40, 45 50, 50 50 C48 45, 45 35, 35 30 L30 25"
              fill="url(#lotus-side-petal-left)"
              strokeWidth="1"
              stroke="url(#lotus-inner-petal)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            />
            
            {/* Right top petal */}
            <motion.path
              d="M70 25 L60 35 C58 40, 55 50, 50 50 C52 45, 55 35, 65 30 L70 25"
              fill="url(#lotus-side-petal-right)"
              strokeWidth="1"
              stroke="url(#lotus-inner-petal)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.0 }}
            />
            
            {/* Center circle */}
            <motion.circle
              cx="50"
              cy="50"
              r="5"
              fill="url(#lotus-center-gradient)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 1.1 }}
            />
            
            {/* Subtle glow effects */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ duration: 1.5, delay: 1.2 }}
            >
              <motion.circle 
                cx="50" cy="50" r="3" 
                fill="#D6BCFA"
                fillOpacity="0.3"
                animate={{ 
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.5, 1]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.g>
          </motion.g>
          
          {/* Gradients */}
          <defs>
            <linearGradient id="lotus-stem-gradient" x1="50" y1="50" x2="50" y2="85" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9b87f5" />
              <stop offset="1" stopColor="#1EAEDB" />
            </linearGradient>
            
            <linearGradient id="lotus-outer-petal" x1="30" y1="60" x2="70" y2="60" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D6BCFA" />
              <stop offset="0.5" stopColor="#9b87f5" />
              <stop offset="1" stopColor="#33C3F0" />
            </linearGradient>
            
            <linearGradient id="lotus-middle-petal" x1="30" y1="45" x2="70" y2="45" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D6BCFA" />
              <stop offset="0.5" stopColor="#9b87f5" />
              <stop offset="1" stopColor="#33C3F0" />
            </linearGradient>
            
            <linearGradient id="lotus-inner-petal" x1="40" y1="30" x2="60" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D6BCFA" />
              <stop offset="0.5" stopColor="#9b87f5" />
              <stop offset="1" stopColor="#1EAEDB" />
            </linearGradient>
            
            <linearGradient id="lotus-center-petal" x1="50" y1="15" x2="50" y2="50" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D6BCFA" />
              <stop offset="1" stopColor="#9b87f5" />
            </linearGradient>
            
            <linearGradient id="lotus-side-petal-left" x1="30" y1="25" x2="50" y2="50" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D6BCFA" />
              <stop offset="1" stopColor="#9b87f5" />
            </linearGradient>
            
            <linearGradient id="lotus-side-petal-right" x1="70" y1="25" x2="50" y2="50" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1EAEDB" />
              <stop offset="1" stopColor="#9b87f5" />
            </linearGradient>
            
            <linearGradient id="lotus-center-gradient" x1="45" y1="45" x2="55" y2="55" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9b87f5" />
              <stop offset="1" stopColor="#1EAEDB" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </motion.div>
  );
};

export default LumenLogo;
