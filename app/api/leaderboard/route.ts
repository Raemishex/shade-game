import { NextRequest, NextResponse } from "next/server";
import connectDB, { isDBConnectionError, DB_ERROR_RESPONSE } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    await connectDB();

    if (type === "weekly") {
      // Həftəlik: son 7 gündə giriş edən istifadəçilər, XP-yə görə
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const users = await User.find({
        lastLoginAt: { $gte: oneWeekAgo },
        isGuest: false,
      })
        .select("displayName username avatarColor xp level stats")
        .sort({ xp: -1 })
        .limit(limit)
        .lean();

      return NextResponse.json({
        success: true,
        type: "weekly",
        leaderboard: users.map((u, i) => ({
          rank: i + 1,
          id: u._id,
          displayName: u.displayName,
          username: u.username,
          avatarColor: u.avatarColor,
          xp: u.xp,
          level: u.level,
          winRate:
            u.stats.totalGames > 0
              ? Math.round((u.stats.wins / u.stats.totalGames) * 100)
              : 0,
        })),
      });
    }

    if (type === "friends") {
      // Dostlar — hələlik boş (Faza 4)
      return NextResponse.json({
        success: true,
        type: "friends",
        leaderboard: [],
        message: "Dost sistemi tezliklə gələcək!",
      });
    }

    // Ümumi: ən çox XP-yə görə sıralama
    const users = await User.find({ isGuest: false })
      .select("displayName username avatarColor xp level stats")
      .sort({ xp: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      type: "all",
      leaderboard: users.map((u, i) => ({
        rank: i + 1,
        id: u._id,
        displayName: u.displayName,
        username: u.username,
        avatarColor: u.avatarColor,
        xp: u.xp,
        level: u.level,
        winRate:
          u.stats.totalGames > 0
            ? Math.round((u.stats.wins / u.stats.totalGames) * 100)
            : 0,
      })),
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    if (isDBConnectionError(err)) {
      return NextResponse.json(DB_ERROR_RESPONSE, { status: 503 });
    }
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
