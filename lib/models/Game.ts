import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClue {
  userId: string;
  displayName: string;
  clue: string;
  submittedAt: Date;
}

export interface IGameRound {
  roundNumber: number;
  clues: IClue[];
}

export interface IVote {
  voterId: string;
  votedFor: string | null;
}

export interface IGameResult {
  winners: "citizens" | "imposters";
  eliminatedId?: string;
  xpDistribution: { userId: string; xp: number }[];
}

export interface IGamePlayer {
  userId: string;
  displayName: string;
  avatarColor: string;
  role: "citizen" | "imposter";
}

export interface IGame extends Document {
  roomId: string;
  word: string;
  category: string;
  players: IGamePlayer[];
  imposters: string[];
  rounds: IGameRound[];
  votes: IVote[];
  result?: IGameResult;
  startedAt: Date;
  endedAt?: Date;
}

const ClueSchema = new Schema<IClue>(
  {
    userId: { type: String, required: true },
    displayName: { type: String, required: true },
    clue: { type: String, required: true, maxlength: 30 },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const GameRoundSchema = new Schema<IGameRound>(
  {
    roundNumber: { type: Number, required: true },
    clues: { type: [ClueSchema], default: [] },
  },
  { _id: false }
);

const VoteSchema = new Schema<IVote>(
  {
    voterId: { type: String, required: true },
    votedFor: { type: String, default: null },
  },
  { _id: false }
);

const GamePlayerSchema = new Schema<IGamePlayer>(
  {
    userId: { type: String, required: true },
    displayName: { type: String, required: true },
    avatarColor: { type: String, default: "#C8A44E" },
    role: { type: String, enum: ["citizen", "imposter"], required: true },
  },
  { _id: false }
);

const GameSchema = new Schema<IGame>({
  roomId: {
    type: String,
    required: true,
  },
  word: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  players: {
    type: [GamePlayerSchema],
    default: [],
  },
  imposters: [{ type: String }],
  rounds: {
    type: [GameRoundSchema],
    default: [],
  },
  votes: {
    type: [VoteSchema],
    default: [],
  },
  result: {
    winners: { type: String, enum: ["citizens", "imposters"] },
    eliminatedId: { type: String },
    xpDistribution: [
      {
        userId: { type: String },
        xp: { type: Number },
      },
    ],
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: {
    type: Date,
  },
});

GameSchema.index({ "players.userId": 1, startedAt: -1 });

const Game: Model<IGame> =
  mongoose.models.Game || mongoose.model<IGame>("Game", GameSchema);

export default Game;
