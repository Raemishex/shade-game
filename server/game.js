const { rooms, saveRooms, clearRoomTimers } = require("./rooms");
const { getRandomWord, getCategoryName } = require("./wordLoader");

// ============== CONSTANTS ==============
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000];
const ROUND_TIMER_MS = 60000; // 60 seconds
const VOTE_TIMER_MS = 30000; // 30 seconds
const DISCUSSION_CHECK_INTERVAL_MS = 1000;
const GAME_END_DELAY_MS = 3000;
const ROUND_TRANSITION_DELAY_MS = 2000;
const MAX_USED_WORDS = 50;

// ============== XP CALCULATION ==============
function calculateLevelFromXP(totalXP) {
  let level = 1;
  while (true) {
    const nextThreshold =
      level < LEVEL_THRESHOLDS.length
        ? LEVEL_THRESHOLDS[level]
        : LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (level - LEVEL_THRESHOLDS.length + 1) * 1200;
    if (totalXP < nextThreshold) break;
    level++;
  }
  return level;
}

// ============== DATABASE ==============
function getMongoose() {
  try {
    return require("mongoose");
  } catch {
    return null;
  }
}

async function ensureDB() {
  const mongoose = getMongoose();
  if (!mongoose) return null;
  if (mongoose.connection.readyState === 0) {
    const uri = process.env.MONGODB_URI;
    if (!uri) return null;
    try {
      await mongoose.connect(uri);
    } catch (err) {
      console.error("[ensureDB] Connection failed:", err.message);
      return null;
    }
  }
  return mongoose;
}

/**
 * Update player XP in database with atomic operations
 */
async function updatePlayerXP(xpDistribution, winners, imposters) {
  const mongoose = await ensureDB();
  if (!mongoose) {
    console.log("[xp-update] DB not available, skipping");
    return;
  }

  const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}, { strict: false }));

  const updatePromises = xpDistribution.map(async (entry) => {
    // Skip guest users — they have no DB record
    if (!entry.userId || entry.userId.startsWith("guest_")) return;
    if (entry.xp <= 0) return;

    try {
      const isImposter = imposters.includes(entry.userId);
      const isWinner =
        (winners === "citizens" && !isImposter) ||
        (winners === "imposters" && isImposter);

      // Atomic $inc to avoid race conditions when player finishes multiple games simultaneously
      const statsInc = {
        xp: entry.xp,
        "stats.totalGames": 1,
        ...(isWinner ? { "stats.wins": 1 } : {}),
        ...(isImposter ? { "stats.imposterGames": 1 } : {}),
        ...(isImposter && isWinner ? { "stats.imposterWins": 1 } : {}),
      };

      const updated = await User.findByIdAndUpdate(
        entry.userId,
        { $inc: statsInc },
        { new: true }
      );
      if (!updated) return;

      // Update level based on new XP total
      const newLevel = calculateLevelFromXP(updated.xp);
      if (newLevel !== updated.level) {
        await User.findByIdAndUpdate(entry.userId, { $set: { level: newLevel } });
      }

      console.log(`[xp-update] ${entry.displayName}: +${entry.xp} XP → total ${updated.xp}, LVL ${newLevel}`);
    } catch (err) {
      console.error(`[xp-update] Failed for ${entry.userId}:`, err.message);
    }
  });

  await Promise.allSettled(updatePromises);
}

/**
 * Save game result to database (BUG 1.1 fix)
 */
async function saveGameToDB(room, winners, xpDistribution, eliminatedId, wasImposter, voteBreakdown, voteDetails) {
  const mongoose = await ensureDB();
  if (!mongoose) {
    console.log("[saveGame] DB not available, skipping game save");
    return;
  }

  try {
    const GameSchema = mongoose.models.Game?.schema || new mongoose.Schema({}, { strict: false });
    const Game = mongoose.models.Game || mongoose.model("Game", GameSchema);
    const RoomModel = mongoose.models.Room || mongoose.model("Room", new mongoose.Schema({}, { strict: false }));

    const gameDoc = new Game({
      roomId: room.code,
      word: room.game.word,
      category: room.game.category,
      players: room.players.map((p) => ({
        userId: p.userId,
        displayName: p.displayName,
        role: room.game.imposters.includes(p.userId) ? "imposter" : "citizen",
      })),
      imposters: room.game.imposters,
      rounds: room.game.rounds,
      votes: room.game.votes,
      result: {
        winners,
        eliminatedId,
        wasImposter,
        voteBreakdown,
        voteDetails,
        xpDistribution,
      },
      startedAt: new Date(room.game.startedAt),
      endedAt: new Date(),
    });

    await gameDoc.save();
    console.log(`[saveGame] Game saved to DB: ${gameDoc._id} for room ${room.code}`);

    // Room status-u DB-də yenilə
    const dbRoom = await RoomModel.findOne({ code: room.code });
    if (dbRoom) {
      dbRoom.status = "finished";
      dbRoom.currentGameId = gameDoc._id;
      await dbRoom.save();
    }

    return gameDoc._id;
  } catch (err) {
    console.error("[saveGame] Failed to save game:", err.message);
  }
}

// ============== GAME STATE CLEANUP ==============
/**
 * Clean up game state after game ends
 */
function cleanupGameState(room) {
  if (!room.game) return;
  
  // Clear all timers
  if (room.game.roundTimer) {
    clearTimeout(room.game.roundTimer);
    room.game.roundTimer = null;
  }
  if (room.game.voteTimer) {
    clearTimeout(room.game.voteTimer);
    room.game.voteTimer = null;
  }
  if (room.game.discussionTimer) {
    clearInterval(room.game.discussionTimer);
    room.game.discussionTimer = null;
  }
  
  // Cap used words to prevent memory leak
  if (room.usedWords && room.usedWords.length > MAX_USED_WORDS) {
    room.usedWords = room.usedWords.slice(-MAX_USED_WORDS);
  }
  
  // Clear game state after delay
  setTimeout(() => {
    if (room.game) {
      room.game = null;
    }
    room.status = "finished";
    saveRooms();
  }, GAME_END_DELAY_MS);
}

// ============== HELPERS ==============
/**
 * Get active players: not eliminated AND connected (has socketId)
 */
function getActivePlayers(room) {
  return room.players.filter(
    (p) => !room.game.eliminated.includes(p.userId) && p.socketId !== null
  );
}

// ============== HANDLER SETUP ==============
function setupGameHandlers(io, socket, checkRateLimit) {
  // ========== game:start ==========
  socket.on("game:start", (data, callback) => {
    try {
      if (!checkRateLimit(socket, "game:start", 5000)) {
        if (callback) return callback({ success: false, error: "Çox sürətli — gözləyin" });
        return;
      }
      
      const roomCode = data?.roomCode || socket.data.roomCode;
      const room = rooms.get(roomCode);

      if (!room) {
        if (callback) return callback({ success: false, error: "Otaq tapılmadı" });
        return;
      }
      
      if (room.hostId !== socket.data.userId) {
        if (callback) return callback({ success: false, error: "Yalnız host oyunu başlada bilər" });
        return;
      }
      
      if (room.players.length < 3) {
        if (callback) return callback({ success: false, error: "Minimum 3 oyunçu lazımdır" });
        return;
      }
      
      // BUG FIX: Prevent double game start
      if (room.game) {
        if (callback) return callback({ success: false, error: "Oyun artıq başladı" });
        return;
      }

      // Filter out players without active socket connections
      const connectedPlayers = room.players.filter((p) => {
        const pSocket = io.sockets.sockets.get(p.socketId);
        if (!pSocket) {
          console.log(`[game:start] Removing disconnected player ${p.displayName} before start`);
          return false;
        }
        return true;
      });
      room.players = connectedPlayers;

      if (room.players.length < 3) {
        if (callback) return callback({ success: false, error: "Bağlantısı olan minimum 3 oyunçu lazımdır" });
        return;
      }

      room.status = "playing";
      saveRooms();

      // İmposter sayı — settings-dən gəlirsə istifadə et, yoxsa auto
      const playerCount = room.players.length;
      let imposterCount;
      const requestedCount = room.settings.imposterCount || 0;
      if (requestedCount > 0 && requestedCount < playerCount) {
        imposterCount = requestedCount;
      } else {
        // Auto mode
        if (playerCount <= 5) imposterCount = 1;
        else if (playerCount <= 10) imposterCount = Math.random() < 0.5 ? 1 : 2;
        else imposterCount = Math.random() < 0.5 ? 2 : 3;
      }

      // Random imposter seç (Fisher-Yates shuffle)
      const shuffled = [...room.players];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const imposters = shuffled.slice(0, imposterCount).map((p) => p.userId);

      // JSON database-dən random söz seç
      const category = room.settings.category;
      const wordEntry = getRandomWord(category, room.usedWords || []);

      if (!wordEntry || !wordEntry.az) {
        console.error(`[game:start] No word found for category: ${category}`);
        if (callback) return callback({ success: false, error: "Seçilmiş kateqoriyada söz tapılmadı" });
        return;
      }

      const word = wordEntry.az;
      const categoryName = getCategoryName(category);

      // İstifadə olunmuş sözlərə əlavə et
      if (!room.usedWords) room.usedWords = [];
      room.usedWords.push(word);

      // Game state saxla
      room.game = {
        word,
        category,
        imposters,
        rounds: [],
        currentRound: 0,
        votes: [],
        eliminated: [],
        startedAt: Date.now(),
        _roundProcessing: false,
        _voteProcessing: false,
      };

      // Hər oyunçuya fərdi məlumat göndər
      room.players.forEach((player) => {
        const isImposter = imposters.includes(player.userId);
        const playerSocket = io.sockets.sockets.get(player.socketId);
        if (!playerSocket) {
          console.log(`[game:start] WARNING: No socket for player ${player.displayName} (socketId: ${player.socketId})`);
          return;
        }

        const wordPayload = {
          role: isImposter ? "imposter" : "citizen",
          word: isImposter ? null : word,
          category: categoryName,
          categoryHint: isImposter && room.settings.imposterHint ? categoryName : null,
          image: wordEntry.image || null,
        };
        console.log(`[game:start] Sending game:word to ${player.displayName} — role=${wordPayload.role}`);
        playerSocket.emit("game:word", wordPayload);
      });

      // Hamıya oyunun başladığını bildir
      io.to(roomCode).emit("game:start", {
        playerCount,
        imposterCount,
        rounds: room.settings.rounds,
        category: categoryName,
      });

      // İlk raund başlat
      room.game.currentRound = 1;
      room.game.rounds.push({ roundNumber: 1, clues: [] });
      io.to(roomCode).emit("round:start", 1);

      // Raund taymeri başlat (60 saniyə)
      startRoundTimer(io, roomCode, room);

      console.log(`[game:start] room ${roomCode} — ${playerCount} players, ${imposterCount} imposters, word: "${word}"`);

      if (callback) callback({ success: true });
    } catch (err) {
      console.error("[game:start] Error:", err.message);
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // ========== clue:submit ==========
  socket.on("clue:submit", (data) => {
    try {
      if (!checkRateLimit(socket, "clue:submit", 2000)) return;
      const roomCode = socket.data.roomCode;
      const room = rooms.get(roomCode);
      if (!room || !room.game) return;

      // Only accept clues during the playing phase (not voting/finished)
      if (room.status !== "playing") return;

      // Verify player is in this room
      if (!room.players.find((p) => p.userId === socket.data.userId)) return;

      // Eliminated players cannot submit clues
      if (room.game.eliminated.includes(socket.data.userId)) return;

      let { clue } = data;
      if (!clue || typeof clue !== "string") return;

      // Input sanitization — HTML tagları və xüsusi simvolları təmizlə
      clue = clue
        .replace(/[<>&"'/\\]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (clue.length === 0 || clue.length > 30) return;

      const currentRound = room.game.rounds[room.game.currentRound - 1];
      if (!currentRound) return;

      // Artıq ipucu veribsə, qəbul etmə
      if (currentRound.clues.find((c) => c.userId === socket.data.userId)) return;

      const clueEntry = {
        userId: socket.data.userId,
        displayName: socket.data.displayName,
        clue: clue.trim(),
        submittedAt: Date.now(),
      };

      currentRound.clues.push(clueEntry);

      // Bütün otağa bildir
      io.to(roomCode).emit("clue:update", currentRound.clues);

      console.log(`[clue] ${socket.data.displayName}: "${clue}" (round ${room.game.currentRound})`);

      // Hamı ipucu verdisə
      const activePlayers = getActivePlayers(room);
      if (currentRound.clues.length >= activePlayers.length) {
        handleRoundEnd(io, roomCode, room);
      }
    } catch (err) {
      console.error("[clue:submit] Error:", err.message);
    }
  });

  // ========== vote:cast ==========
  socket.on("vote:cast", (data) => {
    try {
      if (!checkRateLimit(socket, "vote:cast", 2000)) return;
      const roomCode = socket.data.roomCode;
      const room = rooms.get(roomCode);
      if (!room || !room.game) return;

      // Only accept votes during the voting phase
      if (room.status !== "voting") return;

      // Verify player is in this room
      if (!room.players.find((p) => p.userId === socket.data.userId)) return;

      const { votedFor } = data;

      // Oyunçunun özü eliminated-dırsa, səs verə bilməz
      if (room.game.eliminated.includes(socket.data.userId)) return;

      // Artıq səs veribsə, qəbul etmə
      if (room.game.votes.find((v) => v.voterId === socket.data.userId)) return;

      // votedFor dəyərini yoxla — yalnız aktiv oyunçulara səs verilə bilər
      if (votedFor !== null && votedFor !== undefined) {
        if (typeof votedFor !== "string") return;
        // NoSQL injection protection
        if (votedFor.includes("$") || votedFor.includes(".")) return;
        // No self-vote
        if (votedFor === socket.data.userId) return;
        // Check if target is active (not eliminated, not disconnected)
        const votableTargets = getActivePlayers(room).filter(
          (p) => p.userId !== socket.data.userId
        );
        if (!votableTargets.some((p) => p.userId === votedFor)) return;
      }

      const voteEntry = {
        voterId: socket.data.userId,
        votedFor: votedFor || null,
      };

      room.game.votes.push(voteEntry);

      console.log(`[vote] ${socket.data.displayName} → ${votedFor || "skip"}`);

      // Hamı səs verdisə
      const activeVoters = getActivePlayers(room);
      if (room.game.votes.length >= activeVoters.length) {
        handleVoteResult(io, roomCode, room);
      }
    } catch (err) {
      console.error("[vote:cast] Error:", err.message);
    }
  });
}

// ============== ROUND TIMER ==============
function startRoundTimer(io, roomCode, room) {
  // Əvvəlki taymeri təmizlə
  if (room.game.roundTimer) {
    clearTimeout(room.game.roundTimer);
  }

  room.game.roundTimer = setTimeout(() => {
    // Re-fetch room from Map to avoid stale closure
    const freshRoom = rooms.get(roomCode);
    if (!freshRoom || !freshRoom.game) return;

    const currentRound = freshRoom.game.rounds[freshRoom.game.currentRound - 1];
    if (!currentRound) return;

    // İpucu verməyən oyunçulara "---" yaz
    const activePlayers = getActivePlayers(freshRoom);

    let changed = false;
    activePlayers.forEach((player) => {
      if (!currentRound.clues.find((c) => c.userId === player.userId)) {
        currentRound.clues.push({
          userId: player.userId,
          displayName: player.displayName,
          clue: "---",
          submittedAt: Date.now(),
        });
        changed = true;
      }
    });

    if (changed) {
      io.to(roomCode).emit("clue:update", currentRound.clues);
      console.log(`[timer] Round ${freshRoom.game.currentRound} timeout — auto-submitted for missing players`);
    }

    // Always resolve round when timer fires, even if no new clues were added
    if (currentRound.clues.length >= activePlayers.length) {
      handleRoundEnd(io, roomCode, freshRoom);
    }
  }, ROUND_TIMER_MS);
}

// ============== ROUND END HANDLER ==============
function handleRoundEnd(io, roomCode, room) {
  // Guard: game may have been cleaned up
  if (!room.game) return;

  // Race condition qarşısını al
  if (room.game._roundProcessing) {
    console.log(`[round-end] Already processing for room ${roomCode}, skipping duplicate`);
    return;
  }
  room.game._roundProcessing = true;

  // Taymeri təmizlə
  if (room.game.roundTimer) {
    clearTimeout(room.game.roundTimer);
    room.game.roundTimer = null;
  }
  
  const currentRoundNum = room.game.currentRound;
  io.to(roomCode).emit("round:end", currentRoundNum);

  // Davam raundları üçün düzgün limit hesabla
  // İlk dövr: settings.rounds ədəd raund
  // Davam dövrləri: hər dəfə 1 raund (sonra müzakirə+səsvermə)
  const continuationStart = room.game._continuationRoundStart || 0;
  const isFirstCycle = continuationStart === 0;
  const maxRoundThisCycle = isFirstCycle
    ? room.settings.rounds
    : continuationStart; // davam dövrü: yalnız 1 raund

  if (currentRoundNum < maxRoundThisCycle) {
    // Növbəti raund
    room.game.currentRound++;
    room.game.rounds.push({ roundNumber: room.game.currentRound, clues: [] });

    setTimeout(() => {
      const freshRoom = rooms.get(roomCode);
      if (!freshRoom || !freshRoom.game) return;
      io.to(roomCode).emit("round:start", freshRoom.game.currentRound);
      startRoundTimer(io, roomCode, freshRoom);
      freshRoom.game._roundProcessing = false;
    }, ROUND_TRANSITION_DELAY_MS);
  } else {
    // Bütün raundlar bitdi → müzakirə və ya səsvermə başlasın
    const discussionTime = room.settings.discussionTime || 0;

    if (discussionTime > 0) {
      // Drift-ə davamlı taymer (başlanğıc vaxtına əsaslanır)
      const discussionStartTime = Date.now();
      room.game._discussionStartTime = discussionStartTime;
      room.game._discussionDuration = discussionTime;

      // serverTimestamp göndər — client rejoin-da düzgün sync edə bilsin
      io.to(roomCode).emit("discussion:start", { duration: discussionTime, serverTimestamp: discussionStartTime });

      let lastEmittedSecond = discussionTime;

      const discussionTimer = setInterval(() => {
        const freshRoom = rooms.get(roomCode);
        if (!freshRoom || !freshRoom.game || freshRoom.status !== "playing") {
          clearInterval(discussionTimer);
          return;
        }

        const elapsed = Math.floor((Date.now() - discussionStartTime) / 1000);
        const timeLeft = Math.max(0, discussionTime - elapsed);

        // Yalnız dəyişəndə emit et (dublikat qarşısını al)
        if (timeLeft !== lastEmittedSecond) {
          lastEmittedSecond = timeLeft;
          io.to(roomCode).emit("discussion:timer", timeLeft);
        }

        if (timeLeft <= 0) {
          clearInterval(discussionTimer);
          freshRoom.game.discussionTimer = null;
          io.to(roomCode).emit("discussion:end");

          // Səsvermə başlasın
          startVotingPhase(io, roomCode, freshRoom);
          freshRoom.game._roundProcessing = false;
        }
      }, DISCUSSION_CHECK_INTERVAL_MS);

      room.game.discussionTimer = discussionTimer;
    } else {
      // Müzakirə yoxdur, birbaşa səsverməyə
      startVotingPhase(io, roomCode, room);
      room.game._roundProcessing = false;
    }
  }
}

/**
 * Start the voting phase
 */
function startVotingPhase(io, roomCode, room) {
  if (room.game.discussionTimer) {
    clearInterval(room.game.discussionTimer);
    room.game.discussionTimer = null;
  }

  room.status = "voting";
  room.game.votes = [];
  io.to(roomCode).emit("voting:start");

  // 30s səsvermə taymeri
  startVoteTimer(io, roomCode, room);
}

// ============== VOTE TIMER ==============
function startVoteTimer(io, roomCode, room) {
  if (room.game.voteTimer) {
    clearTimeout(room.game.voteTimer);
  }

  room.game.voteTimer = setTimeout(() => {
    // Re-fetch room from Map to avoid stale closure
    const freshRoom = rooms.get(roomCode);
    if (!freshRoom || !freshRoom.game || freshRoom.status !== "voting") return;

    // Səs verməyən oyunçulara null vote yaz
    const activePlayers = getActivePlayers(freshRoom);

    let changed = false;
    activePlayers.forEach((player) => {
      if (!freshRoom.game.votes.find((v) => v.voterId === player.userId)) {
        freshRoom.game.votes.push({
          voterId: player.userId,
          votedFor: null,
        });
        changed = true;
      }
    });

    if (changed) {
      console.log(`[vote-timer] Auto-submitted null votes for missing players in room ${roomCode}`);
    }

    // Always resolve voting when timer fires, even if no new votes were added
    if (freshRoom.game.votes.length >= activePlayers.length) {
      handleVoteResult(io, roomCode, freshRoom);
    }
  }, VOTE_TIMER_MS);
}

// ============== VOTE RESULT HANDLER ==============
function handleVoteResult(io, roomCode, room) {
  // Guard: game may have been cleaned up
  if (!room.game) return;

  // BUG 1.4 fix: Race condition
  if (room.game._voteProcessing) {
    console.log(`[vote-result] Already processing for room ${roomCode}, skipping duplicate`);
    return;
  }

  // Taymerləri dərhal təmizləyirik (mutex-dən əvvəl) ki, dublikat hadisələr gəlməsin
  if (room.game.voteTimer) {
    clearTimeout(room.game.voteTimer);
    room.game.voteTimer = null;
  }

  room.game._voteProcessing = true;

  const votes = room.game.votes;

  // 1. Səsləri say
  const counts = {};
  votes.forEach((v) => {
    if (v.votedFor) {
      counts[v.votedFor] = (counts[v.votedFor] || 0) + 1;
    }
  });

  // 2. Ən çox səs alanı tap
  let maxVotes = 0;
  let eliminatedId = null;
  let tie = false;

  Object.entries(counts).forEach(([userId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      eliminatedId = userId;
      tie = false;
    } else if (count === maxVotes) {
      tie = true;
    }
  });

  // 3. Bərabərlik → heç kim çıxarılmır
  if (tie) eliminatedId = null;

  const wasImposter = eliminatedId
    ? room.game.imposters.includes(eliminatedId)
    : false;

  if (eliminatedId) {
    room.game.eliminated.push(eliminatedId);
  }

  // Vote breakdown
  const voteBreakdown = Object.entries(counts).map(([targetId, count]) => ({
    targetId,
    count,
  }));

  // Kimin kimə səs verdiyini də əlavə et
  const voteDetails = votes.map((v) => ({
    voterId: v.voterId,
    votedFor: v.votedFor,
  }));

  // 4-5-6. Oyun bitdimi yoxla
  const remainingImposters = room.game.imposters.filter(
    (id) => !room.game.eliminated.includes(id)
  );
  const remainingCitizens = room.players.filter(
    (p) =>
      !room.game.imposters.includes(p.userId) &&
      !room.game.eliminated.includes(p.userId)
  );

  let gameOver = false;
  let winners = null;

  // 4. Hamı imposter tapılıb → VƏTƏNDAŞLAR QAZANDI
  if (remainingImposters.length === 0) {
    gameOver = true;
    winners = "citizens";
  }
  // 5. Qalan vətəndaş <= imposter → İMPOSTER QAZANDI
  else if (remainingImposters.length >= remainingCitizens.length) {
    gameOver = true;
    winners = "imposters";
  }

  console.log(`[vote-result] room ${roomCode}: eliminated=${eliminatedId || "nobody"}, wasImposter=${wasImposter}, gameOver=${gameOver}, winners=${winners}`);

  // Nəticə göndər
  io.to(roomCode).emit("vote:result", {
    eliminatedId,
    wasImposter,
    voteBreakdown,
    voteDetails,
    gameOver,
  });

  if (gameOver) {
    room.status = "finished";
    saveRooms();

    // XP paylanması
    const xpDistribution = room.players.map((p) => {
      const isImposter = room.game.imposters.includes(p.userId);
      const isEliminated = room.game.eliminated.includes(p.userId);
      // BUG-002 fix: socketId null olan player həmişə disconnected sayılır
      const isDisconnected = !p.socketId || !io.sockets.sockets.get(p.socketId);

      // Tərk edən → 0 XP
      if (isDisconnected) {
        return { userId: p.userId, displayName: p.displayName, xp: 0, breakdown: ["Tərk etdi"] };
      }

      let xp = 8;
      const breakdown = [];

      // Qələbə +25
      if (winners === "citizens" && !isImposter) {
        xp = 25;
        breakdown.push("Qələbə +25");
      } else if (winners === "imposters" && isImposter) {
        xp = 25;
        breakdown.push("Qələbə +25");
      } else {
        breakdown.push("Məğlubiyyət +8");
      }

      // Bonus: imposter-i düzgün tapma +5
      if (eliminatedId && wasImposter) {
        const vote = votes.find((v) => v.voterId === p.userId);
        if (vote && vote.votedFor === eliminatedId) {
          xp += 5;
          breakdown.push("İmposter tapma +5");
        }
      }

      // Bonus: imposter olaraq sağ qalma +10
      if (isImposter && !isEliminated && winners === "imposters") {
        xp += 10;
        breakdown.push("Sağ qalma +10");
      }

      // Accumulate stats for guests right in the room.players memory
      const roomPlayer = room.players.find((rp) => rp.userId === p.userId);
      if (roomPlayer) {
        roomPlayer.xp = (roomPlayer.xp || 0) + xp;
        if (!roomPlayer.stats) {
          roomPlayer.stats = { totalGames: 0, wins: 0, imposterGames: 0, imposterWins: 0 };
        }
        roomPlayer.stats.totalGames += 1;
        const playerIsWinner = (winners === "citizens" && !isImposter) || (winners === "imposters" && isImposter);
        
        if (playerIsWinner) {
          roomPlayer.stats.wins += 1;
        }
        if (isImposter) {
          roomPlayer.stats.imposterGames += 1;
          if (playerIsWinner) roomPlayer.stats.imposterWins += 1;
        }
      }

      return { userId: p.userId, displayName: p.displayName, xp, breakdown };
    });

    // Capture game data BEFORE cleanup (room.game will be nulled)
    const gameEndPayload = {
      winners,
      imposters: room.game.imposters,
      word: room.game.word,
      voteBreakdown,
      voteDetails,
      xpDistribution,
      allClues: room.game.rounds.flatMap((r) => r.clues),
    };

    // DB əməliyyatları — hər ikisi tamamlanana qədər gözlə, uğursuzluqları log et
    const impostersSnapshot = [...room.game.imposters];
    Promise.allSettled([
      saveGameToDB(room, winners, xpDistribution, eliminatedId, wasImposter, voteBreakdown, voteDetails),
      updatePlayerXP(xpDistribution, winners, impostersSnapshot),
    ]).then((results) => {
      if (results[0].status === "rejected") {
        console.error("[saveGame] Failed to save game to DB:", results[0].reason?.message);
      }
      if (results[1].status === "rejected") {
        console.error("[xp-update] Failed to update player XP:", results[1].reason?.message);
      }
    });

    // Cleanup game state (schedules room.game = null after delay)
    // Mutex flags cleared AFTER cleanupGameState so no new handlers can enter
    // during the 3s window before room.game is nulled
    cleanupGameState(room);

    // room.game still exists here (nulled after GAME_END_DELAY_MS by cleanupGameState)
    // Clear mutexes now — room.status="finished" blocks new vote/clue handlers anyway
    if (room.game) {
      room.game._voteProcessing = false;
      room.game._roundProcessing = false;
    }

    setTimeout(() => {
      io.to(roomCode).emit("game:end", gameEndPayload);
    }, GAME_END_DELAY_MS);
  } else {
    // Oyun davam edir — yeni raund dövrü başlayır
    room.status = "playing";
    room.game.votes = [];

    // Yeni raund əlavə et və currentRound-u DÜZGÜN set et
    const nextRoundNumber = room.game.rounds.length + 1;
    room.game.rounds.push({ roundNumber: nextRoundNumber, clues: [] });
    room.game.currentRound = nextRoundNumber; // push-dan SONRA set et

    // Davam raundları üçün rounds limitini yenilə
    // (belə ki handleRoundEnd düzgün işləsin)
    room.game._continuationRoundStart = nextRoundNumber;

    // Clear _voteProcessing now — voting is done
    room.game._voteProcessing = false;
    // Keep _roundProcessing = true until the new round actually starts,
    // so any stray handleRoundEnd calls during the 2s delay are blocked
    setTimeout(() => {
      const freshRoom = rooms.get(roomCode);
      if (!freshRoom || !freshRoom.game) return;
      io.to(roomCode).emit("round:start", freshRoom.game.currentRound);
      startRoundTimer(io, roomCode, freshRoom);
      freshRoom.game._roundProcessing = false;
    }, ROUND_TRANSITION_DELAY_MS);
  }

  if (gameOver) {
    // gameOver path: mutexes cleared by cleanupGameState
  }
}

// ============== EXPORTS ==============
module.exports = {
  setupGameHandlers,
  calculateLevelFromXP,
  updatePlayerXP,
  saveGameToDB,
  cleanupGameState,
  startVotingPhase,
  // Internal functions exported for testing
  startRoundTimer,
  handleRoundEnd,
  startVoteTimer,
  handleVoteResult,
  // Constants for testing
  CONSTANTS: {
    LEVEL_THRESHOLDS,
    ROUND_TIMER_MS,
    VOTE_TIMER_MS,
    MAX_USED_WORDS,
  },
  // Test hooks
  __TEST_ONLY__: {
    // State manipulation for tests
    getRooms: () => require("./rooms").rooms,
    setRooms: (newRooms) => {
      const { rooms } = require("./rooms");
      rooms.clear();
      for (const [k, v] of newRooms.entries()) rooms.set(k, v);
    },
    resetGameState: (roomCode) => {
      const { rooms } = require("./rooms");
      const room = rooms.get(roomCode);
      if (room && room.game) {
        if (room.game.roundTimer) clearTimeout(room.game.roundTimer);
        if (room.game.voteTimer) clearTimeout(room.game.voteTimer);
        if (room.game.discussionTimer) clearInterval(room.game.discussionTimer);
        room.game = null;
      }
    },
  },
};
