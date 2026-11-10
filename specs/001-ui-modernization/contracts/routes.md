# UI Rota Sözleşmesi (001-ui-modernization)

Kullanıcıya (tarayıcı ve arama motorları) açılan arayüz: rota → HTTP durum kodu, sorgu parametresi ayrıştırma, yüklenen ağır parçalar. URL'ler değişmez (FR-022).

## Durum kodları

| İstek | Önce | Sonra |
|---|---|---|
| `GET /providers/{id}` — var olan id | 200 | 200 |
| `GET /providers/{id}` — backend 404 | 500 | **404** (not-found sayfası; kontrol `providers/[id]/layout.tsx`'te; liste dosyaları `providers/(list)/` route group'unda olduğu için hiçbir loading sınırı bu layout'u sarmaz) |
| `GET /providers/abc`, `/providers/0`, `/providers/-1` | 500 | **404** |
| `GET /olmayan-sayfa` | 404 (Next varsayılanı, İngilizce) | **404** (Türkçe not-found) |
| Herhangi bir rotada beklenmeyen sunucu hatası | Ham hata metni / İngilizce | Türkçe `RouteError` (rota) veya `global-error` (kök düzen) |

## Sorgu parametreleri (server tarafı ayrıştırma — `src/lib/params.ts`)

| Parametre | Kural | Geçersiz değer |
|---|---|---|
| `page` (tüm listeler, detay yorumları) | 1-based tam sayı ≥1 | `0`, negatif, `abc` → `1`; backend'e `page0 = page - 1 ≥ 0` |
| `size` | 1..50 (liste), backend sınırları korunur | sayı değil / aralık dışı → varsayılan |
| `brandId`, `categoryId` | pozitif tam sayı | sayı değil → filtre yok sayılır (backend'e gönderilmez) |
| `minScore`, `maxScore` | -5..5 tam sayı | aralık dışı / sayı değil → yok sayılır |
| `radiusKm` (near) | 1..100'e sıkıştırılır | sayı değil → 10; ekranda sıkıştırılmış değer |
| `sort`, `dir` (`/brands`, `/providers`) | beyaz liste | listede yok → varsayılan sıralama |
| `lat`, `lon` (near) | sonlu sayı, -90..90 / -180..180 | geçersiz → konum isteme ekranı (mevcut davranış) |

## Ağır parçaların yüklendiği rotalar

| Parça | Yalnızca şu rotalarda |
|---|---|
| Leaflet JS + CSS (+ defaulticon CSS) | `/providers`, `/providers/[id]`, `/providers/near` |
| reCAPTCHA | `/providers/[id]` — yalnızca mount sonrası anonim kullanıcı + site key tanımlı (üyeye hiç inmez) |
| @stomp/stompjs | `/chat/[brandId]` |

## Önbellek

| Fetch | Önce | Sonra |
|---|---|---|
| meta (brands/categories) | revalidate 300 | aynı |
| providers listesi | revalidate 60 | aynı |
| provider detay / yorumlar | no-store | aynı (+ `cache()` ile istek içi tekilleştirme) |
| providers/near | revalidate 30 | **no-store** (Complexity Tracking) |
