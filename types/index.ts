// ==========================================
// SHADE — TypeScript Type Definitions
// ==========================================

// ---------- User ----------
export interface UserStats {
  totalGames: number;
  wins: number;
  imposterGames: number;
  imposterWins: number;
}

export interface UserSettings {
  sound: boolean;
  language: "az" | "en";
  theme: "dark" | "light";
}

export interface User {
  _id: string;
  username: string;
  displayName: string;
  email?: string;
  avatarColor: string;
  xp: number;
  level: number;
  stats: UserStats;
  badges: string[];
  settings: UserSettings;
  isGuest: boolean;
  fs5Active: boolean;
  fs5ActivatedAt?: Date;
  createdAt: Date;
  lastLoginAt: Date;
}

// ---------- Room ----------
export interface RoomPlayer {
  userId: string;
  displayName: string;
  avatarColor: string;
  isReady: boolean;
}

export interface RoomSettings {
  category: string;
  rounds: number;
  discussionTime: 30 | 60 | 90;
  imposterHint: boolean;
  imposterCount?: number; // 0 = auto, 1, 2, 3
}

export interface Room {
  _id: string;
  code: string;
  hostId: string;
  players: RoomPlayer[];
  settings: RoomSettings;
  status: "waiting" | "playing" | "voting" | "finished";
  currentGameId?: string;
  usedWords: string[];
  createdAt: Date;
}

// ---------- Game ----------
export interface Clue {
  userId: string;
  displayName: string;
  clue: string;
  submittedAt: Date;
}

export interface GameRound {
  roundNumber: number;
  clues: Clue[];
}

export interface Vote {
  voterId: string;
  votedFor: string | null;
}

export interface GameResult {
  winners: "citizens" | "imposters";
  eliminatedId?: string;
  xpDistribution: { userId: string; xp: number }[];
}

export interface Game {
  _id: string;
  roomId: string;
  word: string;
  category: string;
  imposters: string[];
  rounds: GameRound[];
  votes: Vote[];
  result?: GameResult;
  startedAt: Date;
  endedAt?: Date;
}

// ---------- Word & Category ----------
export interface Word {
  _id: string;
  categoryId: string;
  wordAz: string;
  wordEn: string;
  image: string | null;
  difficulty: 1 | 2 | 3;
  isActive: boolean;
}

export interface Category {
  _id: string;
  slug: string;
  nameAz: string;
  nameEn: string;
  icon: string;
  isPremium: boolean;
  fs5Only: boolean;
  wordCount: number;
}

// ---------- Socket Events ----------
export interface ServerToClientEvents {
  "player:join": (player: RoomPlayer) => void;
  "player:leave": (userId: string) => void;
  "player:ready": (userId: string, isReady: boolean) => void;
  "player:disconnected": (userId: string) => void;
  "room:settings": (settings: RoomSettings) => void;
  "room:host-changed": (data: { newHostId: string }) => void;
  "game:start": (data: { playerCount: number; imposterCount: number; rounds: number; category: string }) => void;
  "game:word": (data: GameWordData) => void;
  "game:end": (result: GameEndData) => void;
  "clue:update": (clues: Clue[]) => void;
  "round:start": (roundNumber: number) => void;
  "round:end": (roundNumber: number) => void;
  "discussion:start": (duration: number) => void;
  "discussion:message": (message: ChatMessage) => void;
  "discussion:timer": (secondsLeft: number) => void;
  "discussion:end": () => void;
  "voting:start": () => void;
  "vote:cast": (voterId: string, votedFor: string | null) => void;
  "vote:result": (result: VoteResult) => void;
  "emoji:receive": (data: EmojiData & { displayName: string }) => void;
  "player:reconnect": (userId: string) => void;
}

export interface ClientToServerEvents {
  "room:create": (data: { settings?: Partial<RoomSettings> }, callback?: (response: { success: boolean; room?: Room; error?: string }) => void) => void;
  "room:join": (data: { roomCode: string }, callback?: (response: { success: boolean; room?: Room; error?: string }) => void) => void;
  "room:leave": (data: { roomCode?: string }, callback?: (response: { success: boolean }) => void) => void;
  "room:settings": (data: { roomCode?: string; settings: Partial<RoomSettings> }) => void;
  "player:ready": (data: { roomCode?: string; isReady: boolean }) => void;
  "game:requestState": (data: { roomCode?: string }) => void;
  "game:start": (data: { roomCode?: string }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  "clue:submit": (data: { clue: string }) => void;
  "vote:cast": (data: { votedFor: string | null }) => void;
  "discussion:message": (data: { message: string }) => void;
  "emoji:send": (data: { roomCode: string; emoji: string }) => void;
  "player:reconnect": (data: { roomCode: string }) => void;
}

// ---------- Helper Types ----------
export interface GameWordData {
  role: "citizen" | "imposter";
  word: string | null;
  category: string;
  categoryHint: string | null;
  image: string | null;
}

export interface ChatMessage {
  userId: string;
  displayName: string;
  message: string;
  timestamp: Date;
}

export interface VoteDetail {
  voterId: string;
  votedFor: string | null;
}

export interface VoteResult {
  eliminatedId: string | null;
  wasImposter: boolean;
  voteBreakdown: { targetId: string; count: number }[];
  voteDetails: VoteDetail[];
  gameOver: boolean;
}

export interface XpEntry {
  userId: string;
  displayName: string;
  xp: number;
  breakdown: string[];
}

export interface GameEndData {
  winners: "citizens" | "imposters";
  imposters: string[];
  word: string;
  voteBreakdown: { targetId: string; count: number }[];
  voteDetails: VoteDetail[];
  xpDistribution: XpEntry[];
  allClues: Clue[];
}

export interface EmojiData {
  userId: string;
  emoji: string;
  timestamp: number;
}

// ---------- FS5 Config ----------
export interface FS5Config {
  citizenName: string;
  imposterName: string;
  defaultCitizenName: string;
  defaultImposterName: string;
  activationCode: string;
  durationMonths: number;
}

// ---------- Badge ----------
export interface Badge {
  id: string;
  nameAz: string;
  nameEn: string;
  description: string;
  icon: string;
  condition: (user: User) => boolean;
}

// ---------- XP Level ----------
export interface LevelInfo {
  level: number;
  currentXp: number;
  requiredXp: number;
  progress: number;
}
