/**
 * wordLoader.js — Unit Tests
 * Söz yükləyicisinin düzgün işlədiyini yoxlayır
 */
const {
  getRandomWord,
  getCategoryName,
  getCategories,
  categoryExists,
  wordsByCategory,
  categories,
  __TEST_ONLY__,
} = require("../server/wordLoader");

describe("wordLoader", () => {
  describe("loadWordDatabase", () => {
    test("words.json düzgün yüklənir", () => {
      expect(categories).toBeDefined();
      expect(categories.length).toBeGreaterThan(0);
      expect(Object.keys(wordsByCategory).length).toBeGreaterThan(0);
    });

    test("hər kateqoriyada ən azı 1 söz var", () => {
      for (const cat of categories) {
        const words = wordsByCategory[cat.id];
        expect(words).toBeDefined();
        expect(words.length).toBeGreaterThan(0);
      }
    });

    test("hər sözün 'az' sahəsi var", () => {
      for (const catId of Object.keys(wordsByCategory)) {
        for (const word of wordsByCategory[catId]) {
          expect(word).toHaveProperty("az");
          expect(typeof word.az).toBe("string");
          expect(word.az.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("getRandomWord", () => {
    test("mövcud kateqoriyadan söz qaytarır", () => {
      const word = getRandomWord("yemekler", []);
      expect(word).toBeDefined();
      expect(word).toHaveProperty("az");
    });

    test("istifadə olunmuş sözləri çıxarır", () => {
      const allWords = wordsByCategory["yemekler"].map((w) => w.az);
      // Hamısını çıxar — 1-dən başqa
      const usedAll = allWords.slice(0, -1);
      const word = getRandomWord("yemekler", usedAll);
      expect(word).toBeDefined();
      expect(word.az).toBe(allWords[allWords.length - 1]);
    });

    test("bütün sözlər istifadə olunanda reset olunur", () => {
      const allWords = wordsByCategory["yemekler"].map((w) => w.az);
      const word = getRandomWord("yemekler", allWords);
      expect(word).toBeDefined();
      expect(word).toHaveProperty("az");
    });

    test("olmayan kateqoriya yemekler-ə fallback edir", () => {
      const word = getRandomWord("olmayan_kateqoriya", []);
      expect(word).toBeDefined();
      expect(word).toHaveProperty("az");
    });

    test("çoxlu kateqoriya dəstəkləyir (vergüllə ayrılmış)", () => {
      const word = getRandomWord("yemekler,heyvanlar", []);
      expect(word).toBeDefined();
      expect(word).toHaveProperty("az");
      expect(word).toHaveProperty("_category");
    });
  });

  describe("getCategoryName", () => {
    test("mövcud kateqoriya adını qaytarır", () => {
      const name = getCategoryName("yemekler");
      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
    });

    test("olmayan kateqoriya üçün ID-ni qaytarır", () => {
      const name = getCategoryName("xyzabc");
      expect(name).toBe("xyzabc");
    });
  });

  describe("getCategories", () => {
    test("kateqoriya siyahısı qaytarır", () => {
      const cats = getCategories();
      expect(Array.isArray(cats)).toBe(true);
      expect(cats.length).toBeGreaterThan(0);

      for (const cat of cats) {
        expect(cat).toHaveProperty("id");
        expect(cat).toHaveProperty("nameAz");
        expect(cat).toHaveProperty("nameEn");
      }
    });
  });

  describe("categoryExists", () => {
    test("mövcud kateqoriya üçün true qaytarır", () => {
      expect(categoryExists("yemekler")).toBe(true);
    });

    test("olmayan kateqoriya üçün false qaytarır", () => {
      expect(categoryExists("xyzabc_olmayan")).toBe(false);
    });
  });
});
