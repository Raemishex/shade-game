"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface TimerProps {
  seconds: number;
  onComplete?: () => void;
  size?: number;
  className?: string;
}

export default function Timer({
  seconds,
  onComplete,
  size = 80,
  className = "",
}: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isRunning, setIsRunning] = useState(true);

  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / seconds;
  const strokeDashoffset = circumference * (1 - progress);

  // Son 10 saniyədə qırmızıya keç
  const isWarning = timeLeft <= 10;
  const strokeColor = isWarning ? "#E8593C" : "#C8A44E";

  useEffect(() => {
    setTimeLeft(seconds);
    setIsRunning(true);
  }, [seconds]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      if (timeLeft <= 0) onComplete?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  // Vaxtı format et (MM:SS)
  const minutes = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const display = minutes > 0
    ? `${minutes}:${secs.toString().padStart(2, "0")}`
    : `${secs}`;

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${className}`}
      animate={isWarning ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={isWarning ? { duration: 0.5, repeat: Infinity } : undefined}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="4"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
        />
      </svg>
      <span
        className={`absolute font-nunito font-bold ${
          isWarning ? "text-red" : "text-gold"
        }`}
        style={{ fontSize: size * 0.25 }}
      >
        {display}
      </span>
    </motion.div>
  );
}
