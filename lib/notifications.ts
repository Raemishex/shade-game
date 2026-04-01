// ---------- Bildiriş Sistemi ----------
// Local notification + Service Worker push notification dəstəyi

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

// Bildiriş icazəsini yoxla
export function hasNotificationPermission(): boolean {
  if (typeof window === "undefined") return false;
  return "Notification" in window && Notification.permission === "granted";
}

// Bildiriş icazəsi istə
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

// İstifadəçi bildirişləri aktiv edib?
export function isNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("shade_notifications") === "true";
}

// Local bildiriş göndər
export function sendLocalNotification(payload: NotificationPayload): void {
  if (!hasNotificationPermission() || !isNotificationsEnabled()) {
    return;
  }

  try {
    const notification = new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || "/icon-192.svg",
      tag: payload.tag || "shade-game",
      data: payload.data,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // 5 saniyədən sonra bağla
    setTimeout(() => notification.close(), 5000);
  } catch {
    // Notification constructor failed
  }
}

// Oyun bildirişləri
export const GameNotifications = {
  gameStarted: (roomCode: string) => {
    sendLocalNotification({
      title: "SHADE — Oyun Başladı!",
      body: `Otaq ${roomCode} üçün oyun başladı. Kartına bax!`,
      tag: "game-start",
    });
  },

  yourTurn: () => {
    sendLocalNotification({
      title: "SHADE — Sənin Növbəndir!",
      body: "İpucu vermə vaxtıdır. Tez ol!",
      tag: "your-turn",
    });
  },

  voteTime: () => {
    sendLocalNotification({
      title: "SHADE — Səsvermə!",
      body: "İmposter kimdir? Səsini ver!",
      tag: "vote-time",
    });
  },

  gameResult: (won: boolean) => {
    sendLocalNotification({
      title: won ? "SHADE — Qazandın! 🎉" : "SHADE — Uduzdun",
      body: won ? "Təbriklər! İmposter tapıldı." : "İmposter qaçdı. Yenidən cəhd et!",
      tag: "game-result",
    });
  },

  dailyChallenge: () => {
    sendLocalNotification({
      title: "SHADE — Gündəlik Challenge!",
      body: "Bu günün xüsusi kateqoriyası səni gözləyir. Bonus XP qazan!",
      tag: "daily-challenge",
    });
  },
};

// Gündəlik challenge bildirişini planlaşdır (səhər saat 9-da)
export function scheduleDailyNotification(): void {
  if (typeof window === "undefined") return;

  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);

  if (now > target) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target.getTime() - now.getTime();

  setTimeout(() => {
    GameNotifications.dailyChallenge();
    // Növbəti gün üçün yenidən planlaşdır
    scheduleDailyNotification();
  }, delay);
}
