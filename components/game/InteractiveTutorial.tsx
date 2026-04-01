"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

interface TutorialStep {
  icon: string;
  color: string;
  bg: string;
}

const STEPS: TutorialStep[] = [
  { icon: "create", color: "#C8A44E", bg: "bg-gold/[0.08]" },
  { icon: "group", color: "#B8D4A8", bg: "bg-green/[0.08]" },
  { icon: "card", color: "#A8C4E0", bg: "bg-blue/[0.08]" },
  { icon: "clue", color: "#E0C4A8", bg: "bg-orange/[0.08]" },
  { icon: "discuss", color: "#F0997B", bg: "bg-pink/[0.08]" },
  { icon: "vote", color: "#E8593C", bg: "bg-red/[0.08]" },
];

interface InteractiveTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InteractiveTutorial({ isOpen, onClose }: InteractiveTutorialProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem("shade_tutorial_done", "true");
      onClose();
    }
  }, [step, onClose]);

  const handlePrev = useCallback(() => {
    if (step > 0) {
      setStep(step - 1);
    }
  }, [step]);

  const handleSkip = useCallback(() => {
    localStorage.setItem("shade_tutorial_done", "true");
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const currentStep = STEPS[step];
  const titleKey = `howToPlay.step${step + 1}title`;
  const descKey = `howToPlay.step${step + 1}desc`;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-dark/90 backdrop-blur-sm px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-sm bg-[#1A1A18] border border-gold/20 rounded-2xl overflow-hidden"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {/* Progress bar */}
          <div className="h-1 bg-cream/[0.06]">
            <motion.div
              className="h-full bg-gold rounded-r"
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            {/* Icon */}
            <motion.div
              key={step}
              className={`w-16 h-16 rounded-2xl ${currentStep.bg} flex items-center justify-center mx-auto mb-4 border border-white/[0.06]`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <TutorialIcon icon={currentStep.icon} color={currentStep.color} />
            </motion.div>

            {/* Step counter */}
            <p className="text-[10px] text-cream/30 tracking-widest uppercase mb-2 font-nunito">
              {step + 1} / {STEPS.length}
            </p>

            {/* Title & description */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-semibold text-cream font-nunito mb-2">
                  {t(titleKey)}
                </h2>
                <p className="text-[13px] text-cream/50 font-nunito leading-relaxed mb-6">
                  {t(descKey)}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Interactive mini-demo */}
            <div className="mb-6">
              <MiniDemo step={step} color={currentStep.color} />
            </div>

            {/* Buttons */}
            <div className="flex gap-2.5">
              {step > 0 ? (
                <button
                  onClick={handlePrev}
                  className="flex-1 py-2.5 rounded-xl bg-cream/[0.05] border border-cream/[0.08] text-cream/60 text-sm font-nunito hover:bg-cream/[0.08] transition-colors"
                >
                  {t("tutorial.prev")}
                </button>
              ) : (
                <button
                  onClick={handleSkip}
                  className="flex-1 py-2.5 rounded-xl bg-cream/[0.05] border border-cream/[0.08] text-cream/60 text-sm font-nunito hover:bg-cream/[0.08] transition-colors"
                >
                  {t("tutorial.skip")}
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex-1 py-2.5 rounded-xl bg-gold text-dark text-sm font-bold font-nunito hover:bg-gold/90 transition-colors"
              >
                {step < STEPS.length - 1 ? t("tutorial.next") : t("tutorial.start")}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Tutorial icon renderer
function TutorialIcon({ icon, color }: { icon: string; color: string }) {
  const s = 24;
  switch (icon) {
    case "create":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "group":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="7" r="3" stroke={color} strokeWidth="1.5" />
          <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke={color} strokeWidth="1.5" />
          <circle cx="17" cy="7" r="3" stroke={color} strokeWidth="1.5" />
          <path d="M21 21v-2a4 4 0 00-3-3.87" stroke={color} strokeWidth="1.5" />
        </svg>
      );
    case "card":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="1.5" />
          <text x="12" y="15" textAnchor="middle" fill={color} fontSize="8" fontWeight="700">?</text>
        </svg>
      );
    case "clue":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path d="M8 6h8M8 10h8M8 14h5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="18" cy="18" r="4" stroke={color} strokeWidth="1.5" />
          <path d="M20.5 20.5L22 22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "discuss":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke={color} strokeWidth="1.5" />
        </svg>
      );
    case "vote":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="1.5" />
          <path d="M8 12l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.5" />
        </svg>
      );
  }
}

// Mini demo animation for each step
function MiniDemo({ step, color }: { step: number; color: string }) {
  switch (step) {
    case 0: // Create room
      return (
        <div className="flex justify-center gap-2">
          <motion.div
            className="w-12 h-8 rounded-lg bg-cream/[0.04] border border-cream/[0.08] flex items-center justify-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-[8px] text-gold font-mono">A7X2</span>
          </motion.div>
          <motion.div
            className="w-8 h-8 rounded-lg bg-cream/[0.04] border border-cream/[0.08] flex items-center justify-center"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg width="12" height="12" viewBox="0 0 20 20">
              <path d="M5 10l3 3 7-7" fill="none" stroke="#B8D4A8" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.div>
        </div>
      );
    case 1: // Join players
      return (
        <div className="flex justify-center gap-1">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-bold"
              style={{
                backgroundColor: `${color}15`,
                color: color,
                border: `1px solid ${color}30`,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.3, type: "spring" }}
            >
              {String.fromCharCode(65 + i)}
            </motion.div>
          ))}
        </div>
      );
    case 2: // Card flip
      return (
        <motion.div
          className="w-16 h-24 rounded-lg bg-[#1A1A18] border border-gold/20 flex items-center justify-center"
          animate={{ rotateY: [0, 180, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <span className="text-[10px] text-gold">?</span>
        </motion.div>
      );
    case 3: // Clue
      return (
        <div className="flex justify-center gap-2">
          {["Qırmızı", "Yuvarlaq", "Şirin"].map((clue, i) => (
            <motion.span
              key={i}
              className="px-2 py-1 rounded-lg bg-cream/[0.04] border border-cream/[0.08] text-[9px] text-cream/60"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.5 }}
            >
              {clue}
            </motion.span>
          ))}
        </div>
      );
    case 4: // Discuss
      return (
        <div className="space-y-1 text-left">
          {[
            { name: "A", msg: "Məncə C imposterdir" },
            { name: "B", msg: "D şübhəli görünür" },
          ].map((m, i) => (
            <motion.div
              key={i}
              className="flex gap-1.5 items-center"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.6 }}
            >
              <span className="text-[8px] text-gold font-medium w-3">{m.name}:</span>
              <span className="text-[8px] text-cream/40">{m.msg}</span>
            </motion.div>
          ))}
        </div>
      );
    case 5: // Vote
      return (
        <div className="flex justify-center gap-3">
          {["A", "B", "C", "D"].map((letter, i) => (
            <motion.div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold border ${
                i === 2
                  ? "bg-green/10 border-green/30 text-green"
                  : "bg-cream/[0.04] border-cream/[0.08] text-cream/40"
              }`}
              animate={i === 2 ? { scale: [1, 1.15, 1] } : {}}
              transition={i === 2 ? { duration: 1.5, repeat: Infinity } : {}}
            >
              {letter}
              {i === 2 && (
                <motion.span
                  className="absolute -top-1 -right-1 text-[6px]"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1 }}
                >
                  ✓
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>
      );
    default:
      return null;
  }
}
