/**
 * FS5 Mode — Special mode for SHADE game
 * Activation code: ELLINFS5
 * Duration: 6 months from activation
 */

const FS5_STORAGE_KEY = "shade_fs5_activated_at";
const FS5_CODE = process.env.NEXT_PUBLIC_FS5_CODE || "ELLINFS5";
const FS5_DURATION_MS = 6 * 30 * 24 * 60 * 60 * 1000; // ~6 months

export interface FS5Config {
  citizenName: string;
  imposterName: string;
  categoryId: string;
  categoryName: string;
}

const fs5Config: FS5Config = {
  citizenName: "Proqramçı",
  imposterName: "Haker",
  categoryId: "proqramlasma",
  categoryName: "Proqramlaşdırma",
};

export const FS5_WORDS = [
  "React", "API", "Bug", "Framework", "Deploy", "Git", "Frontend", "Backend",
  "Database", "Server", "Docker", "Variable", "Function", "Component", "Hook",
  "State", "Props", "Router", "Middleware", "Token", "JSON", "REST", "GraphQL",
  "TypeScript", "JavaScript", "Python", "HTML", "CSS", "Terminal", "Debug",
  "Compile", "Runtime", "Stack", "Queue", "Array", "Object", "String", "Boolean",
  "Loop", "Recursion", "Callback", "Promise", "Async", "Fetch", "DOM", "Event",
  "Render", "npm", "Webpack", "Vite", "Tailwind", "Bootstrap", "MongoDB",
  "PostgreSQL", "Redis", "Socket", "HTTP", "HTTPS", "SSL", "CDN", "Cache",
  "Cookie", "Session", "OAuth", "JWT", "CORS", "Regex", "Algorithm", "Binary",
  "Responsive", "Breakpoint", "Node.js", "Express", "Next.js", "Vercel", "GitHub",
];

/** Check if FS5 mode is currently active */
export function isFS5Active(): boolean {
  if (typeof window === "undefined") return false;
  const activatedAt = localStorage.getItem(FS5_STORAGE_KEY);
  if (!activatedAt) return false;
  const timestamp = parseInt(activatedAt, 10);
  if (isNaN(timestamp)) return false;
  return Date.now() - timestamp < FS5_DURATION_MS;
}

/** Activate FS5 mode with code. Returns true if code is correct. */
export function activateFS5(code: string): boolean {
  if (code.trim().toUpperCase() !== FS5_CODE) return false;
  localStorage.setItem(FS5_STORAGE_KEY, Date.now().toString());
  return true;
}

/** Deactivate FS5 mode */
export function deactivateFS5(): void {
  localStorage.removeItem(FS5_STORAGE_KEY);
}

/** Get FS5 config */
export function getFS5Config(): FS5Config {
  return fs5Config;
}

/** Get role display name based on FS5 status */
export function getRoleName(role: "citizen" | "imposter", isFS5: boolean): string {
  if (isFS5) {
    return role === "citizen" ? fs5Config.citizenName : fs5Config.imposterName;
  }
  return role === "citizen" ? "VƏTƏNDAŞ" : "İMPOSTER";
}

/** Get remaining FS5 days */
export function getFS5RemainingDays(): number {
  if (typeof window === "undefined") return 0;
  const activatedAt = localStorage.getItem(FS5_STORAGE_KEY);
  if (!activatedAt) return 0;
  const timestamp = parseInt(activatedAt, 10);
  if (isNaN(timestamp)) return 0;
  const remaining = FS5_DURATION_MS - (Date.now() - timestamp);
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}
