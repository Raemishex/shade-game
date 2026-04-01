"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getGuestUser } from "@/lib/guest";
import { useSocket } from "@/hooks/useSocket";
import { getSocket } from "@/lib/socket";
import { useTranslation } from "@/hooks/useTranslation";
import type { Clue, RoomPlayer } from "@/types";

interface SpectatorViewProps {
  roomCode: string;
}

interface GameInfo {
  players: RoomPlayer[];
  currentRound: number;
  clues: Clue[];
  isDiscussion: boolean;
  isVoting: boolean;
  category: string;
}

export default function SpectatorView({ roomCode }: SpectatorViewProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const guest = useMemo(() => getGuestUser(), []);

  const auth = useMemo(
    () => ({
      userId: guest.userId,
      displayName: `${guest.displayName} 👁`,
      avatarColor: guest.avatarColor,
    }),
    [guest]
  );

  const { isConnected } = useSocket(auth);
  const [gameInfo, setGameInfo] = useState<GameInfo>({
    players: [],
    currentRound: 0,
    clues: [],
    isDiscussion: false,
    isVoting: false,
    category: "",
  });

  useEffect(() => {
    if (!isConnected) return;

    const socket = getSocket();

    // Spectator olaraq qoşul
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (socket as any).emit("room:join", { roomCode, isSpectator: true }, (response: { success: boolean }) => {
      if (!response?.success) {
        router.push("/home");
      }
    });

    socket.emit("game:requestState", { roomCode });

    // Event listener-lər
    function onRoundStart(roundNumber: number) {
      setGameInfo((prev) => ({ ...prev, currentRound: roundNumber, clues: [] }));
    }

    function onClueUpdate(clues: Clue[]) {
      setGameInfo((prev) => ({ ...prev, clues }));
    }

    function onDiscussionStart() {
      setGameInfo((prev) => ({ ...prev, isDiscussion: true }));
    }

    function onDiscussionEnd() {
      setGameInfo((prev) => ({ ...prev, isDiscussion: false }));
    }

    function onVotingStart() {
      setGameInfo((prev) => ({ ...prev, isVoting: true }));
    }

    function onVoteResult() {
      setGameInfo((prev) => ({ ...prev, isVoting: false }));
    }

    socket.on("round:start", onRoundStart);
    socket.on("clue:update", onClueUpdate);
    socket.on("discussion:start", onDiscussionStart);
    socket.on("discussion:end", onDiscussionEnd);
    socket.on("voting:start", onVotingStart);
    socket.on("vote:result", onVoteResult);

    return () => {
      socket.off("round:start", onRoundStart);
      socket.off("clue:update", onClueUpdate);
      socket.off("discussion:start", onDiscussionStart);
      socket.off("discussion:end", onDiscussionEnd);
      socket.off("voting:start", onVotingStart);
      socket.off("vote:result", onVoteResult);
    };
  }, [isConnected, roomCode, router]);

  return (
    <div className="flex flex-col min-h-screen bg-dark">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gold/[0.08]">
        <button
          onClick={() => router.push("/home")}
          className="flex items-center gap-1 text-gold text-sm font-nunito"
        >
          <svg width="14" height="14" viewBox="0 0 20 20">
            <path d="M13 4L7 10L13 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {t("lobby.back")}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-cream/50 tracking-wider uppercase font-nunito">İzləyici</span>
          <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4">
        {/* Otaq məlumatı */}
        <div className="text-center mb-6">
          <p className="text-[9px] text-cream/50 tracking-widest uppercase mb-1 font-nunito">Otaq</p>
          <p className="text-[24px] font-medium text-gold tracking-[6px] font-nunito">{roomCode}</p>
        </div>

        {/* Status */}
        <motion.div
          className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-4"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <p className="text-center text-cream/70 text-sm font-nunito">
            {gameInfo.isVoting
              ? "Səsvermə mərhələsi"
              : gameInfo.isDiscussion
              ? "Müzakirə mərhələsi"
              : gameInfo.currentRound > 0
              ? `Raund ${gameInfo.currentRound} — İpucu`
              : "Oyun gözlənilir..."}
          </p>
        </motion.div>

        {/* İpucları */}
        {gameInfo.clues.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] text-cream/50 tracking-wider uppercase mb-2 font-nunito">İpucları</p>
            <div className="flex flex-wrap gap-2">
              {gameInfo.clues.map((clue, i) => (
                <div key={i} className="px-3 py-1.5 rounded-lg bg-gold/[0.04] border border-gold/[0.1]">
                  <span className="text-[10px] text-cream/50 font-nunito mr-1">{clue.displayName}:</span>
                  <span className="text-[12px] text-gold font-medium font-nunito">{clue.clue}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Oyunçu siyahısı */}
        <div>
          <p className="text-[10px] text-cream/50 tracking-wider uppercase mb-2 font-nunito">
            Oyunçular ({gameInfo.players.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {gameInfo.players.map((player) => (
              <div
                key={player.userId}
                className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
              >
                <span className="text-[11px] text-cream/70 font-nunito">{player.displayName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gold/[0.08] text-center">
        <p className="text-[9px] text-cream/30 font-nunito">
          İzləyici rejimi — Səs verə və ya ipucu verə bilməzsiniz
        </p>
      </div>
    </div>
  );
}
