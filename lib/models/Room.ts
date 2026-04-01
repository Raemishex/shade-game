import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IRoomPlayer {
  userId: string;
  displayName: string;
  avatarColor: string;
  isReady: boolean;
}

export interface IRoomSettings {
  category: string;
  rounds: number;
  discussionTime: 30 | 60 | 90;
  imposterHint: boolean;
}

export interface IRoomGameState {
  word?: string;
  category?: string;
  imposters?: string[];
  rounds?: Array<{
    roundNumber: number;
    clues: Array<{
      userId: string;
      displayName: string;
      clue: string;
      submittedAt: number;
    }>;
  }>;
  currentRound?: number;
  votes?: Array<{
    voterId: string;
    votedFor: string | null;
  }>;
  eliminated?: string[];
  startedAt?: number;
}

export interface IRoom extends Document {
  code: string;
  hostId: string;
  players: IRoomPlayer[];
  settings: IRoomSettings;
  status: "waiting" | "playing" | "voting" | "finished";
  currentGameId?: Types.ObjectId;
  usedWords: string[];
  gameState?: IRoomGameState;
  createdAt: Date;
}

const RoomPlayerSchema = new Schema<IRoomPlayer>(
  {
    userId: { type: String, required: true },
    displayName: { type: String, required: true },
    avatarColor: { type: String, required: true },
    isReady: { type: Boolean, default: false },
  },
  { _id: false }
);

const RoomSchema = new Schema<IRoom>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      length: 6,
    },
    hostId: {
      type: String,
      required: true,
    },
    players: {
      type: [RoomPlayerSchema],
      default: [],
    },
    settings: {
      category: { type: String, default: "yemekler" },
      rounds: { type: Number, default: 2, min: 1, max: 5 },
      discussionTime: { type: Number, default: 60, enum: [30, 60, 90] },
      imposterHint: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: ["waiting", "playing", "voting", "finished"],
      default: "waiting",
    },
    currentGameId: {
      type: Schema.Types.ObjectId,
      ref: "Game",
    },
    usedWords: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// TTL index: 2 saat (7200 saniyə) sonra avtomatik silinsin
RoomSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7200 });

const Room: Model<IRoom> =
  mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);

export default Room;
