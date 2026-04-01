"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket, connectSocket, disconnectSocket, SocketAuth } from "@/lib/socket";
import type { ServerToClientEvents, ClientToServerEvents } from "@/types";
import type { Socket } from "socket.io-client";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket(auth?: SocketAuth) {
  const socketRef = useRef<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!auth) return;

    const socket = connectSocket(auth);
    socketRef.current = socket;

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    if (socket.connected) {
      setIsConnected(true);
    }

    // Telefon yuxu rejimindən oyandıqda yenidən bağlan
    function onVisibilityChange() {
      if (document.visibilityState === "visible" && !socket.connected) {
        console.log("[socket] Page visible, reconnecting...");
        socket.connect();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [auth?.userId, auth?.displayName, auth?.avatarColor]);

  const emit = useCallback(
    <E extends keyof ClientToServerEvents>(
      event: E,
      ...args: Parameters<ClientToServerEvents[E]>
    ) => {
      socketRef.current?.emit(event, ...args);
    },
    []
  );

  return {
    socket: socketRef.current || getSocket(auth),
    isConnected,
    emit,
    connect: () => connectSocket(auth),
    disconnect: disconnectSocket,
  };
}
