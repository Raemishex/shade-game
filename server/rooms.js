// ---------- Room State (in-memory + file persistence) ----------
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ============== CONSTANTS ==============
const PERSIST_FILE = path.join(__dirname, "..", "data", "rooms-persist.json");
const PERSIST_DIR = path.dirname(PERSIST_FILE);
const ROOM_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const RECONNECT_TIMEOUT_MS = 60000; // 60 seconds
const MAX_PLAYERS = 16;
const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 0,O,1,I,L excluded

// ============== STATE ==============
const rooms = new Map();
const roomTimers = new Map(); // Track all timers per room for cleanup
const reconnectTimeouts = new Map(); // Track reconnect timeouts by userId

// ============== UTILITY FUNCTIONS ==============

/**
 * Generate cryptographically secure random room code
 */
function generateRoomCode() {
  let code = "";
  const randomBytes = crypto.randomBytes(ROOM_CODE_LENGTH);
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_CHARS[randomBytes[i] % ROOM_CODE_CHARS.length];
  }
  return code;
}

/**
 * Generate unique room code with collision protection
 */
function generateUniqueRoomCode(maxAttempts = 20) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateRoomCode();
    if (!rooms.has(code)) {
      return code;
    }
  }
  throw new Error(`Failed to generate unique room code after ${maxAttempts} attempts`);
}

/**
 * Sanitize string input to prevent NoSQL injection
 */
function sanitizeString(value, maxLength = 100) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, maxLength);
  // Remove potential NoSQL operators
  if (trimmed.includes("$") || trimmed.includes(".")) return null;
  return trimmed;
}

/**
 * Validate settings object with strict whitelist
 */
function validateSettings(settings) {
  const validSettings = {};
  
  if (!settings || typeof settings !== "object") return validSettings;
  
  // Category validation
  if (typeof settings.category === "string") {
    const sanitized = sanitizeString(settings.category, 50);
    if (sanitized) validSettings.category = sanitized;
  }
  
  // Rounds validation (1-5)
  if (typeof settings.rounds === "number" && Number.isInteger(settings.rounds)) {
    validSettings.rounds = Math.max(1, Math.min(5, settings.rounds));
  }
  
  // Discussion time validation (0, 30, 60, 90) - 0 means skipped
  if (typeof settings.discussionTime === "number" && [0, 30, 60, 90].includes(settings.discussionTime)) {
    validSettings.discussionTime = settings.discussionTime;
  }
  
  // Imposter hint validation
  if (typeof settings.imposterHint === "boolean") {
    validSettings.imposterHint = settings.imposterHint;
  }
  
  // Imposter count validation (0-5)
  if (typeof settings.imposterCount === "number" && Number.isInteger(settings.imposterCount)) {
    validSettings.imposterCount = Math.max(0, Math.min(5, settings.imposterCount));
  }
  
  return validSettings;
}

/**
 * Atomic file write with temp file + rename
 */
function atomicWriteFile(filePath, data) {
  const tempPath = `${filePath}.tmp.${Date.now()}.${process.pid}`;
  try {
    fs.writeFileSync(tempPath, data, "utf-8");
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    // Cleanup temp file if rename failed
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch (cleanupErr) {
      console.error("[atomicWrite] Failed to cleanup temp file:", cleanupErr.message);
    }
    throw err;
  }
}

/**
 * Clear all timers for a room
 */
function clearRoomTimers(roomCode) {
  const timers = roomTimers.get(roomCode);
  if (timers) {
    for (const timer of timers) {
      if (typeof timer.clear === "function") {
        timer.clear();
      }
    }
    roomTimers.delete(roomCode);
  }
  
  // Clear reconnect timeouts for this room
  for (const [userId, timeout] of reconnectTimeouts.entries()) {
    if (timeout.roomCode === roomCode) {
      clearTimeout(timeout.timer);
      reconnectTimeouts.delete(userId);
    }
  }
}

/**
 * Add a timer to room's timer list
 */
function addRoomTimer(roomCode, timer) {
  if (!roomTimers.has(roomCode)) {
    roomTimers.set(roomCode, []);
  }
  roomTimers.get(roomCode).push(timer);
}

// ============== PERSISTENCE ==============

/**
 * Load rooms from persistence file on server start
 */
function loadRooms() {
  try {
    if (!fs.existsSync(PERSIST_FILE)) {
      console.log("[room:persist] No persistence file found, starting fresh");
      return;
    }
    
    const raw = fs.readFileSync(PERSIST_FILE, "utf-8");
    const saved = JSON.parse(raw);
    const cutoff = Date.now() - ROOM_TTL_MS;
    let loaded = 0;
    let expired = 0;
    
    for (const [code, room] of Object.entries(saved)) {
      // Only load waiting/playing rooms that haven't expired
      if ((room.status === "waiting" || room.status === "playing") && room.createdAt > cutoff) {
        rooms.set(code, room);
        loaded++;
      } else {
        expired++;
      }
    }
    
    if (loaded > 0) {
      console.log(`[room:persist] Loaded ${loaded} rooms from disk (${expired} expired)`);
    }
  } catch (err) {
    console.error("[room:persist] Failed to load rooms:", err.message);
    // Don't throw - server can start without persisted rooms
  }
}

/**
 * Save active rooms to persistence file with atomic write
 */
function saveRooms() {
  try {
    const obj = {};
    const now = Date.now();
    
    for (const [code, room] of rooms.entries()) {
      // Only persist waiting/playing rooms
      if (room.status === "waiting" || room.status === "playing") {
        // Create minimal game state for persistence
        const roomCopy = {
          code: room.code,
          hostId: room.hostId,
          players: room.players,
          settings: room.settings,
          status: room.status,
          usedWords: room.usedWords,
          createdAt: room.createdAt,
        };
        
        if (room.status === "playing" && room.game) {
          roomCopy.game = {
            currentRound: room.game.currentRound,
            word: room.game.word,
            category: room.game.category,
            imposters: room.game.imposters,
            eliminated: room.game.eliminated,
            rounds: room.game.rounds,
            votes: room.game.votes,
            status: room.game.status || "playing",
          };
        }
        obj[code] = roomCopy;
      }
    }
    
    // Ensure directory exists
    if (!fs.existsSync(PERSIST_DIR)) {
      fs.mkdirSync(PERSIST_DIR, { recursive: true });
    }
    
    // Atomic write to prevent corruption
    atomicWriteFile(PERSIST_FILE, JSON.stringify(obj, null, 2));
  } catch (err) {
    console.error("[room:persist] Failed to save rooms:", err.message);
    // Don't throw - server can continue without persistence
  }
}

// ============== GAME STATE ==============

/**
 * Send game state to socket (for reconnect / requestState)
 */
function sendGameState(socket, room) {
  try {
    if (!room || !room.game) {
      console.log(`[sendGameState] No room or game state — cannot send`);
      return;
    }
    const { getCategoryName } = require("./wordLoader");
    const isImposter = room.game.imposters.includes(socket.data.userId);

    const wordData = {
      role: isImposter ? "imposter" : "citizen",
      word: isImposter ? null : room.game.word,
      category: getCategoryName(room.game.category),
      categoryHint: isImposter && room.settings.imposterHint ? getCategoryName(room.game.category) : null,
      image: null,
    };

    console.log(`[sendGameState] → ${socket.data.displayName}: role=${wordData.role}, phase=${room.status}, round=${room.game.currentRound}`);

    socket.emit("game:word", wordData);

    // Fazaya uyğun event göndər (İlk olaraq fazanı göndəririk ki, client hansı raundda olduğumuzu bilsin)
    if (room.status === "voting") {
      socket.emit("voting:start");
    } else if (room.game.discussionTimer) {
      // Send serverTimestamp so rejoining client can calculate correct elapsed time
      socket.emit("discussion:start", {
        duration: room.game._discussionDuration || room.settings.discussionTime,
        serverTimestamp: room.game._discussionStartTime || Date.now(),
      });
    } else {
      socket.emit("round:start", room.game.currentRound);
    }

    // Bütün raund ipucularını və keçmişi vahid event-lə göndər (BUG FIX: Reconnect zamanı ipucuların itməməsi üçün)
    const history = room.game.rounds.map(r => ({
      roundNumber: r.roundNumber,
      clues: r.clues
    })).filter(r => r.clues.length > 0);

    if (history.length > 0) {
      console.log(`[sendGameState] Sending game:history with ${history.length} rounds to ${socket.data.displayName}`);
      socket.emit("game:history", history);
    }
  } catch (err) {
    console.error("[sendGameState] Error:", err.message);
  }
}

// ============== ROOM CLEANUP ==============

/**
 * Cleanup old rooms and their timers
 */
function cleanupStaleRooms() {
  const cutoff = Date.now() - ROOM_TTL_MS;
  let deleted = 0;
  
  for (const [code, room] of rooms.entries()) {
    // Delete empty rooms or rooms older than TTL
    if (room.players.length === 0 || room.createdAt < cutoff) {
      // Clear all timers for this room
      clearRoomTimers(code);
      
      // Clear discussion timer if exists
      if (room.game?.discussionTimer) {
        clearInterval(room.game.discussionTimer);
        room.game.discussionTimer = null;
      }
      if (room.game?.roundTimer) {
        clearTimeout(room.game.roundTimer);
        room.game.roundTimer = null;
      }
      if (room.game?.voteTimer) {
        clearTimeout(room.game.voteTimer);
        room.game.voteTimer = null;
      }
      
      rooms.delete(code);
      deleted++;
      console.log(`[room:cleanup] Deleted stale room ${code}`);
    }
  }
  
  if (deleted > 0) {
    saveRooms();
  }
}

// ============== HANDLER SETUP ==============

function setupRoomHandlers(io, socket, checkRateLimit) {
  // ========== game:requestState ==========
  socket.on("game:requestState", (data) => {
    try {
      const roomCode = data?.roomCode || socket.data.roomCode;
      
      if (!roomCode) {
        console.log(`[game:requestState] NO roomCode — cannot send game state`);
        return;
      }
      
      const room = rooms.get(roomCode);
      if (!room) {
        console.log(`[game:requestState] Room ${roomCode} not found in memory`);
        socket.emit("error", { message: "Room not found" });
        return;
      }
      
      if (!room.game) {
        console.log(`[game:requestState] Room ${roomCode} has no active game`);
        socket.emit("error", { message: "No active game" });
        return;
      }
      
      // Update socket room code if not set
      if (!socket.data.roomCode) {
        socket.data.roomCode = roomCode;
      }
      socket.join(roomCode);
      
      // Update player socket ID
      const player = room.players.find((p) => p.userId === socket.data.userId);
      if (player) {
        player.socketId = socket.id;
      }
      
      console.log(`[game:requestState] Sending game state to ${socket.data.displayName} for room ${roomCode}`);
      sendGameState(socket, room);
    } catch (err) {
      console.error("[game:requestState] Error:", err.message);
      socket.emit("error", { message: "Failed to get game state" });
    }
  });
  
  // ========== room:create ==========
  socket.on("room:create", (data, callback) => {
    try {
      // Rate limiting
      if (!checkRateLimit(socket, "room:create", 5, 5000)) {
        if (callback) callback({ success: false, error: "Çox sürətli — gözləyin" });
        return;
      }
      
      // Generate unique room code
      let code;
      try {
        code = generateUniqueRoomCode();
      } catch (err) {
        console.error("[room:create] Failed to generate unique code:", err.message);
        if (callback) callback({ success: false, error: "Failed to create room" });
        return;
      }
      
      const room = {
        code,
        hostId: socket.data.userId,
        players: [
          {
            userId: socket.data.userId,
            displayName: socket.data.displayName,
            avatarColor: socket.data.avatarColor,
            isReady: true,
            socketId: socket.id,
          },
        ],
        settings: {
          category: "yemekler",
          rounds: 2,
          discussionTime: 60,
          imposterHint: true,
          imposterCount: 0, // Will be auto-calculated
        },
        status: "waiting",
        usedWords: [],
        createdAt: Date.now(),
      };
      
      // Apply validated settings if provided
      if (data?.settings) {
        const validated = validateSettings(data.settings);
        room.settings = { ...room.settings, ...validated };
      }
      
      rooms.set(code, room);
      socket.join(code);
      socket.data.roomCode = code;
      
      console.log(`[room:create] ${socket.data.displayName} created room ${code}`);
      saveRooms();
      
      if (callback) callback({ success: true, room });
    } catch (err) {
      console.error("[room:create] Error:", err.message);
      if (callback) callback({ success: false, error: err.message });
    }
  });
  
  // ========== room:join ==========
  socket.on("room:join", (data, callback) => {
    try {
      // Rate limiting
      if (!checkRateLimit(socket, "room:join", 5, 3000)) {
        if (callback) callback({ success: false, error: "Çox sürətli — gözləyin" });
        return;
      }
      
      const roomCode = sanitizeString(data?.roomCode, 10);
      if (!roomCode) {
        if (callback) callback({ success: false, error: "Invalid room code" });
        return;
      }
      
      let room = rooms.get(roomCode);
      
      // Auto-create room if exists in API but not in memory
      if (!room) {
        room = {
          code: roomCode,
          hostId: socket.data.userId,
          players: [],
          settings: {
            category: "yemekler",
            rounds: 2,
            discussionTime: 60,
            imposterHint: true,
            imposterCount: 0,
          },
          status: "waiting",
          usedWords: [],
          createdAt: Date.now(),
        };
        rooms.set(roomCode, room);
        console.log(`[room:join] Auto-created room ${roomCode} in memory`);
      }
      
      // Check if player already in room (reconnect)
      const existing = room.players.find((p) => p.userId === socket.data.userId);
      if (existing) {
        existing.socketId = socket.id;
        existing.displayName = socket.data.displayName;
        existing.avatarColor = socket.data.avatarColor;
        socket.join(roomCode);
        socket.data.roomCode = roomCode;
        
        // Clear any pending reconnect timeout
        const reconnect = reconnectTimeouts.get(socket.data.userId);
        if (reconnect && reconnect.roomCode === roomCode) {
          clearTimeout(reconnect.timer);
          reconnectTimeouts.delete(socket.data.userId);
        }
        
        console.log(`[room:rejoin] ${socket.data.displayName} reconnected to room ${roomCode}`);
        
        // Send game state if game is active
        if (room.game) {
          sendGameState(socket, room);
        }
        
        if (callback) callback({ success: true, room });
        return;
      }
      
      // Validate room status
      if (room.status !== "waiting") {
        if (callback) callback({ success: false, error: "Oyun artıq başlayıb" });
        return;
      }
      
      // Check player limit
      if (room.players.length >= MAX_PLAYERS) {
        if (callback) callback({ success: false, error: `Otaq doludur (max ${MAX_PLAYERS})` });
        return;
      }
      
      // Handle duplicate display names
      let displayName = socket.data.displayName;
      const nameExists = room.players.some((p) => p.displayName === displayName);
      if (nameExists) {
        const suffix = Math.floor(100 + crypto.randomBytes(2).readUInt16LE(0) % 900);
        displayName = `${displayName}_${suffix}`;
        socket.data.displayName = displayName;
      }
      
      const player = {
        userId: socket.data.userId,
        displayName,
        avatarColor: socket.data.avatarColor,
        isReady: false,
        socketId: socket.id,
      };
      
      room.players.push(player);
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      
      // Notify other players
      socket.to(roomCode).emit("player:join", {
        userId: player.userId,
        displayName: player.displayName,
        avatarColor: player.avatarColor,
        isReady: player.isReady,
      });
      
      console.log(`[room:join] ${socket.data.displayName} → room ${roomCode} (${room.players.length} players)`);
      saveRooms();
      
      if (callback) callback({ success: true, room });
    } catch (err) {
      console.error("[room:join] Error:", err.message);
      if (callback) callback({ success: false, error: err.message });
    }
  });
  
  // ========== room:leave ==========
  socket.on("room:leave", (data, callback) => {
    try {
      const roomCode = data?.roomCode || socket.data.roomCode;
      if (!roomCode) {
        if (callback) callback({ success: false, error: "No room joined" });
        return;
      }
      
      const room = rooms.get(roomCode);
      if (!room) {
        if (callback) callback({ success: true }); // Already gone
        return;
      }
      
      // Clear any pending reconnect timeout
      const reconnect = reconnectTimeouts.get(socket.data.userId);
      if (reconnect) {
        clearTimeout(reconnect.timer);
        reconnectTimeouts.delete(socket.data.userId);
      }
      
      // Remove player from room
      room.players = room.players.filter((p) => p.userId !== socket.data.userId);
      socket.leave(roomCode);
      socket.data.roomCode = null;
      
      // Delete empty room
      if (room.players.length === 0) {
        clearRoomTimers(roomCode);
        rooms.delete(roomCode);
        console.log(`[room:delete] room ${roomCode} (empty)`);
      } else {
        // Assign new host if needed
        if (room.hostId === socket.data.userId) {
          room.hostId = room.players[0].userId;
          io.to(roomCode).emit("room:host-changed", { newHostId: room.hostId });
        }
        socket.to(roomCode).emit("player:leave", socket.data.userId);
      }
      
      console.log(`[room:leave] ${socket.data.displayName} ← room ${roomCode}`);
      saveRooms();
      
      if (callback) callback({ success: true });
    } catch (err) {
      console.error("[room:leave] Error:", err.message);
      if (callback) callback({ success: false, error: err.message });
    }
  });
  
  // ========== player:ready ==========
  socket.on("player:ready", (data) => {
    try {
      if (!checkRateLimit(socket, "ready", 10, 1000)) return;
      
      const roomCode = data?.roomCode || socket.data.roomCode;
      if (!roomCode) return;
      
      const room = rooms.get(roomCode);
      if (!room) return;
      
      const player = room.players.find((p) => p.userId === socket.data.userId);
      if (!player) return;
      
      player.isReady = data.isReady !== false;
      
      io.to(roomCode).emit("player:ready", socket.data.userId, player.isReady);
    } catch (err) {
      console.error("[player:ready] Error:", err.message);
    }
  });
  
  // ========== room:settings ==========
  socket.on("room:settings", (data) => {
    try {
      if (!checkRateLimit(socket, "settings", 10, 1000)) return;
      
      const roomCode = data?.roomCode || socket.data.roomCode;
      if (!roomCode) return;
      
      const room = rooms.get(roomCode);
      if (!room) return;
      
      // Only host can change settings
      if (room.hostId !== socket.data.userId) {
        console.log(`[room:settings] Denied: ${socket.data.displayName} is not host`);
        return;
      }
      
      // Apply validated settings
      if (data?.settings) {
        const validated = validateSettings(data.settings);
        room.settings = { ...room.settings, ...validated };
      }
      
      io.to(roomCode).emit("room:settings", room.settings);
      saveRooms();
    } catch (err) {
      console.error("[room:settings] Error:", err.message);
    }
  });
  
  // ========== disconnect ==========
  socket.on("disconnect", () => {
    try {
      const roomCode = socket.data.roomCode;
      if (!roomCode) return;
      
      const room = rooms.get(roomCode);
      if (!room) return;
      
      const player = room.players.find((p) => p.userId === socket.data.userId);
      if (!player) return;
      
      if (room.status !== "waiting") {
        // Game in progress - mark as disconnected and set reconnect timeout
        player.socketId = null;
        socket.to(roomCode).emit("player:disconnected", socket.data.userId);
        
        console.log(`[disconnect] ${socket.data.displayName} disconnected from game ${roomCode} (60s reconnect)`);
        
        // Clear any existing reconnect timeout for this user before setting a new one
        const existing = reconnectTimeouts.get(socket.data.userId);
        if (existing) {
          clearTimeout(existing.timer);
          reconnectTimeouts.delete(socket.data.userId);
        }

        // Set reconnect timeout
        const timeout = setTimeout(() => {
          const currentRoom = rooms.get(roomCode);
          if (!currentRoom) return;
          
          const p = currentRoom.players.find((pl) => pl.userId === socket.data.userId);
          if (p && p.socketId === null) {
            // Player didn't reconnect - remove them
            currentRoom.players = currentRoom.players.filter((pl) => pl.userId !== socket.data.userId);
            
            // Clean up votes for this player (BUG 1.5 fix)
            if (currentRoom.game && currentRoom.game.votes) {
              currentRoom.game.votes = currentRoom.game.votes.filter((v) => v.voterId !== socket.data.userId);
            }
            
            io.to(roomCode).emit("player:leave", socket.data.userId);
            
            // Delete empty room
            if (currentRoom.players.length === 0) {
              clearRoomTimers(roomCode);
              rooms.delete(roomCode);
              console.log(`[room:delete] room ${roomCode} (empty after disconnect)`);
            }
            
            saveRooms();
          }
          
          reconnectTimeouts.delete(socket.data.userId);
        }, RECONNECT_TIMEOUT_MS);
        
        reconnectTimeouts.set(socket.data.userId, {
          timer: timeout,
          roomCode: roomCode,
        });
      } else {
        // Lobby - remove immediately
        room.players = room.players.filter((p) => p.userId !== socket.data.userId);
        socket.leave(roomCode);
        
        if (room.players.length === 0) {
          clearRoomTimers(roomCode);
          rooms.delete(roomCode);
          console.log(`[room:delete] room ${roomCode} (empty after disconnect)`);
        } else {
          // Assign new host if needed
          if (room.hostId === socket.data.userId) {
            room.hostId = room.players[0].userId;
            io.to(roomCode).emit("room:host-changed", { newHostId: room.hostId });
          }
          io.to(roomCode).emit("player:leave", socket.data.userId);
        }
        
        console.log(`[disconnect] ${socket.data.displayName} removed from lobby ${roomCode}`);
        saveRooms();
      }
    } catch (err) {
      console.error("[disconnect] Error:", err.message);
    }
  });
}

// ============== INITIALIZATION ==============

// Load rooms on module start
loadRooms();

// Start cleanup interval
const cleanupInterval = setInterval(cleanupStaleRooms, CLEANUP_INTERVAL_MS);
cleanupInterval.unref(); // Don't prevent process exit

// Graceful shutdown handler
function cleanup() {
  console.log("[room:cleanup] Saving rooms before shutdown...");
  saveRooms();
  
  // Clear all timers
  for (const [code] of roomTimers.entries()) {
    clearRoomTimers(code);
  }
  
  // Clear reconnect timeouts
  for (const [userId, reconnect] of reconnectTimeouts.entries()) {
    clearTimeout(reconnect.timer);
  }
  reconnectTimeouts.clear();
  
  clearInterval(cleanupInterval);
}

// ============== EXPORTS ==============

module.exports = {
  // Public API
  setupRoomHandlers,
  rooms,
  generateRoomCode,
  generateUniqueRoomCode,
  saveRooms,
  loadRooms,
  cleanup,
  validateSettings,
  sanitizeString,
  
  // Internal functions exported for testing
  atomicWriteFile,
  clearRoomTimers,
  addRoomTimer,
  sendGameState,
  cleanupStaleRooms,
  
  // Constants exported for testing
  CONSTANTS: {
    ROOM_TTL_MS,
    CLEANUP_INTERVAL_MS,
    RECONNECT_TIMEOUT_MS,
    MAX_PLAYERS,
    ROOM_CODE_LENGTH,
    ROOM_CODE_CHARS,
  },
  
  // Test hooks (only used in test environment)
  __TEST_ONLY__: {
    setRooms: (newRooms) => {
      rooms.clear();
      for (const [k, v] of newRooms.entries()) rooms.set(k, v);
    },
    setReconnectTimeouts: (newTimeouts) => {
      reconnectTimeouts.clear();
      for (const [k, v] of newTimeouts.entries()) reconnectTimeouts.set(k, v);
    },
    getRoomTimers: () => roomTimers,
    getReconnectTimeouts: () => reconnectTimeouts,
    resetAllState: () => {
      rooms.clear();
      roomTimers.clear();
      reconnectTimeouts.clear();
    },
  },
};
