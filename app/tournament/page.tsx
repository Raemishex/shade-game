"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useTranslation } from "@/hooks/useTranslation";
import { getGuestUser } from "@/lib/guest";

interface TournamentPlayer {
  id: string;
  name: string;
  color: string;
}

interface BracketMatch {
  p1: string;
  p2: string;
  winner?: string;
}

interface BracketRound {
  round: number;
  matches: BracketMatch[];
}

interface Tournament {
  id: string;
  name: string;
  code: string;
  hostId: string;
  hostName: string;
  players: TournamentPlayer[];
  maxPlayers: number;
  rounds: number;
  status: "waiting" | "playing" | "finished";
  bracket: BracketRound[];
  winner?: string;
  createdAt: string;
}

export default function TournamentPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const guest = getGuestUser();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [tournamentName, setTournamentName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTournaments();
  }, []);

  async function fetchTournaments() {
    setLoading(true);
    try {
      const res = await fetch("/api/tournaments");
      const data = await res.json();
      if (data.success) {
        setTournaments(data.tournaments);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }

  async function handleCreate() {
    if (tournamentName.trim().length < 2) {
      setError(t("tournament.nameMinError"));
      return;
    }
    setError("");
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tournamentName.trim(),
          hostId: guest.userId,
          hostName: guest.displayName,
          hostColor: guest.avatarColor,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTournamentName("");
        setCreateOpen(false);
        fetchTournaments();
        setSelectedTournament(data.tournament);
      } else {
        setError(data.error || t("tournament.createFailed"));
      }
    } catch {
      setError(t("tournament.serverError"));
    }
  }

  async function handleJoinByCode() {
    if (joinCode.trim().length !== 6) {
      setError(t("tournament.codeLength"));
      return;
    }
    setError("");
    try {
      const res = await fetch(`/api/tournaments?code=${joinCode.trim().toUpperCase()}`);
      const data = await res.json();
      if (data.success && data.tournaments.length > 0) {
        const trn = data.tournaments[0];
        await joinTournament(trn.id);
        setJoinCode("");
        setJoinOpen(false);
      } else {
        setError(t("tournament.notFound"));
      }
    } catch {
      setError(t("tournament.serverError"));
    }
  }

  async function joinTournament(id: string) {
    try {
      const res = await fetch("/api/tournaments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          playerId: guest.userId,
          playerName: guest.displayName,
          playerColor: guest.avatarColor,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTournaments();
        setSelectedTournament(data.tournament);
      } else {
        setError(data.error);
      }
    } catch {
      setError(t("tournament.serverError"));
    }
  }

  async function startTournament(id: string) {
    try {
      const res = await fetch("/api/tournaments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "playing" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTournaments();
        setSelectedTournament(data.tournament);
      }
    } catch {
      // silent
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting": return "#C8A44E";
      case "playing": return "#A8C4E0";
      case "finished": return "#B8D4A8";
      default: return "#888";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "waiting": return t("tournament.statusWaiting");
      case "playing": return t("tournament.statusPlaying");
      case "finished": return t("tournament.statusFinished");
      default: return status;
    }
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
            {t("tournament.title")}
          </h1>
          <div className="w-6" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-6 mb-4 flex gap-2">
        <button
          onClick={() => { setCreateOpen(true); setError(""); }}
          className="flex-1 py-2.5 rounded-xl bg-gold text-dark text-sm font-bold font-nunito hover:bg-gold/90 transition-colors"
        >
          {t("tournament.create")}
        </button>
        <button
          onClick={() => { setJoinOpen(true); setError(""); }}
          className="flex-1 py-2.5 rounded-xl bg-cream/[0.05] border border-cream/[0.08] text-cream/70 text-sm font-medium font-nunito hover:bg-cream/[0.08] transition-colors"
        >
          {t("tournament.join")}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <motion.div
            className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      {/* Tournament list */}
      {!loading && tournaments.length === 0 && (
        <motion.div
          className="text-center py-16 px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 rounded-full bg-cream/[0.03] border border-cream/[0.06] mx-auto mb-4 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" stroke="#555" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-cream/50 text-sm font-nunito">{t("tournament.noTournaments")}</p>
        </motion.div>
      )}

      {!loading && tournaments.length > 0 && (
        <motion.div
          className="px-6 space-y-2"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {tournaments.map((trn) => (
            <motion.button
              key={trn.id}
              variants={staggerItem}
              onClick={() => setSelectedTournament(trn)}
              className="w-full p-4 rounded-xl bg-cream/[0.02] border border-cream/[0.05] text-left hover:bg-cream/[0.04] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-cream font-medium font-nunito">{trn.name}</span>
                    <span
                      className="text-[9px] px-2 py-0.5 rounded-full font-nunito"
                      style={{
                        color: getStatusColor(trn.status),
                        background: `${getStatusColor(trn.status)}15`,
                        border: `1px solid ${getStatusColor(trn.status)}30`,
                      }}
                    >
                      {getStatusLabel(trn.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-cream/50 font-nunito">
                      {trn.players.length}/{trn.maxPlayers} {t("tournament.players")}
                    </span>
                    <span className="text-[10px] text-gold font-nunito tracking-wider">{trn.code}</span>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 20 20" className="text-cream/20">
                  <path d="M7 4l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {createOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-dark/80 backdrop-blur-sm px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCreateOpen(false)}
          >
            <motion.div
              className="w-full max-w-sm bg-[#1A1A18] border border-gold/20 rounded-2xl p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold text-cream font-nunito mb-4 text-center">
                {t("tournament.createTitle")}
              </h2>
              <input
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                placeholder={t("tournament.namePlaceholder")}
                className="w-full px-4 py-3 rounded-xl bg-cream/[0.05] border border-cream/[0.08] text-cream text-sm font-nunito placeholder:text-cream/30 focus:outline-none focus:border-gold/30 mb-3"
                maxLength={30}
              />
              {error && <p className="text-red text-[11px] font-nunito mb-3">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => setCreateOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-cream/[0.05] border border-cream/[0.08] text-cream/60 text-sm font-nunito hover:bg-cream/[0.08] transition-colors"
                >
                  {t("tournament.cancel")}
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 py-2.5 rounded-xl bg-gold text-dark text-sm font-bold font-nunito hover:bg-gold/90 transition-colors"
                >
                  {t("tournament.create")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Modal */}
      <AnimatePresence>
        {joinOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-dark/80 backdrop-blur-sm px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setJoinOpen(false)}
          >
            <motion.div
              className="w-full max-w-sm bg-[#1A1A18] border border-gold/20 rounded-2xl p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold text-cream font-nunito mb-4 text-center">
                {t("tournament.joinTitle")}
              </h2>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                placeholder={t("tournament.codePlaceholder")}
                className="w-full px-4 py-3 rounded-xl bg-cream/[0.05] border border-cream/[0.08] text-cream text-sm font-nunito placeholder:text-cream/30 focus:outline-none focus:border-gold/30 mb-3 tracking-[4px] text-center uppercase"
                maxLength={6}
              />
              {error && <p className="text-red text-[11px] font-nunito mb-3">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => setJoinOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-cream/[0.05] border border-cream/[0.08] text-cream/60 text-sm font-nunito hover:bg-cream/[0.08] transition-colors"
                >
                  {t("tournament.cancel")}
                </button>
                <button
                  onClick={handleJoinByCode}
                  className="flex-1 py-2.5 rounded-xl bg-gold text-dark text-sm font-bold font-nunito hover:bg-gold/90 transition-colors"
                >
                  {t("tournament.join")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tournament Detail Modal */}
      <AnimatePresence>
        {selectedTournament && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-dark/80 backdrop-blur-sm px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTournament(null)}
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
                <h2 className="text-lg font-semibold text-cream font-nunito">{selectedTournament.name}</h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span
                    className="text-[9px] px-2 py-0.5 rounded-full font-nunito"
                    style={{
                      color: getStatusColor(selectedTournament.status),
                      background: `${getStatusColor(selectedTournament.status)}15`,
                      border: `1px solid ${getStatusColor(selectedTournament.status)}30`,
                    }}
                  >
                    {getStatusLabel(selectedTournament.status)}
                  </span>
                  <span className="text-[10px] text-gold tracking-wider font-nunito">{selectedTournament.code}</span>
                </div>
              </div>

              {/* Players */}
              <div className="mb-4">
                <p className="text-[10px] text-cream/50 tracking-wider uppercase mb-2 font-nunito">
                  {t("tournament.players")} ({selectedTournament.players.length}/{selectedTournament.maxPlayers})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTournament.players.map((p) => (
                    <span
                      key={p.id}
                      className="text-[10px] px-2 py-0.5 rounded-full font-nunito bg-cream/[0.04] text-cream/70 border border-cream/[0.06]"
                    >
                      {p.name}
                      {p.id === selectedTournament.hostId && " ★"}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bracket */}
              {selectedTournament.bracket.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] text-cream/50 tracking-wider uppercase mb-2 font-nunito">
                    {t("tournament.bracket")}
                  </p>
                  <div className="space-y-3">
                    {selectedTournament.bracket.map((round) => (
                      <div key={round.round}>
                        <p className="text-[9px] text-cream/40 mb-1 font-nunito">
                          {t("tournament.round")} {round.round}
                        </p>
                        <div className="space-y-1">
                          {round.matches.map((match, mi) => (
                            <div
                              key={mi}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cream/[0.02] border border-cream/[0.04]"
                            >
                              <span className={`text-[11px] font-nunito ${match.winner === match.p1 ? "text-green font-medium" : "text-cream/60"}`}>
                                {match.p1}
                              </span>
                              <span className="text-[9px] text-cream/30">{t("tournament.vs")}</span>
                              <span className={`text-[11px] font-nunito ${match.winner === match.p2 ? "text-green font-medium" : "text-cream/60"}`}>
                                {match.p2}
                              </span>
                              {match.winner && (
                                <span className="text-[9px] text-green ml-auto">✓</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Winner */}
              {selectedTournament.winner && (
                <div className="mb-4 text-center p-3 rounded-xl bg-green/[0.05] border border-green/[0.1]">
                  <p className="text-[10px] text-green/70 font-nunito">{t("tournament.champion")}</p>
                  <p className="text-[14px] text-green font-bold font-nunito">{selectedTournament.winner}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedTournament(null)}
                  className="flex-1 py-2.5 rounded-xl bg-cream/[0.05] border border-cream/[0.08] text-cream/60 text-sm font-nunito hover:bg-cream/[0.08] transition-colors"
                >
                  {t("tournament.close")}
                </button>
                {selectedTournament.status === "waiting" &&
                  selectedTournament.hostId === guest.userId &&
                  selectedTournament.players.length >= 2 && (
                    <button
                      onClick={() => startTournament(selectedTournament.id)}
                      className="flex-1 py-2.5 rounded-xl bg-gold text-dark text-sm font-bold font-nunito hover:bg-gold/90 transition-colors"
                    >
                      {t("tournament.start")}
                    </button>
                  )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
