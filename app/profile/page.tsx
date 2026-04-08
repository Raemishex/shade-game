"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FoxLogo } from "@/components/ui";
import { ProfileSkeleton } from "@/components/ui/Skeleton";
import { BADGES, type BadgeDefinition, type SimplePlayerStats, getUnlockedBadges } from "@/lib/badges";
import { getGuestUser } from "@/lib/guest";
import { isFS5Active } from "@/lib/fs5";
import { useTranslation } from "@/hooks/useTranslation";
import { requestNotificationPermission, scheduleDailyNotification } from "@/lib/notifications";
import Link from "next/link";
import SoundManager from "@/lib/sounds";

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  xp: number;
  level: number;
  stats: {
    totalGames: number;
    wins: number;
    imposterGames: number;
    imposterWins: number;
  };
  badges: string[];
  settings: { sound: boolean; language: "az" | "en"; theme: "dark" | "light" };
  isGuest: boolean;
  fs5Active: boolean;
}

// Default profil — SSR zamanı da göstərilsin
const DEFAULT_PROFILE: UserProfile = {
  id: "guest",
  username: "guest",
  displayName: "Oyunçu",
  avatarColor: "#C8A44E",
  xp: 0,
  level: 1,
  stats: { totalGames: 0, wins: 0, imposterGames: 0, imposterWins: 0 },
  badges: [],
  settings: { sound: true, language: "az", theme: "dark" },
  isGuest: true,
  fs5Active: false,
};

// --- KÖMƏKÇİ KOMPONENTLƏR ---

function BadgeIcon({ badge, size = 20 }: { badge: BadgeDefinition; size?: number }) {
  const s = size;
  switch (badge.icon) {
    case "star":
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <path d="M10 3L12 8H17L13 11L14.5 16L10 13L5.5 16L7 11L3 8H8Z" fill={badge.color} />
        </svg>
      );
    case "check":
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="7" fill="none" stroke={badge.color} strokeWidth="1.2" />
          <path d="M7 10l2 2 4-4" fill="none" stroke={badge.color} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "flame":
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <path d="M10 4C7 4 4 7 4 10C4 14 10 17 10 17S16 14 16 10C16 7 13 4 10 4Z" fill={badge.color} opacity="0.8" />
        </svg>
      );
    case "trophy":
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <path d="M6 4h8v6c0 2.2-1.8 4-4 4s-4-1.8-4-4V4z" fill="none" stroke={badge.color} strokeWidth="1.2" />
          <path d="M8 16h4M10 14v2" stroke={badge.color} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "lightning":
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <path d="M11 3L6 11h4l-1 6 5-8h-4l1-6z" fill={badge.color} />
        </svg>
      );
    case "shield":
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <path d="M10 2L4 5v5c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5V5L10 2z" fill="none" stroke={badge.color} strokeWidth="1.2" />
        </svg>
      );
    case "crown":
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <path d="M3 14L5 7l4 3 1-6 1 6 4-3 2 7H3z" fill={badge.color} />
        </svg>
      );
    case "level":
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.3-4.9-2.6-4.9 2.6.9-5.3-4-3.9 5.5-.8z" fill="none" stroke={badge.color} strokeWidth="1.2" />
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="7" fill={badge.color} opacity="0.5" />
        </svg>
      );
  }
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-9 h-5 rounded-full relative transition-colors ${on ? "bg-green/30" : "bg-cream/10"}`}
    >
      <div
        className={`w-4 h-4 rounded-full absolute top-0.5 transition-all ${
          on ? "left-[18px] bg-green" : "left-0.5 bg-cream/40"
        }`}
      />
    </button>
  );
}

// --- MODULLAŞDIRILMIŞ UI KOMPONENTLƏRİ ---

function ProfileHeader({ user }: { user: UserProfile }) {
  const { t } = useTranslation();
  return (
    <motion.div
      className="pt-6 md:pt-10 pb-4 px-6 text-center border-b border-gold/[0.06]"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.5 }}
    >
      <motion.div 
        className="relative w-[76px] h-[76px] lg:w-[90px] lg:h-[90px] mx-auto mb-3"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="w-full h-full rounded-full border-[1.5px] border-gold flex items-center justify-center">
          <FoxLogo size={46} />
        </div>
        <div className="absolute -bottom-1 -right-0.5 bg-gold text-dark text-[9px] font-medium px-2 py-0.5 rounded-xl border-2 border-dark">
          LVL {user.level}
        </div>
      </motion.div>
      <h1 className="text-lg lg:text-xl font-medium text-cream">{user.displayName}</h1>
      <p className="text-[11px] text-cream/50">
        @{user.username}
        {user.fs5Active && <span className="text-gold"> · {t("profile.fs5Active")}</span>}
      </p>
      {user.isGuest && (
        <Link
          href="/auth/register"
          className="inline-block mt-2 text-[11px] text-gold border border-gold/20 px-3 py-1 rounded-lg hover:bg-gold/5 transition-colors"
        >
          {t("profile.createAccount")}
        </Link>
      )}
    </motion.div>
  );
}

function StatsGrid({ user, ranking }: { user: UserProfile, ranking: string }) {
  const { t } = useTranslation();
  
  const winRate = user.stats.totalGames > 0
    ? Math.round((user.stats.wins / user.stats.totalGames) * 100)
    : 0;
  const citizenWins = user.stats.wins - user.stats.imposterWins;

  return (
    <motion.div 
      className="md:col-span-1"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <div className="flex gap-2 mb-3.5">
        {[
          { num: user.stats.totalGames, label: t("home.games") },
          { num: `${winRate}%`, label: t("profile.wins") },
          { num: ranking, label: t("profile.ranking") },
          { num: user.badges.length, label: t("profile.badge") },
        ].map((s, i) => (
          <motion.div
            key={i}
            className="flex-1 py-2.5 px-1.5 rounded-[10px] bg-gold/[0.04] border border-gold/[0.08] text-center"
            whileHover={{ y: -2, backgroundColor: "rgba(200,164,78,0.08)" }}
          >
            <div className="text-lg font-medium text-gold">{s.num}</div>
            <div className="text-[8px] text-cream/50 tracking-wider uppercase mt-0.5">
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-3 rounded-[10px] bg-cream/[0.02] border border-cream/[0.04] mb-3.5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[11px] text-cream/50">{t("profile.winRate")}</span>
          <span className="text-[12px] text-green font-medium">{winRate}%</span>
        </div>
        <div className="h-1.5 bg-cream/[0.04] rounded-full overflow-hidden mb-2">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, rgba(184,212,168,0.4), #B8D4A8)" }}
            initial={{ width: 0 }}
            animate={{ width: `${winRate}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-green">{citizenWins} {t("profile.citizen")}</span>
          <span className="text-red">{user.stats.imposterWins} {t("profile.imposter")}</span>
        </div>
      </div>
    </motion.div>
  );
}

function BadgeShowcase({ user }: { user: UserProfile }) {
  const { t, locale } = useTranslation();
  
  return (
    <motion.div 
      className="md:col-span-1"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-[10px] text-cream/50 tracking-[1.5px] uppercase">
          {t("profile.achievements")}
        </span>
        <button className="text-[10px] text-gold/60 font-nunito hover:text-gold transition-colors">
          {t("profile.seeAll") || "Hamısı ↗"}
        </button>
      </div>
      <div className="flex gap-2.5 mb-4 overflow-x-auto pb-1">
        {BADGES.slice(0, 4).map((badge) => {
          const unlocked = user.badges.includes(badge.id);
          return (
            <motion.div
              key={badge.id}
              className={`w-[54px] text-center flex-shrink-0 ${!unlocked ? "opacity-30" : ""}`}
              whileHover={unlocked ? { y: -3 } : {}}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-1"
                style={{
                  background: unlocked ? `${badge.color}15` : "rgba(255,255,255,0.03)",
                  border: unlocked ? `0.5px solid ${badge.color}33` : "0.5px solid rgba(255,255,255,0.06)",
                }}
              >
                {unlocked ? <BadgeIcon badge={badge} /> : (
                  <svg width="20" height="20" viewBox="0 0 20 20">
                    <rect x="5" y="9" width="10" height="8" rx="1.5" fill="none" stroke="#555" strokeWidth="1" />
                    <path d="M7 9V7a3 3 0 016 0v2" fill="none" stroke="#555" strokeWidth="1" />
                  </svg>
                )}
              </div>
              <div className="text-[8px] text-cream/50 leading-tight">
                {unlocked ? (locale === "az" ? badge.nameAz : badge.nameEn) : "???"}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function SettingsPanel({ 
  user, 
  updateSetting, 
  notificationsOn, 
  setNotificationsOn 
}: { 
  user: UserProfile, 
  updateSetting: (key: string, value: boolean | string) => void,
  notificationsOn: boolean,
  setNotificationsOn: (v: boolean) => void
}) {
  const { t, locale, setLocale } = useTranslation();

  return (
    <motion.div 
      className="md:col-span-1"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <div className="text-[10px] text-cream/50 tracking-[1.5px] uppercase mb-2.5">
        {t("profile.settings")}
      </div>

      {/* Sound */}
      <div className="flex items-center justify-between py-3 border-b border-cream/[0.03]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gold/[0.08] flex items-center justify-center">
             <svg width="16" height="16" viewBox="0 0 20 20"><path d="M3 8v4h3l4 4V4L6 8H3z" fill="none" stroke="#C8A44E" strokeWidth="1.2" strokeLinecap="round" /></svg>
          </div>
          <div>
            <div className="text-[13px] text-cream">{t("profile.sound")}</div>
            <div className="text-[9px] text-cream/50">{t("profile.soundDesc")}</div>
          </div>
        </div>
        <Toggle on={user.settings.sound} onToggle={() => updateSetting("sound", !user.settings.sound)} />
      </div>

      {/* Language */}
      <div className="flex items-center justify-between py-3 border-b border-cream/[0.03]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue/[0.08] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 20 20"><circle cx="10" cy="6" r="4" fill="none" stroke="#A8C4E0" strokeWidth="1.2" /><path d="M6 10a8 8 0 006 0" fill="none" stroke="#A8C4E0" strokeWidth="1" /></svg>
          </div>
          <div>
            <div className="text-[13px] text-cream">{t("profile.language")}</div>
            <div className="text-[9px] text-cream/50">{t("profile.languageDesc")}</div>
          </div>
        </div>
        <button 
          onClick={() => { const newLang = locale === "az" ? "en" : "az"; setLocale(newLang); updateSetting("language", newLang); }}
          className="flex items-center gap-1 text-[12px] text-cream/50"
        >
          {locale === "az" ? t("profile.azerbaijani") : t("profile.english")}
          <svg width="10" height="10" viewBox="0 0 20 20"><path d="M7 4l6 6-6 6" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </div>

      {/* Theme */}
      <div className="flex items-center justify-between py-3 border-b border-cream/[0.03]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange/[0.08] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 20 20"><circle cx="10" cy="10" r="4" fill="none" stroke="#E0C4A8" strokeWidth="1" /><path d="M10 2v3M10 15v3M2 10h3M15 10h3" stroke="#E0C4A8" strokeWidth="1" strokeLinecap="round" /></svg>
          </div>
          <div>
            <div className="text-[13px] text-cream">{t("profile.theme")}</div>
            <div className="text-[9px] text-cream/50">{t("profile.themeDesc")}</div>
          </div>
        </div>
        <button 
          onClick={() => { const newTheme = user.settings.theme === "dark" ? "light" : "dark"; updateSetting("theme", newTheme); document.documentElement.className = newTheme; localStorage.setItem("shade_theme", newTheme); }}
          className="flex items-center gap-1 text-[12px] text-cream/50"
        >
          {user.settings.theme === "dark" ? t("profile.dark") : t("profile.light")}
          <svg width="10" height="10" viewBox="0 0 20 20"><path d="M7 4l6 6-6 6" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </div>

      {/* Notifications */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-pink/[0.08] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 20 20"><path d="M4 4h12v12H4z" fill="none" stroke="#F0997B" strokeWidth="1.2" rx="2" /><path d="M8 2v4M12 2v4M4 8h12" stroke="#F0997B" strokeWidth="1" strokeLinecap="round" /></svg>
          </div>
          <div><div className="text-[13px] text-cream">{t("profile.notifications")}</div></div>
        </div>
        <Toggle on={notificationsOn} onToggle={async () => {
          SoundManager.getInstance().playSfx("button_click");
          if (!notificationsOn) {
            const granted = await requestNotificationPermission();
            if (granted) { setNotificationsOn(true); localStorage.setItem("shade_notifications", "true"); scheduleDailyNotification(); }
          } else { setNotificationsOn(false); localStorage.setItem("shade_notifications", "false"); }
        }} />
      </div>
    </motion.div>
  );
}

// --- ƏSAS KOMPONENT ---

export default function ProfilePage() {
  const { t, locale } = useTranslation();
  const [user, setUser] = useState<UserProfile>(DEFAULT_PROFILE);
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [ranking, setRanking] = useState<string>("#—");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const guest = getGuestUser();
    const savedTheme = (localStorage.getItem("shade_theme") as "dark" | "light") || "dark";
    const savedNotif = localStorage.getItem("shade_notifications");

    if (savedNotif === "true" && "Notification" in window && Notification.permission === "granted") {
      setNotificationsOn(true);
    }

    const guestProfile: UserProfile = {
      ...DEFAULT_PROFILE,
      id: guest.userId,
      username: "guest",
      displayName: guest.displayName,
      avatarColor: guest.avatarColor,
      fs5Active: isFS5Active(),
      settings: { ...DEFAULT_PROFILE.settings, language: locale as "az" | "en", theme: savedTheme },
    };
    setUser(guestProfile);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/auth/me", { signal: controller.signal });
        clearTimeout(timeout);

        if (!res.ok) throw new Error("API error");

        const data = await res.json();
        if (data?.user) {
          const stats: SimplePlayerStats = {
            totalGames: data.user.stats?.totalGames || 0,
            wins: data.user.stats?.wins || 0,
            imposterGames: data.user.stats?.imposterGames || 0,
            imposterWins: data.user.stats?.imposterWins || 0,
            level: data.user.level || 1,
            fs5Active: data.user.fs5Active || false,
          };
          const unlockedBadges = getUnlockedBadges(stats);
          
          setUser({
            ...data.user,
            id: data.user.id || data.user._id || guest.userId,
            username: data.user.username || "guest",
            badges: unlockedBadges,
            settings: data.user.settings || { 
              ...DEFAULT_PROFILE.settings, 
              language: locale as "az" | "en" 
            }
          });

          // Fetch ranking
          try {
            const lbRes = await fetch("/api/leaderboard?limit=100");
            const lbData = await lbRes.json();
            if (lbData?.leaderboard) {
              const myRank = lbData.leaderboard.findIndex(
                (entry: { id: string }) => entry.id === (data.user.id || data.user._id)
              );
              // Xəta düzəlişi: İlk 100-lükdə yoxdursa "100+" göstər
              if (myRank >= 0) {
                setRanking(`#${myRank + 1}`);
              } else {
                setRanking("100+");
              }
            }
          } catch (e) {
            console.warn("Ranking fetch failed", e);
          }
        }
      } catch (err) {
        console.warn("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
    // Xəta düzəlişi: locale asılılığı silindi ki, dil dəyişəndə lüzumsuz API call olmasın
  }, []); 

  const updateSetting = useCallback(
    async (key: string, value: boolean | string) => {
      if (!user) return;

      SoundManager.getInstance().playSfx("button_click");

      if (key === "sound") {
        const sm = SoundManager.getInstance();
        if (value) {
          sm.unmute();
          sm.setMusicEnabled(true);
          sm.setSfxEnabled(true);
        } else {
          sm.mute();
          sm.setMusicEnabled(false);
          sm.setSfxEnabled(false);
        }
        localStorage.setItem("shade_sound", String(value));
        localStorage.setItem("shade_sound_muted", String(!value));
        window.dispatchEvent(new CustomEvent("shade:sound", { detail: value }));
      }

      setUser((prev) =>
        prev ? { 
          ...prev, 
          settings: { 
            ...(prev.settings || DEFAULT_PROFILE.settings), 
            [key]: value 
          } 
        } : prev
      );
      
      if (!user.isGuest && user.id !== "guest") {
        try {
          await fetch(`/api/users/${user.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ settings: { [key]: value } }),
          });
        } catch {
          // silent
        }
      }
    },
    [user]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-dark pb-24">
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-dark pb-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <ProfileHeader user={user} />

        <div className="px-6 pt-3 md:grid md:grid-cols-3 md:gap-6 md:max-w-4xl md:mx-auto lg:max-w-7xl lg:gap-8">
          <StatsGrid user={user} ranking={ranking} />
          <BadgeShowcase user={user} />
          <SettingsPanel 
            user={user} 
            updateSetting={updateSetting} 
            notificationsOn={notificationsOn} 
            setNotificationsOn={setNotificationsOn} 
          />
        </div>

        {/* Legal links */}
        <motion.div 
          className="flex justify-center gap-3 pt-2 pb-6 px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button className="text-[9px] text-cream/25 font-nunito hover:text-cream/50 transition-colors">{t("profile.terms") || "İstifadə şərtləri"}</button>
          <span className="text-[9px] text-cream/15">·</span>
          <button className="text-[9px] text-cream/25 font-nunito hover:text-cream/50 transition-colors">{t("profile.privacy") || "Məxfilik siyasəti"}</button>
          <span className="text-[9px] text-cream/15">·</span>
          <button className="text-[9px] text-cream/25 font-nunito hover:text-cream/50 transition-colors">{t("profile.contact") || "Əlaqə"}</button>
        </motion.div>
      </div>
    </motion.div>
  );
}
