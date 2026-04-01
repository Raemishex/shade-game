"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { isFS5Active } from "@/lib/fs5";
import FS5Modal from "@/components/game/FS5Modal";
import { useTranslation } from "@/hooks/useTranslation";

export default function ModesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [fs5Active, setFs5Active] = useState(() => {
    if (typeof window === "undefined") return false;
    return isFS5Active();
  });
  const [fs5ModalOpen, setFs5ModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark pb-24">
      <motion.div
        className="px-6 pt-6"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Header */}
        <motion.div className="mb-6" variants={staggerItem}>
          <h1 className="text-xl font-medium text-cream font-nunito">
            {t("modes.title")}
          </h1>
          <div
            className="w-8 h-[1px] mt-2"
            style={{
              background:
                "linear-gradient(90deg, #C8A44E, transparent)",
            }}
          />
        </motion.div>

        {/* Mode cards */}
        <div className="space-y-3 max-w-lg">
          {/* Troll Mode */}
          <motion.div
            className="p-4 rounded-xl bg-cream/[0.03] border border-cream/[0.06] flex items-start gap-4"
            variants={staggerItem}
          >
            <div className="w-12 h-12 rounded-xl bg-orange/[0.08] border border-orange/[0.12] flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#E0C4A8" strokeWidth="1.2" />
                <circle cx="9" cy="10" r="1.5" fill="#E0C4A8" />
                <circle cx="15" cy="10" r="1.5" fill="#E0C4A8" />
                <path d="M8 15c1 1.5 3 2 4 2s3-.5 4-2" stroke="#E0C4A8" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[14px] font-medium text-cream font-nunito">
                  {t("modes.trollMode")}
                </h3>
                <span className="text-[9px] text-cream/50 border border-cream/10 px-2 py-0.5 rounded-full">
                  {t("modes.comingSoon")}
                </span>
              </div>
              <p className="text-[11px] text-cream/50 font-nunito leading-relaxed">
                {t("modes.trollModeDesc")}
              </p>
            </div>
          </motion.div>

          {/* FS5 Mode */}
          <motion.button
            className="w-full p-4 rounded-xl bg-gold/[0.03] border border-gold/[0.1] flex items-start gap-4 text-left hover:bg-gold/[0.06] transition-colors"
            variants={staggerItem}
            onClick={() => setFs5ModalOpen(true)}
          >
            <div className="w-12 h-12 rounded-xl bg-gold/[0.08] border border-gold/[0.15] flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L3 6v8l7 4 7-4V6l-7-4z" stroke="#C8A44E" strokeWidth="1.2" strokeLinejoin="round" />
                <text x="10" y="13" textAnchor="middle" fill="#C8A44E" fontSize="6" fontWeight="700">FS5</text>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[14px] font-medium text-gold font-nunito">
                  {t("modes.fs5Mode")}
                </h3>
                {fs5Active && (
                  <span className="text-[9px] text-green border border-green/20 bg-green/5 px-2 py-0.5 rounded-full">
                    {t("modes.active")}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-cream/50 font-nunito leading-relaxed">
                {t("modes.fs5ModeDesc")}
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 20 20" className="shrink-0 mt-1">
              <path d="M7 4l6 6-6 6" fill="none" stroke="#C8A44E" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            </svg>
          </motion.button>

          {/* Tournament Mode */}
          <motion.button
            className="w-full p-4 rounded-xl bg-orange/[0.03] border border-orange/[0.1] flex items-start gap-4 text-left hover:bg-orange/[0.06] transition-colors"
            variants={staggerItem}
            onClick={() => router.push("/tournament")}
          >
            <div className="w-12 h-12 rounded-xl bg-orange/[0.08] border border-orange/[0.15] flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L12.5 7L18 8L14 12L15 18L10 15L5 18L6 12L2 8L7.5 7L10 2Z" stroke="#E0C4A8" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-medium text-cream font-nunito mb-1">
                {t("modes.tournament")}
              </h3>
              <p className="text-[11px] text-cream/50 font-nunito leading-relaxed">
                {t("modes.tournamentDesc")}
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 20 20" className="shrink-0 mt-1">
              <path d="M7 4l6 6-6 6" fill="none" stroke="#E0C4A8" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            </svg>
          </motion.button>

          {/* Replay System */}
          <motion.button
            className="w-full p-4 rounded-xl bg-blue/[0.03] border border-blue/[0.1] flex items-start gap-4 text-left hover:bg-blue/[0.06] transition-colors"
            variants={staggerItem}
            onClick={() => router.push("/replay")}
          >
            <div className="w-12 h-12 rounded-xl bg-blue/[0.08] border border-blue/[0.15] flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7" stroke="#A8C4E0" strokeWidth="1.2" />
                <polygon points="9,7 14,10 9,13" fill="none" stroke="#A8C4E0" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-medium text-cream font-nunito mb-1">
                {t("modes.replay")}
              </h3>
              <p className="text-[11px] text-cream/50 font-nunito leading-relaxed">
                {t("modes.replayDesc")}
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 20 20" className="shrink-0 mt-1">
              <path d="M7 4l6 6-6 6" fill="none" stroke="#A8C4E0" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            </svg>
          </motion.button>

          {/* Troll Mode placeholder */}
          <motion.div
            className="p-4 rounded-xl border border-dashed border-cream/[0.06] flex items-center gap-4 opacity-40"
            variants={staggerItem}
          >
            <div className="w-12 h-12 rounded-xl bg-cream/[0.03] border border-cream/[0.06] flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="#888" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-cream/50 font-nunito">
                {t("modes.comingSoon")}
              </h3>
              <p className="text-[11px] text-cream/50 font-nunito mt-0.5">
                {t("modes.comingSoonDesc")}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* FS5 Modal */}
      <FS5Modal
        isOpen={fs5ModalOpen}
        onClose={() => setFs5ModalOpen(false)}
        onActivated={() => setFs5Active(isFS5Active())}
      />
    </div>
  );
}
