"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { getGuestUser } from "@/lib/guest";
import SoundManager from "@/lib/sounds";
import { useTranslation, type Locale } from "@/hooks/useTranslation";
import Link from "next/link";

const AVATAR_COLORS = [
  "#C8A44E", "#B8D4A8", "#A8C4E0", "#E0C4A8",
  "#F0997B", "#D4A8E0", "#A8E0D4", "#E0A8B8",
];

interface UserSettings {
  id: string;
  displayName: string;
  avatarColor: string;
  email: string;
  isGuest: boolean;
  settings: {
    sound: boolean;
    musicVolume: number;
    sfxVolume: number;
    language: Locale;
    theme: "dark" | "light";
    pushNotifications: boolean;
    gameInvites: boolean;
  };
}

// Toggle component
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-10 h-[22px] rounded-full relative transition-colors ${on ? "bg-green/30" : "bg-cream/10"}`}
    >
      <div
        className={`w-[18px] h-[18px] rounded-full absolute top-[2px] transition-all ${
          on ? "left-[20px] bg-green" : "left-[2px] bg-cream/40"
        }`}
      />
    </button>
  );
}

// Volume slider
function VolumeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3 w-full">
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1 appearance-none bg-cream/10 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:cursor-pointer"
      />
      <span className="text-[11px] text-cream/50 w-8 text-right font-nunito">{value}%</span>
    </div>
  );
}

// Confirm modal
function ConfirmModal({
  isOpen,
  title,
  message,
  cancelText,
  confirmText,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  cancelText: string;
  confirmText: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-dark/80 backdrop-blur-sm px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="w-full max-w-sm bg-[#1A1A18] border border-red/20 rounded-2xl p-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-cream font-nunito mb-2">{title}</h3>
            <p className="text-[13px] text-cream/50 font-nunito mb-5">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl bg-cream/[0.05] border border-cream/[0.08] text-cream/60 text-sm font-nunito hover:bg-cream/[0.08] transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-2.5 rounded-xl bg-red/10 border border-red/20 text-red text-sm font-medium font-nunito hover:bg-red/15 transition-colors"
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();
  const [user, setUser] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [editName, setEditName] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [confirmModal, setConfirmModal] = useState<"history" | "account" | null>(null);

  // Password fields
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch("/api/auth/me", { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser({
              id: data.user.id || data.user._id,
              displayName: data.user.displayName,
              avatarColor: data.user.avatarColor || "#C8A44E",
              email: data.user.email || "",
              isGuest: false,
              settings: {
                sound: data.user.settings?.sound ?? true,
                musicVolume: data.user.settings?.musicVolume ?? 70,
                sfxVolume: data.user.settings?.sfxVolume ?? 80,
                language: (data.user.settings?.language as Locale) || locale,
                theme: data.user.settings?.theme || "dark",
                pushNotifications: data.user.settings?.pushNotifications ?? true,
                gameInvites: data.user.settings?.gameInvites ?? true,
              },
            });
            setEditName(data.user.displayName);
            setSelectedColor(data.user.avatarColor || "#C8A44E");
            setLoading(false);
            return;
          }
        }
      } catch {
        // fallback to guest
      }

      const guest = getGuestUser();
      setUser({
        id: guest.userId,
        displayName: guest.displayName,
        avatarColor: guest.avatarColor,
        email: "",
        isGuest: true,
        settings: {
          sound: true,
          musicVolume: 70,
          sfxVolume: 80,
          language: locale,
          theme: "dark",
          pushNotifications: true,
          gameInvites: true,
        },
      });
      setEditName(guest.displayName);
      setSelectedColor(guest.avatarColor);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showSaved = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);

  const updateRemote = useCallback(
    async (updates: Record<string, unknown>) => {
      if (!user || user.isGuest) return;
      try {
        await fetch(`/api/users/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
      } catch {
        // silent
      }
    },
    [user]
  );

  const handleSaveName = useCallback(async () => {
    if (!user || editName.trim().length < 2) return;
    setUser((prev) => prev ? { ...prev, displayName: editName.trim() } : prev);
    await updateRemote({ displayName: editName.trim() });
    showSaved();
  }, [user, editName, updateRemote, showSaved]);

  const handleColorChange = useCallback(
    async (color: string) => {
      setSelectedColor(color);
      setUser((prev) => prev ? { ...prev, avatarColor: color } : prev);
      await updateRemote({ avatarColor: color });
      // Also save to localStorage for guest
      localStorage.setItem("shade_avatar_color", color);
      showSaved();
    },
    [updateRemote, showSaved]
  );

  const handleToggle = useCallback(
    async (key: string, value: boolean) => {
      setUser((prev) =>
        prev ? { ...prev, settings: { ...prev.settings, [key]: value } } : prev
      );
      localStorage.setItem(`shade_${key}`, String(value));

      // Sync with SoundManager
      const sm = SoundManager.getInstance();
      if (key === "sound") {
        sm.setMusicEnabled(value);
        if (!value) sm.mute(); else sm.unmute();
      }

      await updateRemote({ settings: { [key]: value } });
    },
    [updateRemote]
  );

  const handleVolumeChange = useCallback(
    async (key: "musicVolume" | "sfxVolume", value: number) => {
      setUser((prev) =>
        prev ? { ...prev, settings: { ...prev.settings, [key]: value } } : prev
      );
      localStorage.setItem(`shade_${key}`, String(value));

      // Sync with SoundManager
      const sm = SoundManager.getInstance();
      if (key === "musicVolume") sm.setMusicVolume(value / 100);
      if (key === "sfxVolume") sm.setSfxVolume(value / 100);

      await updateRemote({ settings: { [key]: value } });
    },
    [updateRemote]
  );

  const handleLanguageChange = useCallback(
    async (lang: Locale) => {
      setLocale(lang);
      setUser((prev) =>
        prev ? { ...prev, settings: { ...prev.settings, language: lang } } : prev
      );
      await updateRemote({ settings: { language: lang } });
    },
    [setLocale, updateRemote]
  );

  const handleThemeChange = useCallback(
    async (theme: "dark" | "light") => {
      setUser((prev) =>
        prev ? { ...prev, settings: { ...prev.settings, theme } } : prev
      );
      localStorage.setItem("shade_theme", theme);
      await updateRemote({ settings: { theme } });
    },
    [updateRemote]
  );

  const handleDeleteHistory = useCallback(async () => {
    setConfirmModal(null);
    if (!user) return;
    try {
      await fetch(`/api/users/${user.id}/history`, { method: "DELETE" });
      showSaved();
    } catch {
      // silent
    }
  }, [user, showSaved]);

  const handleDeleteAccount = useCallback(async () => {
    setConfirmModal(null);
    if (!user) return;
    try {
      await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (typeof window !== "undefined") {
        localStorage.removeItem("shade_guest");
      }
      router.push("/");
    } catch {
      // silent
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <motion.div
          className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-dark pb-24 lg:max-w-2xl lg:mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-3">
        <Link href="/profile" className="text-gold text-sm font-nunito flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 20 20">
            <path d="M13 4L7 10L13 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold text-cream font-nunito">{t("settings.title")}</h1>
        <div className="w-6" />
      </div>

      {/* Saved indicator */}
      <AnimatePresence>
        {saved && (
          <motion.div
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-green/20 border border-green/30 text-green text-xs font-nunito"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {t("settings.saved")}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guest warning */}
      {user.isGuest && (
        <div className="mx-6 mb-4 px-4 py-3 rounded-xl bg-gold/[0.04] border border-gold/10">
          <p className="text-[12px] text-gold/70 font-nunito">{t("settings.guestWarning")}</p>
          <Link
            href="/auth/register"
            className="text-[12px] text-gold font-medium font-nunito mt-1 inline-block"
          >
            {t("auth.createAccount")} →
          </Link>
        </div>
      )}

      <motion.div
        className="px-6 space-y-5"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* 1. Account */}
        <motion.section className="space-y-3" variants={staggerItem}>
          <h2 className="text-[10px] text-cream/50 tracking-[1.5px] uppercase font-nunito">
            {t("settings.account")}
          </h2>

          {/* Display name */}
          <div className="p-3.5 rounded-xl bg-cream/[0.02] border border-cream/[0.05]">
            <label className="text-[11px] text-cream/50 font-nunito block mb-1.5">
              {t("settings.displayName")}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={20}
                className="flex-1 bg-cream/[0.04] border border-cream/[0.08] rounded-lg px-3 py-2 text-cream text-sm font-nunito outline-none focus:border-gold/30 transition-colors"
              />
              <button
                onClick={handleSaveName}
                disabled={editName.trim().length < 2 || editName.trim() === user.displayName}
                className="px-4 py-2 rounded-lg bg-gold/10 border border-gold/20 text-gold text-xs font-medium font-nunito disabled:opacity-30 hover:bg-gold/15 transition-colors"
              >
                {t("settings.save")}
              </button>
            </div>
          </div>

          {/* Avatar color */}
          <div className="p-3.5 rounded-xl bg-cream/[0.02] border border-cream/[0.05]">
            <label className="text-[11px] text-cream/50 font-nunito block mb-2">
              {t("settings.avatarColor")}
            </label>
            <div className="flex gap-2.5">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    selectedColor === color
                      ? "ring-2 ring-gold ring-offset-2 ring-offset-dark scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Change password (non-guest only) */}
          {!user.isGuest && (
            <div className="p-3.5 rounded-xl bg-cream/[0.02] border border-cream/[0.05]">
              <label className="text-[11px] text-cream/50 font-nunito block mb-2">
                {t("settings.changePassword")}
              </label>
              <div className="space-y-2">
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => { setCurrentPw(e.target.value); setPwError(""); }}
                  placeholder={t("settings.currentPassword")}
                  className="w-full bg-cream/[0.04] border border-cream/[0.08] rounded-lg px-3 py-2 text-cream text-sm font-nunito outline-none focus:border-gold/30 transition-colors placeholder:text-cream/20"
                />
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => { setNewPw(e.target.value); setPwError(""); }}
                  placeholder={t("settings.newPassword")}
                  className="w-full bg-cream/[0.04] border border-cream/[0.08] rounded-lg px-3 py-2 text-cream text-sm font-nunito outline-none focus:border-gold/30 transition-colors placeholder:text-cream/20"
                />
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => { setConfirmPw(e.target.value); setPwError(""); }}
                  placeholder={t("settings.confirmNewPassword")}
                  className="w-full bg-cream/[0.04] border border-cream/[0.08] rounded-lg px-3 py-2 text-cream text-sm font-nunito outline-none focus:border-gold/30 transition-colors placeholder:text-cream/20"
                />
                {pwError && (
                  <p className="text-red text-xs font-nunito">{pwError}</p>
                )}
                <button
                  onClick={async () => {
                    if (!currentPw || !newPw) return;
                    if (newPw !== confirmPw) {
                      setPwError(t("auth.passwordsDontMatch"));
                      return;
                    }
                    if (newPw.length < 6) {
                      setPwError(t("auth.passwordMinLength"));
                      return;
                    }
                    await updateRemote({ currentPassword: currentPw, newPassword: newPw });
                    setCurrentPw("");
                    setNewPw("");
                    setConfirmPw("");
                    showSaved();
                  }}
                  disabled={!currentPw || !newPw || !confirmPw}
                  className="px-4 py-2 rounded-lg bg-gold/10 border border-gold/20 text-gold text-xs font-medium font-nunito disabled:opacity-30 hover:bg-gold/15 transition-colors"
                >
                  {t("settings.save")}
                </button>
              </div>
            </div>
          )}
        </motion.section>

        {/* 2. Sound */}
        <motion.section className="space-y-3" variants={staggerItem}>
          <h2 className="text-[10px] text-cream/50 tracking-[1.5px] uppercase font-nunito">
            {t("settings.sound")}
          </h2>
          <div className="p-3.5 rounded-xl bg-cream/[0.02] border border-cream/[0.05] space-y-3">
            {/* Music */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold/[0.08] flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 20 20">
                    <path d="M8 4v10M8 14a3 3 0 100 0m4-10v6m0 0a2 2 0 100 0" fill="none" stroke="#C8A44E" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-[13px] text-cream font-nunito">{t("settings.music")}</span>
              </div>
              <Toggle
                on={user.settings.sound}
                onToggle={() => handleToggle("sound", !user.settings.sound)}
              />
            </div>
            {user.settings.sound && (
              <VolumeSlider
                value={user.settings.musicVolume}
                onChange={(v) => handleVolumeChange("musicVolume", v)}
              />
            )}

            <div className="border-t border-cream/[0.03]" />

            {/* Effects */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue/[0.08] flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 20 20">
                      <path d="M3 8v4h3l4 4V4L6 8H3z" fill="none" stroke="#A8C4E0" strokeWidth="1.2" strokeLinecap="round" />
                      <path d="M14 7c.6.6 1 1.5 1 2.5s-.4 1.9-1 2.5" fill="none" stroke="#A8C4E0" strokeWidth="1" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-[13px] text-cream font-nunito">{t("settings.effects")}</span>
                </div>
              </div>
              <VolumeSlider
                value={user.settings.sfxVolume}
                onChange={(v) => handleVolumeChange("sfxVolume", v)}
              />
            </div>
          </div>
        </motion.section>

        {/* 3. Language */}
        <motion.section className="space-y-3" variants={staggerItem}>
          <h2 className="text-[10px] text-cream/50 tracking-[1.5px] uppercase font-nunito">
            {t("settings.language")}
          </h2>
          <div className="p-3.5 rounded-xl bg-cream/[0.02] border border-cream/[0.05]">
            <p className="text-[11px] text-cream/50 font-nunito mb-2.5">{t("settings.selectLanguage")}</p>
            <div className="flex gap-2">
              {(["az", "en"] as Locale[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium font-nunito transition-all ${
                    locale === lang
                      ? "bg-gold/15 border border-gold/30 text-gold"
                      : "bg-cream/[0.03] border border-cream/[0.06] text-cream/50 hover:bg-cream/[0.05]"
                  }`}
                >
                  {lang === "az" ? "🇦🇿 Azərbaycan" : "🇬🇧 English"}
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* 4. Theme */}
        <motion.section className="space-y-3" variants={staggerItem}>
          <h2 className="text-[10px] text-cream/50 tracking-[1.5px] uppercase font-nunito">
            {t("settings.theme")}
          </h2>
          <div className="p-3.5 rounded-xl bg-cream/[0.02] border border-cream/[0.05]">
            <div className="flex gap-2">
              {(["dark", "light"] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleThemeChange(theme)}
                  className={`flex-1 rounded-xl overflow-hidden border transition-all ${
                    user.settings.theme === theme
                      ? "border-gold/30 ring-1 ring-gold/20"
                      : "border-cream/[0.06] hover:border-cream/[0.12]"
                  }`}
                >
                  {/* Preview */}
                  <div
                    className={`h-16 flex items-center justify-center ${
                      theme === "dark" ? "bg-[#0D0D0C]" : "bg-[#F5F2EA]"
                    }`}
                  >
                    <div className="flex gap-1.5">
                      <div
                        className={`w-6 h-2 rounded-full ${
                          theme === "dark" ? "bg-gold/30" : "bg-[#8B7744]/30"
                        }`}
                      />
                      <div
                        className={`w-4 h-2 rounded-full ${
                          theme === "dark" ? "bg-cream/10" : "bg-[#333]/10"
                        }`}
                      />
                    </div>
                  </div>
                  <div
                    className={`py-2 text-center text-[11px] font-medium font-nunito ${
                      user.settings.theme === theme ? "text-gold" : "text-cream/50"
                    }`}
                  >
                    {theme === "dark" ? t("settings.darkMode") : t("settings.lightMode")}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* 5. Notifications */}
        <motion.section className="space-y-3" variants={staggerItem}>
          <h2 className="text-[10px] text-cream/50 tracking-[1.5px] uppercase font-nunito">
            {t("settings.notifications")}
          </h2>
          <div className="p-3.5 rounded-xl bg-cream/[0.02] border border-cream/[0.05] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-cream font-nunito">{t("settings.pushNotifications")}</span>
              <Toggle
                on={user.settings.pushNotifications}
                onToggle={() => handleToggle("pushNotifications", !user.settings.pushNotifications)}
              />
            </div>
            <div className="border-t border-cream/[0.03]" />
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-cream font-nunito">{t("settings.gameInvites")}</span>
              <Toggle
                on={user.settings.gameInvites}
                onToggle={() => handleToggle("gameInvites", !user.settings.gameInvites)}
              />
            </div>
          </div>
        </motion.section>

        {/* 6. Data */}
        <motion.section className="space-y-3" variants={staggerItem}>
          <h2 className="text-[10px] text-cream/50 tracking-[1.5px] uppercase font-nunito">
            {t("settings.data")}
          </h2>
          <div className="p-3.5 rounded-xl bg-cream/[0.02] border border-cream/[0.05] space-y-3">
            <button
              onClick={() => setConfirmModal("history")}
              className="w-full flex items-center justify-between py-1"
            >
              <div className="text-left">
                <div className="text-[13px] text-cream font-nunito">{t("settings.deleteHistory")}</div>
                <div className="text-[10px] text-cream/50 font-nunito">{t("settings.deleteHistoryDesc")}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 20 20" className="text-cream/20 flex-shrink-0">
                <path d="M7 4l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {!user.isGuest && (
              <>
                <div className="border-t border-cream/[0.03]" />
                <button
                  onClick={() => setConfirmModal("account")}
                  className="w-full flex items-center justify-between py-1"
                >
                  <div className="text-left">
                    <div className="text-[13px] text-red font-nunito">{t("settings.deleteAccount")}</div>
                    <div className="text-[10px] text-red/40 font-nunito">{t("settings.deleteAccountDesc")}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 20 20" className="text-red/30 flex-shrink-0">
                    <path d="M7 4l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </motion.section>

        {/* Version */}
        <motion.section className="space-y-3" variants={staggerItem}>
          <p className="text-center text-[10px] text-cream/20 font-nunito pt-2 pb-4">
            {t("settings.version")} v1.0.0
          </p>
        </motion.section>
      </motion.div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal !== null}
        title={t("settings.deleteConfirmTitle")}
        message={
          confirmModal === "history"
            ? t("settings.deleteHistoryConfirm")
            : t("settings.deleteAccountConfirm")
        }
        cancelText={t("settings.cancel")}
        confirmText={t("settings.delete")}
        onCancel={() => setConfirmModal(null)}
        onConfirm={confirmModal === "history" ? handleDeleteHistory : handleDeleteAccount}
      />
    </div>
  );
}
