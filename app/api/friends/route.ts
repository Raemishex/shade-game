import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readFile, writeFile } from "fs/promises";
import { verifyToken } from "@/lib/auth";

const FRIENDS_PATH = path.join(process.cwd(), "data", "friends.json");

interface FriendRequest {
  id: string;
  fromId: string;
  fromName: string;
  fromColor: string;
  toId: string;
  toName: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

interface FriendsData {
  requests: FriendRequest[];
}

async function readFriends(): Promise<FriendsData> {
  try {
    const raw = await readFile(FRIENDS_PATH, "utf-8");
    return JSON.parse(raw) as FriendsData;
  } catch {
    return { requests: [] };
  }
}

async function writeFriends(data: FriendsData): Promise<void> {
  await writeFile(FRIENDS_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// GET — friend list and pending requests
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
    const userId = payload.userId;

    const data = await readFriends();
    const friends = data.requests
      .filter((r) => r.status === "accepted" && (r.fromId === userId || r.toId === userId))
      .map((r) => ({
        id: r.fromId === userId ? r.toId : r.fromId,
        name: r.fromId === userId ? r.toName : r.fromName,
        color: r.fromId === userId ? "#C8A44E" : r.fromColor,
      }));
    const incoming = data.requests.filter(
      (r) => r.toId === userId && r.status === "pending"
    );
    const outgoing = data.requests.filter(
      (r) => r.fromId === userId && r.status === "pending"
    );

    return NextResponse.json({ success: true, friends, incoming, outgoing });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST — send friend request
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
    const fromId = payload.userId;

    const body = await request.json();

    if (!body.toId) {
      return NextResponse.json({ success: false, error: "toId required" }, { status: 400 });
    }

    if (fromId === body.toId) {
      return NextResponse.json({ success: false, error: "You cannot send a request to yourself" }, { status: 400 });
    }

    const data = await readFriends();

    // Check if request already exists
    const existing = data.requests.find(
      (r) =>
        (r.fromId === fromId && r.toId === body.toId) ||
        (r.fromId === body.toId && r.toId === fromId)
    );

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Friend request already exists" },
        { status: 409 }
      );
    }

    const request_: FriendRequest = {
      id: `fr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      fromId: fromId,
      fromName: body.fromName || "Player",
      fromColor: body.fromColor || "#C8A44E",
      toId: body.toId,
      toName: body.toName || "Player",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    data.requests.push(request_);
    await writeFriends(data);

    return NextResponse.json({ success: true, request: request_ });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PUT — accept/reject friend request
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

    if (!body.id || !body.status) {
      return NextResponse.json({ success: false, error: "id and status required" }, { status: 400 });
    }

    if (!["accepted", "rejected"].includes(body.status)) {
      return NextResponse.json({ success: false, error: "Status must be 'accepted' or 'rejected'" }, { status: 400 });
    }

    const data = await readFriends();
    const idx = data.requests.findIndex((r) => r.id === body.id);

    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Friend request not found" }, { status: 404 });
    }

    // Check if the user is either the sender or receiver of the friend request
    const friendReq = data.requests[idx];
    if (friendReq.fromId !== userId && friendReq.toId !== userId) {
      return NextResponse.json({ success: false, error: "You are not authorized to modify this request" }, { status: 403 });
    }

    data.requests[idx].status = body.status;
    await writeFriends(data);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}