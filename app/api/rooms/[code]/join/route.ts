import { NextRequest, NextResponse } from "next/server";
import connectDB, { isDBConnectionError, DB_ERROR_RESPONSE } from "@/lib/mongodb";
import Room from "@/lib/models/Room";

// POST /api/rooms/[code]/join
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    await connectDB();

    const { code } = params;
    const body = await req.json().catch(() => ({}));
    const { userId, displayName, avatarColor } = body;

    // Type validation — injection qarşısını al
    if (typeof userId !== "string" || typeof displayName !== "string") {
      return NextResponse.json(
        { success: false, error: "Yanlış sorğu formatı" },
        { status: 400 }
      );
    }
    if (userId.length > 50 || displayName.length > 30 || displayName.length < 1) {
      return NextResponse.json(
        { success: false, error: "Yanlış məlumat uzunluğu" },
        { status: 400 }
      );
    }

    if (!userId || !displayName) {
      return NextResponse.json(
        { success: false, error: "userId və displayName tələb olunur" },
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

    if (room.status !== "waiting") {
      return NextResponse.json(
        { success: false, error: "Oyun artıq başlayıb" },
        { status: 400 }
      );
    }

    if (room.players.length >= 16) {
      return NextResponse.json(
        { success: false, error: "Otaq doludur (max 16 oyunçu)" },
        { status: 400 }
      );
    }

    // Artıq otaqdadırsa
    const alreadyIn = room.players.find(
      (p) => p.userId.toString() === userId
    );
    if (alreadyIn) {
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
    }

    // Oyunçunu əlavə et
    room.players.push({
      userId,
      displayName,
      avatarColor: avatarColor || "#C8A44E",
      isReady: false,
    });

    await room.save();

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
    console.error("[POST /api/rooms/join] error:", err instanceof Error ? err.message : err);
    if (isDBConnectionError(err)) {
      return NextResponse.json({ success: false, ...DB_ERROR_RESPONSE }, { status: 503 });
    }
    return NextResponse.json(
      { success: false, error: "Server xətası" },
      { status: 500 }
    );
  }
}
