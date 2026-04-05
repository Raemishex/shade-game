/**
 * game.js — Unit Tests
 * Oyun məntiqinin kritik hissələrini yoxlayır:
 * - XP hesablama
 * - Raund tracking (BUG 1 fix doğrulaması)
 * - Səsvermə nəticəsi
 * - Oyun state cleanup
 */
const {
  calculateLevelFromXP,
  handleVoteResult,
  handleRoundEnd,
  cleanupGameState,
  CONSTANTS,
} = require("../server/game");

const { rooms, cleanup: roomsCleanup, __TEST_ONLY__: roomTestUtils } = require("../server/rooms");

// Hər testdən əvvəl state təmizlə + fake timers istifadə et
beforeEach(() => {
  jest.useFakeTimers();
  roomTestUtils.resetAllState();
});

afterEach(() => {
  // Bütün pending timer-ları sürüb təmizlə
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  roomTestUtils.resetAllState();
});

afterAll(() => {
  roomTestUtils.resetAllState();
  roomsCleanup();
});

// ============== Mock IO ==============
function createMockIO() {
  const emittedEvents = [];
  const roomEvents = [];

  const mockIo = {
    to: (roomCode) => ({
      emit: (event, data) => {
        roomEvents.push({ roomCode, event, data });
      },
    }),
    sockets: {
      sockets: new Map(),
    },
  };

  return { io: mockIo, roomEvents };
}

// ============== Helper: create test room ==============
function createTestRoom(code, playerCount = 4, settings = {}) {
  const players = [];
  for (let i = 0; i < playerCount; i++) {
    players.push({
      userId: `player_${i}`,
      displayName: `Player ${i}`,
      avatarColor: "#C8A44E",
      socketId: `socket_${i}`,
      isReady: true,
    });
  }

  const room = {
    code,
    hostId: "player_0",
    players,
    settings: {
      category: "yemekler",
      rounds: 2,
      discussionTime: 60,
      imposterHint: true,
      imposterCount: 0,
      ...settings,
    },
    status: "playing",
    usedWords: [],
    createdAt: Date.now(),
    game: {
      word: "plov",
      category: "yemekler",
      imposters: ["player_0"],
      rounds: [],
      currentRound: 0,
      votes: [],
      eliminated: [],
      startedAt: Date.now(),
      _roundProcessing: false,
      _voteProcessing: false,
    },
  };

  rooms.set(code, room);
  return room;
}

describe("game", () => {
  // ============== XP Calculation ==============
  describe("calculateLevelFromXP", () => {
    test("0 XP = level 1", () => {
      expect(calculateLevelFromXP(0)).toBe(1);
    });

    test("100 XP = level 2", () => {
      expect(calculateLevelFromXP(100)).toBe(2);
    });

    test("250 XP = level 3", () => {
      expect(calculateLevelFromXP(250)).toBe(3);
    });

    test("99 XP = hələ level 1", () => {
      expect(calculateLevelFromXP(99)).toBe(1);
    });

    test("4000+ XP yüksək level", () => {
      const level = calculateLevelFromXP(4000);
      expect(level).toBeGreaterThanOrEqual(10);
    });

    test("level monoton artan olmalıdır", () => {
      let prevLevel = 0;
      for (let xp = 0; xp <= 10000; xp += 100) {
        const level = calculateLevelFromXP(xp);
        expect(level).toBeGreaterThanOrEqual(prevLevel);
        prevLevel = level;
      }
    });
  });

  // ============== Vote Result Logic ==============
  describe("handleVoteResult — səs sayma", () => {
    test("ən çox səs alan çıxarılır", () => {
      const room = createTestRoom("VOTE1", 4);
      const { io, roomEvents } = createMockIO();

      room.game.currentRound = 2;
      room.game.rounds = [
        { roundNumber: 1, clues: [] },
        { roundNumber: 2, clues: [] },
      ];
      room.status = "voting";

      // player_0 (imposter) 3 səs alır
      room.game.votes = [
        { voterId: "player_1", votedFor: "player_0" },
        { voterId: "player_2", votedFor: "player_0" },
        { voterId: "player_3", votedFor: "player_0" },
        { voterId: "player_0", votedFor: "player_1" },
      ];

      handleVoteResult(io, "VOTE1", room);

      // vote:result emitted olmalıdır
      const voteResultEvent = roomEvents.find((e) => e.event === "vote:result");
      expect(voteResultEvent).toBeDefined();
      expect(voteResultEvent.data.eliminatedId).toBe("player_0");
      expect(voteResultEvent.data.wasImposter).toBe(true);
      expect(voteResultEvent.data.gameOver).toBe(true);
    });

    test("bərabərlik halında heç kim çıxarılmır", () => {
      const room = createTestRoom("VOTE2", 4);
      const { io, roomEvents } = createMockIO();

      room.game.currentRound = 2;
      room.game.rounds = [
        { roundNumber: 1, clues: [] },
        { roundNumber: 2, clues: [] },
      ];
      room.status = "voting";

      // 2-2 bərabərlik
      room.game.votes = [
        { voterId: "player_0", votedFor: "player_1" },
        { voterId: "player_1", votedFor: "player_0" },
        { voterId: "player_2", votedFor: "player_1" },
        { voterId: "player_3", votedFor: "player_0" },
      ];

      handleVoteResult(io, "VOTE2", room);

      const voteResultEvent = roomEvents.find((e) => e.event === "vote:result");
      expect(voteResultEvent).toBeDefined();
      expect(voteResultEvent.data.eliminatedId).toBeNull();
      expect(voteResultEvent.data.gameOver).toBe(false);
    });

    test("vətəndaş çıxarılarsa oyun davam edir", () => {
      const room = createTestRoom("VOTE3", 4);
      const { io, roomEvents } = createMockIO();

      room.game.currentRound = 2;
      room.game.rounds = [
        { roundNumber: 1, clues: [] },
        { roundNumber: 2, clues: [] },
      ];
      room.status = "voting";

      // player_1 (vətəndaş) çıxarılır
      room.game.votes = [
        { voterId: "player_0", votedFor: "player_1" },
        { voterId: "player_2", votedFor: "player_1" },
        { voterId: "player_3", votedFor: "player_1" },
        { voterId: "player_1", votedFor: "player_0" },
      ];

      handleVoteResult(io, "VOTE3", room);

      const voteResultEvent = roomEvents.find((e) => e.event === "vote:result");
      expect(voteResultEvent).toBeDefined();
      expect(voteResultEvent.data.eliminatedId).toBe("player_1");
      expect(voteResultEvent.data.wasImposter).toBe(false);
      // 3 oyunçu qalır: 1 imposter + 2 vətəndaş → oyun davam edir
      expect(voteResultEvent.data.gameOver).toBe(false);
    });

    test("imposter sayı >= vətəndaş sayı → imposter qazanır", () => {
      const room = createTestRoom("VOTE4", 3);
      const { io, roomEvents } = createMockIO();

      room.game.imposters = ["player_0"];
      room.game.eliminated = ["player_2"]; // artıq 1 vətəndaş çıxarılıb
      room.game.currentRound = 2;
      room.game.rounds = [
        { roundNumber: 1, clues: [] },
        { roundNumber: 2, clues: [] },
      ];
      room.status = "voting";

      // skip vote — heç kim çıxarılmır
      room.game.votes = [
        { voterId: "player_0", votedFor: null },
        { voterId: "player_1", votedFor: null },
      ];

      handleVoteResult(io, "VOTE4", room);

      const voteResultEvent = roomEvents.find((e) => e.event === "vote:result");
      expect(voteResultEvent).toBeDefined();
      // 1 imposter vs 1 vətəndaş → imposter qazanır
      expect(voteResultEvent.data.gameOver).toBe(true);
    });
  });

  // ============== BUG 1 FIX: currentRound tracking ==============
  describe("BUG 1 Fix — currentRound post-vote tracking", () => {
    test("oyun davam edəndə currentRound düzgün artır", () => {
      const room = createTestRoom("BUG1A", 4);
      const { io } = createMockIO();

      room.game.currentRound = 2;
      room.game.rounds = [
        { roundNumber: 1, clues: [{ userId: "player_0", clue: "a" }] },
        { roundNumber: 2, clues: [{ userId: "player_0", clue: "b" }] },
      ];
      room.status = "voting";

      // Vətəndaş çıxarılır, oyun davam edir
      room.game.votes = [
        { voterId: "player_0", votedFor: "player_1" },
        { voterId: "player_2", votedFor: "player_1" },
        { voterId: "player_3", votedFor: "player_1" },
        { voterId: "player_1", votedFor: "player_0" },
      ];

      handleVoteResult(io, "BUG1A", room);

      // Yeni raund əlavə olunmalıdır
      expect(room.game.rounds.length).toBe(3);
      // currentRound yeni raundun nömrəsi olmalıdır
      expect(room.game.currentRound).toBe(3);
      // continuationRoundStart set olunmalıdır
      expect(room.game._continuationRoundStart).toBe(3);
    });

    test("ipucu düzgün raunda yazılır (köhnə raunda yox)", () => {
      const room = createTestRoom("BUG1B", 4);
      const { io } = createMockIO();

      room.game.currentRound = 2;
      room.game.rounds = [
        { roundNumber: 1, clues: [{ userId: "player_0", clue: "a" }] },
        { roundNumber: 2, clues: [{ userId: "player_0", clue: "b" }] },
      ];
      room.status = "voting";

      room.game.votes = [
        { voterId: "player_0", votedFor: "player_1" },
        { voterId: "player_2", votedFor: "player_1" },
        { voterId: "player_3", votedFor: "player_1" },
        { voterId: "player_1", votedFor: "player_0" },
      ];

      handleVoteResult(io, "BUG1B", room);

      // Yeni raundun array-ini yoxla
      const newRound = room.game.rounds[room.game.currentRound - 1];
      expect(newRound).toBeDefined();
      expect(newRound.roundNumber).toBe(3);
      expect(newRound.clues).toEqual([]); // boş olmalıdır

      // Köhnə raund dəyişməməlidir
      expect(room.game.rounds[1].clues.length).toBe(1);
    });
  });

  // ============== Round End Logic ==============
  describe("handleRoundEnd", () => {
    test("son raundda səsvermə başlayır", () => {
      const room = createTestRoom("REND1", 4, { rounds: 2 });
      const { io, roomEvents } = createMockIO();

      room.game.currentRound = 2;
      room.game.rounds = [
        { roundNumber: 1, clues: [] },
        { roundNumber: 2, clues: [] },
      ];

      handleRoundEnd(io, "REND1", room);

      // Müzakirə fazası 60s olduğu üçün discussion:start gözləyirik
      const discussionEvent = roomEvents.find((e) => e.event === "discussion:start");
      expect(discussionEvent).toBeDefined();
      expect(discussionEvent.data).toBe(60);
      // Status otaqda change olunur
    });

    test("son raund deyilsə növbəti raund başlayır", () => {
      const room = createTestRoom("REND2", 4, { rounds: 3 });
      const { io, roomEvents } = createMockIO();

      room.game.currentRound = 1;
      room.game.rounds = [{ roundNumber: 1, clues: [] }];

      handleRoundEnd(io, "REND2", room);

      // round:end emitted
      const roundEndEvent = roomEvents.find((e) => e.event === "round:end");
      expect(roundEndEvent).toBeDefined();

      // Növbəti raund əlavə olunub
      expect(room.game.currentRound).toBe(2);
      expect(room.game.rounds.length).toBe(2);

      // setTimeout-u irəli sür
      jest.advanceTimersByTime(3000);
      expect(room.game._roundProcessing).toBe(false);

    });

    test("davam raundunda 1 raunddan sonra səsvermə başlayır", () => {
      const room = createTestRoom("REND3", 4, { rounds: 2 });
      const { io, roomEvents } = createMockIO();

      // Davam dövrü: round 3
      room.game.currentRound = 3;
      room.game._continuationRoundStart = 3;
      room.game.rounds = [
        { roundNumber: 1, clues: [] },
        { roundNumber: 2, clues: [] },
        { roundNumber: 3, clues: [] },
      ];

      handleRoundEnd(io, "REND3", room);

      // Davam dövrü: currentRound(3) >= maxRoundThisCycle(3) → müzakirə
      const discussionEvent = roomEvents.find((e) => e.event === "discussion:start");
      expect(discussionEvent).toBeDefined();
    });

    test("dublikat çağırışları bloklayır (_roundProcessing)", () => {
      const room = createTestRoom("REND4", 4, { rounds: 2 });
      const { io, roomEvents } = createMockIO();

      room.game.currentRound = 2;
      room.game.rounds = [
        { roundNumber: 1, clues: [] },
        { roundNumber: 2, clues: [] },
      ];

      handleRoundEnd(io, "REND4", room);
      handleRoundEnd(io, "REND4", room); // dublikat

      // Yalnız 1 dəfə discussion:start emit olunmalıdır
      const discussionEvents = roomEvents.filter((e) => e.event === "discussion:start");
      expect(discussionEvents.length).toBe(1);

    });
  });

  // ============== Cleanup ==============
  describe("cleanupGameState", () => {
    test("taymerleri təmizləyir", () => {
      const room = createTestRoom("CLN01", 4);
      room.game.roundTimer = setTimeout(() => {}, 99999);
      room.game.voteTimer = setTimeout(() => {}, 99999);
      room.game.discussionTimer = setInterval(() => {}, 99999);

      cleanupGameState(room);

      expect(room.game.roundTimer).toBeNull();
      expect(room.game.voteTimer).toBeNull();
      expect(room.game.discussionTimer).toBeNull();
    });

    test("usedWords MAX_USED_WORDS-a kəsilir", () => {
      const room = createTestRoom("CLN02", 4);
      room.usedWords = Array.from({ length: 100 }, (_, i) => `word_${i}`);

      cleanupGameState(room);

      expect(room.usedWords.length).toBe(CONSTANTS.MAX_USED_WORDS);
    });

    test("game null olur (delay ilə)", () => {
      const room = createTestRoom("CLN03", 4);
      cleanupGameState(room);

      // Dərhal null olmamalıdır (delay var)
      expect(room.game).not.toBeNull();

      // 3.5 saniyə irəli sür → null olmalıdır
      jest.advanceTimersByTime(3500);
      expect(room.game).toBeNull();
      expect(room.status).toBe("finished");
    });

    test("game artıq null olduqda xəta vermir", () => {
      const room = createTestRoom("CLN04", 4);
      room.game = null;
      expect(() => cleanupGameState(room)).not.toThrow();
    });
  });

  // ============== Win Conditions ==============
  describe("Win conditions", () => {
    test("bütün imposter-lər çıxarılsa vətəndaşlar qazanır", () => {
      const room = createTestRoom("WIN01", 5);
      const { io, roomEvents } = createMockIO();

      room.game.imposters = ["player_0", "player_1"];
      room.game.eliminated = ["player_0"]; // 1 imposter artıq çıxarılıb
      room.game.currentRound = 2;
      room.game.rounds = [
        { roundNumber: 1, clues: [] },
        { roundNumber: 2, clues: [] },
      ];
      room.status = "voting";

      // player_1 (son imposter) çıxarılır
      room.game.votes = [
        { voterId: "player_2", votedFor: "player_1" },
        { voterId: "player_3", votedFor: "player_1" },
        { voterId: "player_4", votedFor: "player_1" },
        { voterId: "player_1", votedFor: "player_2" },
      ];

      handleVoteResult(io, "WIN01", room);

      const voteResultEvent = roomEvents.find((e) => e.event === "vote:result");
      expect(voteResultEvent.data.gameOver).toBe(true);

      // game:end 3s sonra göndərilir, amma burada XP-i yoxlayaq
      const gameEndEvent = roomEvents.find((e) => e.event === "vote:result");
      expect(gameEndEvent.data.wasImposter).toBe(true);
    });

    test("null vote ilə imposter qazanır (3 oyunçu, 1 imposter, 1 eliminated)", () => {
      const room = createTestRoom("WIN02", 3);
      const { io, roomEvents } = createMockIO();

      room.game.imposters = ["player_0"];
      room.game.eliminated = ["player_2"];
      room.game.currentRound = 2;
      room.game.rounds = [
        { roundNumber: 1, clues: [] },
        { roundNumber: 2, clues: [] },
      ];
      room.status = "voting";

      // Hər ikisi skip edir
      room.game.votes = [
        { voterId: "player_0", votedFor: null },
        { voterId: "player_1", votedFor: null },
      ];

      handleVoteResult(io, "WIN02", room);

      const voteResultEvent = roomEvents.find((e) => e.event === "vote:result");
      // 1 imposter vs 1 vətəndaş → imposter qazanır
      expect(voteResultEvent.data.gameOver).toBe(true);
    });
  });
});
