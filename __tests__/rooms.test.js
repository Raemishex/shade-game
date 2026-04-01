/**
 * rooms.js — Unit Tests
 * Otaq yaratma, qoşulma, ayarlar, təmizlik məntiqini yoxlayır
 */
const {
  rooms,
  generateRoomCode,
  generateUniqueRoomCode,
  validateSettings,
  sanitizeString,
  cleanupStaleRooms,
  cleanup: roomsCleanup,
  CONSTANTS,
  __TEST_ONLY__,
} = require("../server/rooms");

// Hər testdən əvvəl state təmizlə
beforeEach(() => {
  __TEST_ONLY__.resetAllState();
});

afterAll(() => {
  __TEST_ONLY__.resetAllState();
  roomsCleanup();
});

describe("rooms", () => {
  // ============== Room Code Generation ==============
  describe("generateRoomCode", () => {
    test("6 simvollu kod yaradır", () => {
      const code = generateRoomCode();
      expect(code).toHaveLength(CONSTANTS.ROOM_CODE_LENGTH);
    });

    test("yalnız icazə verilmiş simvollardan ibarətdir", () => {
      for (let i = 0; i < 100; i++) {
        const code = generateRoomCode();
        for (const char of code) {
          expect(CONSTANTS.ROOM_CODE_CHARS).toContain(char);
        }
      }
    });

    test("qarışıq simvollar (0,O,1,I,L) istifadə olunmur", () => {
      const forbidden = "0O1IL";
      for (let i = 0; i < 200; i++) {
        const code = generateRoomCode();
        for (const char of forbidden) {
          expect(code).not.toContain(char);
        }
      }
    });
  });

  describe("generateUniqueRoomCode", () => {
    test("unikal kod yaradır", () => {
      const code = generateUniqueRoomCode();
      expect(code).toBeDefined();
      expect(code).toHaveLength(CONSTANTS.ROOM_CODE_LENGTH);
    });

    test("mövcud kodla toqquşma olmur", () => {
      // 10 otaq yarat
      for (let i = 0; i < 10; i++) {
        const code = generateUniqueRoomCode();
        rooms.set(code, { code });
      }
      // Yeni kod mövcud kodlardan fərqli olmalıdır
      const newCode = generateUniqueRoomCode();
      expect(rooms.has(newCode)).toBe(false);
    });
  });

  // ============== Input Sanitization ==============
  describe("sanitizeString", () => {
    test("normal string qaytarır", () => {
      expect(sanitizeString("test")).toBe("test");
    });

    test("boşluqları kəsir", () => {
      expect(sanitizeString("  hello  ")).toBe("hello");
    });

    test("maxLength-ə uyğun kəsir", () => {
      expect(sanitizeString("abcdef", 3)).toBe("abc");
    });

    test("NoSQL injection simvollarını bloklayır ($)", () => {
      expect(sanitizeString("$gt")).toBeNull();
    });

    test("NoSQL injection simvollarını bloklayır (.)", () => {
      expect(sanitizeString("admin.password")).toBeNull();
    });

    test("string olmayan dəyər üçün null qaytarır", () => {
      expect(sanitizeString(123)).toBeNull();
      expect(sanitizeString(null)).toBeNull();
      expect(sanitizeString(undefined)).toBeNull();
    });
  });

  // ============== Settings Validation ==============
  describe("validateSettings", () => {
    test("düzgün ayarları qəbul edir", () => {
      const settings = validateSettings({
        category: "yemekler",
        rounds: 3,
        discussionTime: 60,
        imposterHint: true,
        imposterCount: 2,
      });
      expect(settings.category).toBe("yemekler");
      expect(settings.rounds).toBe(3);
      expect(settings.discussionTime).toBe(60);
      expect(settings.imposterHint).toBe(true);
      expect(settings.imposterCount).toBe(2);
    });

    test("rounds 1-5 arasında clamp olunur", () => {
      expect(validateSettings({ rounds: 0 }).rounds).toBe(1);
      expect(validateSettings({ rounds: 10 }).rounds).toBe(5);
      expect(validateSettings({ rounds: -1 }).rounds).toBe(1);
    });

    test("discussionTime yalnız 30, 60, 90 qəbul edir", () => {
      expect(validateSettings({ discussionTime: 30 }).discussionTime).toBe(30);
      expect(validateSettings({ discussionTime: 90 }).discussionTime).toBe(90);
      expect(validateSettings({ discussionTime: 45 }).discussionTime).toBeUndefined();
      expect(validateSettings({ discussionTime: 120 }).discussionTime).toBeUndefined();
    });

    test("imposterCount 0-5 arasında clamp olunur", () => {
      expect(validateSettings({ imposterCount: 0 }).imposterCount).toBe(0);
      expect(validateSettings({ imposterCount: 5 }).imposterCount).toBe(5);
      expect(validateSettings({ imposterCount: 10 }).imposterCount).toBe(5);
      expect(validateSettings({ imposterCount: -1 }).imposterCount).toBe(0);
    });

    test("null/undefined üçün boş obyekt qaytarır", () => {
      expect(validateSettings(null)).toEqual({});
      expect(validateSettings(undefined)).toEqual({});
    });

    test("NoSQL injection olan category bloklayır", () => {
      const settings = validateSettings({ category: "$yemekler" });
      expect(settings.category).toBeUndefined();
    });

    test("yalnış tip olan dəyərləri rədd edir", () => {
      const settings = validateSettings({
        category: 123,
        rounds: "two",
        discussionTime: true,
        imposterHint: "yes",
        imposterCount: "one",
      });
      expect(settings.category).toBeUndefined();
      expect(settings.rounds).toBeUndefined();
      expect(settings.discussionTime).toBeUndefined();
      expect(settings.imposterHint).toBeUndefined();
      expect(settings.imposterCount).toBeUndefined();
    });
  });

  // ============== Room Cleanup ==============
  describe("cleanupStaleRooms", () => {
    test("boş otaqları silir", () => {
      rooms.set("EMPTY1", { code: "EMPTY1", players: [], createdAt: Date.now() });
      expect(rooms.has("EMPTY1")).toBe(true);
      cleanupStaleRooms();
      expect(rooms.has("EMPTY1")).toBe(false);
    });

    test("vaxtı keçmiş otaqları silir", () => {
      const expired = Date.now() - CONSTANTS.ROOM_TTL_MS - 1000;
      rooms.set("OLD01", { code: "OLD01", players: [{ userId: "u1" }], createdAt: expired });
      cleanupStaleRooms();
      expect(rooms.has("OLD01")).toBe(false);
    });

    test("aktiv otaqları saxlayır", () => {
      rooms.set("ACTIV", {
        code: "ACTIV",
        players: [{ userId: "u1" }],
        createdAt: Date.now(),
      });
      cleanupStaleRooms();
      expect(rooms.has("ACTIV")).toBe(true);
    });
  });
});
