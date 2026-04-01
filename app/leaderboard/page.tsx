"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useTranslation } from "@/hooks/useTranslation";
import { LeaderboardSkeleton } from "@/components/ui/Skeleton";

interface LeaderboardEntry {
  rank: number;
  id: string;
  displayName: string;
  username: string;
  avatarColor: string;
  xp: number;
  level: number;
  winRate: number;
}

type TabType = "all" | "weekly" | "friends";

const TAB_KEYS: TabType[] = ["all", "weekly", "friends"];
const TAB_I18N: Record<TabType, string> = {
  all: "leaderboard.all",
  weekly: "leaderboard.weekly",
  friends: "leaderboard.friends",
};

// Medal rəngləri
function getMedalColor(rank: number): string | null {
  if (rank === 1) return "#C8A44E"; // qızıl
  if (rank === 2) return "#A8B4C0"; // gümüşü
  if (rank === 3) return "#C49A6C"; // bürünc
  return null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabType>("all");
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendsMessage, setFriendsMessage] = useState("");

  const fetchLeaderboard = useCallback(async (type: TabType) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?type=${type}&limit=50`);
      const json = await res.json();
      if (json.success) {
        setData(json.leaderboard);
        setFriendsMessage(json.message || "");
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeaderboard(tab);
  }, [tab, fetchLeaderboard]);

  return (
    <div className="min-h-screen bg-dark pb-24 lg:max-w-3xl lg:mx-auto">
      {/* Header */}
      <div className="pt-6 pb-3 px-6">
        <h1 className="text-lg font-semibold text-cream text-center">{t("leaderboard.title")}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-6 mb-4 bg-cream/[0.03] rounded-xl p-1">
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-all relative ${
              tab === key ? "text-dark" : "text-cream/50"
            }`}
          >
            {tab === key && (
              <motion.div
                className="absolute inset-0 bg-gold rounded-lg"
                layoutId="leaderboard-tab"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10">{t(TAB_I18N[key])}</span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && <LeaderboardSkeleton />}

      {/* Friends empty state */}
      {!loading && tab === "friends" && data.length === 0 && (
        <motion.div
          className="text-center py-16 px-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-full bg-cream/[0.03] border border-cream/[0.06] mx-auto mb-4 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
                fill="#555"
              />
            </svg>
          </div>
          <p className="text-cream/50 text-sm">{friendsMessage || t("leaderboard.friendsComingSoon")}</p>
        </motion.div>
      )}

      {/* Empty state */}
      {!loading && tab !== "friends" && data.length === 0 && (
        <motion.div
          className="text-center py-16 px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-cream/50 text-sm">{t("leaderboard.noOneYet")}</p>
        </motion.div>
      )}

      {/* Leaderboard List */}
      {!loading && data.length > 0 && (
        <motion.div
          className="px-6"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <AnimatePresence mode="popLayout">
            {data.map((entry) => {
              const medal = getMedalColor(entry.rank);
              const isTop3 = entry.rank <= 3;

              return (
                <motion.div
                  key={entry.id}
                  variants={staggerItem}
                  layout
                  className={`flex items-center gap-3 py-3 ${
                    isTop3
                      ? "mb-1"
                      : "border-b border-cream/[0.03]"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 text-center flex-shrink-0">
                    {medal ? (
                      <div
                        className="w-7 h-7 rounded-full mx-auto flex items-center justify-center text-[11px] font-bold"
                        style={{
                          background: `${medal}20`,
                          border: `1.5px solid ${medal}`,
                          color: medal,
                        }}
                      >
                        {entry.rank}
                      </div>
                    ) : (
                      <span className="text-[13px] text-cream/30 font-medium">
                        {entry.rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-semibold"
                    style={{
                      backgroundColor: `${entry.avatarColor}20`,
                      color: entry.avatarColor,
                      border: isTop3
                        ? `1px solid ${entry.avatarColor}40`
                        : "none",
                    }}
                  >
                    {getInitials(entry.displayName)}
                  </div>

                  {/* Name & username */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-cream font-medium truncate">
                      {entry.displayName}
                    </div>
                    <div className="text-[10px] text-cream/30 truncate">
                      @{entry.username}
                    </div>
                  </div>

                  {/* Level */}
                  <div className="text-[10px] text-gold/60 bg-gold/[0.06] px-2 py-0.5 rounded-md flex-shrink-0">
                    LVL {entry.level}
                  </div>

                  {/* XP / Win Rate */}
                  <div className="text-right flex-shrink-0 w-14">
                    <div className="text-[13px] text-cream/70 font-medium">
                      {entry.xp.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-green/60">{entry.winRate}%</div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
