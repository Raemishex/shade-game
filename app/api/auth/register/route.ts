import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB, { isDBConnectionError, DB_ERROR_RESPONSE } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { setTokenCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 3 registrations per minute per IP
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const { limited } = rateLimit(`register:${ip}`, 3, 60000);
    if (limited) {
      return NextResponse.json(
        { error: "Çox sayda cəhd. 1 dəqiqə gözləyin." },
        { status: 429 }
      );
    }

    const { displayName, email, password, guestUserId } = await req.json();

    // NoSQL injection qarşısını al
    if (typeof displayName !== "string" || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Yanlış sorğu formatı" },
        { status: 400 }
      );
    }
    if (guestUserId !== undefined && guestUserId !== null && typeof guestUserId !== "string") {
      return NextResponse.json(
        { error: "Yanlış sorğu formatı" },
        { status: 400 }
      );
    }

    // Validasiya
    if (!displayName || !email || !password) {
      return NextResponse.json(
        { error: "Bütün sahələr tələb olunur" },
        { status: 400 }
      );
    }

    if (displayName.length < 2 || displayName.length > 30) {
      return NextResponse.json(
        { error: "Ad 2-30 simvol olmalıdır" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Düzgün email daxil edin" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Parol minimum 6 simvol olmalıdır" },
        { status: 400 }
      );
    }

    await connectDB();

    // Email mövcuddurmu?
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "Bu email artıq istifadə olunur" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let user;

    // Guest istifadəçi varsa — hesaba çevir
    // guestUserId həm ObjectId həm də "guest_" formatında ola bilər
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(guestUserId);
    if (guestUserId && (isObjectId || guestUserId.startsWith("guest_"))) {
      if (isObjectId) {
        user = await User.findById(guestUserId).catch(() => null);
      } else {
        // Socket server-dən gələn guest_ ID-si ilə axtarış (username sütununda saxlanılırsa)
        user = await User.findOne({ username: guestUserId }).catch(() => null);
      }

      if (user && user.isGuest) {
        user.displayName = displayName;
        user.email = email.toLowerCase();
        user.passwordHash = passwordHash;
        user.isGuest = false;
        user.lastLoginAt = new Date();
        await user.save();
      } else {
        // Guest DB-də yoxdursa (socket server-də yaradılıb), yeni hesab yarad
        user = null;
      }
    }

    // Yeni istifadəçi yarat
    if (!user) {
      const emailPart = email.split("@")[0].slice(0, 12);
      const suffix = Date.now().toString(36).slice(-6);
      const username = `${emailPart}_${suffix}`.slice(0, 20);
      user = await User.create({
        username,
        displayName,
        email: email.toLowerCase(),
        passwordHash,
        isGuest: false,
        lastLoginAt: new Date(),
      });
    }

    // JWT cookie
    await setTokenCookie({
      userId: user._id.toString(),
      email: user.email!,
      isGuest: false,
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
    console.error("Register error:", err);
    if (isDBConnectionError(err)) {
      return NextResponse.json(DB_ERROR_RESPONSE, { status: 503 });
    }
    // MongoDB duplicate key error
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
      return NextResponse.json(
        { error: "Bu email artıq istifadə olunur" },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : "Server xətası";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
