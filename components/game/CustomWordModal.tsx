"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { getGuestUser } from "@/lib/guest";

interface CustomWordModalProps {
  isOpen: boolean;
  category: string;
  categoryName: string;
  onClose: () => void;
  onWordAdded?: (word: string) => void;
}

export default function CustomWordModal({
  isOpen,
  category,
  categoryName,
  onClose,
  onWordAdded,
}: CustomWordModalProps) {
  const { t } = useTranslation();
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async () => {
    const trimmed = word.trim();
    if (trimmed.length < 2) {
      setError(t("customWord.minError"));
      return;
    }
    if (trimmed.length > 30) {
      setError(t("customWord.maxError"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const guest = getGuestUser();
      const res = await fetch("/api/words/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: trimmed,
          category,
          createdBy: guest.userId,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || t("customWordaddError"));
        setLoading(false);
        return;
      }

      setSuccess(true);
      setWord("");
      onWordAdded?.(trimmed);

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch {
      setError(t("customWord.connectionError"));
      setLoading(false);
    }
  }, [word, category, onWordAdded, onClose, t]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !loading) handleSubmit();
    },
    [handleSubmit, loading]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-dark/80 backdrop-blur-sm px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-sm bg-[#1A1A18] border border-gold/20 rounded-2xl p-6"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {success ? (
            <motion.div
              className="text-center py-4"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              <div className="w-12 h-12 rounded-full bg-green/10 border border-green/20 flex items-center justify-center mx-auto mb-3">
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M5 10l3 3 7-7"
                    stroke="#B8D4A8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-green font-medium font-nunito">{t("customWord.added")}</p>
            </motion.div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-cream font-nunito mb-1 text-center">
                {t("customWord.title")}
              </h2>
              <p className="text-[11px] text-cream/50 font-nunito text-center mb-4">
                {categoryName}
              </p>

              <div className="mb-3">
                <input
                  type="text"
                  value={word}
                  onChange={(e) => {
                    setWord(e.target.value);
                    setError("");
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={t("customWord.placeholder")}
                  maxLength={30}
                  autoFocus
                  className="w-full bg-cream/[0.04] border border-gold/[0.15] rounded-xl px-4 py-3 text-cream text-sm font-nunito outline-none focus:border-gold/30 transition-colors placeholder:text-cream/20"
                />
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-red font-nunito">{error}</span>
                  <span className="text-[10px] text-cream/30 font-nunito">
                    {word.length}/30
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-cream/[0.05] border border-cream/[0.08] text-cream/60 text-sm font-nunito hover:bg-cream/[0.08] transition-colors"
                >
                  {t("customWord.cancel")}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || word.trim().length < 2}
                  className="flex-1 py-2.5 rounded-xl bg-gold text-dark text-sm font-bold font-nunito hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        className="w-4 h-4 border-2 border-dark/30 border-t-dark rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    </span>
                  ) : (
                    t("customWord.add")
                  )}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
