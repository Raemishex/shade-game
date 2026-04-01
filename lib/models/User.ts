import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  username: string;
  displayName: string;
  email?: string;
  passwordHash?: string;
  avatarColor: string;
  xp: number;
  level: number;
  stats: {
    totalGames: number;
    wins: number;
    imposterGames: number;
    imposterWins: number;
  };
  badges: string[];
  settings: {
    sound: boolean;
    language: "az" | "en";
    theme: "dark" | "light";
  };
  isGuest: boolean;
  fs5Active: boolean;
  fs5ActivatedAt?: Date;
  createdAt: Date;
  lastLoginAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
    },
    avatarColor: {
      type: String,
      default: "#C8A44E",
    },
    xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    stats: {
      totalGames: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      imposterGames: { type: Number, default: 0 },
      imposterWins: { type: Number, default: 0 },
    },
    badges: {
      type: [String],
      default: [],
    },
    settings: {
      sound: { type: Boolean, default: true },
      language: { type: String, enum: ["az", "en"], default: "az" },
      theme: { type: String, enum: ["dark", "light"], default: "dark" },
    },
    isGuest: {
      type: Boolean,
      default: true,
    },
    fs5Active: {
      type: Boolean,
      default: false,
    },
    fs5ActivatedAt: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
