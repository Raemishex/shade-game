import { NextRequest, NextResponse } from "next/server";
import connectDB, { isDBConnectionError, DB_ERROR_RESPONSE } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getUnlockedBadges } from "@/lib/badges";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const user = await User.findById(id).select("-passwordHash");
    if (!user) {
      return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 404 });
    }

    // Badge-ləri hesabla
    const unlockedBadges = getUnlockedBadges({
      totalGames: user.stats.totalGames,
      wins: user.stats.wins,
      imposterGames: user.stats.imposterGames,
      imposterWins: user.stats.imposterWins,
      level: user.level,
      fs5Active: user.fs5Active,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatarColor: user.avatarColor,
        xp: user.xp,
        level: user.level,
        stats: user.stats,
        badges: unlockedBadges,
        settings: user.settings,
        isGuest: user.isGuest,
        fs5Active: user.fs5Active,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Get user error:", err);
    if (isDBConnectionError(err)) {
      return NextResponse.json(DB_ERROR_RESPONSE, { status: 503 });
    }
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // BUG 2.1 fix: Auth check — yalnız öz profilini dəyişə bilər
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });
    }
    if (currentUser._id.toString() !== id) {
      return NextResponse.json({ error: "Bu əməliyyat üçün icazəniz yoxdur" }, { status: 403 });
    }

    const body = await req.json();
    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 404 });
    }

    // Yenilənə bilən sahələr
    if (body.displayName !== undefined) {
      const name = body.displayName.trim();
      if (name.length < 2 || name.length > 30) {
        return NextResponse.json({ error: "Ad 2-30 simvol olmalıdır" }, { status: 400 });
      }
      user.displayName = name;
    }

    if (body.avatarColor !== undefined) {
      user.avatarColor = body.avatarColor;
    }

    if (body.settings !== undefined) {
      if (body.settings.sound !== undefined) user.settings.sound = body.settings.sound;
      if (body.settings.language !== undefined) user.settings.language = body.settings.language;
      if (body.settings.theme !== undefined) user.settings.theme = body.settings.theme;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        displayName: user.displayName,
        avatarColor: user.avatarColor,
        settings: user.settings,
      },
    });
  } catch (err) {
    console.error("Update user error:", err);
    if (isDBConnectionError(err)) {
      return NextResponse.json(DB_ERROR_RESPONSE, { status: 503 });
    }
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });
    }
    if (currentUser._id.toString() !== id) {
      return NextResponse.json({ error: "Bu əməliyyat üçün icazəniz yoxdur" }, { status: 403 });
    }

    await connectDB();
    const mongoose = await import("mongoose");

    const Game = mongoose.models.Game || mongoose.model("Game", new mongoose.Schema({}, { strict: false }));
    await Game.deleteMany({ "players.userId": id });

    await User.findByIdAndDelete(id);

    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.delete("shade-token");

    return NextResponse.json({ success: true, message: "Hesab silindi" });
  } catch (err) {
    console.error("Delete user error:", err);
    if (isDBConnectionError(err)) {
      return NextResponse.json(DB_ERROR_RESPONSE, { status: 503 });
    }
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
