import { NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "server", "words.json");
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw);

    const categories = data.categories.map(
      (cat: { id: string; nameAz: string; nameEn: string; icon: string }) => ({
        id: cat.id,
        nameAz: cat.nameAz,
        nameEn: cat.nameEn,
        icon: cat.icon,
        wordCount: data.words[cat.id]?.length ?? 0,
      })
    );

    return NextResponse.json({ success: true, categories });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
