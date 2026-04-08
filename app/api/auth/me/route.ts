import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isDBConnectionError, DB_ERROR_RESPONSE } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      // Token yoxdur — guest kimi cavab qaytar (console error-larının qarşısını al)
      return NextResponse.json({
        success: true,
        user: {
          username: "guest",
          displayName: "Qonaq",
          isGuest: true,
          xp: 0,
          level: 1,
          stats: { totalGames: 0, wins: 0, imposterGames: 0, imposterWins: 0 },
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatarColor: user.avatarColor,
        level: user.level,
        xp: user.xp,
        stats: user.stats,
        badges: user.badges,
        isGuest: user.isGuest,
        settings: user.settings,
        fs5Active: user.fs5Active,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Auth/me error:", err);
    if (isDBConnectionError(err)) {
      return NextResponse.json(DB_ERROR_RESPONSE, { status: 503 });
    }
    return NextResponse.json(
      { error: "Server xətası" },
      { status: 500 }
    );
  }
}
