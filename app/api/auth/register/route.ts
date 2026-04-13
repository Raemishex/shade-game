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
    
    // Fetch guest stats from socket server if it's a guest_ ID
    let guestStats = null;
    let guestXp = 0;
    
    if (guestUserId && guestUserId.startsWith("guest_")) {
      try {
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://127.0.0.1:3001";
        // Remove trailing slash if exists
        const baseUrl = socketUrl.replace(/\/$/, "");
        const res = await fetch(`${baseUrl}/api/guest-stats/${guestUserId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            guestXp = data.xp || 0;
            guestStats = data.stats;
          }
        }
      } catch (err) {
        console.error("Failed to fetch guest stats from socket server:", err);
      }
    }

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
        
        // Merge fetched stats
        if (guestXp > 0) user.xp = (user.xp || 0) + guestXp;
        if (guestStats) {
          if (!user.stats) user.stats = { totalGames: 0, wins: 0, imposterGames: 0, imposterWins: 0 };
          user.stats.totalGames = (user.stats.totalGames || 0) + (guestStats.totalGames || 0);
          user.stats.wins = (user.stats.wins || 0) + (guestStats.wins || 0);
          user.stats.imposterGames = (user.stats.imposterGames || 0) + (guestStats.imposterGames || 0);
          user.stats.imposterWins = (user.stats.imposterWins || 0) + (guestStats.imposterWins || 0);
        }
        
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
        xp: guestXp,
        stats: guestStats || { totalGames: 0, wins: 0, imposterGames: 0, imposterWins: 0 },
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
