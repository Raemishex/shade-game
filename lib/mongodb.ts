import mongoose from "mongoose";

import dns from "dns";

// Fix for Node.js DNS ECONNREFUSED on some IPv6 interfaces
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  console.warn("Could not set DNS servers", e);
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/shade";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      family: 4,
    }).catch((err) => {
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
}

/** Check if error is a MongoDB connection error */
export function isDBConnectionError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    err.name === "MongoServerSelectionError" ||
    err.name === "MongoNetworkError" ||
    msg.includes("econnrefused") ||
    msg.includes("server selection timed out") ||
    msg.includes("connect econnrefused") ||
    msg.includes("topology was destroyed")
  );
}

export const DB_ERROR_RESPONSE = {
  error: "Database bağlantısı yoxdur. Zəhmət olmasa sonra yenidən cəhd edin.",
  dbError: true,
};

export default connectDB;
