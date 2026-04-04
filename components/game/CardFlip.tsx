"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isFS5Active, getRoleName } from "@/lib/fs5";
import { useTranslation } from "@/hooks/useTranslation";

interface CardFlipProps {
  word: string | null;
  category: string;
  role: "citizen" | "imposter";
  onViewed?: () => void;
  onClose?: () => void;
}

export default function CardFlip({ word, category, role, onViewed, onClose }: CardFlipProps) {
  const { t } = useTranslation();
  const fs5 = isFS5Active();
  const roleName = getRoleName(role, fs5);
  const [stage, setStage] = useState<"hint" | "card" | "done">("hint");
  const [isFlipped, setIsFlipped] = useState(false);
  const hasViewed = useRef(false);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleShowCard = useCallback(() => {
    setStage("card");
  }, []);

  const handleFlipIn = useCallback(() => {
    if (stage !== "card") return;
    // BUG 3.3 fix: əvvəlki done timer-i təmizlə
    if (doneTimerRef.current) {
      clearTimeout(doneTimerRef.current);
      doneTimerRef.current = null;
    }
    setIsFlipped(true);
    if (!hasViewed.current) {
      hasViewed.current = true;
      onViewed?.();
    }
  }, [stage, onViewed]);

  const handleFlipOut = useCallback(() => {
    if (!isFlipped) return;
    setIsFlipped(false);
    // Kart bağlandıqdan sonra done (rapid flip üçün əvvəlki timer-i təmizlə)
    if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    doneTimerRef.current = setTimeout(() => {
      setStage("done");
      onClose?.();
    }, 500);
  }, [isFlipped, onClose]);

  // İlk toxunma hint ekranı
  if (stage === "hint") {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark/95 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={handleShowCard}
      >
        {/* Dairəvi ikon */}
        <motion.div
          className="w-10 h-10 rounded-full border border-gold/30 border-dashed flex items-center justify-center mb-3.5"
          animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-3 h-3 rounded-full border border-gold/50" />
        </motion.div>
        <p className="text-[15px] text-cream font-medium font-nunito text-center leading-relaxed">
          {t("card.touchToSee")}
          <br />
          {t("card.tapScreen")}
        </p>
        <p className="text-[11px] text-cream/50 mt-1.5 font-nunito">
          {t("card.onlyYou")}
        </p>
      </motion.div>
    );
  }

  // Done — komponent bağlanır
  if (stage === "done") {
    return null;
  }

  // Kart ekranı
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-dark/80 backdrop-blur-md" />

      {/* Sparkle particles */}
      <AnimatePresence>
        {isFlipped && (
          <>
            {[
              { top: "16%", left: "20%", size: 4, delay: 0.1 },
              { top: "24%", right: "18%", size: 3, delay: 0.5 },
              { bottom: "22%", left: "18%", size: 4, delay: 0.9 },
              { bottom: "28%", right: "20%", size: 3, delay: 1.3 },
            ].map((sp, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-gold z-[51]"
                style={{
                  width: sp.size,
                  height: sp.size,
                  top: sp.top,
                  left: sp.left,
                  right: sp.right,
                  bottom: sp.bottom,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: sp.delay }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Card container */}
      <div style={{ perspective: 1200 }} className="relative z-[52]">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="w-[260px] h-[380px] relative cursor-pointer select-none"
            style={{ transformStyle: "preserve-3d", touchAction: "none", WebkitUserSelect: "none" }}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{
              duration: isFlipped ? 0.6 : 0.4,
              ease: [0.4, 0, 0.2, 1],
            }}
            onMouseDown={(e) => { e.preventDefault(); handleFlipIn(); }}
            onMouseUp={(e) => { e.preventDefault(); handleFlipOut(); }}
            onMouseLeave={handleFlipOut}
            onTouchStart={(e) => { e.preventDefault(); handleFlipIn(); }}
            onTouchEnd={(e) => { e.preventDefault(); handleFlipOut(); }}
          >
            {/* ARXA ÜZ */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden border border-gold/20"
              style={{
                backfaceVisibility: "hidden",
                background: "linear-gradient(145deg, #1a1816 0%, #141210 50%, #0f0e0c 100%)",
              }}
            >
              {/* İç border */}
              <div className="absolute inset-[7px] rounded-xl border border-gold/[0.08]" />

              {/* 4 köşə ornamenti */}
              <div className="absolute top-[14px] left-[14px] w-[18px] h-[18px] border-t border-l border-gold/[0.15] rounded-tl" />
              <div className="absolute top-[14px] right-[14px] w-[18px] h-[18px] border-t border-r border-gold/[0.15] rounded-tr" />
              <div className="absolute bottom-[14px] left-[14px] w-[18px] h-[18px] border-b border-l border-gold/[0.15] rounded-bl" />
              <div className="absolute bottom-[14px] right-[14px] w-[18px] h-[18px] border-b border-r border-gold/[0.15] rounded-br" />

              {/* Shimmer */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <motion.div
                  className="absolute top-0 h-full w-[60%]"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(200,164,78,0.04), transparent)",
                  }}
                  animate={{ left: ["-100%", "100%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                {/* Ring with fox eyes */}
                <div className="relative w-[110px] h-[110px] rounded-full border border-gold/25 flex items-center justify-center mb-[18px]">
                  {/* Ring glow */}
                  <motion.div
                    className="absolute w-[130px] h-[130px] rounded-full border border-gold/[0.08]"
                    animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.08, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />

                  {/* Fox eyes SVG */}
                  <motion.svg
                    width="66"
                    height="66"
                    viewBox="0 0 120 120"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <g transform="translate(60,58)">
                      {/* Ears */}
                      <path d="M-18,-16 L-26,-32 L-10,-20Z" fill="#C8A44E" opacity="0.55" />
                      <path d="M18,-16 L26,-32 L10,-20Z" fill="#C8A44E" opacity="0.55" />
                      {/* Left eye */}
                      <motion.g
                        style={{ transformOrigin: "-10px -5px" }}
                        animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
                        transition={{
                          duration: 7,
                          repeat: Infinity,
                          times: [0, 0.4, 0.42, 0.44, 1],
                        }}
                      >
                        <ellipse cx="-10" cy="-5" rx="6" ry="3.5" fill="#C8A44E" />
                        <ellipse cx="-9" cy="-5.5" rx="2.5" ry="2.5" fill="#E8E4D8" />
                        <ellipse cx="-8.5" cy="-5.5" rx="1.2" ry="1.5" fill="#141210" />
                      </motion.g>
                      {/* Right eye */}
                      <motion.g
                        style={{ transformOrigin: "10px -5px" }}
                        animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
                        transition={{
                          duration: 7,
                          repeat: Infinity,
                          delay: 0.3,
                          times: [0, 0.4, 0.42, 0.44, 1],
                        }}
                      >
                        <ellipse cx="10" cy="-5" rx="6" ry="3.5" fill="#C8A44E" />
                        <ellipse cx="11" cy="-5.5" rx="2.5" ry="2.5" fill="#E8E4D8" />
                        <ellipse cx="11.5" cy="-5.5" rx="1.2" ry="1.5" fill="#141210" />
                      </motion.g>
                    </g>
                  </motion.svg>
                </div>

                {/* SHADE text */}
                <p className="text-[22px] font-medium text-gold tracking-[6px] uppercase mb-1">
                  SHADE
                </p>
                {/* Divider */}
                <div
                  className="w-11 h-[0.5px] my-3"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(200,164,78,0.3), transparent)",
                  }}
                />
                <p className="text-[10px] text-gold/40 tracking-[3px] uppercase">word game</p>
                {/* Category */}
                <p className="text-[11px] text-gold/50 tracking-wider mt-[18px]">{category}</p>
              </div>
            </div>

            {/* ÖN ÜZ */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden border border-[#b9af94]/30"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                background:
                  "linear-gradient(155deg, #f8f3e8 0%, #f0ead8 35%, #e8e2cf 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,252,245,0.5)",
              }}
            >
              {/* Fold lines */}
              <div
                className="absolute left-[10px] right-[10px] h-[1px]"
                style={{ top: "25%", background: "rgba(148,138,112,0.08)" }}
              />
              <div
                className="absolute left-[10px] right-[10px] h-[1px]"
                style={{ top: "50%", background: "rgba(148,138,112,0.08)" }}
              />
              <div
                className="absolute left-[10px] right-[10px] h-[1px]"
                style={{ top: "75%", background: "rgba(148,138,112,0.08)" }}
              />
              <div
                className="absolute top-[10px] bottom-[10px] w-[1px]"
                style={{ left: "50%", background: "rgba(148,138,112,0.08)" }}
              />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-7">
                {/* Logo */}
                <p className="text-[8px] text-[#b8a878] tracking-[4px] uppercase opacity-40 mb-2">
                  shade
                </p>
                {/* Line */}
                <div
                  className="w-8 h-[0.5px] mb-[18px]"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, #b8a070, transparent)",
                  }}
                />
                {/* Category */}
                <p className="text-[12px] font-medium text-[#8B7744] tracking-[2px] uppercase mb-2">
                  {category}
                </p>
                {/* Divider */}
                <div
                  className="w-11 h-[1px] mb-4"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, #a89868, transparent)",
                  }}
                />
                {/* Word or "?" */}
                <p className="text-[40px] font-medium text-[#2C2010] tracking-wider mb-5">
                  {role === "citizen" ? word : "?"}
                </p>
                {/* Role badge */}
                <div>
                  <span
                    className={`text-[12px] font-medium px-5 py-1.5 rounded-2xl tracking-wider border ${
                      role === "citizen"
                        ? "bg-[#3C6B38]/10 text-[#3C6B38] border-[#3C6B38]/[0.18]"
                        : "bg-[#E8593C]/10 text-[#E8593C] border-[#E8593C]/[0.18]"
                    }`}
                  >
                    {roleName}
                  </span>
                </div>
                {/* Footer */}
                <div className="mt-[18px] pt-3 border-t border-[#a09678]/10">
                  <p className="text-[8px] text-[#a89878] tracking-[2px] uppercase">
                    {t("card.dontShow")}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Hold hint */}
      <AnimatePresence>
        {!isFlipped && (
          <motion.div
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[53] text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="w-10 h-10 mx-auto mb-2 rounded-full border-[1.5px] border-gold/25 flex items-center justify-center"
              animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <svg width="18" height="18" viewBox="0 0 20 20">
                <path
                  d="M10 2C8 2 6.5 3.5 6.5 5.5V9H6C5 9 4 10 4 11V15C4 17 5.5 18 7 18H13C14.5 18 16 17 16 15V11C16 10 15 9 14 9H13.5V5.5C13.5 3.5 12 2 10 2ZM8.5 5.5C8.5 4.5 9.2 4 10 4S11.5 4.5 11.5 5.5V9H8.5V5.5Z"
                  fill="none"
                  stroke="#C8A44E"
                  strokeWidth="1"
                />
              </svg>
            </motion.div>
            <p className="text-[11px] text-cream/50 tracking-wider font-nunito">
              {t("card.holdToSee")}
            </p>
            <p className="text-[11px] text-cream/50 mt-0.5 font-nunito">
              {t("card.releasesToClose")}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
