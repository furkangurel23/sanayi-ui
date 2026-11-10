# Ölçümler: 002-premium-dark-redesign (T037–T039)

Tarih: 2026-11-10. Koşullar 001 "Sonra" ile aynı: prod build (`npm run build` + `npm run start`, :3000), Node 24, yerel backend :8080 (seed), `scripts/measure.sh` (Lighthouse 12, mobil, simüle kısıtlama, 3 koşu medyan).

## FR-018 performans bütçeleri (T038)

| Rota | Perf | LCP (ms) | CLS | TBT (ms) | JS transfer (KB) | 001 "sonra" JS (KB) | Δ JS (KB, ≤ +5) | 001 LCP (ms) |
|---|---|---|---|---|---|---|---|---|
| / | 98 | 2492 | 0.000 | 18 | 148.3 | 148.7 | −0.4 ✓ | 2412 |
| /providers | 84 | **4636** ¹ | 0.000 | 42 | 198.0 | 197.9 | +0.1 ✓ | 5277 |
| /providers/1058 | 78 | **5335** ¹ | 0.000 | 131 | 559.7 | 558.0 | +1.7 ✓ | 5244 |
| /chat | 97 | 2513 | 0.000 | 23 | 147.1 | 145.9 | +1.2 ✓ | 2505 |
| /login | 98 | 2486 | 0.000 | 14 | 148.5 | 147.3 | +1.2 ✓ | 2348 |
| /brands | 96 | 2726 | 0.000 | 26 | 149.8 | 148.6 | +1.2 ✓ | 2727 |

¹ Karo `preconnect` sonrası (aşağıda). Önce: `/providers` 5045 ms, `/providers/1058` 5304 ms (aynı build, preconnect yok).

| Bütçe | Hedef | Sonuç |
|---|---|---|
| Rota başına ilk yük JS artışı | ≤ 5 KB gzip | ✅ en fazla +1.7 KB (`/providers/1058`) |
| Genel stil dosyası | ≤ 001 × 1.5 = 6.0 × 1.5 ≈ 9.0 KB gzip | ✅ 40.9 KB ham / **8.4 KB** gzip (−9) — tavana yakın, yeni stil eklerken dikkat |
| Harita stilleri yalnız harita rotalarında | — | ✅ `leaflet + ProvidersMap.css` parçası (12.9 KB / 3.1 KB gzip) yalnız `/providers`, `/providers/[id]`, `/providers/near`'da iniyor; `/`, `/login`, `/chat`, `/brands` HTML'inde yalnız global CSS |
| CLS < 0.1 | — | ✅ tüm rotalarda 0.000 |
| LCP ≤ 2.5 sn | — | (rev 3: harita rotaları mobilde ✅ 2494 / 2493 ms — aşağıda "rev 3") ⚠️ **Kısmi**: `/` 2492 ✓, `/login` 2486 ✓; `/chat` 2513 (+13 ms, 001'de de 2505 — gürültü sınırı); `/brands` 2726 ✗ (001: 2727, değişmedi); harita rotaları ✗ (aşağıda) |
| Yeni üçüncü taraf | yalnız karo sağlayıcısı | ✅ yeni kaynak yok (OSM zaten vardı; yalnız `preconnect` ipucu) |
| Cam üst bar mobil TBT etkisi | — | Ölçülebilir etki yok: TBT `/` 53 → 18, `/chat` 22 → 23, `/login` 19 → 14, `/brands` 21 → 26, detay 164 → 131 (koşu gürültüsü aralığında) |

### Harita rotalarında LCP (001 SC-004 kısmi, 001 T054)

- LCP öğesi iki rotada da **OSM karo görseli** (`img.leaflet-tile`, 256×256). Faz dağılımı (Lighthouse, ilk koşu): `/providers` TTFB 454 · Load Delay 1019 · Load Time 2438 · Render Delay 1682 ms; `/providers/1058` TTFB 453 · **Load Delay 3101** · Load Time 1539 · Render Delay 208 ms. Karo isteği, harita parçasının (`dynamic`, `ssr:false`) inip Leaflet'in kurulmasını bekliyor; detayda ayrıca anonim reCAPTCHA (≈400 KB JS) aynı ağ penceresini paylaşıyor.
- **Denendi ve tutuldu**: React 19 `preconnect("https://tile.openstreetmap.org")` — harita açıkken render sırasında (MapSection, ProviderMapClient); SSR'da `<head>`'e `<link rel="preconnect">` düşüyor, yalnız harita rotalarında (`/`'de 0). `/providers` 5045 → **4636 ms** (−409 ms); detay 5304 → 5335 (değişmedi — darboğaz bağlantı değil, parça bekleme).
- **Denendi ve geri alındı**: harita parçasını hidrasyonu beklemeden modül değerlendirmesinde `import()` ile başlatmak — detay 5335 → 5167 ms (gürültü aralığında), JS +2 KB, TBT 131 → 162. Fayda kanıtlanamadığı için kod sadeliği tercih edildi.
- **Yer ayırma**: harita kabı baştan `--map-h` yüksekliğinde iskeletle ayrılmış (CLS 0); ancak iskelet gradyanı LCP adayı sayılmaz ve kutudaki karo (65 536 px²) sayfadaki her metin bloğundan büyük olduğu için karo dışı bir LCP adayı ancak tasarım/davranış değişikliğiyle mümkün: (a) mobilde haritayı kapalı başlatmak (davranış — `showMap` varsayılanı), (b) haritayı sonuç listesinin altına taşımak (bilgi mimarisi — spec Out of Scope), (c) statik harita önizleme görseli (yeni üçüncü taraf/kaynak — FR-018). Üçü de bu özelliğin kapsamı dışında → **harita rotalarında LCP ≤ 2.5 sn sağlanamadı**; öneri: ayrı bir küçük özellik olarak (a) veya karo sunucusu/önizleme kararı (D3 notu: OSM politikası zaten üretimde ayrı karo sağlayıcısı gerektiriyor).

## Erişilebilirlik (T037)

### Lighthouse a11y (mobil; tema ve oturum `localStorage`'ı önceden ayarlanmış Chrome profiliyle, `--disable-storage-reset`; profil durumu son ekran görüntüsüyle doğrulandı)

| Rota | koyu | açık | Başarısız denetim |
|---|---|---|---|
| `/` | 100 | 100 | — |
| `/providers` | 96 | 96 | `target-size` (harita işaretçileri, aşağıda) |
| `/providers/1` | 100 | 100 | — |
| `/login` | 100 | 100 | — |
| `/chat/6` (üye, e-posta doğrulanmış) | 100 | 100 | — |

### axe-core 4.10 (wcag2a/aa, wcag21a/aa, **wcag22aa**, best-practice; 375 px; headless Chrome, prod)

21 URL × 2 tema (misafir + üye + admin; liste, boş sonuç, detay ×2, konum ×2, sohbet listesi/odası/boş oda, kimlik ×5, admin ×3 + yetkisiz, 404). İlk turda bulunan **moderate** ihlaller düzeltildi: `/brands` heading-order (kart başlığı h3 → h2), kilitli sohbet ve yetkisiz admin ekranında `page-has-heading-one` (görsel olarak gizli h1). Son durum:

- **0 critical, 0 moderate/minor**; **serious: yalnız `target-size`** — `/providers` (12 düğüm) ve `/providers/near?…` (14 düğüm), iki temada. Düğümlerin hepsi **üst üste binen Leaflet işaretçileri** (25×41 px, aynı sanayi sitesindeki dükkanlar). WCAG 2.5.8 "eşdeğer" istisnası: her işaretçinin dükkanı aynı sayfada ≥44 px kart bağlantısıyla erişilebilir. İşaretçileri klavye sırasından çıkarmak (`keyboard:false`) ya da kümelemek davranış/paket değişikliği olacağı için yapılmadı → **SC-002 "0 serious" bu iki harita rotasında karşılanmadı (bilinçli istisna, onay gerekir)**. Lighthouse puanı yine ≥95 (96).
- Dokunma hedefi: harita işaretçileri dışında axe `target-size` ihlali yok (küçük kontroller `::after` ile 44 px).

### Harita işaretçi kontrastı (FR-007, ≥ 3:1)

Leaflet varsayılan işaretçisi (mavi gövde `#2A81CB`, beyaz merkez) koyu filtreli (`--map-dark-filter`) karo renkleri üzerinde, filtre matrisleriyle hesaplandı (işaretçi bölmesi filtresiz — tarayıcıda doğrulandı):

| Filtreli OSM yüzeyi | mavi gövde | beyaz merkez |
|---|---|---|
| kara `#191714` | 4.33 | 17.8 |
| yol `#0a0a0a` | 4.80 | 19.8 |
| park/yeşil `#122312` / `#1b2a15` | 4.00 / 3.68 | 16.5 / 15.1 |
| yerleşim `#262525` | 3.72 | 15.3 |
| bina `#35302d` | 3.17 | 13.0 |
| su `#253a40` | **2.90** | 11.9 |
| ana yol `#5d392e` | **2.44** | 10.0 |
| otoyol `#784c54` | **1.72** | 7.1 |

→ Kısmi: gövde çoğu zeminde ≥3:1, su/ana yol/otoyol üzerinde altında; beyaz merkez her zeminde ≥7:1 olduğundan işaretçi tanınabilir kalıyor. Tam uyum için özel işaretçi ikonu (ör. beyaz kenarlı) gerekir — sonraki iş.

**rev 3 / T045 — `--marker-outline` sonrası (✅ FR-024)**: işaretçi görseline 4 yöne 1 px, bulanıklıksız `drop-shadow` konturu (belirteç, iki temada ayrı değer: açıkta koyu `oklch(0.21 0.005 260)`, koyuda açık `oklch(0.97 0.003 260)` — koyu kontur filtreli koyu karolar üstünde ayrışmazdı, siyah × su ≈ 1.8:1). Ölçüm (headless Chrome, `/providers/1058` 1440 px, işaretçinin %35 yüksekliğindeki piksel satırı, PNG çözülerek): açık tema karo `#f2dad9` → kontur `#1f2023` **12.26:1** (gövde 3.26); koyu tema karo `#2f2322` → kontur `#ececee` **12.86:1** (gövde 3.70). Ölçülen kontur renkleriyle OSM paleti üzerinde (kontur keskin ve opak olduğu için oran deterministik):

| Zemin | açık: kontur `#1f2023` | koyu (filtreli): kontur `#ececee` |
|---|---|---|
| kara | 14.19 | 15.16 |
| yerleşim | 12.25 | 12.96 |
| bina | 10.72 | 11.04 |
| park | 13.96 | 12.82 |
| **su** | **10.16** | **10.13** |
| **ana yol** | **11.86** | **8.52** |
| otoyol | 7.03 | 6.01 |

→ İşaretçi silüeti her zeminde ≥6:1 ile ayrışıyor (açık temada gövde tek başına su 2.57 / otoyol 1.78 idi). Ekran görüntüsü: `screenshots/providers--map-open-light-1440.png`.

## rev 3 — US5: mobilde kapalı harita + yol tarifi (T052, 2026-11-10)

Koşullar: prod build (`npm run build` + `next start`), Node 24, yerel backend :8080 (seed). Not: :3000'de başka bir oturumun `next dev` sunucusu çalıştığı için prod sunucusu **:3100**'de açıldı; `scripts/measure.sh` yalnız port değiştirilmiş bir kopyayla koşturuldu (Lighthouse 12, mobil, simüle kısıtlama, 3 koşu medyan). "Önce" sütunu aynı oturumda HEAD `673b4d1`'in ayrı bir worktree build'i (:3200) ile ölçüldü.

### Mobil LCP (FR-018 / SC-004, 001 T054 — T043 kapanışı)

| Rota | Önce (T038) | Önce (aynı oturum, 673b4d1) | **rev 3** | CLS | TBT (ms) | JS transfer (KB) | Toplam transfer (KB) | LCP öğesi |
|---|---|---|---|---|---|---|---|---|
| /providers | 4636 | 4631 | **2494** ✅ | 0.000 | 53 → 18 | 198.6 → **154.8** | 469.2 → 243.1 | karo → `<h1 class="title">` |
| /providers/1058 | 5335 | 5234 | **2493** ✅ | 0.000 | 108 → 84 | 559.9 → **515.4** | 834.5 → 728.9 | karo → kapalı harita kutusunun metni |

- Mobil LCP iki harita rotasında da ≤ 2.5 sn (sınırda: 2494 / 2493 ms; tek koşularda 2826 ve 2653 görüldü — medyan bütçe içinde). Lighthouse koşularında **0 OSM karo isteği** (önce 10) ve Leaflet parçası (≈ 44 KB) inmiyor; detayda kalan büyük kalem anonim reCAPTCHA.
- Masaüstü izleme (Lighthouse `--preset=desktop`): `/providers` 1321 → 1285 ms; `/providers/1058` 3 koşu: önce 1364/1380/1372, sonra 1397/1379/1375 ms → değişmedi (harita masaüstünde auto modda yine açık; karo `preconnect` korunuyor — `Link: <https://tile.openstreetmap.org>; rel=preconnect` başlığı auto ve `showMap=1`'de var, `showMap=0`'da yok).

### Davranış doğrulaması (headless Chrome + CDP, bağımlılıksız betik; yerleşik tarayıcı bölmesiyle çapraz kontrol)

| Kontrol | Sonuç |
|---|---|
| 375 px `/providers`, `/providers/near?lat=39.92&lon=32.85`, `/providers/1`, `/providers/1058` | harita kapalı, "Haritayı göster" görünür; **ağda OSM isteği 0**, indirilen JS'lerin hiçbiri Leaflet içermiyor (her chunk `leafletjs.com` imzası için tarandı), Leaflet CSS parçası yok; CLS 0; konsolda hydration uyarısı 0 (prod + `next dev`). Yerleşik tarayıcı (375×812): `/providers/1` `read_network_requests("openstreetmap")` → istek yok, konsol boş |
| 1440 px aynı rotalar | harita açık (Leaflet parçası 1, karo 18–22 istek), hydration uyarısı 0; CLS `/providers` ve detayda 0 |
| URL önceliği | `?showMap=1` 375 px'te açık (karo yükleniyor); `?showMap=0` 1440 px'te kapalı (Leaflet/karo yok) — near ve detayda da |
| Geri/ileri (375 px) | near ve detay: auto(kapalı) → "Haritayı göster" → `?…&showMap=1` açık → geri: auto kapalı → ileri: açık → "Haritayı gizle" → `showMap=0` kapalı ✓ (`scroll:false`) |
| Auto modda yeniden boyutlandırma | 375 → 1024: harita açılıyor, kap 960 / Leaflet 958 px (kenarlıklar), karolar sağ kenara kadar dolu; 1024 → 375 kapanıyor; tekrar 1024 doğru boyut. Açık tercihte (`showMap=1`) 375 → 1024: 341 → 958 px, karolar tam (ResizeObserver → `invalidateSize`) ✓ |
| ProviderCard (near, 375 px) | `a a` = 0 (iç içe bağlantı yok); kart ortasına tıklama → detay bağlantısı (`::after` örtüsü), alt köşe de karta ait; yol tarifi düğmesi kendi bağlantısına gidiyor; düğme 36 px + `::after` 44 px vuruş alanı; Tab ile odak: halka `::after`'da (2 px `--ring`, kartın çevresinde), Link'in kendi outline'ı yok |
| 320 px | near, detay, liste: yatay kaydırma yok (near kartlarında iki düğme alt alta sarıyor) |
| Masaüstü near CLS | 0.099 (footer kayması, `loading.tsx` akışı) — **önceden de aynı** (673b4d1 build'inde birebir 0.0989); bu değişiklikle ilgisiz, mobilde 0 |

### Yol tarifi bağlantıları (FR-023)

- Koordinatlı (`/providers/1`): `https://www.google.com/maps/dir/?api=1&destination=39.9776%2C32.754&travelmode=driving` · `https://maps.apple.com/?daddr=39.9776%2C32.754&dirflg=d`; `target="_blank" rel="noopener"`, 44 px; erişilebilir ad "Google Haritalar ile Ostim Honda Usta için yol tarifi (yeni sekmede açılır)" (görünür metinle başlar).
- Koordinatsız + adresli (geçici: `UPDATE providers SET location = NULL WHERE id = 1054`, sonra orijinal EWKB değeri geri yazıldı ve doğrulandı): harita bölümü yok; `…destination=100.%20Y%C4%B1l%20Bulvar%C4%B1%20No%3A14%2C%20Etimesgut%2C%20Ankara…` / `…daddr=<aynı>&dirflg=d` (adres ilçeyi zaten içerdiği için ilçe tekrar eklenmedi). Ekran görüntüsü: `provider-detail--directions-address-dark-375.png`. (Not: backend detay önbelleği 10 dk boyunca 1054'ü konumsuz döndürebilir — `expireAfterWrite=10m`.)
- Yakınımdakiler kartı ve harita popup'ı: aynı iki bağlantı (popup'ta DOM ile, `textContent`; 44 px; renk `--accent-text`).
- `node --test src/lib/directions.test.mjs`: 4/4 (koordinat, adres, adreste geçen ilçe, eksik/NaN).
- **Doğrulanmadı**: gerçek iOS/Android cihazda bağlantıların harita UYGULAMASINI açması (bu ortamda cihaz yok); masaüstü tarayıcıda URL'ler doğru biçimde üretildi ve yeni sekmede açılacak şekilde işaretlendi.

### FR-025 — işaretçi dokunma hedefi istisnası (T044 kararı)

Üst üste binen Leaflet işaretçileri (25×41 px) WCAG 2.5.8 "eşdeğer" istisnasıyla karşılanır: her işaretçinin dükkanı aynı sayfada ≥44 px kart bağlantısıyla erişilebilir ve rev 3 ile harita mobilde (dokunmatik ekranın asıl kullanıldığı yerde) varsayılan olarak kapalı başlar. axe `target-size` bulguları (yalnız harita açıkken, yalnız işaretçiler) bu istisna kapsamında kabul edilmiştir.

### Kapılar

token-lint 0 · contrast-check 0 eşik altı · lint 0 hata / 7 uyarı (taban) · `npm run build` ✓ · ekran görüntüleri: `providers--map-closed-{dark,light}-375.png`, `provider-detail--directions-{dark,light}-375.png`, `provider-detail--directions-address-dark-375.png`, `providers-near--directions-dark-375.png`, `providers--map-open-{dark,light}-1440.png`.

## Yatay kaydırma (SC-006) ve elle senaryolar (T039)

- **320 ve 375 px**: 26 URL (misafir/üye/admin, veri yüklendikten 2.5 sn sonra) × 2 genişlik = 52 kontrol, **0 taşma** (headless Chrome, `scrollWidth`).

| # | Senaryo | Sonuç |
|---|---|---|
| 1 | İlk ziyaret | Sunucu HTML'i `<html data-theme="dark">`, init script yalnız kayıtlı tercihi uygular (sistem teması yok sayılır); vitrin başlığı + açıklama + CTA ilk ekranda (T021) ✓ |
| 2 | Haritada tema değişimi (`/providers/1`, popup açık) | Karo filtresi `invert(1)…` ↔ `none`, 2 kare içinde (24 ms); harita bölmesi dönüşümü (konum/zoom), 8 karo ve **açık popup korundu**; işaretçi bölmesi filtresiz; `theme-color` `#070709` ↔ `#f6f7f8` ✓ |
| 3 | Puan seçici klavye | Tek sekme durağı (`tabIndex` 0 + 10×−1); → → = "eksi 3", End = "artı 5" (`aria-checked=true`), Home = "eksi 5" ✓ |
| 4 | Admin log paneli | Açılışta odak "Kapat"ta, Tab/Shift+Tab panelde kalıyor, Escape kapattı, odak "Log" düğmesine döndü, URL değişmedi ✓ (yerleşik tarayıcı) |
| 5 | Admin sayfalama | `/admin/providers` sayfa 2: tablo değişti, `aria-current` = 2, URL `/admin/providers` (?page yok) ✓ |
| 6 | 320 px | Yukarıda — 0 taşma ✓ |
| 7 | Hareket azalt | `prefers-reduced-motion: reduce` emülasyonunda 47 öğenin geçiş süresi 0.00001 s, `scroll-behavior: auto` ✓ |
| 8 | Tam akış | Atılabilir üye: kayıt (API) → doğrulama bağlantısı (konsol logu) → `/verify-email` ekranı otomatik giriş + yönlendirme ✓ → `/providers/1058` puan +4 + yorum "kaydedildi" ✓ → `/chat/6` mesaj gönderildi, canlı akışta göründü; görsel + video ekleri ayrılmış kutuda ✓ → çıkış → admin girişi (form) ✓ → `/admin/ratings` yorumu sil (satır içi onay) → "Silinmiş", log paneli `RATING_SOFT_DELETE` ✓. Akış koyu temada yürütüldü; açık tema aynı ekranların görüntü setiyle (iki tema) kontrol edildi. |

Notlar: yerleşik tarayıcı bölmesi gizliyken Next'in akış (streaming) içeriği açılmıyor (rAF durur) — haritalı sayfalarda iskelet kalıyordu; aynı sayfa headless Chrome'da ve görüntü setinde sorunsuz. Uygulama hatası değil, araç kısıtı.
