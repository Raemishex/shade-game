import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readFile, writeFile } from "fs/promises";
import { verifyToken } from "@/lib/auth";

const TOURNAMENTS_PATH = path.join(process.cwd(), "data", "tournaments.json");

interface Tournament {
  id: string;
  name: string;
  code: string;
  hostId: string;
  hostName: string;
  players: { id: string; name: string; color: string }[];
  maxPlayers: number;
  rounds: number;
  status: "waiting" | "playing" | "finished";
  bracket: { round: number; matches: { p1: string; p2: string; winner?: string }[] }[];
  winner?: string;
  createdAt: string;
}

interface TournamentsData {
  tournaments: Tournament[];
}

async function readTournaments(): Promise<TournamentsData> {
  try {
    const raw = await readFile(TOURNAMENTS_PATH, "utf-8");
    return JSON.parse(raw) as TournamentsData;
  } catch {
    return { tournaments: [] };
  }
}

async function writeTournaments(data: TournamentsData): Promise<void> {
  await writeFile(TOURNAMENTS_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function generateCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// GET — turnir siyahısı
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
    const code = searchParams.get("code");
    const status = searchParams.get("status");

    const data = await readTournaments();
    let tournaments = data.tournaments;

    if (id) {
      tournaments = tournaments.filter((t) => t.id === id);
    }
    if (code) {
      tournaments = tournaments.filter((t) => t.code === code);
    }
    if (status) {
      tournaments = tournaments.filter((t) => t.status === status);
    }

    return NextResponse.json({ success: true, tournaments });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST — yeni turnir yarat
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
    const hostId = payload.userId;

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ success: false, error: "name required" }, { status: 400 });
    }

    const data = await readTournaments();

    let code = generateCode();
    while (data.tournaments.some((t) => t.code === code)) {
      code = generateCode();
    }

    const tournament: Tournament = {
      id: `trn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: body.name,
      code,
      hostId: hostId,
      hostName: body.hostName || "Host",
      players: [{ id: hostId, name: body.hostName || "Host", color: body.hostColor || "#C8A44E" }],
      maxPlayers: body.maxPlayers || 8,
      rounds: body.rounds || 2,
      status: "waiting",
      bracket: [],
      createdAt: new Date().toISOString(),
    };

    data.tournaments.push(tournament);
    await writeTournaments(data);

    return NextResponse.json({ success: true, tournament });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PUT — turnirə qoşul / status dəyiş
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Authorization required" }, { status: 401 });
    }
    const payload = verifyToken(authHeader.slice(7));
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }
    const userId = payload.userId;

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ success: false, error: "Tournament ID required" }, { status: 400 });
    }

    const data = await readTournaments();
    const idx = data.tournaments.findIndex((t) => t.id === body.id);

    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Tournament not found" }, { status: 404 });
    }

    const tournament = data.tournaments[idx];

    // Oyunçu əlavə et
    if (body.playerId && body.playerName) {
      if (tournament.players.length >= tournament.maxPlayers) {
        return NextResponse.json({ success: false, error: "Tournament is full" }, { status: 400 });
      }

      // Only allow adding oneself
      if (body.playerId !== userId) {
        return NextResponse.json({ success: false, error: "You can only add yourself" }, { status: 403 });
      }

      if (tournament.players.some((p) => p.id === body.playerId)) {
        return NextResponse.json({ success: false, error: "You are already in the tournament" }, { status: 409 });
      }

      tournament.players.push({
        id: body.playerId,
        name: body.playerName,
        color: body.playerColor || "#C8A44E",
      });
    }

    // Status dəyiş - only host can change status
    if (body.status) {
      if (tournament.hostId !== userId) {
        return NextResponse.json({ success: false, error: "Only the host can change the status" }, { status: 403 });
      }
      if (["playing", "finished"].includes(body.status)) {
        tournament.status = body.status;
      }
    }

    // Qalib təyin et - only host can set winner
    if (body.winner) {
      if (tournament.hostId !== userId) {
        return NextResponse.json({ success: false, error: "Only the host can set the winner" }, { status: 403 });
      }
      tournament.winner = body.winner;
      tournament.status = "finished";
    }

    data.tournaments[idx] = tournament;
    await writeTournaments(data);

    return NextResponse.json({ success: true, tournament });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}