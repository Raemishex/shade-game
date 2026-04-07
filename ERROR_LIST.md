# SHADE — Tapılmış Xətalar və Problemlər Siyahısı
> Son yenilənmə: 2026-04-03

---

## 🔴 Kritik Xətalar (P1)

| # | Səhifə | Problem | Status |
|---|--------|---------|--------|
| 1 | `/api/auth/me` | Bütün səhifələrdə **401 Unauthorized** xətası — qonaq istifadəçilər üçün bu endpoint bacarıqlı deyil. Hər səhifə yüklənəndə çağırılır və konsola düşür. | ⚠️ Gözlənilən (guest mode) |
| 2 | `/lobby/create` | Əvvəl: Otaq yaradılması uğursuz olduqda **lokal kod ilə yönləndirmə** edirdi (server olmadan). | ✅ Düzəldildi |
| 3 | `/lobby/create` | Əvvəl: `generateRoomCode` import edilib istifadə olunmurdu — unused import xətası. | ✅ Düzəldildi |
| 4 | Sound System | **Autoplay Policy**: `{ once: true }` ilə listener qeydiyyatı Howler yüklənmədən əvvəl işləyirdi, AudioContext suspended qalırdı. | ✅ Düzəldildi |
| 5 | `/settings` | Theme dəyişikliyi: `document.documentElement.className` yenilənmirdi, yalnız `localStorage` ilə saxlanırdı — anlıq vizual dəyişiklik yox idi. | ✅ Düzəldildi |

---

## 🟡 Orta Xətalar (P2)

| # | Səhifə | Problem | Status |
|---|--------|---------|--------|
| 6 | Guest System | `updateGuestName("")` çağırılanda fallback olaraq **"Oyunçu"** yazılırdı (unikal deyil), indi `Oyunçu_XXXX` yaradılır. | ✅ Düzəldildi |
| 7 | Toast bildirişləri | Əvvəl sağ üst küncə yerləşdirilmişdi, mobildə gizlənirdi. İndi **mərkəzə** köçürülüb. | ✅ Düzəldildi |
| 8 | `/lobby/[code]` | Socket bağlantısı uğursuz olduqda **10 sn timeout** var, amma istifadəçiyə açıq xəta mesajı göstərilmir. | ⚠️ Mövcud (artıq connectionError state var) |
| 9 | `/game/[id]` | `wordData` gəlmədikdə **15 sn timeout** sonra xəbərdarlıq göstərilir — yaxşı, amma istifadəçiyə retry düyməsi yoxdur. | ⚠️ Mövcud (artıq back-to-lobby düyməsi var) |

---

## 🔵 Kiçik Xətalar / UI Problemləri (P3)

| # | Səhifə | Problem | Status |
|---|--------|---------|--------|
| 10 | FoxLogo SVG | `ellipse ry undefined` konsol xəbərdarlığı — brauzer auditində müşahidə edilmədi. Kod düzgün işləyir. | ✅ Yoxlandı (problem yoxdur) |
| 11 | PWA | `icon-192.svg` istifadə olunur, amma bəzi cihazlar `.png` istəyir. | ⚠️ TODO |
| 12 | Light Theme | Açıq mövzuda bəzi elementlər tam override olunmayıb — kontrastı aşağıdır. | ⚠️ TODO |
| 13 | Leaderboard | Hazırda yalnız **"TestUser"** görünür. Real data yoxdur. | ℹ️ Test data |
| 14 | Profile | Qonaq istifadəçi üçün bütün statistikalar **0** göstərilir (gözlənilən). | ℹ️ Normal |
| 15 | Webpack build | TypeScript path resolve xəbərdarlığı (case-sensitive path mismatch: `C:\` vs `c:\`). Build-ə təsiri yoxdur. | ℹ️ Warning only |

---

## ✅ Edilmiş Düzəlişlər Xülasəsi

| Fayl | Dəyişiklik |
|------|-----------|
| `app/lobby/create/page.tsx` | `generateRoomCode` import silindi. Server xətası zamanı lokal yönləndirmə əvəzinə error state göstərilir. |
| `lib/guest.ts` | `updateGuestName("")` fallback-i `"Oyunçu"` → `generateGuestName()` (unikal `Oyunçu_XXXX`). |
| `app/settings/page.tsx` | Theme dəyişəndə `document.documentElement.className = theme` əlavə olundu. |
| `lib/sounds.ts` | AudioContext resume listener `{ once: true }` → davamlı listener (Howler yüklənənə qədər saxlayır). |
| `components/ui/Toast.tsx` | Toast konteyner yuxarı-sağ → yuxarı-mərkəz, mobil responsive əlavə olundu. |

---

## 📋 Gələcək İşlər (başqa agentə ötürülə bilər)

- [ ] PWA icon-192.png yaradılması
- [ ] Light theme kontrastının artırılması
- [ ] `canvas-confetti` qələbə ekranına inteqrasiyası
- [ ] Skeleton loader-lərin Home və Profile səhifələrinə əlavəsi
- [ ] Micro-interactions (hover ripple effektləri)
- [ ] "Necə oynanır?" modal məzmununun genişləndirilməsi
- [ ] Lobbidə Imposter sayı seçiminin test edilməsi
- [ ] `/api/auth/me` endpoint-inin qonaq rejimdə 401 yerinə guest data qaytarması
