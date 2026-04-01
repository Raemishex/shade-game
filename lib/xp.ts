/**
 * SHADE — XP / Səviyyə Sistemi
 */

// Səviyyə cədvəli: hər səviyyənin başlanğıc XP-si
const LEVEL_THRESHOLDS: number[] = [
  0,    // LVL 1
  100,  // LVL 2
  250,  // LVL 3
  500,  // LVL 4
  800,  // LVL 5
  1200, // LVL 6
  1700, // LVL 7
  2300, // LVL 8
  3000, // LVL 9
  4000, // LVL 10
  // LVL 10+ : hər level +1200 XP
];

// XP qaydaları
export const XP_RULES = {
  WIN: 25,
  LOSS: 8,
  CORRECT_VOTE: 5,        // imposter-i düzgün tapma
  IMPOSTER_SURVIVE: 10,   // imposter olaraq sağ qalma
  DAILY_CHALLENGE: 15,    // günlük challenge tamamlama
  STREAK_BONUS: 10,       // 3 ardıcıl qələbə streak
} as const;

export interface GameXPInput {
  role: "citizen" | "imposter";
  isWinner: boolean;
  correctVote?: boolean;       // vətəndaş: imposter-i düzgün səs verdi?
  imposterSurvived?: boolean;  // imposter: sağ qaldı?
  isDailyChallenge?: boolean;
  streakCount?: number;        // ardıcıl qələbə sayı
}

export interface XPBreakdown {
  base: number;
  correctVote: number;
  imposterSurvive: number;
  dailyChallenge: number;
  streakBonus: number;
  total: number;
}

/**
 * Oyun XP-sini hesabla
 */
export function calculateGameXP(input: GameXPInput): XPBreakdown {
  const breakdown: XPBreakdown = {
    base: 0,
    correctVote: 0,
    imposterSurvive: 0,
    dailyChallenge: 0,
    streakBonus: 0,
    total: 0,
  };

  // Base XP
  breakdown.base = input.isWinner ? XP_RULES.WIN : XP_RULES.LOSS;

  // Vətəndaş düzgün səs verdisə
  if (input.correctVote) {
    breakdown.correctVote = XP_RULES.CORRECT_VOTE;
  }

  // İmposter sağ qaldısa
  if (input.imposterSurvived) {
    breakdown.imposterSurvive = XP_RULES.IMPOSTER_SURVIVE;
  }

  // Günlük challenge
  if (input.isDailyChallenge) {
    breakdown.dailyChallenge = XP_RULES.DAILY_CHALLENGE;
  }

  // Streak bonus (3+ ardıcıl qələbə)
  if (input.isWinner && input.streakCount && input.streakCount >= 3) {
    breakdown.streakBonus = XP_RULES.STREAK_BONUS;
  }

  breakdown.total =
    breakdown.base +
    breakdown.correctVote +
    breakdown.imposterSurvive +
    breakdown.dailyChallenge +
    breakdown.streakBonus;

  return breakdown;
}

/**
 * Verilən XP-yə görə hansı səviyyə
 */
function getThresholdForLevel(level: number): number {
  if (level <= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[level - 1];
  }
  // LVL 10+: hər level +1200
  const extraLevels = level - LEVEL_THRESHOLDS.length;
  return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + extraLevels * 1200;
}

export function calculateLevel(totalXP: number): number {
  let level = 1;
  while (true) {
    const nextThreshold = getThresholdForLevel(level + 1);
    if (totalXP < nextThreshold) break;
    level++;
  }
  return level;
}

export interface LevelProgress {
  currentLevel: number;
  xpInLevel: number;
  xpNeeded: number;
  progress: number; // 0-100
}

/**
 * Səviyyə proqresini hesabla
 */
export function getLevelProgress(totalXP: number): LevelProgress {
  const currentLevel = calculateLevel(totalXP);
  const currentThreshold = getThresholdForLevel(currentLevel);
  const nextThreshold = getThresholdForLevel(currentLevel + 1);

  const xpInLevel = totalXP - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const progress = xpNeeded > 0 ? Math.min(Math.round((xpInLevel / xpNeeded) * 100), 100) : 0;

  return {
    currentLevel,
    xpInLevel,
    xpNeeded,
    progress,
  };
}
