"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { getGuestUser } from "@/lib/guest";
import { useTranslation } from "@/hooks/useTranslation";
import { HistorySkeleton } from "@/components/ui/Skeleton";

interface GameHistoryEntry {
  id: string;
  word: string;
  category: string;
  role: "citizen" | "imposter";
  result: "win" | "loss";
  playerCount: number;
  xpEarned: number;
  date: string;
  players: { displayName: string; avatarColor: string; role: string }[];
  rounds: { roundNumber: number; clues: { displayName: string; clue: string }[] }[];
  votes: { voterId: string; votedFor: string | null }[];
  winners: "citizens" | "imposters";
  imposters: string[];
}

type FilterResult = "all" | "win" | "loss";
type FilterRole = "all" | "citizen" | "imposter";

export default function HistoryPage() {
  const { t } = useTranslation();
  const [games, setGames] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filterResult, setFilterResult] = useState<FilterResult>("all");
  const [filterRole, setFilterRole] = useState<FilterRole>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchGames = useCallback(
    async (pageNum: number, append = false) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const guest = getGuestUser();
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: "20",
        });
        if (filterResult !== "all") params.set("result", filterResult);
        if (filterRole !== "all") params.set("role", filterRole);

        const res = await fetch(
          `/api/users/${guest.userId}/history?${params}`
        );
        const data = await res.json();

        if (data.success) {
          setGames((prev) => (append ? [...prev, ...data.history] : data.history));
          setHasMore(data.pagination.hasMore);
        }
      } catch {
        // silent
      }

      setLoading(false);
      setLoadingMore(false);
    },
    [filterResult, filterRole]
  );

  useEffect(() => {
    setPage(1);
    fetchGames(1);
  }, [fetchGames]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchGames(next, true);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return t("history.today");
    if (days === 1) return t("history.yesterday");
    if (days < 7) return t("history.daysAgo", { days: String(days) });
    return d.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-dark pb-24 lg:max-w-3xl lg:mx-auto">
      {/* Header */}
      <div className="pt-6 pb-3 px-6">
        <h1 className="text-lg font-semibold text-cream text-center font-nunito">
          {t("history.title")}
        </h1>
      </div>

      {/* Filters */}
      <div className="px-6 mb-4 space-y-2">
        {/* Result filter */}
        <div className="flex gap-1 bg-cream/[0.03] rounded-xl p-1">
          {(["all", "win", "loss"] as FilterResult[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilterResult(f)}
              className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all relative font-nunito ${
                filterResult === f ? "text-dark" : "text-cream/50"
              }`}
            >
              {filterResult === f && (
                <motion.div
                  className="absolute inset-0 bg-gold rounded-lg"
                  layoutId="history-result-tab"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">
                {f === "all"
                  ? t("history.filterAll")
                  : f === "win"
                  ? t("history.filterWin")
                  : t("history.filterLoss")}
              </span>
            </button>
          ))}
        </div>

        {/* Role filter */}
        <div className="flex gap-1 bg-cream/[0.03] rounded-xl p-1">
          {(["all", "citizen", "imposter"] as FilterRole[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilterRole(f)}
              className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all relative font-nunito ${
                filterRole === f ? "text-dark" : "text-cream/50"
              }`}
            >
              {filterRole === f && (
                <motion.div
                  className="absolute inset-0 bg-gold rounded-lg"
                  layoutId="history-role-tab"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">
                {f === "all"
                  ? t("history.filterAll")
                  : f === "citizen"
                  ? t("history.filterCitizen")
                  : t("history.filterImposter")}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && <HistorySkeleton />}

      {/* Empty state */}
      {!loading && games.length === 0 && (
        <motion.div
          className="text-center py-16 px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 rounded-full bg-cream/[0.03] border border-cream/[0.06] mx-auto mb-4 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="#555"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="text-cream/50 text-sm font-nunito">{t("history.noGames")}</p>
        </motion.div>
      )}

      {/* Game list */}
      {!loading && games.length > 0 && (
        <motion.div
          className="px-6 space-y-2"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <AnimatePresence mode="popLayout">
            {games.map((game) => {
              const isExpanded = expandedId === game.id;

              return (
                <motion.div
                  key={game.id}
                  variants={staggerItem}
                  layout
                  className="rounded-xl bg-cream/[0.02] border border-cream/[0.05] overflow-hidden"
                >
                  {/* Card header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : game.id)}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left"
                  >
                    {/* Result badge */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        game.result === "win"
                          ? "bg-green/10 border border-green/20"
                          : "bg-red/10 border border-red/20"
                      }`}
                    >
                      {game.result === "win" ? (
                        <svg width="18" height="18" viewBox="0 0 20 20">
                          <path
                            d="M6 4h8v6c0 2.2-1.8 4-4 4s-4-1.8-4-4V4z"
                            fill="none"
                            stroke="#B8D4A8"
                            strokeWidth="1.2"
                          />
                          <path d="M8 16h4" stroke="#B8D4A8" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 20 20">
                          <path
                            d="M6 6l8 8M14 6l-8 8"
                            stroke="#E8593C"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] text-cream font-medium font-nunito truncate">
                          {game.word}
                        </span>
                        <span className="text-[10px] text-cream/50 font-nunito">
                          {game.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded font-nunito ${
                            game.role === "citizen"
                              ? "bg-green/10 text-green"
                              : "bg-red/10 text-red"
                          }`}
                        >
                          {game.role === "citizen" ? t("history.citizen") : t("history.imposter")}
                        </span>
                        <span className="text-[10px] text-cream/50 font-nunito">
                          {game.playerCount} {t("history.players")}
                        </span>
                        {game.xpEarned > 0 && (
                          <span className="text-[10px] text-gold font-nunito">
                            +{game.xpEarned} XP
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Date & expand */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] text-cream/50 font-nunito">
                        {formatDate(game.date)}
                      </div>
                      <motion.svg
                        width="12"
                        height="12"
                        viewBox="0 0 20 20"
                        className="ml-auto mt-1 text-cream/20"
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                      >
                        <path
                          d="M5 8l5 5 5-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </motion.svg>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-cream/[0.04] overflow-hidden"
                      >
                        <div className="px-4 py-3 space-y-3">
                          {/* Clues per round */}
                          {game.rounds.map((round) => (
                            <div key={round.roundNumber}>
                              <p className="text-[10px] text-cream/50 tracking-wider uppercase mb-1.5 font-nunito">
                                {t("history.round")} {round.roundNumber}
                              </p>
                              <div className="space-y-1">
                                {round.clues.map((clue, ci) => (
                                  <div
                                    key={ci}
                                    className="flex items-center gap-2 text-[12px]"
                                  >
                                    <span className="text-cream/50 font-nunito w-20 truncate">
                                      {clue.displayName}
                                    </span>
                                    <span className="text-gold font-medium font-nunito">
                                      {clue.clue}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}

                          {/* Players & roles */}
                          {game.players.length > 0 && (
                            <div>
                              <p className="text-[10px] text-cream/50 tracking-wider uppercase mb-1.5 font-nunito">
                                {t("history.playerRoles")}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {game.players.map((p, pi) => (
                                  <span
                                    key={pi}
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-nunito ${
                                      p.role === "imposter"
                                        ? "bg-red/10 text-red border border-red/15"
                                        : "bg-cream/[0.04] text-cream/50 border border-cream/[0.06]"
                                    }`}
                                  >
                                    {p.displayName}
                                    {p.role === "imposter" && " ★"}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Result */}
                          <div className="flex items-center gap-2 pt-1">
                            <span
                              className={`text-[11px] font-medium font-nunito ${
                                game.result === "win" ? "text-green" : "text-red"
                              }`}
                            >
                              {game.result === "win"
                                ? t("history.victory")
                                : t("history.defeat")}
                            </span>
                            <span className="text-[10px] text-cream/20">·</span>
                            <span className="text-[10px] text-cream/50 font-nunito">
                              {game.winners === "citizens"
                                ? t("result.citizensWin")
                                : t("result.imposterWins")}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Load more */}
          {hasMore && (
            <motion.div className="pt-2 pb-4" variants={staggerItem}>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full py-3 rounded-xl bg-cream/[0.03] border border-cream/[0.06] text-cream/50 text-xs font-nunito hover:bg-cream/[0.05] transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <motion.div
                    className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full mx-auto"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  t("history.loadMore")
                )}
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
