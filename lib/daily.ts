// ---------- Gündəlik Challenge Sistemi ----------
// Hər gün avtomatik xüsusi kateqoriya + bonus XP təyin edir

export interface DailyChallenge {
  date: string; // YYYY-MM-DD
  categoryId: string;
  categoryNameAz: string;
  categoryNameEn: string;
  bonusXp: number;
  isCompleted: boolean;
  completedAt?: string;
}

// Mövcud kateqoriyalar (words.json ilə uyğun)
const CATEGORIES: { id: string; nameAz: string; nameEn: string }[] = [
  { id: "yemekler", nameAz: "Yeməklər", nameEn: "Food" },
  { id: "heyvanlar", nameAz: "Heyvanlar", nameEn: "Animals" },
  { id: "olkeler", nameAz: "Ölkələr", nameEn: "Countries" },
  { id: "idman", nameAz: "İdman", nameEn: "Sports" },
  { id: "peseler", nameAz: "Peşələr", nameEn: "Professions" },
  { id: "texnologiya", nameAz: "Texnologiya", nameEn: "Technology" },
  { id: "musiqi", nameAz: "Musiqi", nameEn: "Music" },
  { id: "film", nameAz: "Film və Serial", nameEn: "Film & TV" },
  { id: "tebiet", nameAz: "Təbiət", nameEn: "Nature" },
  { id: "neqliyyat", nameAz: "Nəqliyyat", nameEn: "Transport" },
  { id: "geyim", nameAz: "Geyim və Aksesuar", nameEn: "Clothing" },
  { id: "mekteb", nameAz: "Məktəb və Təhsil", nameEn: "Education" },
  { id: "ev", nameAz: "Ev Əşyaları", nameEn: "Home Items" },
  { id: "saglamliq", nameAz: "Sağlamlıq", nameEn: "Health" },
  { id: "kosmos", nameAz: "Kosmos və Elm", nameEn: "Space & Science" },
  { id: "proqramlasma", nameAz: "Proqramlaşdırma", nameEn: "Programming" },
];

// Seeded random — eyni tarixdə həmişə eyni nəticə
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Gündəlik challenge yaradır
export function getDailyChallenge(): DailyChallenge {
  const today = getTodayKey();
  const saved = getCompletedChallenge();

  if (saved && saved.date === today) {
    return saved;
  }

  const dayOfYear = getDayOfYear();
  const seed = dayOfYear * 137 + new Date().getFullYear() * 365;

  // Kateqoriya seçimi (günə görə rotasiya)
  const catIndex = Math.floor(seededRandom(seed) * CATEGORIES.length);
  const cat = CATEGORIES[catIndex];

  // Bonus XP (30-70 arası)
  const bonusXp = 30 + Math.floor(seededRandom(seed + 1) * 41);

  return {
    date: today,
    categoryId: cat.id,
    categoryNameAz: cat.nameAz,
    categoryNameEn: cat.nameEn,
    bonusXp,
    isCompleted: false,
  };
}

// Tamamlanmış challenge-ı localStorage-dan oxu
export function getCompletedChallenge(): DailyChallenge | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("shade_daily_challenge");
    if (!saved) return null;
    return JSON.parse(saved) as DailyChallenge;
  } catch {
    return null;
  }
}

// Challenge-ı tamamla
export function completeDailyChallenge(): DailyChallenge {
  const challenge = getDailyChallenge();
  challenge.isCompleted = true;
  challenge.completedAt = new Date().toISOString();

  if (typeof window !== "undefined") {
    localStorage.setItem("shade_daily_challenge", JSON.stringify(challenge));
  }

  return challenge;
}

// Qalan vaxt (bugünkü challenge üçün)
export function getTimeUntilReset(): string {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const diff = tomorrow.getTime() - now.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}s ${minutes}d`;
}
