// ============== WORD DATABASE LOADER ==============

/**
 * Load and validate word database from JSON file
 */
function loadWordDatabase() {
  let wordData;
  try {
    wordData = require("./words.json");
  } catch (err) {
    console.error("[wordLoader] Failed to load words.json:", err.message);
    throw new Error("words.json not found or invalid JSON");
  }
  
  // Validate structure
  if (!wordData) {
    throw new Error("words.json is empty or null");
  }
  
  if (!wordData.words || typeof wordData.words !== "object") {
    throw new Error("words.json missing 'words' data");
  }
  
  if (!Array.isArray(wordData.categories)) {
    throw new Error("words.json missing 'categories' array");
  }
  
  return wordData;
}

// Load database at module start
const wordData = loadWordDatabase();
const wordsByCategory = wordData.words;
const categories = wordData.categories;

// ============== CONSTANTS ==============
const MAX_USED_WORDS_CACHE = 50;

// ============== WORD SELECTION ==============
/**
 * Select random word from category, excluding used words
 * Uses Set for O(1) lookup performance
 */
function getRandomWord(categoryId, usedWords = []) {
  // Support multiple categories: "yemekler,heyvanlar,olkeler"
  const catIds = categoryId.includes(",")
    ? categoryId.split(",").filter(Boolean)
    : [categoryId];

  // Merge words from all selected categories
  let allWords = [];
  for (const cid of catIds) {
    const words = wordsByCategory[cid];
    if (words && words.length > 0) {
      allWords = allWords.concat(words.map((w) => ({ ...w, _category: cid })));
    }
  }

  // Fallback if no words found — avoid infinite recursion if yemekler also has no words
  if (allWords.length === 0) {
    if (categoryId === "yemekler") {
      console.error("[getRandomWord] No words found in fallback category 'yemekler'");
      return null;
    }
    console.warn("[getRandomWord] No words found for categories:", catIds, "falling back to yemekler");
    return getRandomWord("yemekler", usedWords);
  }

  // Use Set for O(1) lookup instead of Array.includes() O(n)
  const usedSet = new Set(usedWords);
  let available = allWords.filter((w) => !usedSet.has(w.az));

  // Reset if all words used
  if (available.length === 0) {
    console.log(`[getRandomWord] All words used for ${categoryId}, resetting`);
    available = allWords;
  }

  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
}

/**
 * Get category name by ID
 */
function getCategoryName(categoryId) {
  const cat = categories.find((c) => c.id === categoryId);
  return cat ? cat.nameAz : categoryId;
}

/**
 * Get list of available categories
 */
function getCategories() {
  return categories.map((c) => ({
    id: c.id,
    nameAz: c.nameAz,
    nameEn: c.nameEn,
  }));
}

/**
 * Validate if category exists
 */
function categoryExists(categoryId) {
  return categories.some((c) => c.id === categoryId);
}

// ============== EXPORTS ==============
module.exports = {
  getRandomWord,
  getCategoryName,
  getCategories,
  categoryExists,
  categories,
  wordsByCategory,
  loadWordDatabase,
  CONSTANTS: {
    MAX_USED_WORDS_CACHE,
  },
  // Test hooks
  __TEST_ONLY__: {
    // Allow injecting custom word data for testing
    setWordData: (customData) => {
      if (customData && customData.words && customData.categories) {
        // Override for testing
        const originalCategories = [...categories];
        const originalWords = { ...wordsByCategory };
        
        // Clear and repopulate
        categories.length = 0;
        for (const cat of customData.categories) {
          categories.push(cat);
        }
        
        // For wordsByCategory, we need to modify the object in place
        Object.keys(wordsByCategory).forEach(key => delete wordsByCategory[key]);
        for (const [key, value] of Object.entries(customData.words)) {
          wordsByCategory[key] = value;
        }
        
        // Return restore function
        return () => {
          categories.length = 0;
          for (const cat of originalCategories) {
            categories.push(cat);
          }
          Object.keys(wordsByCategory).forEach(key => delete wordsByCategory[key]);
          for (const [key, value] of Object.entries(originalWords)) {
            wordsByCategory[key] = value;
          }
        };
      }
    },
    resetWordData: () => {
      // Reload original data
      const freshData = loadWordDatabase();
      categories.length = 0;
      for (const cat of freshData.categories) {
        categories.push(cat);
      }
      Object.keys(wordsByCategory).forEach(key => delete wordsByCategory[key]);
      for (const [key, value] of Object.entries(freshData.words)) {
        wordsByCategory[key] = value;
      }
    },
  },
};
