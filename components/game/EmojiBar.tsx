"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

const EMOJIS = [
  { key: "smile", emoji: "😄", label: "Gülən", i18nKey: "emoji.smiling" },
  { key: "sad", emoji: "😢", label: "Üzgün", i18nKey: "emoji.sad" },
  { key: "surprised", emoji: "😮", label: "Təəccüblü", i18nKey: "emoji.surprised" },
  { key: "star", emoji: "⭐", label: "Ulduz", i18nKey: "emoji.star" },
  { key: "heart", emoji: "❤️", label: "Ürək", i18nKey: "emoji.heart" },
  { key: "eye", emoji: "👁️", label: "Şübhəli", i18nKey: "emoji.suspicious" },
];

interface BubbleEmoji {
  id: number;
  emoji: string;
  x: number;
}

interface EmojiBarProps {
  onSend: (emoji: string) => void;
  disabled?: boolean;
}

export default function EmojiBar({ onSend, disabled = false }: EmojiBarProps) {
  const { t } = useTranslation();
  const [bubbles, setBubbles] = useState<BubbleEmoji[]>([]);
  const [cooldown, setCooldown] = useState(false);
  const idCounter = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const handleEmoji = useCallback(
    (emoji: string, buttonIndex: number) => {
      if (disabled || cooldown) return;

      // Göndər
      onSend(emoji);

      // Bubble effekt
      const id = ++idCounter.current;
      const x = buttonIndex * 52 + 26; // düymə mövqeyi
      setBubbles((prev) => [...prev.slice(-4), { id, emoji, x }]);

      // 1.5s sonra bubble sil
      const bubbleTimer = setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.id !== id));
        timersRef.current = timersRef.current.filter((t) => t !== bubbleTimer);
      }, 1500);
      timersRef.current.push(bubbleTimer);

      // Rate limit: 3 saniyə cooldown
      setCooldown(true);
      const cooldownTimer = setTimeout(() => {
        setCooldown(false);
        timersRef.current = timersRef.current.filter((t) => t !== cooldownTimer);
      }, 3000);
      timersRef.current.push(cooldownTimer);
    },
    [onSend, disabled, cooldown]
  );

  return (
    <div className="relative">
      {/* Float bubbles */}
      <div className="absolute bottom-full left-0 right-0 h-32 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {bubbles.map((b) => (
            <motion.div
              key={b.id}
              className="absolute text-2xl"
              style={{ left: b.x, bottom: 0 }}
              initial={{ y: 0, opacity: 1, scale: 0.5, rotate: 0 }}
              animate={{
                y: -100,
                opacity: 0,
                scale: 1.2,
                rotate: Math.random() * 30 - 15,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.5,
                ease: "easeOut",
              }}
            >
              {b.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Emoji buttons */}
      <div className="flex items-center justify-center gap-1.5 py-2 px-3 bg-cream/[0.03] rounded-2xl border border-cream/[0.06]">
        {EMOJIS.map((e, i) => (
          <motion.button
            key={e.key}
            onClick={() => handleEmoji(e.emoji, i)}
            disabled={disabled || cooldown}
            aria-label={t(e.i18nKey)}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-xl transition-colors hover:bg-cream/[0.06] disabled:opacity-30 disabled:cursor-not-allowed"
            whileTap={{ scale: 0.85 }}
            title={e.label}
          >
            {e.emoji}
          </motion.button>
        ))}

        {/* Cooldown indicator */}
        {cooldown && (
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-gold/40 ml-1"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
}

export { EMOJIS };
