"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingEmoji {
  id: number;
  emoji: string;
  fromName: string;
  x: number;
  y: number;
}

interface EmojiFloatProps {
  /** Socket-dən gələn emoji event-ləri üçün imperativ API */
  onRef?: (api: EmojiFloatAPI) => void;
}

export interface EmojiFloatAPI {
  addEmoji: (emoji: string, fromName: string) => void;
}

const MAX_VISIBLE = 5;

export default function EmojiFloat({ onRef }: EmojiFloatProps) {
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);
  const idCounter = useRef(0);

  const addEmoji = useCallback((emoji: string, fromName: string) => {
    const id = ++idCounter.current;
    const x = 20 + Math.random() * 60; // 20-80% arasında random x
    const y = 30 + Math.random() * 40; // 30-70% arasında random y

    setEmojis((prev) => {
      const next = [...prev, { id, emoji, fromName, x, y }];
      // FIFO: max 5
      return next.length > MAX_VISIBLE ? next.slice(-MAX_VISIBLE) : next;
    });

    // 1.5s sonra sil
    setTimeout(() => {
      setEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 1800);
  }, []);

  // Ref ilə API-ni paylaş
  useEffect(() => {
    onRef?.({ addEmoji });
  }, [onRef, addEmoji]);

  return (
    <div className="fixed inset-0 z-[55] pointer-events-none overflow-hidden">
      <AnimatePresence>
        {emojis.map((e) => (
          <motion.div
            key={e.id}
            className="absolute flex flex-col items-center"
            style={{ left: `${e.x}%`, top: `${e.y}%` }}
            initial={{ opacity: 0, scale: 0.3, y: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.3, 1.1, 1, 0.8],
              y: -80,
              rotate: [0, Math.random() * 20 - 10, 0],
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              duration: 1.5,
              ease: "easeOut",
              times: [0, 0.15, 0.7, 1],
            }}
          >
            <span className="text-3xl drop-shadow-lg">{e.emoji}</span>
            <motion.span
              className="text-[9px] text-cream/60 bg-dark/60 px-1.5 py-0.5 rounded-md mt-0.5 whitespace-nowrap backdrop-blur-sm"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {e.fromName}
            </motion.span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
