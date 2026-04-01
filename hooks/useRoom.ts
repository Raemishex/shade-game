"use client";

import { useEffect, useState, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import type { RoomPlayer, RoomSettings } from "@/types";

interface RoomState {
  code: string;
  hostId: string;
  players: RoomPlayer[];
  settings: RoomSettings;
  status: "waiting" | "playing" | "voting" | "finished";
}

export function useRoom(roomCode: string | null) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomCode) return;

    const socket = getSocket();

    function onPlayerJoin(player: RoomPlayer) {
      setRoom((prev) => {
        if (!prev) return prev;
        if (prev.players.find((p) => p.userId === player.userId)) return prev;
        return { ...prev, players: [...prev.players, player] };
      });
    }

    function onPlayerLeave(userId: string) {
      setRoom((prev) => {
        if (!prev) return prev;
        return { ...prev, players: prev.players.filter((p) => p.userId !== userId) };
      });
    }

    function onPlayerReady(userId: string, isReady: boolean) {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map((p) =>
            p.userId === userId ? { ...p, isReady } : p
          ),
        };
      });
    }

    function onSettings(settings: RoomSettings) {
      setRoom((prev) => {
        if (!prev) return prev;
        return { ...prev, settings };
      });
    }

    function onHostChanged(data: { newHostId: string }) {
      setRoom((prev) => {
        if (!prev) return prev;
        return { ...prev, hostId: data.newHostId };
      });
    }

    function onGameStart() {
      setRoom((prev) => {
        if (!prev) return prev;
        return { ...prev, status: "playing" };
      });
    }

    socket.on("player:join", onPlayerJoin);
    socket.on("player:leave", onPlayerLeave);
    socket.on("player:ready", onPlayerReady);
    socket.on("room:settings", onSettings);
    socket.on("game:start", onGameStart);
    socket.on("room:host-changed", onHostChanged);

    return () => {
      socket.off("player:join", onPlayerJoin);
      socket.off("player:leave", onPlayerLeave);
      socket.off("player:ready", onPlayerReady);
      socket.off("room:settings", onSettings);
      socket.off("game:start", onGameStart);
      socket.off("room:host-changed", onHostChanged);
    };
  }, [roomCode]);

  const createRoom = useCallback(
    (settings?: Partial<RoomSettings>): Promise<RoomState> => {
      return new Promise((resolve, reject) => {
        const socket = getSocket();
        socket.emit("room:create", { settings }, (response) => {
          if (response?.success && response.room) {
            setRoom(response.room as unknown as RoomState);
            setError(null);
            resolve(response.room as unknown as RoomState);
          } else {
            const errMsg = response?.error || "Otaq yaradıla bilmədi";
            setError(errMsg);
            reject(new Error(errMsg));
          }
        });
      });
    },
    []
  );

  const joinRoom = useCallback(
    (code: string): Promise<RoomState> => {
      return new Promise((resolve, reject) => {
        const socket = getSocket();
        socket.emit("room:join", { roomCode: code }, (response) => {
          if (response?.success && response.room) {
            setRoom(response.room as unknown as RoomState);
            setError(null);
            resolve(response.room as unknown as RoomState);
          } else {
            const errMsg = response?.error || "Otaqa qoşulmaq mümkün olmadı";
            setError(errMsg);
            reject(new Error(errMsg));
          }
        });
      });
    },
    []
  );

  const leaveRoom = useCallback(() => {
    if (!roomCode) return;
    const socket = getSocket();
    socket.emit("room:leave", { roomCode });
    setRoom(null);
  }, [roomCode]);

  const toggleReady = useCallback(
    (isReady: boolean) => {
      if (!roomCode) return;
      const socket = getSocket();
      socket.emit("player:ready", { roomCode, isReady });
    },
    [roomCode]
  );

  const updateSettings = useCallback(
    (settings: Partial<RoomSettings>) => {
      if (!roomCode) return;
      const socket = getSocket();
      socket.emit("room:settings", { roomCode, settings });
    },
    [roomCode]
  );

  const startGame = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!roomCode) return reject(new Error("No room"));
      const socket = getSocket();
      socket.emit("game:start", { roomCode }, (response) => {
        if (response?.success) resolve();
        else reject(new Error(response?.error || "Oyun başladıla bilmədi"));
      });
    });
  }, [roomCode]);

  return {
    room,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    updateSettings,
    startGame,
  };
}
