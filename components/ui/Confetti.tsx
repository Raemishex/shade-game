"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CONFETTI_COLORS = [
  "#C8A44E", "#B8D4A8", "#A8C4E0", "#E0C4A8",
  "#F0997B", "#E8593C", "#9B8EC4", "#7ECEC1",
  "#D4A8D0", "#E0B878",
];

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
  duration: number;
  shape: "square" | "circle" | "rect";
}

interface ConfettiProps {
  active: boolean;
  count?: number;
  duration?: number; // ms
}

export default function Confetti({ active, count = 25, duration = 3000 }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) {
      setShow(false);
      return;
    }

    const generated: ConfettiPiece[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // % mövqe
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 720 - 360,
      delay: i * 0.04,
      duration: 2 + Math.random() * 1.5,
      shape: (["square", "circle", "rect"] as const)[Math.floor(Math.random() * 3)],
    }));

    setPieces(generated);
    setShow(true);

    const timer = setTimeout(() => setShow(false), duration);
    return () => clearTimeout(timer);
  }, [active, count, duration]);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[70] pointer-events-none overflow-hidden">
          {pieces.map((p) => (
            <motion.div
              key={p.id}
              className="absolute"
              style={{
                left: `${p.x}%`,
                width: p.shape === "rect" ? p.size * 1.5 : p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: p.shape === "circle" ? "50%" : p.shape === "rect" ? "1px" : "0",
              }}
              initial={{
                y: -20,
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                y: typeof window !== "undefined" ? window.innerHeight + 50 : 900,
                rotate: p.rotation,
                opacity: [1, 1, 0.8, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
