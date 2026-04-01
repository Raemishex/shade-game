export interface BadgeDefinition {
  id: string;
  nameAz: string;
  nameEn: string;
  icon: string;
  color: string;
  condition: (stats: PlayerStats) => boolean;
  description: string;
}

export interface PlayerStats {
  totalGames: number;
  wins: number;
  imposterGames: number;
  imposterWins: number;
  correctDetections: number;   // imposter-i düzgün tapma sayı
  consecutiveWins: number;     // ardıcıl qələbə
  consecutiveDetections: number; // ardıcıl imposter tapma
  uniqueOpponents: number;     // fərqli oyunçu sayı
  fastestClue: number;         // ən sürətli ipucu (saniyə)
  playedAfterMidnight: boolean;
  categoryGames: Record<string, number>; // kateqoriya başına oyun sayı
  level: number;
  fs5Active: boolean;
}

// Sadə stats üçün uyğunluq (köhnə interfeys ilə)
export interface SimplePlayerStats {
  totalGames: number;
  wins: number;
  imposterGames: number;
  imposterWins: number;
  level: number;
  fs5Active: boolean;
}

function toFullStats(s: SimplePlayerStats | PlayerStats): PlayerStats {
  return {
    totalGames: s.totalGames,
    wins: s.wins,
    imposterGames: s.imposterGames,
    imposterWins: s.imposterWins,
    correctDetections: "correctDetections" in s ? s.correctDetections : 0,
    consecutiveWins: "consecutiveWins" in s ? s.consecutiveWins : 0,
    consecutiveDetections: "consecutiveDetections" in s ? s.consecutiveDetections : 0,
    uniqueOpponents: "uniqueOpponents" in s ? s.uniqueOpponents : 0,
    fastestClue: "fastestClue" in s ? s.fastestClue : Infinity,
    playedAfterMidnight: "playedAfterMidnight" in s ? s.playedAfterMidnight : false,
    categoryGames: "categoryGames" in s ? s.categoryGames : {},
    level: s.level,
    fs5Active: s.fs5Active,
  };
}

export const BADGES: BadgeDefinition[] = [
  // İlk oyun
  {
    id: "first_game",
    nameAz: "İlk Oyun",
    nameEn: "First Game",
    icon: "star",
    color: "#B8D4A8",
    condition: (s) => s.totalGames >= 1,
    description: "İlk oyununu oyna",
  },
  // Detektiv
  {
    id: "detective",
    nameAz: "Detektiv",
    nameEn: "Detective",
    icon: "eye",
    color: "#A8C4E0",
    condition: (s) => s.correctDetections >= 10,
    description: "İmposter-i 10 dəfə düzgün tap",
  },
  // 100 Oyun
  {
    id: "hundred_games",
    nameAz: "100 Oyun",
    nameEn: "100 Games",
    icon: "check",
    color: "#C8A44E",
    condition: (s) => s.totalGames >= 100,
    description: "100 oyun oyna",
  },
  // Usta Bləfçi
  {
    id: "master_bluffer",
    nameAz: "Usta Bləfçi",
    nameEn: "Master Bluffer",
    icon: "flame",
    color: "#E8593C",
    condition: (s) => s.imposterWins >= 10,
    description: "İmposter olaraq 10 dəfə qazan",
  },
  // Göz Kimi
  {
    id: "eagle_eye",
    nameAz: "Göz Kimi",
    nameEn: "Eagle Eye",
    icon: "eye",
    color: "#B8D4A8",
    condition: (s) => s.consecutiveDetections >= 5,
    description: "5 oyun ardıcıl imposter-i tap",
  },
  // 5 Ardıcıl
  {
    id: "five_streak",
    nameAz: "5 Ardıcıl",
    nameEn: "5 Streak",
    icon: "lightning",
    color: "#C8A44E",
    condition: (s) => s.consecutiveWins >= 5,
    description: "5 ardıcıl qələbə qazan",
  },
  // 10 Ardıcıl
  {
    id: "ten_streak",
    nameAz: "10 Ardıcıl",
    nameEn: "10 Streak",
    icon: "lightning",
    color: "#E8593C",
    condition: (s) => s.consecutiveWins >= 10,
    description: "10 ardıcıl qələbə qazan",
  },
  // Kateqoriya Ustası
  {
    id: "category_master",
    nameAz: "Kateqoriya Ustası",
    nameEn: "Category Master",
    icon: "trophy",
    color: "#C8A44E",
    condition: (s) => Object.values(s.categoryGames).some((count) => count >= 50),
    description: "Bir kateqoriyada 50 oyun oyna",
  },
  // Sosial Kəpənək
  {
    id: "social_butterfly",
    nameAz: "Sosial Kəpənək",
    nameEn: "Social Butterfly",
    icon: "people",
    color: "#9B8EC4",
    condition: (s) => s.uniqueOpponents >= 20,
    description: "20 fərqli oyunçu ilə oyna",
  },
  // Gecə Quşu
  {
    id: "night_owl",
    nameAz: "Gecə Quşu",
    nameEn: "Night Owl",
    icon: "moon",
    color: "#7ECEC1",
    condition: (s) => s.playedAfterMidnight,
    description: "Gecə 00:00-dan sonra oyna",
  },
  // Sürət Şeytanı
  {
    id: "speed_demon",
    nameAz: "Sürət Şeytanı",
    nameEn: "Speed Demon",
    icon: "lightning",
    color: "#F0997B",
    condition: (s) => s.fastestClue <= 3,
    description: "İpucunu 3 saniyədən az müddətdə ver",
  },
  // FS5 Üzvü
  {
    id: "fs5_member",
    nameAz: "FS5 Üzvü",
    nameEn: "FS5 Member",
    icon: "crown",
    color: "#F0997B",
    condition: (s) => s.fs5Active,
    description: "FS5 modunu aktivləşdir",
  },
];

/**
 * Oyunçunun açılmış badge-lərini hesabla
 */
export function getUnlockedBadges(stats: SimplePlayerStats | PlayerStats): string[] {
  const full = toFullStats(stats);
  return BADGES.filter((b) => b.condition(full)).map((b) => b.id);
}

/**
 * Badge ID-yə görə definition tap
 */
export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGES.find((b) => b.id === id);
}

/**
 * Oyun bitdikdən sonra yeni qazanılan badge-ləri yoxla
 * @returns yeni açılmış badge-lərin ID-ləri
 */
export function checkBadges(
  previousBadges: string[],
  currentStats: SimplePlayerStats | PlayerStats
): string[] {
  const allUnlocked = getUnlockedBadges(currentStats);
  return allUnlocked.filter((id) => !previousBadges.includes(id));
}
