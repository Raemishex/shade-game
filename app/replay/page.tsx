"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useTranslation } from "@/hooks/useTranslation";

interface ReplayPlayer {
  id: string;
  name: string;
  color: string;
  role: string;
}

interface ReplayClue {
  playerId: string;
  playerName: string;
  clue: string;
}

interface ReplayRound {
  number: number;
  clues: ReplayClue[];
}

interface ReplayVote {
  voterId: string;
  votedFor: string | null;
}

interface GameReplay {
  id: string;
  roomCode: string;
  category: string;
  word: string;
  imposters: string[];
  players: ReplayPlayer[];
  rounds: ReplayRound[];
  votes: ReplayVote[];
  winner: "citizens" | "imposters";
  createdAt: string;
}

export default function ReplayListPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [replays, setReplays] = useState<GameReplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedReplay, setSelectedReplay] = useState<GameReplay | null>(null);

  const fetchReplays = useCallback(async (pageNum: number, append = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/replays?page=${pageNum}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setReplays((prev) => (append ? [...prev, ...data.replays] : data.replays));
        setHasMore(data.pagination.hasMore);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReplays(1);
  }, [fetchReplays]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchReplays(next, true);
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

  const getPlayerName = (replay: GameReplay, id: string) => {
    const p = replay.players.find((pl) => pl.id === id);
    return p?.name || id;
  };

  return (
    <div className="min-h-screen bg-dark pb-24 lg:max-w-3xl lg:mx-auto">
      {/* Header */}
      <div className="pt-6 pb-3 px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/modes")}
            className="flex items-center gap-1 text-gold text-sm font-nunito"
          >
            <svg width="14" height="14" viewBox="0 0 20 20">
              <path d="M13 4L7 10L13 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-cream text-center font-nunito flex-1">
            {t("replay.title")}
          </h1>
          <div className="w-6" />
        </div>
      </div>

      {/* Loading */}
      {loading && replays.length === 0 && (
        <div className="flex justify-center py-12">
          <motion.div
            className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      {/* Empty state */}
      {!loading && replays.length === 0 && (
        <motion.div
          className="text-center py-16 px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 rounded-full bg-cream/[0.03] border border-cream/[0.06] mx-auto mb-4 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#555" strokeWidth="1.5" />
              <polygon points="10,8 16,12 10,16" fill="none" stroke="#555" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-cream/50 text-sm font-nunito">{t("replay.noReplays")}</p>
        </motion.div>
      )}

      {/* Replay list */}
      {replays.length > 0 && (
        <motion.div
          className="px-6 space-y-2"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {replays.map((replay) => (
            <motion.button
              key={replay.id}
              variants={staggerItem}
              onClick={() => setSelectedReplay(replay)}
              className="w-full p-4 rounded-xl bg-cream/[0.02] border border-cream/[0.05] text-left hover:bg-cream/[0.04] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      replay.winner === "citizens"
                        ? "bg-green/10 border border-green/20"
                        : "bg-red/10 border border-red/20"
                    }`}
                  >
                    {replay.winner === "citizens" ? (
                      <svg width="18" height="18" viewBox="0 0 20 20">
                        <path d="M6 4h8v6c0 2.2-1.8 4-4 4s-4-1.8-4-4V4z" fill="none" stroke="#B8D4A8" strokeWidth="1.2" />
                        <path d="M8 16h4" stroke="#B8D4A8" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 20 20">
                        <path d="M6 6l8 8M14 6l-8 8" stroke="#E8593C" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-cream font-medium font-nunito">{replay.word}</span>
                      <span className="text-[10px] text-cream/50 font-nunito">{replay.category}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-cream/50 font-nunito">
                        {replay.players.length} {t("history.players")}
                      </span>
                      <span className="text-[10px] text-cream/30 font-nunito">
                        {replay.rounds.length} {t("history.round")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] text-cream/50 font-nunito">{formatDate(replay.createdAt)}</div>
                  <svg width="12" height="12" viewBox="0 0 20 20" className="ml-auto mt-1 text-cream/20">
                    <path d="M7 4l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </motion.button>
          ))}

          {hasMore && (
            <motion.div className="pt-2 pb-4" variants={staggerItem}>
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-cream/[0.03] border border-cream/[0.06] text-cream/50 text-xs font-nunito hover:bg-cream/[0.05] transition-colors disabled:opacity-50"
              >
                {loading ? (
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

      {/* Replay Detail Modal */}
      <AnimatePresence>
        {selectedReplay && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-dark/80 backdrop-blur-sm px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedReplay(null)}
          >
            <motion.div
              className="w-full max-w-sm bg-[#1A1A18] border border-gold/20 rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="text-center mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 ${
                    selectedReplay.winner === "citizens"
                      ? "bg-green/10 border border-green/20"
                      : "bg-red/10 border border-red/20"
                  }`}
                >
                  {selectedReplay.winner === "citizens" ? (
                    <svg width="22" height="22" viewBox="0 0 20 20">
                      <path d="M6 4h8v6c0 2.2-1.8 4-4 4s-4-1.8-4-4V4z" fill="none" stroke="#B8D4A8" strokeWidth="1.2" />
                      <path d="M8 16h4" stroke="#B8D4A8" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 20 20">
                      <path d="M6 6l8 8M14 6l-8 8" stroke="#E8593C" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-cream font-nunito">{selectedReplay.word}</h2>
                <p className="text-[11px] text-cream/50 font-nunito">{selectedReplay.category}</p>
              </div>

              {/* Rounds & Clues */}
              {selectedReplay.rounds.map((round) => (
                <div key={round.number} className="mb-3">
                  <p className="text-[10px] text-cream/50 tracking-wider uppercase mb-1.5 font-nunito">
                    {t("replay.round")} {round.number}
                  </p>
                  <div className="space-y-1">
                    {round.clues.map((clue, ci) => (
                      <div key={ci} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cream/[0.02] border border-cream/[0.04]">
                        <span className="text-[10px] text-cream/50 font-nunito w-20 truncate">{clue.playerName}</span>
                        <span className="text-[12px] text-gold font-medium font-nunito">{clue.clue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Votes */}
              {selectedReplay.votes.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] text-cream/50 tracking-wider uppercase mb-1.5 font-nunito">
                    {t("replay.votes")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedReplay.votes.map((vote, vi) => (
                      <span key={vi} className="text-[10px] px-2 py-0.5 rounded-full font-nunito bg-cream/[0.04] text-cream/60 border border-cream/[0.06]">
                        {getPlayerName(selectedReplay, vote.voterId)} → {vote.votedFor ? getPlayerName(selectedReplay, vote.votedFor) : "—"}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Players & Roles */}
              <div className="mb-4">
                <p className="text-[10px] text-cream/50 tracking-wider uppercase mb-1.5 font-nunito">
                  {t("history.playerRoles")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedReplay.players.map((p, pi) => (
                    <span
                      key={pi}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-nunito ${
                        p.role === "imposter"
                          ? "bg-red/10 text-red border border-red/15"
                          : "bg-cream/[0.04] text-cream/50 border border-cream/[0.06]"
                      }`}
                    >
                      {p.name}
                      {p.role === "imposter" && " ★"}
                    </span>
                  ))}
                </div>
              </div>

              {/* Result */}
              <div className={`text-center p-3 rounded-xl mb-4 ${
                selectedReplay.winner === "citizens"
                  ? "bg-green/[0.05] border border-green/[0.1]"
                  : "bg-red/[0.05] border border-red/[0.1]"
              }`}>
                <p className={`text-[12px] font-medium font-nunito ${
                  selectedReplay.winner === "citizens" ? "text-green" : "text-red"
                }`}>
                  {selectedReplay.winner === "citizens" ? t("result.citizensWin") : t("result.imposterWins")}
                </p>
              </div>

              <button
                onClick={() => setSelectedReplay(null)}
                className="w-full py-2.5 rounded-xl bg-cream/[0.05] border border-cream/[0.08] text-cream/60 text-sm font-nunito hover:bg-cream/[0.08] transition-colors"
              >
                {t("tournament.close")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
