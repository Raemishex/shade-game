"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/animations";
import { Button } from "@/components/ui";
import FoxLogo from "@/components/ui/FoxLogo";
import JoinGameModal from "@/components/game/JoinGameModal";
import FS5Modal from "@/components/game/FS5Modal";
import InteractiveTutorial from "@/components/game/InteractiveTutorial";
import { isFS5Active } from "@/lib/fs5";
import SoundManager from "@/lib/sounds";
import { useTranslation } from "@/hooks/useTranslation";
import { getGuestUser } from "@/lib/guest";
import { getDailyChallenge, getTimeUntilReset, type DailyChallenge } from "@/lib/daily";

function SimpleModal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
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
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [soundOn, setSoundOn] = useState(true);
  // mounted state removed — only side effects needed
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [fs5ModalOpen, setFs5ModalOpen] = useState(false);
  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [fs5Active, setFs5Active] = useState(false);

  const [userStats, setUserStats] = useState({
    totalGames: 0,
    wins: 0,
    winRate: 0,
    level: 1,
    xp: 0,
  });
  const [recentGames, setRecentGames] = useState<Array<{
    id: string;
    word: string;
    result: string;
    date: string;
  }>>([]);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [timeLeft, setTimeLeft] = useState("23s 59d");
  const [tutorialOpen, setTutorialOpen] = useState(false);

  useEffect(() => {
    setSoundOn(!SoundManager.getInstance().muted);
    setFs5Active(isFS5Active());
  }, []);

  useEffect(() => {
    // İlk dəfə girən istifadəçi üçün tutorial göstər
    const tutorialDone = localStorage.getItem("shade_tutorial_done");
    if (!tutorialDone) {
      const timer = setTimeout(() => setTutorialOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    setDailyChallenge(getDailyChallenge());
    setTimeLeft(getTimeUntilReset());

    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilReset());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const guest = getGuestUser();

    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          const stats = data.user.stats || {};
          const totalGames = stats.totalGames || 0;
          const wins = stats.wins || 0;
          setUserStats({
            totalGames,
            wins,
            winRate: totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0,
            level: data.user.level || 1,
            xp: data.user.xp || 0,
          });
        }
      })
      .catch(() => {});

    fetch(`/api/users/${guest.userId}/history?limit=3`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.history?.length) {
          setRecentGames(data.history.slice(0, 3));
        }
      })
      .catch(() => {});
  }, []);

  // Auto-open how-to-play from NavBar ? button (via custom event)
  useEffect(() => {
    const handler = () => setHowToPlayOpen(true);
    window.addEventListener("shade:howtoplay", handler);
    return () => window.removeEventListener("shade:howtoplay", handler);
  }, []);

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-dark"
      variants={pageTransition}
      initial="initial"
      animate="animate"
    >
      {/* Top bar — sound & info */}
      <div className="flex justify-between items-center px-6 pt-4 pb-2">
        <button
          onClick={() => {
            const sm = SoundManager.getInstance();
            const nowMuted = sm.toggleMute();
            setSoundOn(!nowMuted);
          }}
          aria-label={t("profile.sound")}
          className="w-9 h-9 rounded-[10px] bg-gold/5 border border-gold/10 flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path
              d="M3 8v4h3l4 4V4L6 8H3z"
              stroke="#C8A44E"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {soundOn ? (
              <>
                <path d="M14 6.5c.8.8.8 2.1 0 3" stroke="#C8A44E" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
                <path d="M16 4.5c1.6 1.6 1.6 4.2 0 5.8" stroke="#C8A44E" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
              </>
            ) : (
              <path d="M14 7l4 4M18 7l-4 4" stroke="#E8593C" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
            )}
          </svg>
        </button>

        <button
          onClick={() => setHowToPlayOpen(true)}
          aria-label={t("home.howToPlay")}
          className="w-9 h-9 rounded-[10px] bg-gold/5 border border-gold/10 flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="#C8A44E" strokeWidth="1" />
            <text x="10" y="14" textAnchor="middle" fill="#C8A44E" fontSize="10" fontWeight="500">?</text>
          </svg>
        </button>
      </div>

      {/* Main content — tablet: 2 panel */}
      <div className="flex-1 flex flex-col md:flex-row md:items-start md:max-w-4xl md:mx-auto md:gap-8 md:w-full lg:max-w-7xl lg:gap-12 items-center px-6 pt-2 pb-4">
      {/* Left panel */}
      <div className="flex flex-col items-center md:flex-1 md:pt-8 w-full md:max-w-md lg:max-w-lg lg:pt-12">
        {/* Logo */}
        <FoxLogo size={80} className="mb-2 lg:scale-110" />

        {/* SHADE text */}
        <h1
          className="text-[26px] lg:text-[32px] font-medium tracking-[6px] uppercase mb-1 font-nunito"
          style={{ color: "#E8E4D8" }}
        >
          SHADE
        </h1>

        {/* Shimmer line */}
        <div className="w-10 h-[1px] mb-1.5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gold/30" />
          <motion.div
            className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-gold/70 to-transparent"
            animate={{ x: [-32, 48] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Subtitle */}
        <p className="text-gold text-[10px] tracking-[3px] uppercase mb-5 font-nunito">
          {t("app.subtitle")}
        </p>

        {/* Daily Challenge Banner */}
        <motion.div
          className="w-full max-w-sm mb-4 px-4 py-3.5 rounded-xl bg-gold/[0.03] border border-gold/10
                     flex items-center gap-3"
          animate={{ boxShadow: ["0 0 0 rgba(200,164,78,0)", "0 0 16px rgba(200,164,78,0.08)", "0 0 0 rgba(200,164,78,0)"] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Clock icon */}
          <div className="w-10 h-10 rounded-[10px] bg-gold/[0.08] flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="#C8A44E" strokeWidth="1" />
              <path d="M10 5v5l3 2" stroke="#C8A44E" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>
          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-gold text-[13px] font-medium font-nunito">
              {dailyChallenge?.isCompleted
                ? t("dailyChallenge.completed")
                : t("home.dailyChallenge")}
            </p>
            <p className="text-cream/50 text-[10px] font-nunito mt-0.5">
              {dailyChallenge
                ? `${locale === "en" ? dailyChallenge.categoryNameEn : dailyChallenge.categoryNameAz} · +${dailyChallenge.bonusXp} XP`
                : t("home.dailyChallengeDesc")}
            </p>
          </div>
          {/* Play button */}
          <button
            onClick={() => setDailyModalOpen(true)}
            className={`text-[10px] border px-3.5 py-1.5 rounded-lg shrink-0 font-nunito transition-colors ${
              dailyChallenge?.isCompleted
                ? "text-green border-green/20 bg-green/5"
                : "text-gold border-gold/20 hover:bg-gold/5 hover:border-gold/30"
            }`}
          >
            {dailyChallenge?.isCompleted ? "✓" : t("home.play")}
          </button>
        </motion.div>

        {/* Button stack */}
        <motion.div
          className="w-full max-w-sm space-y-2.5 mb-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={staggerItem}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => router.push("/lobby/create")}
            >
              {t("home.newGame")}
            </Button>
          </motion.div>

          <motion.div variants={staggerItem}>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => setJoinModalOpen(true)}
            >
              {t("home.joinGame")}
            </Button>
          </motion.div>

          <motion.div variants={staggerItem}>
            <Button
              variant="gold"
              size="md"
              fullWidth
              className={`text-xs tracking-wider ${fs5Active ? "border-gold/60" : ""}`}
              onClick={() => setFs5ModalOpen(true)}
            >
              {fs5Active ? t("home.fs5ModeActive") : t("home.fs5Mode")}
            </Button>
          </motion.div>

          <motion.div variants={staggerItem}>
            <button
              onClick={() => setHowToPlayOpen(true)}
              className="w-full py-3 rounded-xl bg-transparent text-cream/50 text-xs border border-cream/10 flex items-center justify-center gap-2 font-nunito hover:bg-cream/5 transition-colors active:scale-[0.97]"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M4 4h12M4 10h12M4 16h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              {t("home.howToPlay")}
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Right panel — tablet only: stats & recent */}
      <div className="hidden md:flex md:flex-1 md:flex-col md:pt-8 md:max-w-sm lg:max-w-md lg:pt-12">
        {/* Stats preview */}
        <div className="bg-cream/[0.03] border border-cream/[0.06] rounded-xl p-5 mb-4">
          <h3 className="text-[10px] text-cream/50 tracking-[1.5px] uppercase mb-3">{t("home.stats")}</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t("home.games"), value: String(userStats.totalGames) },
              { label: t("home.wins"), value: `${userStats.winRate}%` },
              { label: t("home.level"), value: String(userStats.level) },
              { label: "XP", value: String(userStats.xp) },
            ].map((s) => (
              <div key={s.label} className="bg-cream/[0.02] rounded-lg p-3 text-center transition-colors lg:hover:bg-cream/[0.04]">
                <div className="text-lg font-medium text-gold">{s.value}</div>
                <div className="text-[8px] text-cream/50 tracking-wider uppercase mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent games placeholder */}
        <div className="bg-cream/[0.03] border border-cream/[0.06] rounded-xl p-5">
          <h3 className="text-[10px] text-cream/50 tracking-[1.5px] uppercase mb-3">{t("home.recentGames")}</h3>
          {recentGames.length > 0 ? (
            <div className="space-y-2">
              {recentGames.map((game) => (
                <div key={game.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-cream/[0.02]">
                  <div>
                    <span className="text-[12px] text-cream/70 font-nunito">{game.word}</span>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    game.result === "win" ? "bg-green/10 text-green" : "bg-red/10 text-red"
                  }`}>
                    {game.result === "win" ? t("home.winShort") : t("home.loseShort")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-cream/20 text-xs text-center py-6">{t("home.noGamesYet")}</p>
          )}
        </div>
      </div>
      </div>

      {/* Join Game Modal */}
      <JoinGameModal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} />

      {/* FS5 Modal */}
      <FS5Modal
        isOpen={fs5ModalOpen}
        onClose={() => setFs5ModalOpen(false)}
        onActivated={() => setFs5Active(isFS5Active())}
      />

      {/* Daily Challenge Modal */}
      <SimpleModal isOpen={dailyModalOpen} onClose={() => setDailyModalOpen(false)}>
        <div className="text-center">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
            dailyChallenge?.isCompleted
              ? "bg-green/10 border border-green/20"
              : "bg-gold/10 border border-gold/20"
          }`}>
            {dailyChallenge?.isCompleted ? (
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                <path d="M5 10l3 3 7-7" stroke="#B8D4A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="#C8A44E" strokeWidth="1" />
                <path d="M10 5v5l3 2" stroke="#C8A44E" strokeWidth="1" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <h2 className="text-lg font-semibold text-cream font-nunito mb-2">
            {dailyChallenge?.isCompleted
              ? t("dailyChallenge.completed")
              : t("dailyChallenge.title")}
          </h2>
          {dailyChallenge && (
            <>
              <p className="text-[13px] text-gold font-medium font-nunito mb-1">
                {locale === "en" ? dailyChallenge.categoryNameEn : dailyChallenge.categoryNameAz}
              </p>
              <p className="text-[11px] text-cream/50 font-nunito mb-1">
                {dailyChallenge.isCompleted
                  ? t("dailyChallenge.desc")
                  : `${t("dailyChallenge.desc")} · +${dailyChallenge.bonusXp} XP`}
              </p>
              {!dailyChallenge.isCompleted && (
                <p className="text-[10px] text-cream/30 font-nunito mb-4">
                  {t("dailyChallenge.timeLeft")}: {timeLeft}
                </p>
              )}
            </>
          )}
          {dailyChallenge?.isCompleted ? (
            <button
              onClick={() => setDailyModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-cream/[0.05] border border-cream/[0.08] text-cream/60 text-sm font-nunito hover:bg-cream/[0.08] transition-colors"
            >
              {t("dailyChallenge.close")}
            </button>
          ) : (
            <button
              onClick={() => {
                setDailyModalOpen(false);
                if (dailyChallenge) {
                  localStorage.setItem("shade_daily_category", dailyChallenge.categoryId);
                }
                router.push("/lobby/create");
              }}
              className="w-full py-2.5 rounded-xl bg-gold text-dark text-sm font-bold font-nunito hover:bg-gold/90 transition-colors"
            >
              {t("home.newGame")}
            </button>
          )}
        </div>
      </SimpleModal>

      {/* How to Play Modal */}
      <SimpleModal isOpen={howToPlayOpen} onClose={() => setHowToPlayOpen(false)}>
        <div>
          <h2 className="text-lg font-semibold text-cream font-nunito mb-4 text-center">{t("howToPlay.title")}</h2>
          <div className="space-y-3 mb-4">
            {[
              { num: 1, title: t("howToPlay.step1title"), desc: t("howToPlay.step1desc"), color: "#C8A44E" },
              { num: 2, title: t("howToPlay.step2title"), desc: t("howToPlay.step2desc"), color: "#B8D4A8" },
              { num: 3, title: t("howToPlay.step3title"), desc: t("howToPlay.step3desc"), color: "#A8C4E0" },
              { num: 4, title: t("howToPlay.step4title"), desc: t("howToPlay.step4desc"), color: "#E0C4A8" },
              { num: 5, title: t("howToPlay.step5title"), desc: t("howToPlay.step5desc"), color: "#F0997B" },
              { num: 6, title: t("howToPlay.step6title"), desc: t("howToPlay.step6desc"), color: "#E8593C" },
            ].map((step) => (
              <div key={step.num} className="flex gap-3 items-start">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold font-nunito"
                  style={{ background: `${step.color}15`, color: step.color, border: `1px solid ${step.color}30` }}
                >
                  {step.num}
                </div>
                <div>
                  <p className="text-[12px] font-medium text-cream font-nunito">{step.title}</p>
                  <p className="text-[10px] text-cream/50 font-nunito mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setHowToPlayOpen(false)}
            className="w-full py-2.5 rounded-xl bg-gold/10 border border-gold/20 text-gold text-sm font-medium font-nunito hover:bg-gold/15 transition-colors"
          >
            {t("howToPlay.close")}
          </button>
        </div>
      </SimpleModal>

      {/* Interactive Tutorial */}
      <InteractiveTutorial
        isOpen={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
      />
    </motion.div>
  );
}
