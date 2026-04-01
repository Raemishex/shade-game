"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/home");
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen bg-dark overflow-hidden relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 rounded-full bg-gold/5 blur-[100px]" />
      </div>

      {/* Fox Eyes Logo — float animation */}
      <motion.div
        className="mb-8 relative"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: [0, -8, 0],
        }}
        transition={{
          opacity: { delay: 0.5, duration: 0.6 },
          scale: { delay: 0.5, duration: 0.6, ease: "easeOut" },
          y: { delay: 1.2, duration: 5, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <svg
          width="140"
          height="140"
          viewBox="0 0 140 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer glow circle */}
          <motion.circle
            cx="70"
            cy="70"
            r="68"
            stroke="#C8A44E"
            strokeWidth="1.5"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 0.3, pathLength: 1 }}
            transition={{ delay: 0.6, duration: 1.5, ease: "easeInOut" }}
          />

          {/* Inner subtle circle */}
          <circle cx="70" cy="70" r="60" stroke="#C8A44E" strokeWidth="0.5" opacity="0.1" />

          {/* Left ear */}
          <motion.path
            d="M32 38 L46 58 L24 55 Z"
            fill="#C8A44E"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          />
          {/* Right ear */}
          <motion.path
            d="M108 38 L116 55 L94 58 Z"
            fill="#C8A44E"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          />

          {/* Left ear inner */}
          <path d="M35 42 L44 56 L28 54 Z" fill="#C8A44E" opacity="0.2" />
          {/* Right ear inner */}
          <path d="M105 42 L112 54 L96 56 Z" fill="#C8A44E" opacity="0.2" />

          {/* Eye glow (behind eyes) */}
          <motion.ellipse
            cx="50"
            cy="68"
            rx="18"
            ry="12"
            fill="#C8A44E"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0.1, 0.15] }}
            transition={{ delay: 1, duration: 3, repeat: Infinity }}
          />
          <motion.ellipse
            cx="90"
            cy="68"
            rx="18"
            ry="12"
            fill="#C8A44E"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0.1, 0.15] }}
            transition={{ delay: 1, duration: 3, repeat: Infinity }}
          />

          {/* Left eye */}
          <motion.ellipse
            cx="50"
            cy="68"
            rx="12"
            ry="7"
            fill="#C8A44E"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              ry: [7, 1, 7],
            }}
            transition={{
              opacity: { delay: 1, duration: 0.4 },
              ry: { delay: 4, duration: 0.3, repeat: Infinity, repeatDelay: 8 },
            }}
          />
          {/* Left pupil */}
          <motion.ellipse
            cx="52"
            cy="68"
            rx="4"
            ry="5"
            fill="#0D0D0C"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              ry: [5, 0.5, 5],
            }}
            transition={{
              opacity: { delay: 1.1, duration: 0.3 },
              ry: { delay: 4, duration: 0.3, repeat: Infinity, repeatDelay: 8 },
            }}
          />
          {/* Left eye highlight */}
          <ellipse cx="48" cy="66" rx="2" ry="1.5" fill="white" opacity="0.4" />

          {/* Right eye */}
          <motion.ellipse
            cx="90"
            cy="68"
            rx="12"
            ry="7"
            fill="#C8A44E"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              ry: [7, 1, 7],
            }}
            transition={{
              opacity: { delay: 1, duration: 0.4 },
              ry: { delay: 4, duration: 0.3, repeat: Infinity, repeatDelay: 8 },
            }}
          />
          {/* Right pupil */}
          <motion.ellipse
            cx="92"
            cy="68"
            rx="4"
            ry="5"
            fill="#0D0D0C"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              ry: [5, 0.5, 5],
            }}
            transition={{
              opacity: { delay: 1.1, duration: 0.3 },
              ry: { delay: 4, duration: 0.3, repeat: Infinity, repeatDelay: 8 },
            }}
          />
          {/* Right eye highlight */}
          <ellipse cx="88" cy="66" rx="2" ry="1.5" fill="white" opacity="0.4" />

          {/* Nose hint */}
          <motion.path
            d="M67 78 L70 82 L73 78"
            stroke="#C8A44E"
            strokeWidth="1"
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          />

          {/* Shadow / mouth area */}
          <motion.path
            d="M35 88 Q70 108 105 88"
            stroke="#C8A44E"
            strokeWidth="1"
            opacity="0.15"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 1, duration: 1 }}
          />
        </svg>
      </motion.div>

      {/* SHADE Text — staggered from bottom */}
      <div className="flex gap-1.5 mb-2">
        {"SHADE".split("").map((letter, i) => (
          <motion.span
            key={i}
            className="text-5xl font-extrabold font-nunito"
            style={{
              background: "linear-gradient(135deg, #C8A44E 0%, #E8D48B 50%, #C8A44E 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 1.5 + i * 0.12,
              duration: 0.5,
              ease: "easeOut",
            }}
          >
            {letter}
          </motion.span>
        ))}
      </div>

      {/* Shimmer line */}
      <motion.div
        className="w-40 h-[1px] mb-3 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.3 }}
      >
        <div className="absolute inset-0 bg-gold/20" />
        <motion.div
          className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-gold/60 to-transparent"
          initial={{ x: -64 }}
          animate={{ x: 200 }}
          transition={{
            delay: 2,
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* "word game" subtitle — fade in */}
      <motion.p
        className="text-cream/50 text-sm tracking-[0.3em] uppercase mb-12 font-nunito"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.6 }}
      >
        word game
      </motion.p>

      {/* Loading bar */}
      <motion.div
        className="w-48 h-1 bg-cream/10 rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 0.3 }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #C8A44E, #E8D48B, #C8A44E)",
          }}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ delay: 2.5, duration: 2.3, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Version */}
      <motion.p
        className="text-cream/20 text-xs mt-8 font-nunito tracking-wider"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 0.5 }}
      >
        v1.0.0
      </motion.p>
    </motion.div>
  );
}
