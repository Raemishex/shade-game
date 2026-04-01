/**
 * SHADE — Söz Bazası Seed Script
 *
 * İstifadə: npx ts-node scripts/seed-words.ts
 * Force mode: npx ts-node scripts/seed-words.ts --force
 *
 * data/words.json faylından oxuyub MongoDB-yə import edir.
 */

import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import dns from "dns";

// Fix for Node.js DNS ECONNREFUSED on some IPv6 interfaces
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// .env.local faylını yüklə
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

// Mongoose modelləri
import Category from "../lib/models/Category";
import Word from "../lib/models/Word";

interface WordEntry {
  az: string;
  en: string;
  image: string | null;
  difficulty: number;
}

interface CategoryEntry {
  id: string;
  nameAz: string;
  nameEn: string;
  icon: string;
}

interface WordDatabase {
  categories: CategoryEntry[];
  words: Record<string, WordEntry[]>;
}

const isForce = process.argv.includes("--force");

async function seed() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI tapılmadı. .env.local faylını yoxlayın.");
    process.exit(1);
  }

  console.log("MongoDB-yə qoşulur...");
  await mongoose.connect(mongoUri);
  console.log("Qoşuldu.\n");

  // JSON faylı oxu
  const dataPath = path.join(__dirname, "..", "data", "words.json");
  if (!fs.existsSync(dataPath)) {
    console.error(`Fayl tapılmadı: ${dataPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(dataPath, "utf-8");
  const data: WordDatabase = JSON.parse(rawData);

  console.log(`${data.categories.length} kateqoriya, ${Object.values(data.words).reduce((a, b) => a + b.length, 0)} söz tapıldı.\n`);

  // Mövcud kolleksiyaları təmizlə (--force ilə)
  if (isForce) {
    console.log("--force: Mövcud data təmizlənir...");
    await Category.deleteMany({});
    await Word.deleteMany({});
    console.log("Təmizləndi.\n");
  } else {
    const existingCategories = await Category.countDocuments();
    const existingWords = await Word.countDocuments();
    if (existingCategories > 0 || existingWords > 0) {
      console.log(`Mövcud data var (${existingCategories} kateqoriya, ${existingWords} söz).`);
      console.log("Təmizləmək üçün --force flag istifadə edin.");
      console.log("Çıxır...\n");
      await mongoose.disconnect();
      return;
    }
  }

  // Kateqoriyaları yarat
  let totalWords = 0;

  for (const cat of data.categories) {
    const words = data.words[cat.id] || [];

    // Kateqoriyanı yarat
    const category = await Category.create({
      slug: cat.id,
      nameAz: cat.nameAz,
      nameEn: cat.nameEn,
      icon: cat.icon,
      isPremium: false,
      fs5Only: false,
      wordCount: words.length,
    });

    // Sözləri yarat
    if (words.length > 0) {
      const wordDocs = words.map((w) => ({
        categoryId: category._id,
        wordAz: w.az,
        wordEn: w.en,
        image: w.image || null,
        difficulty: w.difficulty || 2,
        isActive: true,
      }));

      await Word.insertMany(wordDocs);
    }

    totalWords += words.length;
    const checkMark = "\u2713";
    console.log(`  ${cat.icon} ${cat.nameAz}: ${words.length} söz ${checkMark}`);
  }

  console.log(`\n${checkMark()} Tamamlandı! ${data.categories.length} kateqoriya, ${totalWords} söz əlavə edildi.`);
  await mongoose.disconnect();
  console.log("MongoDB bağlandı.");
}

function checkMark(): string {
  return "\u2713";
}

seed().catch((err) => {
  console.error("Seed xətası:", err);
  process.exit(1);
});
