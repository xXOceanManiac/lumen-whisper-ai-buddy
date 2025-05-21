
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
            {/* Lotus flower design */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              {/* Lotus stem */}
              <motion.path
                d="M50 80L50 55"
                stroke="url(#lotus-stem-gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
              />
              
              {/* Lotus leaf left */}
              <motion.path
                d="M50 65C40 70 33 75 35 85C36 88 39 89 42 88C45 87 47 84 48 80C49 76 47 70 50 65"
                fill="none"
                stroke="url(#lotus-leaf-gradient-1)"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.7 }}
              />
              
              {/* Lotus leaf right */}
              <motion.path
                d="M50 65C60 70 67 75 65 85C64 88 61 89 58 88C55 87 53 84 52 80C51 76 53 70 50 65"
                fill="none"
                stroke="url(#lotus-leaf-gradient-2)"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.8 }}
              />
              
              {/* Lotus petals */}
              {/* Bottom petal */}
              <motion.path
                d="M50 55C48 65 46 75 50 80C54 75 52 65 50 55"
                fill="url(#lotus-petal-gradient-1)"
                stroke="none"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              />
              
              {/* Bottom left petal */}
              <motion.path
                d="M50 55C44 62 36 70 35 75C45 77 48 65 50 55"
                fill="url(#lotus-petal-gradient-2)"
                stroke="none"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              />
              
              {/* Bottom right petal */}
              <motion.path
                d="M50 55C56 62 64 70 65 75C55 77 52 65 50 55"
                fill="url(#lotus-petal-gradient-3)"
                stroke="none"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              />
              
              {/* Left petal */}
              <motion.path
                d="M50 55C40 53 30 55 27 60C35 67 45 60 50 55"
                fill="url(#lotus-petal-gradient-4)"
                stroke="none"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 0.9 }}
              />
              
              {/* Right petal */}
              <motion.path
                d="M50 55C60 53 70 55 73 60C65 67 55 60 50 55"
                fill="url(#lotus-petal-gradient-5)"
                stroke="none"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 1.0 }}
              />
              
              {/* Top left petal */}
              <motion.path
                d="M50 55C42 47 32 43 30 46C40 58 45 52 50 55"
                fill="url(#lotus-petal-gradient-6)"
                stroke="none"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 1.1 }}
              />
              
              {/* Top right petal */}
              <motion.path
                d="M50 55C58 47 68 43 70 46C60 58 55 52 50 55"
                fill="url(#lotus-petal-gradient-7)"
                stroke="none"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 1.2 }}
              />
              
              {/* Top petal */}
              <motion.path
                d="M50 55C50 45 50 35 45 30C40 35 50 45 50 55"
                fill="url(#lotus-petal-gradient-8)"
                stroke="none"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 1.3 }}
              />
              
              {/* Center decoration */}
              <motion.circle
                cx="50"
                cy="55"
                r="6"
                fill="url(#lotus-center-gradient)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 1.4, type: "spring" }}
              />
              
              {/* Decorative dots */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.5 }}
              >
                <motion.circle 
                  cx="35" cy="55" r="1.5" 
                  fill="#D6BCFA"
                  animate={{ 
                    opacity: [1, 0.5, 1],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <motion.circle 
                  cx="65" cy="55" r="1.5" 
                  fill="#33C3F0"
                  animate={{ 
                    opacity: [1, 0.5, 1],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />
                
                <motion.circle 
                  cx="50" cy="40" r="1.5" 
                  fill="#9b87f5"
                  animate={{ 
                    opacity: [1, 0.5, 1],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />
                
                <motion.circle 
                  cx="50" cy="70" r="1.5" 
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
              <linearGradient id="lotus-stem-gradient" x1="50" y1="55" x2="50" y2="80" gradientUnits="userSpaceOnUse">
                <stop stopColor="#9b87f5" />
                <stop offset="1" stopColor="#1EAEDB" />
              </linearGradient>
              
              <linearGradient id="lotus-leaf-gradient-1" x1="35" y1="65" x2="48" y2="88" gradientUnits="userSpaceOnUse">
                <stop stopColor="#9b87f5" />
                <stop offset="1" stopColor="#D6BCFA" />
              </linearGradient>
              
              <linearGradient id="lotus-leaf-gradient-2" x1="65" y1="65" x2="52" y2="88" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1EAEDB" />
                <stop offset="1" stopColor="#33C3F0" />
              </linearGradient>
              
              <linearGradient id="lotus-petal-gradient-1" x1="50" y1="55" x2="50" y2="80" gradientUnits="userSpaceOnUse">
                <stop stopColor="#D6BCFA" />
                <stop offset="1" stopColor="#9b87f5" />
              </linearGradient>
              
              <linearGradient id="lotus-petal-gradient-2" x1="35" y1="75" x2="50" y2="55" gradientUnits="userSpaceOnUse">
                <stop stopColor="#D6BCFA" />
                <stop offset="1" stopColor="#9b87f5" />
              </linearGradient>
              
              <linearGradient id="lotus-petal-gradient-3" x1="65" y1="75" x2="50" y2="55" gradientUnits="userSpaceOnUse">
                <stop stopColor="#33C3F0" />
                <stop offset="1" stopColor="#1EAEDB" />
              </linearGradient>
              
              <linearGradient id="lotus-petal-gradient-4" x1="27" y1="60" x2="50" y2="55" gradientUnits="userSpaceOnUse">
                <stop stopColor="#D6BCFA" />
                <stop offset="1" stopColor="#9b87f5" />
              </linearGradient>
              
              <linearGradient id="lotus-petal-gradient-5" x1="73" y1="60" x2="50" y2="55" gradientUnits="userSpaceOnUse">
                <stop stopColor="#33C3F0" />
                <stop offset="1" stopColor="#1EAEDB" />
              </linearGradient>
              
              <linearGradient id="lotus-petal-gradient-6" x1="30" y1="46" x2="50" y2="55" gradientUnits="userSpaceOnUse">
                <stop stopColor="#D6BCFA" />
                <stop offset="1" stopColor="#9b87f5" />
              </linearGradient>
              
              <linearGradient id="lotus-petal-gradient-7" x1="70" y1="46" x2="50" y2="55" gradientUnits="userSpaceOnUse">
                <stop stopColor="#33C3F0" />
                <stop offset="1" stopColor="#1EAEDB" />
              </linearGradient>
              
              <linearGradient id="lotus-petal-gradient-8" x1="45" y1="30" x2="50" y2="55" gradientUnits="userSpaceOnUse">
                <stop stopColor="#9b87f5" />
                <stop offset="1" stopColor="#1EAEDB" />
              </linearGradient>
              
              <linearGradient id="lotus-center-gradient" x1="44" y1="49" x2="56" y2="61" gradientUnits="userSpaceOnUse">
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
