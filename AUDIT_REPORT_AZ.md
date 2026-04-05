# SHADE Oyunu — Hərtərəfli Audit Hesabatı

Bu hesabat "Shade" multiplayer web oyununun kod bazasının dərindən analizi nəticəsində hazırlanmışdır. Analiz zamanı oyun məntiqi, təhlükəsizlik, dayanıqlıq və istifadəçi təcrübəsi (UX) meyarları əsas götürülmüşdür.

---

## 🔴 KRİTİK (Təcili Düzəldilməli)

### 1. Hesaba Çevrilmə Məntiqində Xəta (Register API Bug)
**Fayl:** `app/api/auth/register/route.ts`
**İzah:** Qonaq istifadəçi (Guest) qeydiyyatdan keçərək real hesaba keçid etdikdə, kod yalnız `ObjectId` formatlı ID-ləri DB-də axtarır. Lakin Socket server tərəfindən yaradılan qonaq ID-ləri `guest_` prefiksi ilə başlayır (məs: `guest_abc123`). Bu, DB-də istifadəçinin tapılmamasına və qonağın qazandığı xalların/statistikaların yeni hesaba ötürülməməsinə səbəb olur.
**Nəticə:** İstifadəçi tərəqqisinin (progress) itməsi.

### 2. Səsvermə və Raund Bitməsi zamanı "Race Condition"
**Fayl:** `server/game.js`
**İzah:** "Race condition" — iki və ya daha çox prosesin eyni vaxtda eyni məlumatı dəyişməyə çalışmasıdır. `handleRoundEnd` və `handleVoteResult` funksiyalarında mutex (kilidləmə) mexanizmi olsa da, bəzi kənar ssenarilərdə (məs: eyni anda həm taymerin bitməsi, həm də son oyunçunun səs verməsi) oyun vəziyyəti iki dəfə işlənə bilər.
**Nəticə:** Oyunun donması, bir raundun iki dəfə oynanılması və ya nəticələrin yanlış hesablanması.

### 3. Mühit Dəyişənlərinin (Environment Variables) Çatışmazlığı
**Fayl:** `server/index.js`
**İzah:** Production mühitində `JWT_SECRET` dəyişəni təyin olunmadıqda server birbaşa dayanır (Fatal Crash).
**Nəticə:** Serverin ümumiyyətlə işə düşməməsi (Ekran görüntüsündəki "Crashed" vəziyyəti).

---

## 🟡 ORTA (Moderate)

### 1. Səsvermə Paneli və Sessiya Uyğunsuzluğu
**İzah:** Bəzi hallarda re-connect (yenidən qoşulma) edən oyunçular səsvermə panelində namizədləri görə bilmir. Bu, `SocketAuth` zamanı `roomCode`-un serverə düzgün ötürülməməsi və sessiyanın otaqla tam bağlanmaması ilə bağlıdır.

### 2. İpucu Sistemində Məhdudiyyətlər
**İzah:** İpucu daxil edilərkən boşluq simvoluna icazə verilmir (Regex məhdudiyyəti). Lakin bəzi hallarda mürəkkəb adlar və ya iki sözlü ipucular lazım ola bilər.

### 3. Verilənlər Bazası Olmadıqda Profil Səhifəsinin Çökməsi
**İzah:** Əgər MongoDB bağlantısı kəsilərsə, `/profile` səhifəsi "Server Error" verir. Burada "fallback" (ehtiyat variant) mexanizmi çatışmır.

---

## 🔵 TƏKMİLLƏŞDİRMƏLƏR (Enhancements)

### 1. Müzakirə Fazası (Discussion Phase)
**İzah:** Oyunçuların istəyi ilə müzakirə fazası otaq tənzimləmələrində seçimli edilməlidir. Bəzi oyunçular sürətli oyun, bəziləri isə daha çox müzakirə istəyir.

### 2. "Gördüm" (Seen) Düyməsi
**İzah:** Kart açılan zaman oyunçunun sözü gördüyünü təsdiqləməsi üçün düymə əlavə edilməlidir. Bu, təsadüfi kliklərlə kartın bağlanmasının və oyunçunun sözü unudub oyunu korlamasının qarşısını alar.

### 3. UI/UX: Yüklənmə Ekranı (Loading State)
**İzah:** Oyun başlayanda sözün DB-dən gəlməsi və bütün oyunçulara paylanması zamanı qısa müddətli "0 Players" və ya boş ekran görünə bilər. Bu hissədə daha estetik yüklənmə animasiyası lazımdır.

---

*Qeyd: Top 3 Kritik problemin həlli növbəti addımda tətbiq ediləcək.*
