import { NextRequest, NextResponse } from "next/server";
import { connectDB, isDBConnectionError, DB_ERROR_RESPONSE } from "@/lib/mongodb";
import Game from "@/lib/models/Game";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Giriş tələb olunur" }, { status: 401 });
    }
    if (currentUser._id.toString() !== userId) {
      return NextResponse.json({ success: false, error: "İcazə yoxdur" }, { status: 403 });
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const category = searchParams.get("category") || "";
    const result = searchParams.get("result") || ""; // win | loss
    const role = searchParams.get("role") || ""; // citizen | imposter

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {
      "players.userId": userId,
      endedAt: { $exists: true },
    };

    if (category) {
      query.category = category;
    }

    if (role === "citizen") {
      query.imposters = { $nin: [userId] };
    } else if (role === "imposter") {
      query.imposters = userId;
    }

    const skip = (page - 1) * limit;

    const [games, total] = await Promise.all([
      Game.find(query)
        .sort({ startedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Game.countDocuments(query),
    ]);

    // Filter by result after fetch (requires checking per-user win/loss)
    const history = games
      .map((game) => {
        const isImposter = game.imposters.some(
          (imp) => imp.toString() === userId
        );
        const playerRole = isImposter ? "imposter" : "citizen";
        const winners = game.result?.winners;
        const didWin =
          (winners === "citizens" && !isImposter) ||
          (winners === "imposters" && isImposter);

        const myXp =
          game.result?.xpDistribution?.find(
            (x) => x.userId.toString() === userId
          )?.xp || 0;

        return {
          id: game._id.toString(),
          word: game.word,
          category: game.category,
          role: playerRole,
          result: didWin ? "win" : "loss",
          playerCount: game.players.length > 0 ? game.players.length : (game.imposters.length + 1),
          xpEarned: myXp,
          date: game.startedAt,
          endedAt: game.endedAt,
          players: game.players.map((p) => ({
            displayName: p.displayName,
            avatarColor: p.avatarColor,
            role: p.role,
          })),
          rounds: game.rounds.map((r) => ({
            roundNumber: r.roundNumber,
            clues: r.clues.map((c) => ({
              displayName: c.displayName,
              clue: c.clue,
            })),
          })),
          votes: game.votes.map((v) => ({
            voterId: v.voterId.toString(),
            votedFor: v.votedFor?.toString() || null,
          })),
          winners,
          imposters: game.imposters.map((i) => i.toString()),
        };
      })
      .filter((g) => {
        if (result === "win") return g.result === "win";
        if (result === "loss") return g.result === "loss";
        return true;
      });

    return NextResponse.json({
      success: true,
      history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("History fetch error:", error);
    if (isDBConnectionError(error)) {
      return NextResponse.json({ success: false, ...DB_ERROR_RESPONSE }, { status: 503 });
    }
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Auth before DB connection — avoid leaking DB errors to unauthenticated callers
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Auth tələb olunur" },
        { status: 401 }
      );
    }

    const { verifyToken } = await import("@/lib/auth");
    const payload = verifyToken(authHeader.slice(7));
    if (!payload?.userId || payload.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "İcazə yoxdur" },
        { status: 403 }
      );
    }

    await connectDB();
    const result = await Game.deleteMany({ "players.userId": userId });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Delete history error:", error);
    if (isDBConnectionError(error)) {
      return NextResponse.json({ success: false, ...DB_ERROR_RESPONSE }, { status: 503 });
    }
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
