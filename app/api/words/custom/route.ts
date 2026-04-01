import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readFile, writeFile } from "fs/promises";

// Custom words JSON faylı
const CUSTOM_WORDS_PATH = path.join(process.cwd(), "data", "custom-words.json");

interface CustomWord {
  id: string;
  word: string;
  category: string;
  createdBy: string;
  createdAt: string;
  approved: boolean;
}

interface CustomWordsData {
  words: CustomWord[];
}

async function readCustomWords(): Promise<CustomWordsData> {
  try {
    const raw = await readFile(CUSTOM_WORDS_PATH, "utf-8");
    return JSON.parse(raw) as CustomWordsData;
  } catch {
    return { words: [] };
  }
}

async function writeCustomWords(data: CustomWordsData): Promise<void> {
  await writeFile(CUSTOM_WORDS_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// GET — bütün custom sözləri al
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const approved = searchParams.get("approved");

    const data = await readCustomWords();

    let words = data.words;

    if (category) {
      words = words.filter((w) => w.category === category);
    }

    if (approved === "true") {
      words = words.filter((w) => w.approved);
    }

    return NextResponse.json({ success: true, words });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST — yeni custom söz əlavə et
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.word || typeof body.word !== "string") {
      return NextResponse.json({ success: false, error: "Söz tələb olunur" }, { status: 400 });
    }

    if (!body.category || typeof body.category !== "string") {
      return NextResponse.json({ success: false, error: "Kateqoriya tələb olunur" }, { status: 400 });
    }

    if (!body.createdBy || typeof body.createdBy !== "string") {
      return NextResponse.json({ success: false, error: "İstifadəçi ID tələb olunur" }, { status: 400 });
    }

    const word = body.word.trim().toLowerCase();

    if (word.length < 2 || word.length > 30) {
      return NextResponse.json(
        { success: false, error: "Söz 2-30 simvol olmalıdır" },
        { status: 400 }
      );
    }

    // Filtrlənmiş sözlər
    const bannedWords = ["spam", "test", "xxx", "hack"];
    if (bannedWords.includes(word)) {
      return NextResponse.json(
        { success: false, error: "Bu sözə icazə verilmir" },
        { status: 400 }
      );
    }

    const data = await readCustomWords();

    // Dublikat yoxlama
    const exists = data.words.some(
      (w) => w.word === word && w.category === body.category
    );
    if (exists) {
      return NextResponse.json(
        { success: false, error: "Bu söz artıq mövcuddur" },
        { status: 409 }
      );
    }

    const customWord: CustomWord = {
      id: `cw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      word,
      category: body.category,
      createdBy: body.createdBy,
      createdAt: new Date().toISOString(),
      approved: true, // avtomatik təsdiq (gələcəkdə moderation əlavə olunacaq)
    };

    data.words.push(customWord);
    await writeCustomWords(data);

    return NextResponse.json({ success: true, word: customWord });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE — custom söz sil
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json({ success: false, error: "Söz ID tələb olunur" }, { status: 400 });
    }

    // JWT token yoxla
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Auth tələb olunur" }, { status: 401 });
    }

    const { verifyToken } = await import("@/lib/auth");
    const payload = verifyToken(authHeader.slice(7));
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: "Token etibarsızdır" }, { status: 401 });
    }

    const userId = payload.userId;

    const data = await readCustomWords();
    const wordIndex = data.words.findIndex((w) => w.id === body.id);

    if (wordIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Söz tapılmadı" },
        { status: 404 }
      );
    }

    if (data.words[wordIndex].createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: "Bu sözü silmək üçün icazə yoxdur" },
        { status: 403 }
      );
    }

    data.words.splice(wordIndex, 1);
    await writeCustomWords(data);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
