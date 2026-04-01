import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readFile, writeFile } from "fs/promises";
import { verifyToken } from "@/lib/auth";

const REPLAYS_PATH = path.join(process.cwd(), "data", "replays.json");

interface GameReplay {
  id: string;
  roomCode: string;
  category: string;
  word: string;
  imposters: string[];
  players: { id: string; name: string; color: string; role: string }[];
  rounds: {
    number: number;
    clues: { playerId: string; playerName: string; clue: string }[];
  }[];
  votes: { voterId: string; votedFor: string | null }[];
  winner: "citizens" | "imposters";
  createdAt: string;
}

interface ReplaysData {
  replays: GameReplay[];
}

async function readReplays(): Promise<ReplaysData> {
  try {
    const raw = await readFile(REPLAYS_PATH, "utf-8");
    return JSON.parse(raw) as ReplaysData;
  } catch {
    return { replays: [] };
  }
}

async function writeReplays(data: ReplaysData): Promise<void> {
  await writeFile(REPLAYS_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// GET — replay siyahısı
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Authorization required" }, { status: 401 });
    }
    const payload = verifyToken(authHeader.slice(7));
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const playerId = searchParams.get("playerId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const data = await readReplays();

    let replays = data.replays;

    if (id) {
      replays = replays.filter((r) => r.id === id);
    }

    if (playerId) {
      replays = replays.filter((r) => r.players.some((p) => p.id === playerId));
    }

    // Sort by date (newest first)
    replays.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const total = replays.length;
    const offset = (page - 1) * limit;
    const paginated = replays.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      replays: paginated,
      pagination: {
        page,
        limit,
        total,
        hasMore: offset + limit < total,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST — yeni replay yadda saxla
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Authorization required" }, { status: 401 });
    }
    const payload = verifyToken(authHeader.slice(7));
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.roomCode || !body.word || !body.players) {
      return NextResponse.json(
        { success: false, error: "roomCode, word and players required" },
        { status: 400 }
      );
    }

    const data = await readReplays();

    const replay: GameReplay = {
      id: `replay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      roomCode: body.roomCode,
      category: body.category || "unknown",
      word: body.word,
      imposters: body.imposters || [],
      players: body.players,
      rounds: body.rounds || [],
      votes: body.votes || [],
      winner: body.winner || "citizens",
      createdAt: new Date().toISOString(),
    };

    data.replays.push(replay);

    // Keep only the last 100 replays
    if (data.replays.length > 100) {
      data.replays = data.replays.slice(-100);
    }

    await writeReplays(data);

    return NextResponse.json({ success: true, replay });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}