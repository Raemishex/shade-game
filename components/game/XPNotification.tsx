"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { XPBreakdown } from "@/lib/xp";

interface XPNotificationProps {
  breakdown: XPBreakdown | null;
  previousLevel: number;
  newLevel: number;
  newBadge?: { nameAz: string; color: string } | null;
  onClose: () => void;
}

function AnimatedNumber({ from, to, duration = 1.2 }: { from: number; to: number; duration?: number }) {
  const [current, setCurrent] = useState(from);

  useEffect(() => {
    if (from === to) { setCurrent(to); return; }
    const start = performance.now();
    const diff = to - from;
    function tick(now: number) {
      const elapsed = (now - start) / (duration * 1000);
      if (elapsed >= 1) { setCurrent(to); return; }
      setCurrent(Math.round(from + diff * elapsed));
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [from, to, duration]);

  return <>{current}</>;
}

export default function XPNotification({
  breakdown,
  previousLevel,
  newLevel,
  newBadge,
  onClose,
}: XPNotificationProps) {
  const [phase, setPhase] = useState<"xp" | "levelup" | "badge">("xp");
  const isLevelUp = newLevel > previousLevel;

  useEffect(() => {
    if (!breakdown) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    if (isLevelUp) {
      timers.push(setTimeout(() => setPhase("levelup"), 2000));
      if (newBadge) {
        timers.push(setTimeout(() => setPhase("badge"), 4000));
        timers.push(setTimeout(onClose, 6000));
      } else {
        timers.push(setTimeout(onClose, 4500));
      }
    } else if (newBadge) {
      timers.push(setTimeout(() => setPhase("badge"), 2000));
      timers.push(setTimeout(onClose, 4000));
    } else {
      timers.push(setTimeout(onClose, 2500));
    }

    return () => timers.forEach(clearTimeout);
  }, [breakdown, isLevelUp, newBadge, onClose]);

  if (!breakdown) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-dark/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* XP Phase */}
        {phase === "xp" && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 15 }}
          >
            {/* XP Amount */}
            <motion.div
              className="text-5xl font-bold text-gold mb-2"
              initial={{ y: 30 }}
              animate={{ y: 0 }}
            >
              +<AnimatedNumber from={0} to={breakdown.total} />
            </motion.div>
            <p className="text-cream/60 text-sm mb-6">XP qazandın!</p>

            {/* Breakdown */}
            <div className="space-y-1.5">
              {breakdown.base > 0 && (
                <motion.div
                  className="text-[12px] text-cream/40"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {breakdown.base === 25 ? "Qələbə" : "İştirak"} +{breakdown.base}
                </motion.div>
              )}
              {breakdown.correctVote > 0 && (
                <motion.div
                  className="text-[12px] text-cream/40"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  Düzgün səs +{breakdown.correctVote}
                </motion.div>
              )}
              {breakdown.imposterSurvive > 0 && (
                <motion.div
                  className="text-[12px] text-cream/40"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  İmposter sağ qaldı +{breakdown.imposterSurvive}
                </motion.div>
              )}
              {breakdown.dailyChallenge > 0 && (
                <motion.div
                  className="text-[12px] text-gold/60"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  Günlük challenge +{breakdown.dailyChallenge}
                </motion.div>
              )}
              {breakdown.streakBonus > 0 && (
                <motion.div
                  className="text-[12px] text-gold/60"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 }}
                >
                  Streak bonus +{breakdown.streakBonus}
                </motion.div>
              )}
            </div>

            {/* XP bar */}
            <div className="mt-6 w-48 mx-auto">
              <div className="h-1.5 bg-cream/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold"
                  initial={{ width: "20%" }}
                  animate={{ width: "60%" }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[9px] text-cream/30">
                <span>LVL {previousLevel}</span>
                <span>LVL {previousLevel + 1}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Level Up Phase */}
        {phase === "levelup" && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 10, stiffness: 100 }}
          >
            {/* Glow ring */}
            <motion.div
              className="w-32 h-32 rounded-full border-2 border-gold mx-auto mb-6 flex items-center justify-center relative"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(200,164,78,0.2)",
                  "0 0 60px rgba(200,164,78,0.4)",
                  "0 0 20px rgba(200,164,78,0.2)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-4xl font-bold text-gold">{newLevel}</span>
              {/* Burst particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-gold"
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{
                    opacity: 0,
                    scale: 0,
                    x: Math.cos((i * Math.PI * 2) / 8) * 80,
                    y: Math.sin((i * Math.PI * 2) / 8) * 80,
                  }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
              ))}
            </motion.div>

            <motion.p
              className="text-2xl font-bold text-gold mb-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Səviyyə yüksəldi!
            </motion.p>
            <motion.p
              className="text-cream/40 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              LVL {previousLevel} → LVL {newLevel}
            </motion.p>
          </motion.div>
        )}

        {/* New Badge Phase */}
        {phase === "badge" && newBadge && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ type: "spring", damping: 12 }}
          >
            <motion.div
              className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{
                background: `${newBadge.color}15`,
                border: `1px solid ${newBadge.color}33`,
              }}
              animate={{
                boxShadow: [
                  `0 0 10px ${newBadge.color}20`,
                  `0 0 30px ${newBadge.color}40`,
                  `0 0 10px ${newBadge.color}20`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <svg width="36" height="36" viewBox="0 0 20 20">
                <path
                  d="M10 3L12 8H17L13 11L14.5 16L10 13L5.5 16L7 11L3 8H8Z"
                  fill={newBadge.color}
                />
              </svg>
            </motion.div>

            <motion.p
              className="text-lg font-bold text-cream mb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Yeni nailiyyət!
            </motion.p>
            <motion.p
              className="text-gold text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {newBadge.nameAz}
            </motion.p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
