"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { activateFS5, isFS5Active, deactivateFS5, getFS5RemainingDays } from "@/lib/fs5";
import { useTranslation } from "@/hooks/useTranslation";

interface FS5ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated: () => void;
}

export default function FS5Modal({ isOpen, onClose, onActivated }: FS5ModalProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const active = isFS5Active();
  const remainingDays = getFS5RemainingDays();

  const handleSubmit = () => {
    setError("");
    if (!code.trim()) {
      setError(t("fs5.enterCode"));
      return;
    }
    const ok = activateFS5(code);
    if (ok) {
      setSuccess(true);
      onActivated();
      setTimeout(() => {
        setSuccess(false);
        setCode("");
        onClose();
      }, 1500);
    } else {
      setError(t("fs5.wrongCode"));
    }
  };

  const handleDeactivate = () => {
    deactivateFS5();
    onActivated();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            {/* Header */}
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-3">
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L3 6v8l7 4 7-4V6l-7-4z" stroke="#C8A44E" strokeWidth="1.2" strokeLinejoin="round" />
                  <text x="10" y="13" textAnchor="middle" fill="#C8A44E" fontSize="6" fontWeight="700">FS5</text>
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-cream font-nunito">{t("fs5.title")}</h2>
              <p className="text-[11px] text-cream/50 font-nunito mt-1">
                {active
                  ? t("fs5.activeRemaining", { days: String(remainingDays) })
                  : t("fs5.activateDesc")}
              </p>
            </div>

            {success ? (
              <motion.div
                className="text-center py-4"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <div className="w-14 h-14 rounded-full bg-green/10 border border-green/20 flex items-center justify-center mx-auto mb-3">
                  <svg width="24" height="24" viewBox="0 0 20 20">
                    <path d="M5 10l3 3 7-7" fill="none" stroke="#B8D4A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-green text-sm font-medium font-nunito">{t("fs5.activated")}</p>
              </motion.div>
            ) : active ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-gold/[0.04] border border-gold/10">
                  <p className="text-[11px] text-cream/50 font-nunito mb-1">{t("fs5.specialCategory")}</p>
                  <p className="text-gold text-sm font-medium font-nunito">{t("fs5.programming")}</p>
                </div>
                <div className="p-3 rounded-xl bg-gold/[0.04] border border-gold/10">
                  <p className="text-[11px] text-cream/50 font-nunito mb-1">{t("fs5.roleNames")}</p>
                  <div className="flex gap-3">
                    <span className="text-green text-sm font-medium font-nunito">Zorbalayıcı</span>
                    <span className="text-cream/20">/</span>
                    <span className="text-red text-sm font-medium font-nunito">Şübhəli</span>
                  </div>
                </div>
                <button
                  onClick={handleDeactivate}
                  className="w-full py-2.5 rounded-xl bg-red/10 border border-red/20 text-red text-xs font-medium font-nunito hover:bg-red/15 transition-colors"
                >
                  {t("fs5.deactivate")}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError("");
                  }}
                  placeholder={t("fs5.enterCode")}
                  maxLength={12}
                  className="w-full px-4 py-3 rounded-xl bg-cream/[0.03] border border-cream/[0.08] text-cream text-center text-lg tracking-[4px] font-medium font-nunito placeholder:text-cream/20 placeholder:tracking-normal placeholder:text-sm focus:outline-none focus:border-gold/30"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  autoFocus
                />
                {error && (
                  <motion.p
                    className="text-red text-xs text-center font-nunito"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.p>
                )}
                <button
                  onClick={handleSubmit}
                  className="w-full py-3 rounded-xl bg-gold/10 border border-gold/20 text-gold text-sm font-semibold font-nunito hover:bg-gold/15 transition-colors"
                >
                  {t("fs5.activate")}
                </button>
              </div>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="w-full mt-3 py-2 text-cream/30 text-xs font-nunito hover:text-cream/50 transition-colors"
            >
              {t("fs5.close")}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
