"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import FoxLogo from "@/components/ui/FoxLogo";
import SoundManager from "@/lib/sounds";
import { useTranslation } from "@/hooks/useTranslation";

interface NavItem {
  id: string;
  labelKey: string;
  href: string;
  icon: (color: string) => React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: "game",
    labelKey: "nav.game",
    href: "/home",
    icon: (c) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L2 8v10h6v-6h4v6h6V8z" stroke={c} strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    id: "leaderboard",
    labelKey: "nav.leaderboard",
    href: "/leaderboard",
    icon: (c) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 2L12.5 7.5L18 8L14 12L15 18L10 15L5 18L6 12L2 8L7.5 7.5Z"
          stroke={c}
          strokeWidth="1.2"
        />
      </svg>
    ),
  },
  {
    id: "modes",
    labelKey: "nav.modes",
    href: "/modes",
    icon: (c) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="6" height="6" rx="1" stroke={c} strokeWidth="1.2" />
        <rect x="11" y="3" width="6" height="6" rx="1" stroke={c} strokeWidth="1.2" />
        <rect x="3" y="11" width="6" height="6" rx="1" stroke={c} strokeWidth="1.2" />
        <rect x="11" y="11" width="6" height="6" rx="1" stroke={c} strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    id: "profile",
    labelKey: "nav.profile",
    href: "/profile",
    icon: (c) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="7" r="4" stroke={c} strokeWidth="1.2" />
        <path d="M3 18c0-4 3-7 7-7s7 3 7 7" stroke={c} strokeWidth="1.2" />
      </svg>
    ),
  },
];

function getActiveId(pathname: string): string {
  if (pathname.startsWith("/leaderboard")) return "leaderboard";
  if (pathname.startsWith("/modes")) return "modes";
  if (pathname.startsWith("/profile") || pathname.startsWith("/settings")) return "profile";
  return "game";
}

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const activeId = getActiveId(pathname);
  const [soundOn, setSoundOn] = useState(() => {
    if (typeof window === "undefined") return true;
    return !SoundManager.getInstance().muted;
  });

  const handleSoundToggle = () => {
    const sm = SoundManager.getInstance();
    const nowMuted = sm.toggleMute();
    setSoundOn(!nowMuted);
    // Broadcast change
    window.dispatchEvent(new CustomEvent("shade:sound", { detail: !nowMuted }));
  };

  useEffect(() => {
    function onSoundChange(e: Event) {
      const detail = (e as CustomEvent).detail;
      setSoundOn(detail);
    }
    window.addEventListener("shade:sound", onSoundChange);
    return () => window.removeEventListener("shade:sound", onSoundChange);
  }, []);

  // Oyun ekranları (lobby, game) zamanı nav bar gizlənsin
  if (
    pathname.startsWith("/lobby") ||
    pathname.startsWith("/game") ||
    pathname === "/"
  ) {
    return null;
  }

  return (
    <>
      {/* ========== MOBILE NAV (< md) ========== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark border-t border-gold/[0.06]">
        <div className="flex justify-around items-center px-4 py-2.5">
          {navItems.map((item) => {
            const isActive = item.id === activeId;
            const color = isActive ? "#C8A44E" : "#555";

            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                aria-label={t(item.labelKey)}
                className="relative flex flex-col items-center gap-1 min-w-[48px] py-1"
              >
                {item.icon(color)}
                <span
                  className="text-[10px] font-nunito transition-colors"
                  style={{ color }}
                >
                  {t(item.labelKey)}
                </span>
                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -top-2.5 w-5 h-[2px] bg-gold rounded-full"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
        {/* Home indicator */}
        <div className="flex justify-center pb-1.5 pt-0.5">
          <div className="w-28 h-1 bg-gold/10 rounded-full" />
        </div>
      </nav>

      {/* Mobile spacer */}
      <div className="md:hidden h-20" />

      {/* ========== DESKTOP/TABLET NAV (>= md) ========== */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-40 bg-dark/95 backdrop-blur-sm border-b border-gold/[0.06]">
        <div className="w-full max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Left: Logo */}
          <button
            onClick={() => router.push("/home")}
            className="flex items-center gap-2.5"
          >
            <FoxLogo size={32} animate={false} />
            <span
              className="text-base font-medium tracking-[4px] uppercase font-nunito"
              style={{ color: "#E8E4D8" }}
            >
              SHADE
            </span>
          </button>

          {/* Center: Nav links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = item.id === activeId;
              const color = isActive ? "#C8A44E" : "#777";

              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.href)}
                  aria-label={t(item.labelKey)}
                  className="relative px-4 py-2 flex items-center gap-2 rounded-lg hover:bg-cream/5 transition-colors"
                >
                  {item.icon(color)}
                  <span
                    className="text-sm font-nunito transition-colors"
                    style={{ color }}
                  >
                    {t(item.labelKey)}
                  </span>
                  {/* Active underline */}
                  {isActive && (
                    <motion.div
                      layoutId="desktop-nav-indicator"
                      className="absolute bottom-0 left-2 right-2 h-[2px] bg-gold rounded-full"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Sound + Info */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSoundToggle}
              aria-label={t("profile.sound")}
              className="w-8 h-8 rounded-lg bg-gold/5 border border-gold/10 flex items-center justify-center hover:bg-gold/10 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
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
              onClick={() => {
                if (window.location.pathname === "/home") {
                  window.dispatchEvent(new Event("shade:howtoplay"));
                } else {
                  router.push("/home");
                  setTimeout(() => window.dispatchEvent(new Event("shade:howtoplay")), 500);
                }
              }}
              aria-label={t("home.howToPlay")}
              className="w-8 h-8 rounded-lg bg-gold/5 border border-gold/10 flex items-center justify-center hover:bg-gold/10 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="#C8A44E" strokeWidth="1" />
                <text x="10" y="14" textAnchor="middle" fill="#C8A44E" fontSize="10" fontWeight="500">?</text>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Desktop spacer */}
      <div className="hidden md:block h-14" />
    </>
  );
}
