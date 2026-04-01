// ============== CONSTANTS ==============
const MAX_MESSAGE_LENGTH = 200;
const MIN_MESSAGE_LENGTH = 1;
const CHAT_RATE_LIMIT_MS = 2000;

// ============== SANITIZATION ==============
/**
 * Sanitize chat message to prevent XSS and injection attacks
 */
function sanitizeMessage(message) {
  if (!message || typeof message !== "string") return null;
  
  const trimmed = message.trim();
  if (trimmed.length < MIN_MESSAGE_LENGTH || trimmed.length > MAX_MESSAGE_LENGTH) {
    return null;
  }
  
  // Remove dangerous characters and patterns
  const sanitized = trimmed
    .replace(/[<>&"'/\\]/g, "")  // Remove HTML/script chars
    .replace(/(javascript|vbscript|data):/gi, "")  // Remove protocol handlers
    .replace(/on\w+\s*=/gi, "")  // Remove event handlers
    .replace(/&#x[0-9a-f]+;/gi, "")  // Remove hex entities
    .replace(/\s+/g, " ");  // Normalize whitespace
  
  // Final validation
  if (sanitized.length === 0) return null;
  
  return sanitized.slice(0, MAX_MESSAGE_LENGTH);
}

// ============== HANDLER SETUP ==============
function setupChatHandlers(io, socket, checkRateLimit) {
  // ========== discussion:message ==========
  socket.on("discussion:message", (data) => {
    try {
      // Rate limit check with specific event name
      if (!checkRateLimit(socket, "discussion:message", CHAT_RATE_LIMIT_MS)) return;
      
      // Validate roomCode first
      const roomCode = socket.data.roomCode;
      if (!roomCode) {
        console.log(`[discussion:message] No roomCode for ${socket.data.displayName}`);
        return;
      }
      
      // Validate message
      const message = data?.message;
      if (!message) return;
      
      // Sanitize message
      const sanitized = sanitizeMessage(message);
      if (!sanitized) return;

      const chatMessage = {
        userId: socket.data.userId,
        displayName: socket.data.displayName,
        message: sanitized,
        timestamp: new Date(),
      };

      io.to(roomCode).emit("discussion:message", chatMessage);
    } catch (err) {
      console.error("[discussion:message] Error:", err.message);
    }
  });
}

// ============== EXPORTS ==============
module.exports = {
  setupChatHandlers,
  sanitizeMessage,
  CONSTANTS: {
    MAX_MESSAGE_LENGTH,
    MIN_MESSAGE_LENGTH,
    CHAT_RATE_LIMIT_MS,
  },
  // Test hooks
  __TEST_ONLY__: {
    // Allow testing rate limit behavior
    testRateLimit: (checkRateLimit, socket, event, windowMs) => {
      return checkRateLimit(socket, event, windowMs);
    },
  },
};
