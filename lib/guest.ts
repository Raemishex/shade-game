// Guest user — localStorage-da saxlanır, qeydiyyatsız oynaya bilər

const GUEST_KEY = "shade_guest";
const GUEST_INITIALIZED_KEY = "shade_guest_initialized";

export interface GuestUser {
  userId: string;
  displayName: string;
  avatarColor: string;
}

const AVATAR_COLORS = [
  "#C8A44E", "#B8D4A8", "#A8C4E0", "#E0C4A8",
  "#F0997B", "#E8593C", "#9B8EC4", "#7ECEC1",
  "#D4A8D0", "#8BC4A0", "#E0B878", "#A0B8E0",
];

function generateId(): string {
  return "guest_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function randomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function generateGuestName(): string {
  // Random 4 rəqəmli ad yarat: Oyunçu_XXXX
  const num = Math.floor(1000 + Math.random() * 9000);
  return `Oyunçu_${num}`;
}

/**
 * İlk dəfə daxil olan istifadəçi olub-olmadığını yoxla
 */
export function isFirstVisit(): boolean {
  if (typeof window === "undefined") return true;
  return !localStorage.getItem(GUEST_INITIALIZED_KEY);
}

/**
 * İlk ziyarət bayrağını təyin et (artıq ilk dəfə deyil)
 */
export function markInitialized(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(GUEST_INITIALIZED_KEY, "true");
  }
}

export function getGuestUser(): GuestUser {
  if (typeof window === "undefined") {
    return { userId: generateId(), displayName: generateGuestName(), avatarColor: "#C8A44E" };
  }

  const stored = localStorage.getItem(GUEST_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as GuestUser;
      // Köhnə "Oyunçu" adını yenilə (unikal ada)
      if (parsed.displayName === "Oyunçu") {
        parsed.displayName = generateGuestName();
        localStorage.setItem(GUEST_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      // corrupt data, regenerate
    }
  }

  const guest: GuestUser = {
    userId: generateId(),
    displayName: generateGuestName(),
    avatarColor: randomColor(),
  };
  localStorage.setItem(GUEST_KEY, JSON.stringify(guest));
  // İlk dəfə yaradıldıqda qeyd et
  markInitialized();
  return guest;
}

export function updateGuestName(name: string): GuestUser {
  const guest = getGuestUser();
  guest.displayName = name.trim() || "Oyunçu";
  if (typeof window !== "undefined") {
    localStorage.setItem(GUEST_KEY, JSON.stringify(guest));
  }
  return guest;
}

/**
 * Qonaq profilini sıfırla (test/debug üçün)
 */
export function clearGuestData(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(GUEST_KEY);
    localStorage.removeItem(GUEST_INITIALIZED_KEY);
  }
}
