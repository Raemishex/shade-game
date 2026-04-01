"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui";
import type { Clue, RoomPlayer } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";

interface RoundClues {
  roundNumber: number;
  clues: Clue[];
}

interface ClueSystemProps {
  players: RoomPlayer[];
  clues: Clue[];
  allRoundClues: RoundClues[];
  currentRound: number;
  currentUserId: string;
  timerSeconds: number;
  onSubmitClue: (clue: string) => void;
  disabled?: boolean;
}

export default function ClueSystem({
  players,
  clues,
  allRoundClues,
  currentRound,
  currentUserId,
  timerSeconds,
  onSubmitClue,
  disabled = false,
}: ClueSystemProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const hasSubmitted = clues.some((c) => c.userId === currentUserId);

  // Auto-submit "---" when timer runs out
  useEffect(() => {
    if (timerSeconds <= 0 && !hasSubmitted && !disabled) {
      onSubmitClue("---");
    }
  }, [timerSeconds, hasSubmitted, disabled, onSubmitClue]);

  // Reset input on new round
  useEffect(() => {
    setInput("");
    setError("");
  }, [currentRound]);

  // Auto-scroll to bottom when new round starts
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [currentRound, clues.length]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      setError(t("clue.writeClue"));
      return;
    }
    if (trimmed.includes(" ")) {
      setError(t("clue.oneWordOnly"));
      return;
    }
    if (trimmed.length > 30) {
      setError(t("clue.maxChars"));
      return;
    }
    setError("");
    setInput("");
    onSubmitClue(trimmed);
  }, [input, onSubmitClue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="flex flex-col flex-1">
      {/* Clue list */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-2">
        {/* Previous rounds */}
        {allRoundClues.map((round) => (
          <div key={round.roundNumber} className="mb-2">
            {/* Round separator */}
            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-[0.5px] bg-gold/10" />
              <span className="text-[9px] text-gold/40 tracking-widest uppercase font-nunito">
                {t("clue.roundLabel")} {round.roundNumber}
              </span>
              <div className="flex-1 h-[0.5px] bg-gold/10" />
            </div>
            <div className="space-y-1">
              {round.clues.map((c) => (
                <div
                  key={c.userId}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-[10px] bg-white/[0.02] border border-white/[0.03]"
                >
                  <span className="text-[11px] text-cream/50 font-nunito min-w-[50px]">
                    {c.userId === currentUserId ? t("lobby.you") : c.displayName}
                  </span>
                  <span className="flex-1 text-right text-[13px] text-cream/60 font-nunito">
                    {c.clue}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Current round separator (if rounds > 1) */}
        {allRoundClues.length > 0 && (
          <div className="flex items-center gap-2 my-2">
            <div className="flex-1 h-[0.5px] bg-gold/10" />
            <span className="text-[9px] text-gold/60 tracking-widest uppercase font-nunito font-medium">
              {t("clue.roundLabel")} {currentRound}
            </span>
            <div className="flex-1 h-[0.5px] bg-gold/10" />
          </div>
        )}

        {/* Current round clues */}
        <div className="space-y-1.5">
          {players.map((player) => {
            const clue = clues.find((c) => c.userId === player.userId);
            const isMe = player.userId === currentUserId;

            return (
              <div
                key={player.userId}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-[10px] ${
                  clue
                    ? "bg-white/[0.03] border border-white/[0.05]"
                    : "bg-white/[0.01] border border-white/[0.02]"
                }`}
              >
                <Avatar
                  name={player.displayName}
                  color={player.avatarColor}
                  size="sm"
                />
                <span className="text-[12px] text-cream/70 font-nunito min-w-[60px]">
                  {isMe ? t("lobby.you") : player.displayName}
                </span>

                <div className="flex-1 text-right">
                  {clue ? (
                    <motion.span
                      className="text-[14px] text-cream font-medium font-nunito"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {clue.clue}
                    </motion.span>
                  ) : (
                    <motion.span
                      className="text-[11px] text-cream/25 font-nunito"
                      animate={{ opacity: [0.25, 0.5, 0.25] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      {t("clue.waiting")}
                    </motion.span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 pt-2">
        {error && (
          <motion.p
            className="text-red text-[10px] mb-1.5 text-center font-nunito"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value.replace(/\s/g, ""));
                setError("");
              }}
              onKeyDown={handleKeyDown}
              disabled={hasSubmitted || disabled}
              maxLength={30}
              placeholder={hasSubmitted ? t("clue.clueGiven") : t("clue.placeholder")}
              className={`w-full px-3.5 py-2.5 rounded-xl text-[13px] font-nunito outline-none transition-colors
                ${
                  hasSubmitted
                    ? "bg-white/[0.02] text-cream/50 border border-white/[0.03] cursor-not-allowed"
                    : "bg-white/[0.04] text-cream border border-gold/[0.15] focus:border-gold/30 placeholder:text-cream/25"
                }`}
            />
            {!hasSubmitted && input.length > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-cream/25 font-nunito">
                {input.length}/30
              </span>
            )}
          </div>

          <motion.button
            onClick={handleSubmit}
            disabled={hasSubmitted || disabled || !input.trim()}
            className={`px-4 rounded-xl text-[13px] font-medium font-nunito transition-colors ${
              hasSubmitted || !input.trim()
                ? "bg-green/20 text-green/40 cursor-not-allowed"
                : "bg-green/80 text-dark hover:bg-green"
            }`}
            whileTap={!hasSubmitted && input.trim() ? { scale: 0.95 } : {}}
          >
            {hasSubmitted ? (
              <svg width="16" height="16" viewBox="0 0 20 20">
                <path
                  d="M5 10l3 3 7-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              t("clue.submit")
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
