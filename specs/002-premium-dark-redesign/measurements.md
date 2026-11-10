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
| LCP ≤ 2.5 sn | — | ⚠️ **Kısmi**: `/` 2492 ✓, `/login` 2486 ✓; `/chat` 2513 (+13 ms, 001'de de 2505 — gürültü sınırı); `/brands` 2726 ✗ (001: 2727, değişmedi); harita rotaları ✗ (aşağıda) |
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
