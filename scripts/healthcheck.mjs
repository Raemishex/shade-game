/**
 * SHADE — TAM HEALTH CHECK SKRİPTİ
 * 
 * Bu skript MongoDB bağlantısı, seed data, və fayl bütövlüyünü yoxlayır.
 * (API endpoint testləri dev server ilə ayrıca ediləcək)
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// .env.local yüklə
const require2 = createRequire(import.meta.url);
const dotenv = require2('dotenv');
dotenv.config({ path: join(ROOT, '.env.local') });

const results = [];

function log(section, status, message) {
  results.push({ section, status, message });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${section}] ${message}`);
}

// ========== STEP 1: SETUP CHECK ==========
console.log('\n' + '='.repeat(60));
console.log('STEP 1: SETUP CHECK');
console.log('='.repeat(60));

// 1a. .env.local yoxla
const envPath = join(ROOT, '.env.local');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  if (envContent.includes('mongodb+srv://')) {
    log('ENV', 'PASS', 'MONGODB_URI atlas URI mövcuddur: mongodb+srv://...');
  } else if (envContent.includes('MONGODB_URI=')) {
    log('ENV', 'WARN', 'MONGODB_URI mövcuddur amma atlas URI deyil');
  } else {
    log('ENV', 'FAIL', 'MONGODB_URI .env.local-da tapılmadı');
  }

  // Digər env variables
  if (envContent.includes('JWT_SECRET=')) {
    log('ENV', 'PASS', 'JWT_SECRET mövcuddur');
  } else {
    log('ENV', 'FAIL', 'JWT_SECRET tapılmadı');
  }

  if (envContent.includes('NEXT_PUBLIC_SOCKET_URL=')) {
    log('ENV', 'PASS', 'NEXT_PUBLIC_SOCKET_URL mövcuddur');
  } else {
    log('ENV', 'FAIL', 'NEXT_PUBLIC_SOCKET_URL tapılmadı');
  }
} else {
  log('ENV', 'FAIL', '.env.local faylı tapılmadı!');
}

// 1b. MongoDB bağlantısı
console.log('\n📦 MongoDB-yə qoşulur...');

import mongoose from 'mongoose';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // ignore
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  log('MongoDB', 'FAIL', 'MONGODB_URI təyin edilməyib');
} else {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      family: 4,
    });
    log('MongoDB', 'PASS', 'MongoDB Atlas bağlantısı uğurlu!');

    // Collections yoxla
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collNames = collections.map(c => c.name);
    console.log('  Mövcud kolleksiyalar:', collNames.join(', '));

    // Categories count
    let catCount = 0;
    if (collNames.includes('categories')) {
      catCount = await db.collection('categories').countDocuments();
      if (catCount === 16) {
        log('Seed:Categories', 'PASS', `${catCount} kateqoriya mövcuddur (gözlənilən: 16)`);
      } else if (catCount > 0) {
        log('Seed:Categories', 'WARN', `${catCount} kateqoriya var (gözlənilən: 16)`);
      } else {
        log('Seed:Categories', 'FAIL', 'Kateqoriya yoxdur — seed lazımdır');
      }
    } else {
      log('Seed:Categories', 'FAIL', 'categories kolleksiyası yoxdur — seed lazımdır');
    }

    // Words count
    let wordCount = 0;
    if (collNames.includes('words')) {
      wordCount = await db.collection('words').countDocuments();
      if (wordCount >= 1200) {
        log('Seed:Words', 'PASS', `${wordCount} söz mövcuddur (gözlənilən: ~1220)`);
      } else if (wordCount > 0) {
        log('Seed:Words', 'WARN', `${wordCount} söz var (gözlənilən: ~1220)`);
      } else {
        log('Seed:Words', 'FAIL', 'Söz yoxdur — seed lazımdır');
      }
    } else {
      log('Seed:Words', 'FAIL', 'words kolleksiyası yoxdur — seed lazımdır');
    }

    // Users count
    if (collNames.includes('users')) {
      const userCount = await db.collection('users').countDocuments();
      log('DB:Users', 'PASS', `${userCount} istifadəçi mövcuddur`);
    }

    // Games count
    if (collNames.includes('games')) {
      const gameCount = await db.collection('games').countDocuments();
      log('DB:Games', 'PASS', `${gameCount} oyun tarixçəsi mövcuddur`);
    }

    // Rooms count  
    if (collNames.includes('rooms')) {
      const roomCount = await db.collection('rooms').countDocuments();
      log('DB:Rooms', 'PASS', `${roomCount} otaq mövcuddur`);
    }

    await mongoose.disconnect();
  } catch (err) {
    log('MongoDB', 'FAIL', `Bağlantı uğursuz: ${err.message}`);
  }
}

// ========== STEP 6a: DATA FILE CHECK ==========
console.log('\n' + '='.repeat(60));
console.log('STEP 6a: DATA FILE CHECK');
console.log('='.repeat(60));

// words.json
const wordsJsonPath = join(ROOT, 'data', 'words.json');
if (existsSync(wordsJsonPath)) {
  try {
    const rawData = readFileSync(wordsJsonPath, 'utf-8');
    const data = JSON.parse(rawData);
    const catCount = data.categories?.length || 0;
    const totalWords = data.words ? Object.values(data.words).reduce((a, b) => a + b.length, 0) : 0;
    log('DataFile', 'PASS', `words.json: ${catCount} kateqoriya, ${totalWords} söz`);
  } catch (e) {
    log('DataFile', 'FAIL', `words.json oxuna bilmir: ${e.message}`);
  }
} else {
  log('DataFile', 'FAIL', 'data/words.json tapılmadı');
}

// server/words.json
const serverWordsPath = join(ROOT, 'server', 'words.json');
if (existsSync(serverWordsPath)) {
  try {
    const rawData = readFileSync(serverWordsPath, 'utf-8');
    const data = JSON.parse(rawData);
    const catCount = data.categories?.length || 0;
    const totalWords = data.words ? Object.values(data.words).reduce((a, b) => a + b.length, 0) : 0;
    log('DataFile', 'PASS', `server/words.json: ${catCount} kateqoriya, ${totalWords} söz`);
  } catch (e) {
    log('DataFile', 'FAIL', `server/words.json oxuna bilmir: ${e.message}`);
  }
} else {
  log('DataFile', 'FAIL', 'server/words.json tapılmadı');
}

// ========== STEP 6b: SOUND FILE CHECK ==========
console.log('\n' + '='.repeat(60));
console.log('STEP 6b: SOUND FILE CHECK');
console.log('='.repeat(60));

const expectedSounds = [
  'button_click.mp3',
  'card_flip.mp3',
  'clue_submit.mp3',
  'defeat_music.mp3',
  'emoji_send.mp3',
  'game_music.mp3',
  'lobby_music.mp3',
  'player_join.mp3',
  'player_leave.mp3',
  'reveal_sound.mp3',
  'timer_end.mp3',
  'timer_tick.mp3',
  'victory_music.mp3',
  'vote_cast.mp3',
  'voting_music.mp3',
];

const soundDir = join(ROOT, 'public', 'sounds');
let soundPassed = 0;
let soundFailed = 0;
let totalSoundSize = 0;

for (const fname of expectedSounds) {
  const fpath = join(soundDir, fname);
  if (existsSync(fpath)) {
    const stat = statSync(fpath);
    if (stat.size > 1000) {
      soundPassed++;
      totalSoundSize += stat.size;
    } else {
      log('Sounds', 'FAIL', `${fname} çox kiçikdir (${stat.size} bytes) — placeholder ola bilər`);
      soundFailed++;
    }
  } else {
    log('Sounds', 'FAIL', `${fname} tapılmadı!`);
    soundFailed++;
  }
}

if (soundFailed === 0) {
  log('Sounds', 'PASS', `Bütün ${soundPassed}/15 səs faylı mövcuddur (ümumi: ${(totalSoundSize / 1024 / 1024).toFixed(1)} MB)`);
} else {
  log('Sounds', 'WARN', `${soundPassed}/15 səs faylı OK, ${soundFailed} problem var`);
}

// ========== STEP 6c: PWA MANIFEST CHECK ==========
console.log('\n' + '='.repeat(60));
console.log('STEP 6c: PWA MANIFEST CHECK');
console.log('='.repeat(60));

const manifestPath = join(ROOT, 'public', 'manifest.json');
if (existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    log('PWA:Manifest', 'PASS', `manifest.json: "${manifest.name}" — ${manifest.icons?.length || 0} ikona`);

    // İkonları yoxla
    let allIconsExist = true;
    for (const icon of (manifest.icons || [])) {
      const iconPath = join(ROOT, 'public', icon.src);
      if (!existsSync(iconPath)) {
        log('PWA:Icons', 'FAIL', `İkona tapılmadı: ${icon.src}`);
        allIconsExist = false;
      }
    }
    if (allIconsExist) {
      log('PWA:Icons', 'PASS', 'Bütün manifest ikonları mövcuddur');
    }
  } catch (e) {
    log('PWA:Manifest', 'FAIL', `manifest.json parse xətası: ${e.message}`);
  }
} else {
  log('PWA:Manifest', 'FAIL', 'public/manifest.json tapılmadı');
}

// ========== STEP 6d: KEY FILE INTEGRITY ==========
console.log('\n' + '='.repeat(60));
console.log('STEP 6d: KEY FILE INTEGRITY');
console.log('='.repeat(60));

const criticalFiles = [
  'app/layout.tsx',
  'app/page.tsx',
  'app/globals.css',
  'app/providers.tsx',
  'lib/mongodb.ts',
  'lib/auth.ts',
  'lib/socket.ts',
  'lib/models/User.ts',
  'lib/models/Room.ts',
  'lib/models/Game.ts',
  'lib/models/Word.ts',
  'lib/models/Category.ts',
  'app/api/categories/route.ts',
  'app/api/auth/register/route.ts',
  'app/api/auth/login/route.ts',
  'app/api/auth/me/route.ts',
  'app/api/rooms/route.ts',
  'app/api/leaderboard/route.ts',
  'app/api/users/[id]/route.ts',
  'app/api/users/[id]/history/route.ts',
  'server/index.js',
  'server/game.js',
  'server/rooms.js',
  'server/wordLoader.js',
  'server/chat.js',
  'package.json',
  'tsconfig.json',
  'next.config.mjs',
];

let missingFiles = [];
for (const f of criticalFiles) {
  const fp = join(ROOT, f);
  if (!existsSync(fp)) {
    missingFiles.push(f);
  }
}

if (missingFiles.length === 0) {
  log('FileIntegrity', 'PASS', `Bütün ${criticalFiles.length} kritik fayl mövcuddur`);
} else {
  log('FileIntegrity', 'FAIL', `Çatışmayan fayllar: ${missingFiles.join(', ')}`);
}

// Page files
const pageFiles = [
  'app/page.tsx',            // / (splash)
  'app/home/page.tsx',       // /home
  'app/profile/page.tsx',    // /profile
  'app/leaderboard/page.tsx',// /leaderboard
  'app/history/page.tsx',    // /history
  'app/settings/page.tsx',   // /settings
  'app/auth/login/page.tsx', // /auth/login
  'app/auth/register/page.tsx', // /auth/register
  'app/lobby/create/page.tsx',  // /lobby/create
  'app/modes/page.tsx',      // /modlar (modes)
];

let missingPages = [];
for (const f of pageFiles) {
  const fp = join(ROOT, f);
  if (!existsSync(fp)) {
    missingPages.push(f);
  }
}

if (missingPages.length === 0) {
  log('Pages', 'PASS', `Bütün ${pageFiles.length} səhifə faylı mövcuddur`);
} else {
  log('Pages', 'WARN', `Çatışmayan səhifələr: ${missingPages.join(', ')}`);
}

// ========== YEKUN HESABAT ==========
console.log('\n' + '='.repeat(60));
console.log('YEKUN HESABAT');
console.log('='.repeat(60));

const passes = results.filter(r => r.status === 'PASS').length;
const fails = results.filter(r => r.status === 'FAIL').length;
const warns = results.filter(r => r.status === 'WARN').length;

console.log(`\n✅ PASS: ${passes}`);
console.log(`❌ FAIL: ${fails}`);
console.log(`⚠️ WARN: ${warns}`);

if (fails > 0) {
  console.log('\n--- XƏTALAR ---');
  results.filter(r => r.status === 'FAIL').forEach(r => {
    console.log(`  ❌ [${r.section}] ${r.message}`);
  });
}

console.log('\n--- DONE ---');
process.exit(0);
