"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui";
import { isFS5Active, getRoleName } from "@/lib/fs5";
import type { GameEndData, VoteResult, RoomPlayer } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";

// Konfetti rəngləri
const CONFETTI_COLORS = ["#B8D4A8", "#C8A44E", "#A8C4E0", "#E0C4A8", "#F0997B"];

interface ResultScreenProps {
  gameEnd: GameEndData;
  voteResult: VoteResult;
  players: RoomPlayer[];
  currentUserId: string;
  onRematch: () => void;
  onBackToLobby: () => void;
}

export default function ResultScreen({
  gameEnd,
  voteResult,
  players,
  currentUserId,
  onRematch,
  onBackToLobby,
}: ResultScreenProps) {
  const { t } = useTranslation();
  const isCitizensWin = gameEnd.winners === "citizens";

  // Eliminated player
  const eliminatedPlayer = useMemo(() => {
    if (!voteResult.eliminatedId) return null;
    return players.find((p) => p.userId === voteResult.eliminatedId) || null;
  }, [voteResult.eliminatedId, players]);

  // My XP
  const myXp = useMemo(() => {
    return gameEnd.xpDistribution.find((x) => x.userId === currentUserId);
  }, [gameEnd.xpDistribution, currentUserId]);

  // Am I on the winning side?
  const isMyWin = useMemo(() => {
    const amImposter = gameEnd.imposters.includes(currentUserId);
    return (isCitizensWin && !amImposter) || (!isCitizensWin && amImposter);
  }, [gameEnd.imposters, currentUserId, isCitizensWin]);

  // Max votes for bar scaling
  const maxVoteCount = useMemo(() => {
    if (!voteResult.voteBreakdown.length) return 1;
    return Math.max(...voteResult.voteBreakdown.map((v) => v.count), 1);
  }, [voteResult.voteBreakdown]);

  // Confetti particles (only on win)
  const confetti = useMemo(() => {
    if (!isMyWin) return [];
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: `${5 + Math.random() * 90}%`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      width: 4 + Math.random() * 5,
      height: 4 + Math.random() * 8,
      delay: 1.2 + Math.random() * 0.6,
      duration: 1.8 + Math.random() * 0.8,
    }));
  }, [isMyWin]);

  return (
    <div className="flex flex-col min-h-screen bg-dark relative overflow-hidden">
      {/* Confetti */}
      {confetti.map((c) => (
        <motion.div
          key={c.id}
          className="absolute z-[2] rounded-sm"
          style={{
            left: c.left,
            top: 80,
            width: c.width,
            height: c.height,
            background: c.color,
          }}
          initial={{ y: 0, rotate: 0, opacity: 1 }}
          animate={{ y: 300, rotate: 360, opacity: 0 }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Body */}
      <div className="flex-1 px-6 py-4 text-center overflow-y-auto">
        {/* Reveal card */}
        <motion.div
          className={`p-5 rounded-2xl border mb-4 ${
            voteResult.wasImposter
              ? "bg-red/[0.04] border-red/15"
              : "bg-green/[0.04] border-green/15"
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            boxShadow: voteResult.wasImposter
              ? "0 0 20px rgba(232,89,60,0.08)"
              : "0 0 20px rgba(184,212,168,0.08)",
          }}
        >
          {/* Label */}
          <motion.p
            className="text-[10px] text-cream/50 tracking-[1.5px] uppercase font-nunito mb-2.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {voteResult.eliminatedId ? t("result.mostVoted") : t("result.noOneEliminated")}
          </motion.p>

          {/* Avatar */}
          {eliminatedPlayer && (
            <motion.div
              className="mx-auto mb-2.5"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6, type: "spring" }}
            >
              <Avatar
                name={eliminatedPlayer.displayName}
                color={eliminatedPlayer.avatarColor}
                size="lg"
              />
            </motion.div>
          )}

          {/* Name */}
          {eliminatedPlayer && (
            <motion.p
              className="text-[22px] font-medium text-cream font-nunito mb-1.5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              {eliminatedPlayer.displayName}
            </motion.p>
          )}

          {/* Role badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
          >
            <span
              className={`inline-block text-[14px] font-medium tracking-wider px-4 py-1.5 rounded-full ${
                voteResult.wasImposter
                  ? "bg-red/12 text-red border border-red/25"
                  : voteResult.eliminatedId
                  ? "bg-green/12 text-green border border-green/25"
                  : "bg-gold/12 text-gold border border-gold/25"
              }`}
            >
              {voteResult.eliminatedId
                ? voteResult.wasImposter
                  ? getRoleName("imposter", isFS5Active())
                  : getRoleName("citizen", isFS5Active())
                : t("result.tie")}
            </span>
          </motion.div>

          {/* Word reveal */}
          <motion.div
            className="mt-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            <p className="text-[9px] text-cream/50 tracking-wider uppercase font-nunito">
              {t("result.secretWord")}
            </p>
            <p className="text-[16px] text-gold font-medium font-nunito mt-1">
              {gameEnd.word}
            </p>
          </motion.div>
        </motion.div>

        {/* Vote breakdown */}
        {voteResult.voteBreakdown.length > 0 && (
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
          >
            <p className="text-[10px] text-cream/50 tracking-wider uppercase font-nunito mb-2.5">
              {t("result.voteBreakdown")}
            </p>
            <div className="space-y-1.5">
              {voteResult.voteBreakdown
                .sort((a, b) => b.count - a.count)
                .map((entry) => {
                  const player = players.find((p) => p.userId === entry.targetId);
                  const isImposter = gameEnd.imposters.includes(entry.targetId);
                  const barWidth = (entry.count / maxVoteCount) * 100;

                  return (
                    <div key={entry.targetId} className="flex items-center gap-2">
                      <span
                        className={`text-[12px] font-nunito w-14 text-right shrink-0 ${
                          isImposter ? "text-red" : "text-cream/50"
                        }`}
                      >
                        {player?.displayName || "?"}
                      </span>
                      <div className="flex-1 h-[7px] bg-white/[0.04] rounded overflow-hidden">
                        <motion.div
                          className="h-full rounded"
                          style={{
                            background: isImposter
                              ? "linear-gradient(90deg, rgba(232,89,60,0.3), #E8593C)"
                              : "rgba(200,164,78,0.4)",
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{ delay: 1.5, duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                      <span
                        className={`text-[12px] font-nunito w-5 shrink-0 ${
                          isImposter ? "text-red" : "text-cream/50"
                        }`}
                      >
                        {entry.count}
                      </span>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}

        {/* Winner announcement */}
        <motion.div
          className={`px-4 py-3.5 rounded-xl border mb-4 ${
            isCitizensWin
              ? "bg-green/[0.04] border-green/10"
              : "bg-red/[0.04] border-red/10"
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
        >
          <p
            className={`text-[18px] font-medium font-nunito ${
              isCitizensWin ? "text-green" : "text-red"
            }`}
          >
            {isCitizensWin ? t("result.citizensWin") : t("result.imposterWins")}
          </p>
          <p className="text-[11px] text-cream/50 font-nunito mt-0.5">
            {isCitizensWin ? t("result.imposterFound") : t("result.imposterSurvived")}
          </p>
        </motion.div>

        {/* XP section */}
        {myXp && (
          <motion.div
            className="flex gap-2.5 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
          >
            <div className="flex-1 py-2.5 px-3 rounded-xl bg-gold/[0.04] border border-gold/10 text-center">
              <p className="text-[16px] font-medium text-gold font-nunito">+{myXp.xp}</p>
              <p className="text-[8px] text-cream/50 tracking-wider uppercase font-nunito mt-0.5">
                {t("result.xpEarned")}
              </p>
            </div>
            {myXp.breakdown.length > 0 && (
              <div className="flex-1 py-2.5 px-3 rounded-xl bg-gold/[0.04] border border-gold/10 text-center">
                <div className="space-y-0.5">
                  {myXp.breakdown.map((b, i) => (
                    <p key={i} className="text-[10px] text-gold/70 font-nunito">{b}</p>
                  ))}
                </div>
                <p className="text-[8px] text-cream/50 tracking-wider uppercase font-nunito mt-1">
                  {t("result.details")}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Imposters reveal */}
        <motion.div
          className="mb-4 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.1 }}
        >
          <p className="text-[9px] text-cream/50 tracking-wider uppercase font-nunito mb-1.5">
            {gameEnd.imposters.length > 1 ? t("result.whoWereImposters") : t("result.whoWasImposter")}
          </p>
          <div className="flex justify-center gap-2">
            {gameEnd.imposters.map((id) => {
              const p = players.find((pl) => pl.userId === id);
              return (
                <div key={id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red/[0.08] border border-red/15">
                  <div className="w-5 h-5 rounded-full bg-red/20 flex items-center justify-center">
                    <span className="text-[8px] text-red font-medium">
                      {p?.displayName?.slice(0, 2).toUpperCase() || "?"}
                    </span>
                  </div>
                  <span className="text-[11px] text-red/80 font-nunito">{p?.displayName || "?"}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2 }}
        >
          <motion.button
            onClick={onRematch}
            className="w-full py-3.5 rounded-xl bg-green text-[#2A4A1C] text-[14px] font-medium font-nunito"
            whileTap={{ scale: 0.97 }}
          >
            {t("result.rematch")}
          </motion.button>
          <motion.button
            onClick={onBackToLobby}
            className="w-full py-3 rounded-xl border border-gold/20 text-gold text-[12px] font-nunito"
            whileTap={{ scale: 0.97 }}
          >
            {t("result.backToLobby")}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
