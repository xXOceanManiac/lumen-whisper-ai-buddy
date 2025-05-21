
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
        {/* Outer circle */}
        <motion.circle 
          cx="50" 
          cy="50" 
          r="45" 
          stroke="url(#lumen-gradient)" 
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="animate-glow"
        />
        
        {/* Inner hexagon */}
        <motion.path 
          d="M50 20L77.3205 35V65L50 80L22.6795 65V35L50 20Z" 
          fill="url(#lumen-gradient-fill)" 
          fillOpacity="0.2"
          stroke="url(#lumen-gradient)"
          strokeWidth="2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
        
        {/* Light beam elements */}
        <motion.path 
          d="M50 30L65 40V60L50 70L35 60V40L50 30Z" 
          stroke="url(#lumen-gradient-light)" 
          strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 1, delay: 0.8 }}
        />
        
        {/* Central dot */}
        <motion.circle 
          cx="50" 
          cy="50" 
          r="8" 
          fill="url(#lumen-gradient)" 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        />
        
        {/* Gradients */}
        <defs>
          <linearGradient id="lumen-gradient" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop stopColor="#9b87f5" />
            <stop offset="1" stopColor="#1EAEDB" />
          </linearGradient>
          
          <linearGradient id="lumen-gradient-fill" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop stopColor="#9b87f5" />
            <stop offset="1" stopColor="#1EAEDB" />
          </linearGradient>
          
          <linearGradient id="lumen-gradient-light" x1="35" y1="30" x2="65" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D6BCFA" />
            <stop offset="1" stopColor="#33C3F0" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
};

export default LumenLogo;
