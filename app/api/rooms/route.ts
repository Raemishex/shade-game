import { NextRequest, NextResponse } from "next/server";
import connectDB, { isDBConnectionError, DB_ERROR_RESPONSE } from "@/lib/mongodb";
import Room from "@/lib/models/Room";
import { generateRoomCode } from "@/lib/generateCode";

// POST /api/rooms — Yeni otaq yarat
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const { hostId, displayName, avatarColor, settings } = body;

    // Type validation — injection qarşısını al
    if (typeof hostId !== "string" || typeof displayName !== "string") {
      return NextResponse.json(
        { success: false, error: "Yanlış sorğu formatı" },
        { status: 400 }
      );
    }
    if (hostId.length > 50 || displayName.length > 30 || displayName.length < 1) {
      return NextResponse.json(
        { success: false, error: "Yanlış məlumat uzunluğu" },
        { status: 400 }
      );
    }

    if (!hostId || !displayName) {
      return NextResponse.json(
        { success: false, error: "hostId və displayName tələb olunur" },
        { status: 400 }
      );
    }

    // Unikal kod generasiya et
    let code = generateRoomCode();
    let attempts = 0;
    while (await Room.findOne({ code })) {
      code = generateRoomCode();
      attempts++;
      if (attempts > 20) {
        return NextResponse.json(
          { success: false, error: "Kod generasiyası uğursuz oldu" },
          { status: 500 }
        );
      }
    }

    const room = await Room.create({
      code,
      hostId,
      players: [
        {
          userId: hostId,
          displayName,
          avatarColor: avatarColor || "#C8A44E",
          isReady: true,
        },
      ],
      settings: {
        category: settings?.category || "yemekler",
        rounds: settings?.rounds || 2,
        discussionTime: settings?.discussionTime || 60,
        imposterHint: settings?.imposterHint !== false,
      },
      status: "waiting",
    });

    return NextResponse.json({
      success: true,
      room: {
        code: room.code,
        hostId: room.hostId,
        players: room.players,
        settings: room.settings,
        status: room.status,
      },
    });
  } catch (err) {
    console.error("[POST /api/rooms] error:", err instanceof Error ? err.message : err);
    if (isDBConnectionError(err)) {
      return NextResponse.json({ success: false, ...DB_ERROR_RESPONSE }, { status: 503 });
    }
    return NextResponse.json(
      { success: false, error: "Server xətası" },
      { status: 500 }
    );
  }
}

// GET /api/rooms?code=XXXXXX — Otaq məlumatı
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const code = req.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.json(
        { success: false, error: "Otaq kodu tələb olunur" },
        { status: 400 }
      );
    }

    const room = await Room.findOne({ code: code.toUpperCase() });
    if (!room) {
      return NextResponse.json(
        { success: false, error: "Otaq tapılmadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      room: {
        code: room.code,
        hostId: room.hostId,
        players: room.players,
        settings: room.settings,
        status: room.status,
      },
    });
  } catch (err) {
    console.error("[GET /api/rooms] error:", err instanceof Error ? err.message : err);
    if (isDBConnectionError(err)) {
      return NextResponse.json({ success: false, ...DB_ERROR_RESPONSE }, { status: 503 });
    }
    return NextResponse.json(
      { success: false, error: "Server xətası" },
      { status: 500 }
    );
  }
}
