import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB, { isDBConnectionError, DB_ERROR_RESPONSE } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { setTokenCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 attempts per minute per IP
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const { limited } = rateLimit(`login:${ip}`, 5, 60000);
    if (limited) {
      return NextResponse.json(
        { error: "Çox sayda cəhd. 1 dəqiqə gözləyin." },
        { status: 429 }
      );
    }

    const { email, password } = await req.json();

    // NoSQL injection qarşısını al
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Yanlış sorğu formatı" },
        { status: 400 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email və parol tələb olunur" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Email və ya parol yanlışdır" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Email və ya parol yanlışdır" },
        { status: 401 }
      );
    }

    // Son giriş vaxtını yenilə
    user.lastLoginAt = new Date();
    await user.save();

    // JWT cookie
    await setTokenCookie({
      userId: user._id.toString(),
      email: user.email!,
      isGuest: user.isGuest,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        displayName: user.displayName,
        email: user.email,
        avatarColor: user.avatarColor,
        level: user.level,
        xp: user.xp,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    if (isDBConnectionError(err)) {
      return NextResponse.json(DB_ERROR_RESPONSE, { status: 503 });
    }
    return NextResponse.json(
      { error: "Server xətası" },
      { status: 500 }
    );
  }
}
