"use client";

import { motion } from "framer-motion";

interface FoxLogoProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

export default function FoxLogo({ size = 70, animate = true, className = "" }: FoxLogoProps) {
  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${className}`}
      animate={animate ? { y: [0, -3, 0] } : undefined}
      transition={animate ? { duration: 5, repeat: Infinity, ease: "easeInOut" } : undefined}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Outer circle */}
        <circle cx="70" cy="70" r="68" stroke="#C8A44E" strokeWidth="1.5" opacity="0.3" />

        {/* Mask: hide bottom half of circle for shadow effect */}
        <rect x="0" y="95" width="140" height="50" fill="#0D0D0C" opacity="0.85" style={{ fill: "var(--fox-mask-color, #0D0D0C)" }} />

        {/* Left ear */}
        <path d="M32 38 L46 58 L24 55 Z" fill="#C8A44E" opacity="0.55" />
        <path d="M35 42 L44 56 L28 54 Z" fill="#C8A44E" opacity="0.2" />

        {/* Right ear */}
        <path d="M108 38 L116 55 L94 58 Z" fill="#C8A44E" opacity="0.55" />
        <path d="M105 42 L112 54 L96 56 Z" fill="#C8A44E" opacity="0.2" />

        {/* Eye glow */}
        <ellipse cx="50" cy="68" rx="16" ry="10" fill="#C8A44E" opacity="0.1" />
        <ellipse cx="90" cy="68" rx="16" ry="10" fill="#C8A44E" opacity="0.1" />

        {/* Left eye */}
        {animate ? (
          <motion.ellipse
            cx="50"
            cy="68"
            rx="11"
            ry="6.5"
            animate={{ ry: [6.5, 0.8, 6.5] }}
            transition={{ duration: 0.3, delay: 4, repeat: Infinity, repeatDelay: 8 }}
            fill="#C8A44E"
          />
        ) : (
          <ellipse cx="50" cy="68" rx="11" ry="6.5" fill="#C8A44E" />
        )}
        <ellipse cx="51" cy="67" rx="4" ry="4" fill="#E8E4D8" />
        {animate ? (
          <motion.ellipse
            cx="51.5"
            cy="67"
            rx="2"
            ry="2.5"
            animate={{ ry: [2.5, 0.3, 2.5] }}
            transition={{ duration: 0.3, delay: 4, repeat: Infinity, repeatDelay: 8 }}
            fill="#0D0D0C"
          />
        ) : (
          <ellipse cx="51.5" cy="67" rx="2" ry="2.5" fill="#0D0D0C" />
        )}

        {/* Right eye */}
        {animate ? (
          <motion.ellipse
            cx="90"
            cy="68"
            rx="11"
            ry="6.5"
            animate={{ ry: [6.5, 0.8, 6.5] }}
            transition={{ duration: 0.3, delay: 4.1, repeat: Infinity, repeatDelay: 8 }}
            fill="#C8A44E"
          />
        ) : (
          <ellipse cx="90" cy="68" rx="11" ry="6.5" fill="#C8A44E" />
        )}
        <ellipse cx="91" cy="67" rx="4" ry="4" fill="#E8E4D8" />
        {animate ? (
          <motion.ellipse
            cx="91.5"
            cy="67"
            rx="2"
            ry="2.5"
            animate={{ ry: [2.5, 0.3, 2.5] }}
            transition={{ duration: 0.3, delay: 4.1, repeat: Infinity, repeatDelay: 8 }}
            fill="#0D0D0C"
          />
        ) : (
          <ellipse cx="91.5" cy="67" rx="2" ry="2.5" fill="#0D0D0C" />
        )}

        {/* Shadow curve */}
        <path d="M35 88 Q70 108 105 88" stroke="#C8A44E" strokeWidth="1" opacity="0.12" fill="none" />
      </svg>
    </motion.div>
  );
}
