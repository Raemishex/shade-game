import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isDBConnectionError, DB_ERROR_RESPONSE } from "@/lib/mongodb";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Giriş tələb olunur" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        displayName: user.displayName,
        email: user.email,
        avatarColor: user.avatarColor,
        level: user.level,
        xp: user.xp,
        stats: user.stats,
        badges: user.badges,
        isGuest: user.isGuest,
        settings: user.settings,
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
