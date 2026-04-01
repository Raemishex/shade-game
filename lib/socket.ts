import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@/types";

let SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

// Əgər NEXT_PUBLIC_SOCKET_URL "localhost" və ya "127.0.0.1" daxil edirsə və brauzerdəyiksə,
// cari IP-ni tapmağa çalışırıq.
if (typeof window !== "undefined") {
  const hostname = window.location.hostname;
  // Əgər kimsə başqa IP ilə girsə (məs. 192.168.x.x), socket də ora getməlidir.
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    SOCKET_URL = `http://${hostname}:3001`;
  }
}

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export interface SocketAuth {
  userId: string;
  displayName: string;
  avatarColor?: string;
}

export function getSocket(auth?: SocketAuth): TypedSocket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      auth: auth || {},
    }) as TypedSocket;
  } else if (auth) {
    (socket as Socket).auth = auth;
  }
  return socket;
}

export function connectSocket(auth?: SocketAuth): TypedSocket {
  const s = getSocket(auth);
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export function resetSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
