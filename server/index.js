const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { setupRoomHandlers } = require("./rooms");
const { setupGameHandlers } = require("./game");
const { setupChatHandlers } = require("./chat");
const crypto = require("crypto");

// ============== CONSTANTS ==============
const PORT = process.env.PORT || 3001;
const RATE_LIMIT_CLEANUP_MS = 5 * 60 * 1000; // 5 minutes
const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 5000;
const MAX_DISPLAY_NAME_LENGTH = 30;
const MIN_DISPLAY_NAME_LENGTH = 1;
const MAX_EMOJI_LENGTH = 10;

// Export constants for testing
const CONSTANTS = {
  PORT,
  RATE_LIMIT_CLEANUP_MS,
  GRACEFUL_SHUTDOWN_TIMEOUT_MS,
  MAX_DISPLAY_NAME_LENGTH,
  MIN_DISPLAY_NAME_LENGTH,
  MAX_EMOJI_LENGTH,
};

// ============== APP SETUP ==============
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = process.env.SOCKET_CORS_ORIGIN
        ? process.env.SOCKET_CORS_ORIGIN.split(",")
        : [];
      
      // Development mühitində origin yoxdursa (server-to-server) və ya 
      // localhost / yerli IP-lərdən gəlirsə icazə ver
      // Never allow "*" wildcard in production
      const isProduction = process.env.NODE_ENV === "production";
      if (!origin ||
          !isProduction ||
          (allowedOrigins.includes(origin) && !allowedOrigins.includes("*"))) {
        callback(null, true);
      } else {
        // Dinamik olaraq yerli şəbəkə origin-lərinə (məs. 192.168.x.x) icazə ver
        const isLocalNetwork = /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
                              /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
                              /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin);
        
        if (isLocalNetwork) {
          callback(null, true);
        } else {
          callback(new Error("CORS not allowed"));
        }
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

// ============== HEALTH ENDPOINTS ==============
app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "SHADE Socket Server", uptime: process.uptime() });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", connections: io.engine.clientsCount });
});

// ============== AUTHENTICATION ==============
const jwt = require("jsonwebtoken");

/**
 * Get JWT secret from environment with validation
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

/**
 * Generate cryptographically secure guest ID
 */
function generateGuestId() {
  return `guest_${crypto.randomBytes(8).toString("hex")}`;
}

/**
 * Sanitize display name to prevent injection attacks
 */
function sanitizeDisplayName(name) {
  if (!name || typeof name !== "string") return null;
  const trimmed = name.trim().slice(0, MAX_DISPLAY_NAME_LENGTH);
  // Block potential NoSQL injection characters
  if (trimmed.includes("$") || trimmed.includes(".")) return null;
  // Block HTML/script injection
  if (trimmed.includes("<") || trimmed.includes(">")) return null;
  return trimmed;
}

// Socket authentication middleware
io.use((socket, next) => {
  try {
    const clientDisplayName = socket.handshake.auth.displayName;

    // Validate display name exists and is string
    if (!clientDisplayName || typeof clientDisplayName !== "string") {
      return next(new Error("Authentication required: displayName"));
    }

    // Sanitize and validate length
    const sanitizedName = sanitizeDisplayName(clientDisplayName);
    if (!sanitizedName || 
        sanitizedName.length < MIN_DISPLAY_NAME_LENGTH || 
        sanitizedName.length > MAX_DISPLAY_NAME_LENGTH) {
      return next(new Error("Invalid displayName"));
    }

    const token = socket.handshake.auth.token;

    if (token && typeof token === "string") {
      try {
        const payload = jwt.verify(token, getJwtSecret());
        if (payload.userId && typeof payload.userId === "string") {
          socket.data.userId = payload.userId;
          socket.data.isGuest = false;
        }
      } catch (err) {
        console.log(`[auth] Invalid token, generating guest ID for ${sanitizedName}`);
        socket.data.userId = generateGuestId();
        socket.data.isGuest = true;
      }
    } else {
      // Guest — client-in localStorage userId-sini istifadə et (isHost yoxlaması üçün vacib)
      // Yalnız etibarlı guest_ formatını qəbul et, əks halda yeni ID yarat
      const clientUserId = socket.handshake.auth.userId;
      if (clientUserId && typeof clientUserId === "string" && /^guest_[a-z0-9]+$/i.test(clientUserId)) {
        socket.data.userId = clientUserId;
      } else {
        socket.data.userId = generateGuestId();
      }
      socket.data.isGuest = true;
    }

    socket.data.displayName = sanitizedName;
    socket.data.avatarColor = socket.handshake.auth.avatarColor || "#C8A44E";
    socket.data.roomCode = socket.handshake.auth.roomCode || null;

    next();
  } catch (err) {
    console.error("[auth] Middleware error:", err.message);
    next(new Error("Authentication failed"));
  }
});

// ============== RATE LIMITER ==============
const rateLimits = new Map();

/**
 * Check rate limit for socket event
 * @param {Socket} socket
 * @param {string} event
 * @param {number} maxCountOrWindowMs - if 4th param given, this is maxCount; otherwise windowMs
 * @param {number} [windowMs] - window in milliseconds
 * @returns {boolean} true if allowed, false if rate-limited
 */
function checkRateLimit(socket, event, maxCountOrWindowMs, windowMs) {
  const key = `${socket.id}:${event}`;
  const now = Date.now();

  // Support both (socket, event, windowMs) and (socket, event, maxCount, windowMs)
  if (windowMs === undefined) {
    // Old signature: checkRateLimit(socket, event, windowMs)
    const last = rateLimits.get(key) || 0;
    if (now - last < maxCountOrWindowMs) return false;
    rateLimits.set(key, now);
    return true;
  }

  // New signature: checkRateLimit(socket, event, maxCount, windowMs)
  const maxCount = maxCountOrWindowMs;
  let entry = rateLimits.get(key);
  if (!entry || now - entry.start >= windowMs) {
    entry = { start: now, count: 1 };
    rateLimits.set(key, entry);
    return true;
  }
  entry.count++;
  if (entry.count > maxCount) return false;
  return true;
}

/**
 * Clean up expired rate limits
 */
function cleanupRateLimits() {
  const cutoff = Date.now() - RATE_LIMIT_CLEANUP_MS;
  // Cap map size to prevent memory leaks
  if (rateLimits.size > 10000) {
    rateLimits.clear();
    return;
  }
  for (const [key, val] of rateLimits.entries()) {
    // Handle both old format (timestamp number) and new format ({start, count})
    const ts = typeof val === "number" ? val : val.start;
    if (ts < cutoff) rateLimits.delete(key);
  }
}

// Rate-limit cleanup hər 5 dəqiqədən bir
const rateLimitCleanupInterval = setInterval(cleanupRateLimits, RATE_LIMIT_CLEANUP_MS);
rateLimitCleanupInterval.unref(); // Don't prevent process exit

// ============== CONNECTION HANDLER ==============
io.on("connection", (socket) => {
  console.log(`[connect] ${socket.data.displayName} (${socket.data.isGuest ? "guest" : "user"}:${socket.data.userId}) — ${socket.id}`);

  // Setup all event handlers
  setupRoomHandlers(io, socket, checkRateLimit);
  setupGameHandlers(io, socket, checkRateLimit);
  setupChatHandlers(io, socket, checkRateLimit);

  // ========== Emoji (rate limit: 3s/emoji) ==========
  socket.on("emoji:send", (data) => {
    try {
      if (!checkRateLimit(socket, "emoji:send", 3000)) return;
      if (!data || !data.roomCode) return;
      
      // Sanitize emoji to prevent injection
      const emoji = data.emoji ? String(data.emoji).slice(0, MAX_EMOJI_LENGTH) : "";
      if (!emoji) return;

      socket.to(data.roomCode).emit("emoji:receive", {
        userId: socket.data.userId,
        displayName: socket.data.displayName,
        emoji: emoji,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error("[emoji:send] Error:", err.message);
    }
  });

  // ========== Reconnect ==========
  socket.on("player:reconnect", (data) => {
    try {
      const roomCode = data?.roomCode || socket.data.roomCode;
      if (!roomCode) return;

      socket.data.roomCode = roomCode;
      socket.join(roomCode);
      socket.to(roomCode).emit("player:reconnect", socket.data.userId);

      console.log(`[reconnect] ${socket.data.displayName} → room ${roomCode}`);
    } catch (err) {
      console.error("[player:reconnect] Error:", err.message);
    }
  });

  // ========== Disconnect ==========
  socket.on("disconnect", (reason) => {
    try {
      console.log(`[disconnect] ${socket.data.displayName} — ${reason}`);
      
      // Rate-limit cleanup for this socket
      for (const key of rateLimits.keys()) {
        if (key.startsWith(`${socket.id}:`)) rateLimits.delete(key);
      }
    } catch (err) {
      console.error("[disconnect] Error:", err.message);
    }
  });

  // ========== Error ==========
  socket.on("error", (err) => {
    console.error(`[error] ${socket.data.displayName}:`, err.message);
  });
});

// ============== GRACEFUL SHUTDOWN ==============
let isShuttingDown = false;

/**
 * Graceful shutdown handler
 */
function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[${signal}] Graceful shutdown başladı...`);

  // Clear rate limit cleanup interval
  clearInterval(rateLimitCleanupInterval);

  // Aktiv otaqları xilas et
  const { saveRooms, cleanup } = require("./rooms");
  saveRooms();
  cleanup();

  // Bütün client-lərə bildir
  io.emit("server:shutdown", { message: "Server yenidən başladılır" });

  // Yeni bağlantıları rədd et
  io.engine.on("connection", (_req) => {
    // Köhnə connection-lər üçün
  });

  setTimeout(() => {
    console.log("[shutdown] Bütün bağlantılar bağlanır...");
    io.close(() => {
      server.close(() => {
        console.log("[shutdown] Server bağlandı.");
        process.exit(0);
      });
    });
  }, GRACEFUL_SHUTDOWN_TIMEOUT_MS); // 5s client-lərə disconnect bildirişi üçün
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Unhandled rejection handler
process.on("unhandledRejection", (reason, promise) => {
  console.error("[unhandledRejection]", reason);
});

// Uncaught exception handler
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err.message);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

// ============== STARTUP VALIDATION ==============
function validateStartup() {
  const errors = [];
  
  // JWT_SECRET validation for production
  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    errors.push("JWT_SECRET is required in production");
  }
  
  if (errors.length > 0) {
    console.error("[FATAL] Startup validation failed:");
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
  
  console.log("[startup] Validation passed");
}

validateStartup();

// ============== START SERVER ==============
server.listen(PORT, "0.0.0.0", () => {
  const corsMode = process.env.SOCKET_CORS_ORIGIN 
    ? `allowed: ${process.env.SOCKET_CORS_ORIGIN}` 
    : "all origins (dev mode)";
  
  console.log(`\n🦊 SHADE Socket Server running on 0.0.0.0:${PORT}`);
  console.log(`   CORS: ${corsMode}`);
  console.log(`   Graceful shutdown: enabled (SIGTERM/SIGINT)`);
  console.log(`   Rate limit cleanup: ${RATE_LIMIT_CLEANUP_MS / 60000} minutes\n`);
});

// ============== EXPORTS FOR TESTING ==============
module.exports = {
  app,
  server,
  io,
  checkRateLimit,
  sanitizeDisplayName,
  generateGuestId,
  getJwtSecret,
  validateStartup,
  gracefulShutdown,
  CONSTANTS,
  __TEST_ONLY__: {
    getRateLimits: () => rateLimits,
    clearRateLimits: () => rateLimits.clear(),
    setIsShuttingDown: (value) => { isShuttingDown = value; },
    getIsShuttingDown: () => isShuttingDown,
  },
};
