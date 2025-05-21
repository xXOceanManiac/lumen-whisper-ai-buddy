
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
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Simple geometric logo */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Main shape - hexagon */}
          <motion.path
            d="M50 15L85 35V65L50 85L15 65V35L50 15Z"
            fill="url(#gradient-fill)"
            stroke="url(#stroke-gradient)"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
          />
          
          {/* Inner design elements */}
          <motion.path
            d="M50 25L70 37.5V62.5L50 75L30 62.5V37.5L50 25Z"
            fill="none"
            stroke="url(#inner-stroke)"
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
          />
          
          {/* Central element - circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="10"
            fill="url(#center-gradient)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          />
          
          {/* Abstract lines for accent */}
          <motion.path
            d="M35 50H25M65 50H75M50 35V25M50 65V75"
            stroke="url(#accent-gradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 1, pathLength: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          />
        </motion.g>

        {/* Subtle pulse animation for the center */}
        <motion.circle
          cx="50"
          cy="50"
          r="5"
          fill="url(#pulse-gradient)"
          animate={{ 
            opacity: [0.7, 0.9, 0.7],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Gradients */}
        <defs>
          <linearGradient id="gradient-fill" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D6BCFA" />
            <stop offset="0.5" stopColor="#9b87f5" />
            <stop offset="1" stopColor="#1EAEDB" />
          </linearGradient>
          
          <linearGradient id="stroke-gradient" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D6BCFA" />
            <stop offset="1" stopColor="#33C3F0" />
          </linearGradient>
          
          <linearGradient id="inner-stroke" x1="30" y1="25" x2="70" y2="75" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D6BCFA" />
            <stop offset="1" stopColor="#1EAEDB" />
          </linearGradient>
          
          <linearGradient id="center-gradient" x1="40" y1="40" x2="60" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#9b87f5" />
            <stop offset="1" stopColor="#1EAEDB" />
          </linearGradient>
          
          <linearGradient id="accent-gradient" x1="25" y1="25" x2="75" y2="75" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D6BCFA" />
            <stop offset="1" stopColor="#33C3F0" />
          </linearGradient>
          
          <radialGradient id="pulse-gradient" cx="50" cy="50" r="5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D6BCFA" />
            <stop offset="1" stopColor="#9b87f5" stopOpacity="0.6" />
          </radialGradient>
        </defs>
      </svg>
    </motion.div>
  );
};

export default LumenLogo;
