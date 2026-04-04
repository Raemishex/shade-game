"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, Badge, Button } from "@/components/ui";
import CategoryPicker from "@/components/game/CategoryPicker";
import { getGuestUser } from "@/lib/guest";
import { useSocket } from "@/hooks/useSocket";
import { useRoom } from "@/hooks/useRoom";
import { useSound } from "@/hooks/useSound";
import { isFS5Active } from "@/lib/fs5";
import { useTranslation } from "@/hooks/useTranslation";
import type { RoomSettings } from "@/types";

// Category key mapping for i18n
const CATEGORY_KEYS: Record<string, string> = {
  yemekler: "categories.yemekler",
  heyvanlar: "categories.heyvanlar",
  olkeler: "categories.olkeler",
  idman: "categories.idman",
  peseler: "categories.peseler",
  texnologiya: "categories.texnologiya",
  musiqi: "categories.musiqi",
  film: "categories.film_serial",
  tebiet: "categories.tebiet",
  neqliyyat: "categories.neqliyyat",
  geyim: "categories.geyim_aksesuar",
  mekteb: "categories.mekteb_tehsil",
  ev: "categories.ev_esyalari",
  saglamliq: "categories.saglamliq",
  kosmos: "categories.kosmos_elm",
  proqramlasma: "categories.proqramlasma",
};

const ROUND_OPTIONS = [1, 2, 3];
const DISCUSSION_OPTIONS = [30, 60, 90];

function formatCategoryDisplay(cat: string, t: (key: string) => string): string {
  const ids = cat.includes(",") ? cat.split(",").filter(Boolean) : [cat];
  if (ids.length === 1) {
    return CATEGORY_KEYS[ids[0]] ? t(CATEGORY_KEYS[ids[0]]) : ids[0];
  }
  return t("lobby.categoriesSelected").replace("{count}", String(ids.length));
}

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const code = (params.code as string)?.toUpperCase();

  const guest = useMemo(() => getGuestUser(), []);
  const auth = useMemo(
    () => ({
      userId: guest.userId,
      displayName: guest.displayName,
      avatarColor: guest.avatarColor,
    }),
    [guest]
  );

  const { isConnected } = useSocket(auth);
  const { room, joinRoom, leaveRoom, toggleReady, updateSettings, startGame } =
    useRoom(code);
  const { playLobbyMusic, stopMusic } = useSound();

  // Lobby musiqisi
  useEffect(() => {
    playLobbyMusic();
    return () => stopMusic();
  }, [playLobbyMusic, stopMusic]);

  const [showSettings, setShowSettings] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [startError, setStartError] = useState("");
  const [joining, setJoining] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  const isHost = room?.hostId === guest.userId;
  const myPlayer = room?.players.find((p) => p.userId === guest.userId);
  const playerCount = room?.players.length ?? 0;
  const allReady = room?.players.filter(p => p.userId !== room.hostId).every(p => p.isReady) ?? false;
  const canStart = isHost && playerCount >= 3 && allReady;

  // Connection timeout — 6 saniyə ərzində bağlantı olmasa xəta göstər
  useEffect(() => {
    if (!joining) return;
    const timeout = setTimeout(() => {
      setConnectionError(true);
      setJoining(false);
    }, 6000);
    return () => clearTimeout(timeout);
  }, [joining]);

  // Join room via Socket when connected
  useEffect(() => {
    if (!isConnected || !code) return;

    const joinTimeout = setTimeout(() => {
      setConnectionError(true);
      setJoining(false);
    }, 8000);

    joinRoom(code)
      .then(() => {
        clearTimeout(joinTimeout);
        setJoining(false);
      })
      .catch(() => {
        clearTimeout(joinTimeout);
        // Fallback: fetch room data from API
        fetch(`/api/rooms?code=${code}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.success) setJoining(false);
            else router.push("/home");
          })
          .catch(() => router.push("/home"));
      });
  }, [isConnected, code, joinRoom, router]);

  // Auto-set daily challenge category for host
  useEffect(() => {
    if (!room || !isHost || joining) return;
    const dailyCat = localStorage.getItem("shade_daily_category");
    if (dailyCat && room.settings.category !== dailyCat) {
      updateSettings({ category: dailyCat });
      localStorage.removeItem("shade_daily_category");
    }
  }, [room, isHost, joining, updateSettings]);

  // Navigate to game when status changes to playing
  useEffect(() => {
    if (room?.status === "playing") {
      router.push(`/game/${code}`);
    }
  }, [room?.status, code, router]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  const handleShareLink = useCallback(() => {
    const url = `${window.location.origin}/join/${code}`;
    if (navigator.share) {
      navigator.share({ title: t("lobby.shareTitle"), url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [code]);

  const handleLeave = useCallback(() => {
    leaveRoom();
    router.push("/home");
  }, [leaveRoom, router]);

  const handleToggleReady = useCallback(() => {
    if (!myPlayer) return;
    toggleReady(!myPlayer.isReady);
  }, [myPlayer, toggleReady]);

  const handleSettingChange = useCallback(
    (key: keyof RoomSettings, value: string | number | boolean) => {
      updateSettings({ [key]: value });
    },
    [updateSettings]
  );

  const handleStartGame = useCallback(async () => {
    setStartError("");
    try {
      await startGame();
    } catch (err) {
      setStartError(err instanceof Error ? err.message : t("lobby.startFailed"));
    }
  }, [startGame]);

  // Connection error state
  if (connectionError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-dark px-6 text-center">
        <svg width="48" height="48" viewBox="0 0 24 24" className="mb-4 opacity-40">
          <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" fill="#E8593C"/>
        </svg>
        <p className="text-cream/70 text-base font-nunito mb-2">{t("lobby.noServerConnection")}</p>
        <p className="text-cream/40 text-xs font-mono mb-2 bg-cream/[0.04] px-3 py-1.5 rounded-lg">
          npm run dev:all
        </p>
        <p className="text-cream/30 text-xs font-nunito mb-6">
          {t("lobby.serverNotRunning").replace("{cmd}", "")}
        </p>
        <button
          onClick={() => router.push("/home")}
          className="px-6 py-2.5 rounded-xl bg-gold/10 border border-gold/20 text-gold text-sm font-nunito hover:bg-gold/15 transition-colors"
        >
          {t("lobby.backToHome")}
        </button>
      </div>
    );
  }

  // Loading state
  if (joining || !room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-dark px-6">
        <motion.div
          className="flex gap-1.5 mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-cream/60 text-lg font-nunito">{t("lobby.joining")}</span>
          <motion.span
            className="text-gold text-lg"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            ...
          </motion.span>
        </motion.div>
        <p className="text-gold/60 text-sm font-nunito tracking-wider">{code}</p>
        <div className="w-48 h-1 bg-cream/10 rounded-full overflow-hidden mt-4">
          <motion.div
            className="h-full bg-gold rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </div>
        {!isConnected && (
          <p className="text-cream/50 text-xs font-nunito mt-4 animate-pulse">
            {t("lobby.connectingToServer")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-dark">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gold/[0.08]">
        <button
          onClick={handleLeave}
          aria-label={t("lobby.back")}
          className="flex items-center gap-1 text-gold text-sm font-nunito"
        >
          <svg width="14" height="14" viewBox="0 0 20 20">
            <path
              d="M13 4L7 10L13 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          {t("lobby.back")}
        </button>
        <h1 className="text-[15px] font-medium text-cream font-nunito">{t("lobby.title")}</h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          aria-label={t("lobby.settings")}
          className="w-[30px] h-[30px] rounded-lg bg-gold/[0.06] border border-gold/[0.12] flex items-center justify-center"
        >
          <svg width="14" height="14" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="3" fill="none" stroke="#C8A44E" strokeWidth="1" />
            <path
              d="M10 3v2M10 15v2M3 10h2M15 10h2M5.5 5.5l1.4 1.4M13.1 13.1l1.4 1.4M5.5 14.5l1.4-1.4M13.1 6.9l1.4-1.4"
              stroke="#C8A44E"
              strokeWidth=".8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Body — tablet: 2 panel */}
      <div className="flex-1 px-5 py-3 overflow-y-auto md:flex md:gap-6 md:max-w-4xl md:mx-auto md:w-full lg:max-w-7xl lg:gap-10">
        {/* Left panel (tablet: code, settings, start) */}
        <div className="md:flex-1 md:max-w-md lg:max-w-lg">
        {/* FS5 indicator */}
        {isFS5Active() && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gold/[0.06] border border-gold/15 mb-3">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 6v8l7 4 7-4V6l-7-4z" stroke="#C8A44E" strokeWidth="1.2" strokeLinejoin="round" />
              <text x="10" y="13" textAnchor="middle" fill="#C8A44E" fontSize="5" fontWeight="700">FS5</text>
            </svg>
            <span className="text-[10px] text-gold/70 tracking-wider font-nunito">{t("lobby.fs5Active")}</span>
          </div>
        )}

        {/* Room Code */}
        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-gold/[0.04] border border-gold/[0.1] mb-4">
          <div>
            <p className="text-[9px] text-cream/50 tracking-widest uppercase mb-1 font-nunito">
              {t("lobby.roomCode")}
            </p>
            <p className="text-[28px] lg:text-[32px] font-medium text-gold tracking-[8px] font-nunito">
              {code}
            </p>
          </div>
          <div className="flex gap-2 ml-auto">
            {/* Copy */}
            <button
              onClick={handleCopyCode}
              aria-label={t("lobby.copy")}
              className="w-[34px] h-[34px] rounded-lg bg-gold/[0.08] border border-gold/[0.15] flex items-center justify-center"
              title={t("lobby.copy")}
            >
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 20 20">
                  <path
                    d="M5 10l3 3 7-7"
                    fill="none"
                    stroke="#B8D4A8"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 20 20">
                  <rect x="6" y="6" width="10" height="10" rx="1.5" fill="none" stroke="#C8A44E" strokeWidth="1" />
                  <path d="M14 6V5a1 1 0 00-1-1H5a1 1 0 00-1 1v8a1 1 0 001 1h1" fill="none" stroke="#C8A44E" strokeWidth="1" />
                </svg>
              )}
            </button>
            {/* Share link */}
            <button
              onClick={handleShareLink}
              aria-label={t("lobby.shareLink")}
              className="w-[34px] h-[34px] rounded-lg bg-gold/[0.08] border border-gold/[0.15] flex items-center justify-center"
              title={t("lobby.shareLink")}
            >
              <svg width="14" height="14" viewBox="0 0 20 20">
                <path
                  d="M8 10a3 3 0 014.5-2.6M12 10a3 3 0 01-4.5 2.6"
                  fill="none"
                  stroke="#C8A44E"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
                <circle cx="6" cy="12" r="2" fill="none" stroke="#C8A44E" strokeWidth="1" />
                <circle cx="14" cy="8" r="2" fill="none" stroke="#C8A44E" strokeWidth="1" />
              </svg>
            </button>
            {/* QR code */}
            <button
              onClick={() => setShowQR(true)}
              aria-label={t("lobby.qrCode")}
              className="w-[34px] h-[34px] rounded-lg bg-gold/[0.08] border border-gold/[0.15] flex items-center justify-center"
              title={t("lobby.qrCode")}
            >
              <svg width="14" height="14" viewBox="0 0 20 20">
                <rect x="2" y="2" width="7" height="7" rx="1" fill="none" stroke="#C8A44E" strokeWidth="1" />
                <rect x="11" y="2" width="7" height="7" rx="1" fill="none" stroke="#C8A44E" strokeWidth="1" />
                <rect x="2" y="11" width="7" height="7" rx="1" fill="none" stroke="#C8A44E" strokeWidth="1" />
                <rect x="12" y="12" width="2" height="2" fill="#C8A44E" />
                <rect x="16" y="12" width="2" height="2" fill="#C8A44E" />
                <rect x="12" y="16" width="2" height="2" fill="#C8A44E" />
                <rect x="16" y="16" width="2" height="2" fill="#C8A44E" />
              </svg>
            </button>
          </div>
        </div>

        {/* Settings */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-3.5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Category */}
              <div className="flex justify-between items-center py-1.5">
                <span className="text-xs text-cream/50 font-nunito">{t("lobby.category")}</span>
                {isHost ? (
                  <button
                    onClick={() => setShowCategoryPicker(true)}
                    className="text-gold text-xs font-medium font-nunito flex items-center gap-1"
                  >
                    {formatCategoryDisplay(room.settings.category, t)}
                    <svg width="10" height="10" viewBox="0 0 20 20">
                      <path d="M7 8l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                ) : (
                  <span className="text-gold text-xs font-medium font-nunito">
                    {formatCategoryDisplay(room.settings.category, t)}
                  </span>
                )}
              </div>

              <div className="border-t border-white/[0.03] my-1.5" />

              {/* Rounds */}
              <div className="flex justify-between items-center py-1.5">
                <span className="text-xs text-cream/50 font-nunito">{t("lobby.rounds")}</span>
                {isHost ? (
                  <div className="flex gap-1.5">
                    {ROUND_OPTIONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => handleSettingChange("rounds", r)}
                        className={`px-2.5 py-1 rounded-md text-xs font-nunito font-medium transition-colors ${
                          room.settings.rounds === r
                            ? "bg-gold/20 text-gold"
                            : "bg-white/[0.03] text-cream/50 hover:text-cream/60"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-gold text-xs font-medium font-nunito">
                    {room.settings.rounds}
                  </span>
                )}
              </div>

              <div className="border-t border-white/[0.03] my-1.5" />

              {/* Discussion time */}
              <div className="flex justify-between items-center py-1.5">
                <span className="text-xs text-cream/50 font-nunito">{t("lobby.discussionTime")}</span>
                {isHost ? (
                  <div className="flex gap-1.5">
                    {DISCUSSION_OPTIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => handleSettingChange("discussionTime", d as 30 | 60 | 90)}
                        className={`px-2.5 py-1 rounded-md text-xs font-nunito font-medium transition-colors ${
                          room.settings.discussionTime === d
                            ? "bg-gold/20 text-gold"
                            : "bg-white/[0.03] text-cream/50 hover:text-cream/60"
                        }`}
                      >
                        {d}s
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-gold text-xs font-medium font-nunito">
                    {room.settings.discussionTime} {t("lobby.seconds")}
                  </span>
                )}
              </div>

              <div className="border-t border-white/[0.03] my-1.5" />

              {/* Imposter hint */}
              <div className="flex justify-between items-center py-1.5">
                <span className="text-xs text-cream/50 font-nunito">{t("lobby.imposterHint")}</span>
                {isHost ? (
                  <button
                    onClick={() =>
                      handleSettingChange("imposterHint", !room.settings.imposterHint)
                    }
                    className={`px-2.5 py-1 rounded-md text-xs font-nunito font-medium transition-colors ${
                      room.settings.imposterHint
                        ? "bg-green/20 text-green"
                        : "bg-white/[0.03] text-cream/50"
                    }`}
                  >
                    {room.settings.imposterHint ? t("lobby.on") : t("lobby.off")}
                  </button>
                ) : (
                  <span
                    className={`text-xs font-medium font-nunito ${
                      room.settings.imposterHint ? "text-green" : "text-cream/50"
                    }`}
                  >
                    {room.settings.imposterHint ? t("lobby.on") : t("lobby.off")}
                  </span>
                )}
              </div>

              <div className="border-t border-white/[0.03] my-1.5" />

              {/* Imposter count */}
              <div className="flex justify-between items-center py-1.5">
                <span className="text-xs text-cream/50 font-nunito">{t("lobby.imposterCount")}</span>
                {isHost ? (
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3].map((ic) => (
                      <button
                        key={ic}
                        onClick={() => handleSettingChange("imposterCount", ic)}
                        className={`px-2.5 py-1 rounded-md text-xs font-nunito font-medium transition-colors ${
                          (room.settings.imposterCount ?? 0) === ic
                            ? "bg-gold/20 text-gold"
                            : "bg-white/[0.03] text-cream/50 hover:text-cream/60"
                        }`}
                      >
                        {ic === 0 ? t("lobby.auto") : ic}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-gold text-xs font-medium font-nunito">
                    {(room.settings.imposterCount ?? 0) === 0
                      ? t("lobby.auto")
                      : room.settings.imposterCount}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Always-visible mini settings (when settings panel is closed) */}
        {!showSettings && (
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-3.5">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-xs text-cream/50 font-nunito">{t("lobby.category")}</span>
              <span className="text-gold text-xs font-medium font-nunito">
                {formatCategoryDisplay(room.settings.category, t)}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-xs text-cream/50 font-nunito">{t("lobby.rounds")}</span>
              <span className="text-gold text-xs font-medium font-nunito">{room.settings.rounds}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-xs text-cream/50 font-nunito">{t("lobby.discussionTime")}</span>
              <span className="text-gold text-xs font-medium font-nunito">
                {room.settings.discussionTime} {t("lobby.seconds")}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-xs text-cream/50 font-nunito">{t("lobby.imposterHint")}</span>
              <span
                className={`text-xs font-medium font-nunito ${
                  room.settings.imposterHint ? "text-green" : "text-cream/50"
                }`}
              >
                {room.settings.imposterHint ? t("lobby.on") : t("lobby.off")}
              </span>
            </div>
          </div>
        )}

        {/* Ready / Start buttons — tablet: inside left panel */}
        <div className="hidden md:block mt-4 space-y-2.5">
          {!isHost && (
            <Button
              variant={myPlayer?.isReady ? "secondary" : "gold"}
              size="lg"
              fullWidth
              onClick={handleToggleReady}
            >
              {myPlayer?.isReady ? t("lobby.notReady") : t("lobby.imReady")}
            </Button>
          )}
          {isHost && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleStartGame}
              disabled={!canStart}
              className={!canStart ? "opacity-50" : ""}
            >
              {t("lobby.startGame")}
            </Button>
          )}
          {isHost && !canStart && (
            <p className="text-[9px] text-cream/50 text-center tracking-wider font-nunito">
              {playerCount < 3 ? t("lobby.minPlayers") : t("lobby.waitingReady")}
            </p>
          )}
          {startError && (
            <motion.p className="text-red text-xs text-center font-nunito" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {startError}
            </motion.p>
          )}
        </div>
        </div>

        {/* Right panel (tablet: players) */}
        <div className="md:flex-1">
        {/* Players */}
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-[10px] text-cream/50 tracking-[1.5px] uppercase font-nunito">
            {t("lobby.players")}
          </span>
          <span className="text-[10px] text-gold tracking-[1.5px] font-nunito">
            {playerCount}/16
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <AnimatePresence mode="popLayout">
            {room.players.map((player, i) => {
              const isMe = player.userId === guest.userId;
              const isPlayerHost = player.userId === room.hostId;

              return (
                <motion.div
                  key={player.userId}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] bg-white/[0.02] border transition-colors lg:hover:bg-white/[0.04] ${
                    isPlayerHost ? "border-gold/[0.1]" : "border-white/[0.03]"
                  }`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  layout
                >
                  <Avatar
                    name={player.displayName}
                    color={player.avatarColor}
                    size="md"
                    isHost={isPlayerHost}
                  />
                  <span className="flex-1 text-[13px] text-cream font-nunito">
                    {isMe ? `${t("lobby.you")} (${player.displayName})` : player.displayName}
                  </span>
                  {isPlayerHost ? (
                    <Badge variant="host" text={t("lobby.host")} />
                  ) : player.isReady ? (
                    <Badge variant="ready" text={t("lobby.ready")} />
                  ) : (
                    <Badge variant="waiting" text={t("lobby.waiting")} />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Waiting dots */}
        <div className="flex gap-1.5 justify-center mt-4 mb-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-[7px] h-[7px] rounded-full bg-gold"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
        <p className="text-[10px] text-cream/50 text-center font-nunito animate-pulse">
          {t("lobby.waitingForPlayers")}
        </p>

        {/* Ready / Start buttons — mobile only */}
        <div className="mt-4 space-y-2.5 md:hidden">
          {!isHost && (
            <Button
              variant={myPlayer?.isReady ? "secondary" : "gold"}
              size="lg"
              fullWidth
              onClick={handleToggleReady}
            >
              {myPlayer?.isReady ? t("lobby.notReady") : t("lobby.imReady")}
            </Button>
          )}

          {isHost && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleStartGame}
              disabled={!canStart}
              className={!canStart ? "opacity-50" : ""}
            >
              {t("lobby.startGame")}
            </Button>
          )}

          {isHost && !canStart && (
            <p className="text-[9px] text-cream/50 text-center tracking-wider font-nunito">
              {playerCount < 3 ? t("lobby.minPlayers") : t("lobby.waitingReady")}
            </p>
          )}

          {startError && (
            <motion.p
              className="text-red text-xs text-center font-nunito"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {startError}
            </motion.p>
          )}
        </div>
        </div>
      </div>

      {/* Connection indicator */}
      {!isConnected && (
        <div className="px-5 py-2 bg-red/20 text-center">
          <span className="text-red text-xs font-nunito">{t("lobby.connectionLost")}</span>
        </div>
      )}

      {/* Category Picker Modal */}
      <AnimatePresence>
        {showCategoryPicker && (
          <CategoryPicker
            selected={room.settings.category}
            onSelect={(catId) => handleSettingChange("category", catId)}
            onClose={() => setShowCategoryPicker(false)}
          />
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-dark/80 backdrop-blur-sm px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQR(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 text-center max-w-xs w-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-dark font-bold font-nunito text-lg mb-1">SHADE</p>
              <p className="text-dark/60 font-nunito text-sm mb-3">{t("lobby.roomCodeLabel").replace("{code}", code)}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/join/${code}`)}`}
                alt="QR Code"
                className="w-48 h-48 mx-auto mb-3 rounded-lg"
                width={192}
                height={192}
              />
              <p className="text-dark/40 text-xs font-nunito">
                {`${window.location.origin}/join/${code}`}
              </p>
              <button
                onClick={() => setShowQR(false)}
                className="mt-4 px-6 py-2 rounded-xl bg-dark text-cream text-sm font-nunito font-medium"
              >
                {t("lobby.close")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
