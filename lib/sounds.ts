"use client";

// Səs faylları tərifləri
const SOUND_PATHS = {
  // Arxa fon musiqisi
  lobby_music: "/sounds/lobby_music.mp3",
  game_music: "/sounds/game_music.mp3",
  voting_music: "/sounds/voting_music.mp3",

  // Effekt səsləri
  button_click: "/sounds/button_click.mp3",
  card_flip: "/sounds/card_flip.mp3",
  clue_submit: "/sounds/clue_submit.mp3",
  timer_tick: "/sounds/timer_tick.mp3",
  timer_end: "/sounds/timer_end.mp3",
  vote_cast: "/sounds/vote_cast.mp3",
  emoji_send: "/sounds/emoji_send.mp3",
  player_join: "/sounds/player_join.mp3",
  player_leave: "/sounds/player_leave.mp3",

  // Nəticə
  victory_music: "/sounds/victory_music.mp3",
  defeat_music: "/sounds/defeat_music.mp3",
  reveal_sound: "/sounds/reveal_sound.mp3",
} as const;

type SoundName = keyof typeof SOUND_PATHS;

const BG_SOUNDS: SoundName[] = [
  "lobby_music",
  "game_music",
  "voting_music",
  "victory_music",
  "defeat_music",
];

// Howler-i dinamik yüklə (SSR-da crash olmasın deyə)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Howl: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Howler: any = null;
let howlerLoaded = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let howlerPromise: Promise<boolean> | null = null;

function ensureHowler(): boolean {
  if (typeof window === "undefined") return false;
  if (howlerLoaded) return true;

  // Kick off async loading if not started
  if (!howlerPromise) {
    howlerPromise = loadHowler();
  }
  return howlerLoaded;
}

async function loadHowler(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (howlerLoaded) return true;

  // Try dynamic import first
  try {
    const howlerModule = await import("howler");
    Howl = howlerModule.Howl;
    Howler = howlerModule.Howler;
    howlerLoaded = true;
    console.log("[SoundManager] Howler.js loaded via import");
    return true;
  } catch {
    // fallback: CDN script tag
  }

  // CDN fallback
  return new Promise<boolean>((resolve) => {
    // Check if already loaded globally
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Howl) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Howl = (window as any).Howl;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Howler = (window as any).Howler;
      howlerLoaded = true;
      return resolve(true);
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.4/howler.min.js";
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Howl = (window as any).Howl;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Howler = (window as any).Howler;
      howlerLoaded = true;
      console.log("[SoundManager] Howler.js loaded via CDN");
      resolve(true);
    };
    script.onerror = () => {
      console.warn("[SoundManager] Howler.js CDN-dən yüklənə bilmədi");
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

class SoundManager {
  private static instance: SoundManager;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sounds: Map<string, any> = new Map();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private currentBg: any = null;
  private currentBgName: string | null = null;
  private musicVolume = 0.3;
  private sfxVolume = 0.5;
  private isMuted = false;
  private musicEnabled = true;
  private sfxEnabled = true;

  private constructor() {
    // Load settings from localStorage
    if (typeof window !== "undefined") {
      try {
        const savedMute = localStorage.getItem("shade_sound_muted");
        if (savedMute === "true") {
          this.isMuted = true;
          if (ensureHowler() && Howler) Howler.mute(true);
        }
        const savedMusicVol = localStorage.getItem("shade_musicVolume");
        if (savedMusicVol) this.musicVolume = Number(savedMusicVol) / 100;
        const savedSfxVol = localStorage.getItem("shade_sfxVolume");
        if (savedSfxVol) this.sfxVolume = Number(savedSfxVol) / 100;
        const savedSound = localStorage.getItem("shade_sound");
        if (savedSound === "false") this.musicEnabled = false;
      } catch {
        // ignore
      }

      // Resume AudioContext on first user interaction (autoplay policy)
      const resumeAudio = () => {
        try {
          if (Howler && Howler.ctx && Howler.ctx.state === "suspended") {
            Howler.ctx.resume();
          }
        } catch { /* ignore */ }
      };
      document.addEventListener("click", resumeAudio, { once: true });
      document.addEventListener("touchstart", resumeAudio, { once: true });

      // Kick off Howler loading
      ensureHowler();
    }
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  /**
   * Səsi lazy-load et
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getSound(name: SoundName): any | null {
    ensureHowler();
    if (!Howl) return null;

    if (this.sounds.has(name)) {
      return this.sounds.get(name)!;
    }

    const isBg = BG_SOUNDS.includes(name);
    try {
      const sound = new Howl({
        src: [SOUND_PATHS[name]],
        volume: isBg ? this.musicVolume : this.sfxVolume,
        loop: isBg && name !== "victory_music" && name !== "defeat_music",
        preload: true,
        html5: true,
        onloaderror: (_id: number, err: unknown) => {
          console.warn(`[SoundManager] "${name}" yüklənə bilmədi:`, err);
        },
        onplayerror: (_id: number, err: unknown) => {
          console.warn(`[SoundManager] "${name}" çalına bilmədi:`, err);
        },
      });

      this.sounds.set(name, sound);
      return sound;
    } catch (err) {
      console.warn(`[SoundManager] "${name}" yaradıla bilmədi:`, err);
      return null;
    }
  }

  /**
   * Arxa fon musiqisi başlat
   */
  playBg(name: SoundName): void {
    if (!this.musicEnabled || this.isMuted) return;

    // Əvvəlki bg-ni dayandır
    this.stopBg();

    const sound = this.getSound(name);
    if (!sound) return;
    sound.volume(this.musicVolume);
    sound.play();
    this.currentBg = sound;
    this.currentBgName = name;
  }

  /**
   * Arxa fon musiqisini dayandır
   */
  stopBg(): void {
    if (this.currentBg) {
      try {
        this.currentBg.fade(this.currentBg.volume(), 0, 500);
        const bgRef = this.currentBg;
        setTimeout(() => bgRef.stop(), 500);
      } catch {
        // ignore
      }
      this.currentBg = null;
      this.currentBgName = null;
    }
  }

  /**
   * Effekt səsi çal
   */
  playSfx(name: SoundName): void {
    if (!this.sfxEnabled || this.isMuted) return;

    const sound = this.getSound(name);
    if (!sound) return;
    sound.volume(this.sfxVolume);
    sound.play();
  }

  /**
   * Musiqi səs səviyyəsi
   */
  setMusicVolume(vol: number): void {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.currentBg) {
      this.currentBg.volume(this.musicVolume);
    }
  }

  /**
   * SFX səs səviyyəsi
   */
  setSfxVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  /**
   * Hamısını susdur
   */
  mute(): void {
    this.isMuted = true;
    if (ensureHowler() && Howler) Howler.mute(true);
  }

  /**
   * Susdurmanı aç
   */
  unmute(): void {
    this.isMuted = false;
    if (ensureHowler() && Howler) Howler.mute(false);
  }

  /**
   * Mute vəziyyəti
   */
  get muted(): boolean {
    return this.isMuted;
  }

  /**
   * Musiqi enable/disable
   */
  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (!enabled) this.stopBg();
  }

  /**
   * SFX enable/disable
   */
  setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("shade_sound_muted", String(this.isMuted));
    }
    return this.isMuted;
  }

  /**
   * Get current volumes and state
   */
  getMusicVolume(): number {
    return this.musicVolume;
  }

  getSfxVolume(): number {
    return this.sfxVolume;
  }

  get musicOn(): boolean {
    return this.musicEnabled;
  }

  get sfxOn(): boolean {
    return this.sfxEnabled;
  }
}

export default SoundManager;
export type { SoundName };
