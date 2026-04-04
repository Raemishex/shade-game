"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui";
import type { RoomPlayer, Clue, ChatMessage } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";

interface RoundClues {
  roundNumber: number;
  clues: Clue[];
}

interface VotingPanelProps {
  players: RoomPlayer[];
  currentUserId: string;
  allRoundClues: RoundClues[];
  messages: ChatMessage[];
  onVote: (votedFor: string | null) => void;
  disabled?: boolean;
}

export default function VotingPanel({
  players,
  currentUserId,
  allRoundClues,
  messages,
  onVote,
  disabled = false,
}: VotingPanelProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [voteTimer, setVoteTimer] = useState(30);
  const confirmedRef = useRef(false);
  const onVoteRef = useRef(onVote);

  // onVote ref-i yenilə
  useEffect(() => {
    onVoteRef.current = onVote;
  }, [onVote]);

  // 30s vote timer — ref istifadə edirik, dependency yoxdur
  useEffect(() => {
    if (disabled) return;

    const interval = setInterval(() => {
      setVoteTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!confirmedRef.current) {
            confirmedRef.current = true;
            setConfirmed(true);
            onVoteRef.current(null);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [disabled]);

  const handleConfirm = useCallback(() => {
    if (confirmedRef.current || disabled) return;
    confirmedRef.current = true;
    setConfirmed(true);
    onVoteRef.current(selected);
  }, [disabled, selected]);

  const handleSkip = useCallback(() => {
    if (confirmedRef.current || disabled) return;
    confirmedRef.current = true;
    setSelected(null);
    setConfirmed(true);
    onVoteRef.current(null);
  }, [disabled]);

  // Get player clues from all rounds
  const getPlayerClues = (userId: string): string[] => {
    const clueList: string[] = [];
    allRoundClues.forEach((round) => {
      const c = round.clues.find((cl) => cl.userId === userId);
      if (c) clueList.push(c.clue);
    });
    return clueList;
  };

  // Last 3 discussion messages
  const lastMessages = messages.slice(-3);

  const timerLow = voteTimer <= 10;

  // Votable players (exclude self)
  const votablePlayers = players.filter((p) => p.userId !== currentUserId);

  if (votablePlayers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-10 text-center">
        <p className="text-cream/50 font-nunito">{t("voting.noPlayersToVote") || "Səs vermək üçün oyunçu yoxdur"}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <div className="px-6 py-3 text-center border-b border-gold/[0.08]">
        <p className="text-[10px] text-gold tracking-[1.5px] uppercase font-nunito mb-1">
          {t("voting.title")}
        </p>
        <p className="text-[20px] font-medium text-cream font-nunito mb-1.5">
          {t("voting.whoIsImposter")}
        </p>
        {/* Timer */}
        <motion.div
          className="inline-flex items-center gap-1.5"
          animate={timerLow ? { scale: [1, 1.05, 1] } : {}}
          transition={timerLow ? { duration: 1.5, repeat: Infinity } : {}}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            className={timerLow ? "text-red" : "text-gold"}
          >
            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 5v5l3 2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span
            className={`text-[16px] font-medium font-nunito tabular-nums ${
              timerLow ? "text-red" : "text-gold"
            }`}
          >
            0:{voteTimer.toString().padStart(2, "0")}
          </span>
        </motion.div>
      </div>

      {/* Discussion summary (last 3 messages) */}
      {lastMessages.length > 0 && (
        <div className="mx-5 mt-3 px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] max-h-[100px] overflow-hidden">
          <p className="text-[9px] text-cream/50 tracking-wider uppercase font-nunito mb-1.5">
            {t("voting.discussion")}
          </p>
          {lastMessages.map((msg, i) => (
            <div key={i} className="flex items-start gap-1.5 mb-1 last:mb-0">
              <span className="text-[10px] text-gold font-medium font-nunito shrink-0">
                {msg.displayName}:
              </span>
              <span className="text-[10px] text-cream/50 font-nunito leading-tight">
                {msg.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Vote section */}
      <div className="flex-1 px-5 py-2.5 overflow-y-auto">
        <p className="text-[10px] text-cream/50 tracking-wider uppercase font-nunito mb-2.5 text-center">
          {t("voting.chooseSuspect")}
        </p>

        <div className="flex flex-col gap-[7px]">
          {votablePlayers.map((player, i) => {
            const isSelected = selected === player.userId;
            const playerClues = getPlayerClues(player.userId);

            return (
              <motion.button
                key={player.userId}
                onClick={() => !confirmedRef.current && setSelected(isSelected ? null : player.userId)}
                disabled={confirmed}
                className={`flex items-center gap-2.5 px-3 py-[11px] rounded-xl border transition-all text-left ${
                  isSelected
                    ? "border-green/40 bg-green/[0.06]"
                    : "border-white/[0.04] bg-white/[0.02] hover:border-gold/20 hover:bg-gold/[0.03]"
                } ${confirmed ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                style={isSelected ? {
                  boxShadow: "0 0 12px rgba(184,212,168,0.12)",
                  animation: "none",
                } : undefined}
              >
                <Avatar
                  name={player.displayName}
                  color={player.avatarColor}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-cream font-medium font-nunito">
                    {player.displayName}
                  </p>
                  {playerClues.length > 0 && (
                    <p className="text-[10px] text-cream/35 font-nunito mt-0.5 truncate">
                      {t("voting.clue")} {playerClues.map((c) => `"${c}"`).join(", ")}
                    </p>
                  )}
                </div>

                {/* Checkbox */}
                <div
                  className={`w-[22px] h-[22px] rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? "border-green bg-green/15"
                      : "border-cream/15"
                  }`}
                >
                  <AnimatePresence>
                    {isSelected && (
                      <motion.svg
                        width="12"
                        height="12"
                        viewBox="0 0 20 20"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <path
                          d="M5 10l3 3 7-7"
                          fill="none"
                          stroke="#B8D4A8"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Confirm button */}
      <div className="px-5 pb-2">
        <motion.button
          onClick={handleConfirm}
          disabled={confirmed}
          className={`w-full py-3.5 rounded-xl text-[14px] font-medium font-nunito transition-colors ${
            confirmed
              ? "bg-green/30 text-green/50 cursor-not-allowed"
              : "bg-green text-[#2A4A1C] hover:bg-green/90"
          }`}
          whileTap={!confirmed ? { scale: 0.97 } : {}}
        >
          {confirmed ? t("voting.voted") : t("voting.confirmVote")}
        </motion.button>
      </div>

      {/* Skip button */}
      <div className="px-5 pb-4">
        <button
          onClick={handleSkip}
          disabled={confirmed}
          className={`w-full py-1.5 text-[11px] font-nunito text-center transition-colors ${
            confirmed ? "text-cream/20 cursor-not-allowed" : "text-cream/50 hover:text-cream/60"
          }`}
        >
          {t("voting.voteNobody")}
        </button>
      </div>
    </div>
  );
}
