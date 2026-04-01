/**
 * SHADE — Birbaşa Seed Script (ESM, ts-node tələb etmir)
 * MongoDB-yə data/words.json-dan 16 kateqoriya və ~1220 söz yükləyir
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import dns from 'dns';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// DNS fix
dns.setServers(['8.8.8.8', '1.1.1.1']);

// .env.local yüklə
const require2 = createRequire(import.meta.url);
const dotenv = require2('dotenv');
dotenv.config({ path: path.join(ROOT, '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI tapılmadı!');
  process.exit(1);
}

// Mongoose sxemləri
const CategorySchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  nameAz: { type: String, required: true },
  nameEn: { type: String, required: true },
  icon: { type: String, required: true },
  isPremium: { type: Boolean, default: false },
  fs5Only: { type: Boolean, default: false },
  wordCount: { type: Number, default: 0 },
}, { timestamps: true });

const WordSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  wordAz: { type: String, required: true },
  wordEn: { type: String },
  image: { type: String, default: null },
  difficulty: { type: Number, default: 2 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
const Word = mongoose.models.Word || mongoose.model('Word', WordSchema);

async function seed() {
  console.log('MongoDB-yə qoşulur...');
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    family: 4,
  });
  console.log('Qoşuldu.\n');

  // JSON faylı oxu
  const dataPath = path.join(ROOT, 'data', 'words.json');
  if (!fs.existsSync(dataPath)) {
    console.error(`Fayl tapılmadı: ${dataPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(rawData);

  const totalWordsInFile = Object.values(data.words).reduce((a, b) => a + b.length, 0);
  console.log(`${data.categories.length} kateqoriya, ${totalWordsInFile} söz tapıldı.\n`);

  // --force: təmizlə
  console.log('--force: Mövcud data təmizlənir...');
  await Category.deleteMany({});
  await Word.deleteMany({});
  console.log('Təmizləndi.\n');

  // Kateqoriyaları yarat
  let totalWords = 0;

  for (const cat of data.categories) {
    const words = data.words[cat.id] || [];

    const category = await Category.create({
      slug: cat.id,
      nameAz: cat.nameAz,
      nameEn: cat.nameEn,
      icon: cat.icon,
      isPremium: false,
      fs5Only: false,
      wordCount: words.length,
    });

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
    console.log(`  ${cat.icon} ${cat.nameAz}: ${words.length} söz ✓`);
  }

  console.log(`\n✓ Tamamlandı! ${data.categories.length} kateqoriya, ${totalWords} söz əlavə edildi.`);
  
  // Yoxla
  const catCount = await Category.countDocuments();
  const wordCount = await Word.countDocuments();
  console.log(`\nVerifikasiya: ${catCount} kateqoriya, ${wordCount} söz bazada.`);
  
  await mongoose.disconnect();
  console.log('MongoDB bağlandı.');
}

seed().catch((err) => {
  console.error('Seed xətası:', err);
  process.exit(1);
});
