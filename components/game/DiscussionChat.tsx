"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatMessage, Clue } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";

interface RoundClues {
  roundNumber: number;
  clues: Clue[];
}

interface DiscussionChatProps {
  messages: ChatMessage[];
  allRoundClues: RoundClues[];
  currentUserId: string;
  timeLeft: number | null;
  isEnded: boolean;
  onSendMessage: (message: string) => void;
}

export default function DiscussionChat({
  messages,
  allRoundClues,
  currentUserId,
  timeLeft,
  isEnded,
  onSendMessage,
}: DiscussionChatProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [rateLimited, setRateLimited] = useState(false);
  const [showClues, setShowClues] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastSentRef = useRef(0);

  // Auto-scroll on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || trimmed.length > 200 || isEnded) return;

    // Client-side rate limit (2s)
    const now = Date.now();
    if (now - lastSentRef.current < 2000) {
      setRateLimited(true);
      setTimeout(() => setRateLimited(false), 2000 - (now - lastSentRef.current));
      return;
    }

    lastSentRef.current = now;
    setInput("");
    onSendMessage(trimmed);
  }, [input, isEnded, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Format time for individual messages
  const formatTime = (timestamp: Date) => {
    const d = new Date(timestamp);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Discussion header */}
      <div className="px-5 py-2 text-center border-b border-blue/[0.08]">
        <motion.p
          className="text-[13px] text-blue font-medium font-nunito"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {t("discussion.title")}
        </motion.p>
        <p className="text-[10px] text-cream/50 font-nunito mt-0.5">
          {timeLeft !== null && timeLeft > 0
            ? t("discussion.timeLeft").replace("{seconds}", String(timeLeft))
            : t("discussion.discuss")}
        </p>
      </div>

      {/* Clue summary toggle */}
      <button
        onClick={() => setShowClues(!showClues)}
        className="mx-4 mt-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[10px] text-cream/50 font-nunito tracking-wider flex items-center justify-between"
      >
        <span>{t("discussion.showClues")}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 20 20"
          className={`text-cream/50 transition-transform ${showClues ? "rotate-180" : ""}`}
        >
          <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Collapsible clue summary */}
      <AnimatePresence>
        {showClues && (
          <motion.div
            className="mx-4 mt-1 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.03] overflow-y-auto max-h-[25vh]"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {allRoundClues.map((round) => (
              <div key={round.roundNumber} className="mb-2 last:mb-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-[0.5px] bg-gold/10" />
                  <span className="text-[8px] text-gold/40 tracking-widest uppercase font-nunito">
                    {t("discussion.roundLabel")} {round.roundNumber}
                  </span>
                  <div className="flex-1 h-[0.5px] bg-gold/10" />
                </div>
                {round.clues.map((c) => (
                  <div key={c.userId} className="flex items-center gap-2 py-0.5">
                    <span
                      className={`text-[10px] font-nunito min-w-[45px] ${
                        c.userId === currentUserId ? "text-green/60" : "text-cream/50"
                      }`}
                    >
                      {c.userId === currentUserId ? t("lobby.you") : c.displayName}
                    </span>
                    <span className="text-[11px] text-cream/60 font-nunito">{c.clue}</span>
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5">
        {messages.length === 0 && !isEnded && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[11px] text-cream/20 font-nunito">
              {t("discussion.startDiscussing")}
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.userId === currentUserId;
          return (
            <motion.div
              key={i}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className={`max-w-[75%] px-3 py-2 rounded-xl ${
                  isMe
                    ? "bg-gold/15 rounded-br-sm"
                    : "bg-white/[0.04] rounded-bl-sm"
                }`}
              >
                {!isMe && (
                  <p className="text-[9px] text-cream/50 font-nunito font-medium mb-0.5">
                    {msg.displayName}
                  </p>
                )}
                <p className={`text-[13px] font-nunito ${isMe ? "text-gold" : "text-cream"}`}>
                  {msg.message}
                </p>
                <p className={`text-[8px] mt-0.5 ${isMe ? "text-gold/30 text-right" : "text-cream/20"}`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </motion.div>
          );
        })}

        {/* Discussion ended message */}
        <AnimatePresence>
          {isEnded && (
            <motion.div
              className="flex justify-center py-3"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="px-4 py-2 rounded-xl bg-red/10 border border-red/20 text-center">
                <p className="text-[12px] text-red font-medium font-nunito">
                  {t("discussion.ended")}
                </p>
                <p className="text-[10px] text-cream/50 font-nunito mt-0.5">
                  {t("discussion.votingStarts")}
                </p>
                {/* 3 bouncing dots */}
                <div className="flex gap-1 justify-center mt-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-red/60"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 pt-2">
        {rateLimited && (
          <motion.p
            className="text-orange text-[10px] mb-1 text-center font-nunito"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {t("discussion.tooFast")}
          </motion.p>
        )}

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isEnded}
              maxLength={200}
              placeholder={isEnded ? t("discussion.discussionEnded") : t("discussion.writeMsgPlaceholder")}
              className={`w-full px-3.5 py-2.5 rounded-xl text-[13px] font-nunito outline-none transition-colors
                ${
                  isEnded
                    ? "bg-white/[0.02] text-cream/50 border border-white/[0.03] cursor-not-allowed"
                    : "bg-white/[0.04] text-cream border border-blue/20 focus:border-blue/40 placeholder:text-cream/25"
                }`}
            />
            {!isEnded && input.length > 150 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-cream/25 font-nunito">
                {input.length}/200
              </span>
            )}
          </div>

          <motion.button
            onClick={handleSend}
            disabled={isEnded || !input.trim()}
            className={`px-4 rounded-xl text-[13px] font-medium font-nunito transition-colors ${
              isEnded || !input.trim()
                ? "bg-blue/20 text-blue/40 cursor-not-allowed"
                : "bg-blue/80 text-dark hover:bg-blue"
            }`}
            whileTap={!isEnded && input.trim() ? { scale: 0.95 } : {}}
          >
            <svg width="16" height="16" viewBox="0 0 20 20">
              <path
                d="M3 10l14-7-4 7 4 7L3 10z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
