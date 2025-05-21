
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
      <div className="relative">
        {/* Background glow effect */}
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
            {/* Agave plant design */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              {/* Center stem */}
              <motion.path
                d="M50 15L50 40"
                stroke="url(#lumen-stem-gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
              />
              
              {/* Agave leaves */}
              <motion.path
                d="M50 40C40 45 35 55 38 65C39 68 42 70 45 70C48 70 50 68 50 64C50 60 48 55 50 50"
                fill="none"
                stroke="url(#lumen-leaf-gradient-1)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.6 }}
              />
              
              <motion.path
                d="M50 40C60 45 65 55 62 65C61 68 58 70 55 70C52 70 50 68 50 64C50 60 52 55 50 50"
                fill="none"
                stroke="url(#lumen-leaf-gradient-2)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.7 }}
              />
              
              <motion.path
                d="M50 40C45 35 35 33 28 40C25 43 25 47 28 50C31 53 35 53 38 50C41 47 45 43 50 50"
                fill="none"
                stroke="url(#lumen-leaf-gradient-3)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.8 }}
              />
              
              <motion.path
                d="M50 40C55 35 65 33 72 40C75 43 75 47 72 50C69 53 65 53 62 50C59 47 55 43 50 50"
                fill="none"
                stroke="url(#lumen-leaf-gradient-4)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.9 }}
              />
              
              <motion.path
                d="M50 40C48 30 40 23 30 25C27 26 25 30 27 33C29 36 32 38 36 36C40 34 45 32 50 50"
                fill="none"
                stroke="url(#lumen-leaf-gradient-5)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 1.0 }}
              />
              
              <motion.path
                d="M50 40C52 30 60 23 70 25C73 26 75 30 73 33C71 36 68 38 64 36C60 34 55 32 50 50"
                fill="none"
                stroke="url(#lumen-leaf-gradient-6)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 1.1 }}
              />
              
              {/* Center decoration */}
              <motion.circle
                cx="50"
                cy="40"
                r="5"
                fill="url(#lumen-center-gradient)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 1.3, type: "spring" }}
              />
              
              {/* Decorative dots */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.4 }}
              >
                <motion.circle 
                  cx="38" cy="60" r="2" 
                  fill="#D6BCFA"
                  animate={{ 
                    opacity: [1, 0.5, 1],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <motion.circle 
                  cx="62" cy="60" r="2" 
                  fill="#33C3F0"
                  animate={{ 
                    opacity: [1, 0.5, 1],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />
                
                <motion.circle 
                  cx="35" cy="40" r="2" 
                  fill="#9b87f5"
                  animate={{ 
                    opacity: [1, 0.5, 1],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />
                
                <motion.circle 
                  cx="65" cy="40" r="2" 
                  fill="#1EAEDB"
                  animate={{ 
                    opacity: [1, 0.5, 1],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                />
              </motion.g>
            </motion.g>
            
            {/* Gradients */}
            <defs>
              <linearGradient id="lumen-stem-gradient" x1="50" y1="15" x2="50" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#9b87f5" />
                <stop offset="1" stopColor="#1EAEDB" />
              </linearGradient>
              
              <linearGradient id="lumen-leaf-gradient-1" x1="38" y1="40" x2="45" y2="70" gradientUnits="userSpaceOnUse">
                <stop stopColor="#9b87f5" />
                <stop offset="1" stopColor="#D6BCFA" />
              </linearGradient>
              
              <linearGradient id="lumen-leaf-gradient-2" x1="62" y1="40" x2="55" y2="70" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1EAEDB" />
                <stop offset="1" stopColor="#33C3F0" />
              </linearGradient>
              
              <linearGradient id="lumen-leaf-gradient-3" x1="28" y1="40" x2="38" y2="50" gradientUnits="userSpaceOnUse">
                <stop stopColor="#D6BCFA" />
                <stop offset="1" stopColor="#9b87f5" />
              </linearGradient>
              
              <linearGradient id="lumen-leaf-gradient-4" x1="72" y1="40" x2="62" y2="50" gradientUnits="userSpaceOnUse">
                <stop stopColor="#33C3F0" />
                <stop offset="1" stopColor="#1EAEDB" />
              </linearGradient>
              
              <linearGradient id="lumen-leaf-gradient-5" x1="30" y1="25" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#9b87f5" />
                <stop offset="1" stopColor="#D6BCFA" />
              </linearGradient>
              
              <linearGradient id="lumen-leaf-gradient-6" x1="70" y1="25" x2="64" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1EAEDB" />
                <stop offset="1" stopColor="#33C3F0" />
              </linearGradient>
              
              <linearGradient id="lumen-center-gradient" x1="45" y1="35" x2="55" y2="45" gradientUnits="userSpaceOnUse">
                <stop stopColor="#9b87f5" />
                <stop offset="1" stopColor="#1EAEDB" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </motion.div>
  );
};

export default LumenLogo;
