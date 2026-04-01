"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getGuestUser } from "@/lib/guest";
import { useSocket } from "@/hooks/useSocket";
import { useRoom } from "@/hooks/useRoom";
import { useGame } from "@/hooks/useGame";
import { getSocket } from "@/lib/socket";
import CardFlip from "@/components/game/CardFlip";
import ClueSystem from "@/components/game/ClueSystem";
import DiscussionChat from "@/components/game/DiscussionChat";
import VotingPanel from "@/components/game/VotingPanel";
import ResultScreen from "@/components/game/ResultScreen";
// EmojiBar and EmojiFloat removed — not used in current layout
import { useTranslation } from "@/hooks/useTranslation";
import { useSound } from "@/hooks/useSound";
import { GameNotifications } from "@/lib/notifications";
import { isFS5Active, getRoleName } from "@/lib/fs5";
import { getDailyChallenge, completeDailyChallenge } from "@/lib/daily";
import type { RoomPlayer } from "@/types";

// Emoji bar
const EMOJI_LIST = ["😂", "🤔", "😱", "👏", "🔥"];

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const code = (params.id as string)?.toUpperCase();

  // SSR hydration fix: getGuestUser() yalnız client-də çağır
  const [guest, setGuest] = useState<{ userId: string; displayName: string; avatarColor: string } | null>(null);

  useEffect(() => {
    setGuest(getGuestUser());
  }, []);

  const auth = useMemo(
    () => guest ? {
      userId: guest.userId,
      displayName: guest.displayName,
      avatarColor: guest.avatarColor,
    } : null,
    [guest]
  );

  const { isConnected } = useSocket(auth ?? undefined);
  const { room } = useRoom(code);
  const {
    wordData,
    currentRound,
    clues,
    allRoundClues,
    isDiscussion,
    discussionTimeLeft,
    isVoting,
    gameEnd,
    voteResult,
    roundTransition,
    submitClue,
    castVote,
    sendMessage,
    messages,
  } = useGame(code);

  const { playGameMusic, playVotingMusic, playFlip, playTimerEnd, playEmoji, stopMusic } = useSound();
  const [showCard, setShowCard] = useState(true);
  const [roundTimer, setRoundTimer] = useState(60);
  const [discussionEnded, setDiscussionEnded] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [gameInfo, setGameInfo] = useState<{
    playerCount: number;
    imposterCount: number;
    rounds: number;
    category: string;
  } | null>(null);

  // Loading timeout — 15s sonra xəbərdarlıq göstər
  useEffect(() => {
    if (wordData) return; // artıq yüklənib
    const timer = setTimeout(() => setLoadingTimeout(true), 15000);
    return () => clearTimeout(timer);
  }, [wordData]);

  // Screen Wake Lock — telefon ekranı sönməsin
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch { /* ignore — user denied or not supported */ }
    }

    requestWakeLock();

    // Re-acquire on visibility change (phone sleep/wake)
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, []);

  // Oyun musiqisi
  useEffect(() => {
    if (wordData && !showCard) playGameMusic();
    if (isVoting) playVotingMusic();
    return () => stopMusic();
  }, [!!wordData, showCard, isVoting, playGameMusic, playVotingMusic, stopMusic]);

  // Listen for game:start info
  useEffect(() => {
    const socket = getSocket();

    type GameStartInfo = {
      playerCount: number;
      imposterCount: number;
      rounds: number;
      category: string;
    };

    function onGameStart(data: GameStartInfo) {
      setGameInfo(data);
    }

    function onRoundStart() {
      setRoundTimer(60);
    }

    socket.on("game:start", onGameStart);
    socket.on("round:start", onRoundStart);

    return () => {
      socket.off("game:start", onGameStart);
      socket.off("round:start", onRoundStart);
    };
  }, []);

  // Bildirişlər
  useEffect(() => {
    if (wordData && !showCard) {
      GameNotifications.gameStarted(code);
    }
  }, [!!wordData, showCard, code]);

  useEffect(() => {
    if (isVoting) {
      GameNotifications.voteTime();
    }
  }, [isVoting]);

  useEffect(() => {
    if (gameEnd) {
      const guest = getGuestUser();
      const amImposter = gameEnd.imposters.includes(guest.userId);
      const isCitizensWin = gameEnd.winners === "citizens";
      const won = (isCitizensWin && !amImposter) || (!isCitizensWin && amImposter);
      GameNotifications.gameResult(won);
    }
  }, [gameEnd]);

  // Complete daily challenge if category matches
  useEffect(() => {
    if (gameEnd && gameInfo?.category) {
      const daily = getDailyChallenge();
      if (!daily.isCompleted && daily.categoryId === gameInfo.category) {
        completeDailyChallenge();
      }
    }
  }, [gameEnd, gameInfo?.category]);

  // Round countdown timer (only during clue phase)
  useEffect(() => {
    if (currentRound <= 0 || showCard || isDiscussion) return;

    const interval = setInterval(() => {
      setRoundTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          playTimerEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentRound, showCard, isDiscussion, playTimerEnd]);

  // Handle card viewed
  const handleCardViewed = useCallback(() => {
    playFlip();
  }, [playFlip]);

  // Send emoji
  const handleEmoji = useCallback(
    (emoji: string) => {
      playEmoji();
      const socket = getSocket();
      socket.emit("emoji:send", {
        roomCode: code,
        emoji,
      });
    },
    [code, guest?.userId]
  );

  // Detect discussion end → show transition, then voting
  useEffect(() => {
    if (!isDiscussion && discussionTimeLeft === null && messages.length > 0 && !isVoting && !discussionEnded) {
      // discussion just ended
      setDiscussionEnded(true);
    }
  }, [isDiscussion, discussionTimeLeft, messages.length, isVoting, discussionEnded]);

  // Reset discussionEnded when voting starts
  useEffect(() => {
    if (isVoting) {
      setDiscussionEnded(false);
    }
  }, [isVoting]);

  // Rematch handler — yeni oyun yarat
  const handleRematch = useCallback(() => {
    router.push("/lobby/create");
  }, [router]);

  // Back to lobby handler
  const handleBackToLobby = useCallback(() => {
    router.push(`/lobby/${code}`);
  }, [router, code]);

  const players: RoomPlayer[] = room?.players ?? [];
  const totalRounds = gameInfo?.rounds ?? room?.settings?.rounds ?? 2;

  // Timer display
  const timerValue = isDiscussion ? (discussionTimeLeft ?? 0) : roundTimer;
  const timerMin = Math.floor(timerValue / 60);
  const timerSec = timerValue % 60;
  const timerStr = `${timerMin}:${timerSec.toString().padStart(2, "0")}`;
  const timerLow = timerValue <= 10;

  // Header label
  const headerLabel = isDiscussion
    ? t("game.discussion")
    : `${t("game.round")} ${currentRound}/${totalRounds}`;

  // Guest data loading (SSR hydration fix)
  if (!guest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-dark px-6">
        <span className="text-cream/60 text-lg font-nunito">{t("game.loading")}</span>
      </div>
    );
  }

  // Result screen
  if (gameEnd && voteResult) {
    return (
      <ResultScreen
        gameEnd={gameEnd}
        voteResult={voteResult}
        players={players}
        currentUserId={guest.userId}
        onRematch={handleRematch}
        onBackToLobby={handleBackToLobby}
      />
    );
  }

  // Card flip overlay
  if (showCard && wordData) {
    return (
      <CardFlip
        word={wordData.word}
        category={wordData.category}
        role={wordData.role}
        onViewed={() => {
          handleCardViewed();
          setShowCard(false);
        }}
      />
    );
  }

  // Waiting for game data
  if (!wordData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-dark px-6">
        <motion.div
          className="flex gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-cream/60 text-lg font-nunito">{t("game.loading")}</span>
          <motion.span
            className="text-gold text-lg"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            ...
          </motion.span>
        </motion.div>
        <p className="text-cream/50 text-xs font-nunito mt-3">
          {isConnected ? t("game.serverConnected") : t("game.serverConnecting")}
          {" · "}{t("game.roomCode")} {code}
        </p>
        {loadingTimeout && (
          <div className="mt-6 text-center max-w-xs">
            <p className="text-red/70 text-sm font-nunito mb-2">
              {t("game.dataError")}
            </p>
            <p className="text-cream/50 text-xs font-nunito mb-4">
              {t("game.dataErrorDesc")}
            </p>
            <button
              onClick={() => router.push(`/lobby/${code}`)}
              className="px-5 py-2 rounded-xl bg-gold/10 border border-gold/20 text-gold text-sm font-nunito"
            >
              {t("result.backToLobby")}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-dark relative">
      {/* Round transition overlay */}
      <AnimatePresence>
        {roundTransition && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-dark/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <motion.p
                className="text-[48px] font-bold text-gold font-nunito"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              >
                {t("game.round")} {roundTransition}
              </motion.p>
              <motion.p
                className="text-cream/50 text-sm font-nunito mt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {t("game.prepareClues")}
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header: round/discussion, timer, player count (hidden during voting) */}
      {!isVoting && <div className="flex items-center justify-between px-5 py-2.5 border-b border-gold/[0.08]">
        <span className={`text-[12px] font-nunito ${isDiscussion ? "text-gold font-medium" : "text-cream/50"}`}>
          {headerLabel}
        </span>

        {/* Timer */}
        <motion.div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg ${
            timerLow
              ? "bg-red/10 border border-red/20"
              : isDiscussion
              ? "bg-blue/10 border border-blue/20"
              : "bg-gold/[0.06] border border-gold/[0.12]"
          }`}
          animate={timerLow ? { scale: [1, 1.03, 1] } : {}}
          transition={timerLow ? { duration: 1, repeat: Infinity } : {}}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 20 20"
            className={timerLow ? "text-red" : isDiscussion ? "text-blue" : "text-gold"}
          >
            <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="M10 6v4.5l2.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span
            className={`text-[13px] font-medium font-nunito tabular-nums ${
              timerLow ? "text-red" : isDiscussion ? "text-blue" : "text-gold"
            }`}
          >
            {timerStr}
          </span>
        </motion.div>

        <span className="text-[12px] text-cream/50 font-nunito">
          {players.length} {t("game.players")}
        </span>
      </div>}

      {/* Role indicator (hidden during voting) */}
      {!isVoting && <div className="px-5 py-2 flex items-center justify-center gap-2">
        <span
          className={`text-[11px] font-medium px-3 py-1 rounded-full tracking-wider border ${
            wordData.role === "citizen"
              ? "bg-green/10 text-green border-green/20"
              : "bg-red/10 text-red border-red/20"
          }`}
        >
          {getRoleName(wordData.role, isFS5Active())}
        </span>
        {wordData.role === "citizen" && wordData.word && (
          <span className="text-[13px] text-cream/60 font-nunito">
            {t("game.word")} <span className="text-gold font-medium">{wordData.word}</span>
          </span>
        )}
        {wordData.role === "imposter" && wordData.categoryHint && (
          <span className="text-[11px] text-cream/50 font-nunito">
            {t("game.categoryShort")} {wordData.categoryHint}
          </span>
        )}
      </div>}

      {/* Main content — tablet: 2 panel, desktop: 3 panel */}
      <div className="flex-1 flex flex-col md:flex-row md:gap-4 md:px-4 md:max-w-5xl md:mx-auto md:w-full lg:max-w-7xl lg:gap-5 lg:px-6">
        {/* Left sidebar: player list (desktop only) */}
        <div className="hidden lg:flex lg:flex-col lg:w-[220px] lg:flex-shrink-0 lg:py-3">
          <p className="text-[10px] text-cream/50 tracking-[1.5px] uppercase font-nunito mb-2">{t("game.players")}</p>
          <div className="flex flex-col gap-1.5">
            {players.map((player) => {
              const isMe = player.userId === guest.userId;
              return (
                <div
                  key={player.userId}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.02] border transition-colors hover:bg-white/[0.04] ${
                    isMe ? "border-gold/[0.12]" : "border-white/[0.03]"
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium text-dark"
                    style={{ backgroundColor: player.avatarColor || "#C8A44E" }}
                  >
                    {player.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className={`text-[12px] font-nunito truncate ${isMe ? "text-gold" : "text-cream/70"}`}>
                    {isMe ? t("lobby.you") : player.displayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center panel: game content */}
        <div className="flex-1 flex flex-col min-w-0">
          {isVoting ? (
            <VotingPanel
              players={players}
              currentUserId={guest.userId}
              allRoundClues={allRoundClues}
              messages={messages}
              onVote={castVote}
              disabled={!!voteResult || !!gameEnd}
            />
          ) : isDiscussion ? (
            <div className="md:hidden flex-1">
              <DiscussionChat
                messages={messages}
                allRoundClues={allRoundClues}
                currentUserId={guest.userId}
                timeLeft={discussionTimeLeft}
                isEnded={discussionEnded}
                onSendMessage={sendMessage}
              />
            </div>
          ) : (
            <ClueSystem
              players={players}
              clues={clues}
              allRoundClues={allRoundClues}
              currentRound={currentRound}
              currentUserId={guest.userId}
              timerSeconds={roundTimer}
              onSubmitClue={submitClue}
              disabled={!!gameEnd}
            />
          )}
        </div>

        {/* Right panel (tablet): chat + emoji — always visible */}
        <div className="hidden md:flex md:flex-col md:w-80 md:flex-shrink-0 lg:w-[240px]">
          <div className="flex-1 bg-cream/[0.02] border border-cream/[0.04] rounded-xl overflow-hidden mb-3">
            <DiscussionChat
              messages={messages}
              allRoundClues={allRoundClues}
              currentUserId={guest.userId}
              timeLeft={discussionTimeLeft}
              isEnded={discussionEnded}
              onSendMessage={sendMessage}
            />
          </div>
          <div className="flex justify-center gap-2 pb-3">
            {EMOJI_LIST.map((emoji) => (
              <motion.button
                key={emoji}
                onClick={() => handleEmoji(emoji)}
                className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-base lg:hover:bg-white/[0.08] transition-colors"
                whileTap={{ scale: 0.85 }}
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Emoji bar — mobile only */}
      <div className="flex justify-center gap-2 px-5 pb-3 pt-1 md:hidden">
        {EMOJI_LIST.map((emoji) => (
          <motion.button
            key={emoji}
            onClick={() => handleEmoji(emoji)}
            className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-base lg:hover:bg-white/[0.08] transition-colors"
            whileTap={{ scale: 0.85 }}
          >
            {emoji}
          </motion.button>
        ))}
      </div>

      {/* Connection indicator */}
      {!isConnected && (
        <div className="px-5 py-2 bg-red/20 text-center">
          <span className="text-red text-xs font-nunito">
            {t("game.connectionLost")}
          </span>
        </div>
      )}
    </div>
  );
}
