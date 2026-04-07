import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import connectDB from "./mongodb";
import User, { IUser } from "./models/User";

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    console.warn("JWT_SECRET mühit dəyişəni təyin edilməyib! Production üçün fallback istifadə olunur.");
    process.env.JWT_SECRET = "fallback_shade_production_secret_super_long_string_123456";
  } else {
    process.env.JWT_SECRET = "dev_secret";
  }
}
const TOKEN_NAME = "shade-token";
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 gün (saniyə)

export interface JwtPayload {
  userId: string;
  email: string;
  isGuest: boolean;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return secret;
}

/**
 * JWT token yarat
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_MAX_AGE });
}

/**
 * JWT token doğrula
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * httpOnly cookie-yə token yaz
 */
export async function setTokenCookie(payload: JwtPayload): Promise<void> {
  const token = signToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TOKEN_MAX_AGE,
    path: "/",
  });
}

/**
 * Cookie-dən tokeni sil
 */
export async function removeTokenCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

/**
 * Cookie-dən cari istifadəçini al
 */
export async function getCurrentUser(): Promise<IUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  await connectDB();
  const user = await User.findById(payload.userId).select("-passwordHash");
  return user;
}

/**
 * Cookie-dən JWT payload-u al (DB sorğusu olmadan)
 */
export async function getTokenPayload(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;

  if (!token) return null;
  return verifyToken(token);
}
