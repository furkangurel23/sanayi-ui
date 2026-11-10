# Research: 002-premium-dark-redesign

Tarih: 2026-11-10. Girdiler: spec rev 2, UI tasarım envanteri (denetim), `ui-designer` ajan yönü, 001 kararları (Geist latin-ext, RouteError/not-found, theme.ts, params, baseline.md).

## D1 — Görsel yön ve vurgu

- **Karar**: Apple Pro ürün sayfası dili: neredeyse siyah, hafif soğuk (hue 260) nötr zemin; yüzeyler açıklıkla katmanlanır, kenarlar saç teli (hairline) beyaz-alfa; tek vurgu tonu **mavi (hue ≈255)** iki rolde: dolgu (birincil buton, seçili durum) ve metin (bağlantı, vurgu metni). Mevcut gümüş/krom vurgu birincil butondan kalkar; "metal" hissi nötr yüzey katmanları ve ince parlak kenarlarla korunur.
- **Gerekçe**: Tek doymuş renk = netlik ve premium sadelik; mavi, puan anlam renkleriyle (yeşil/kırmızı) çakışmaz; koyu zeminde AA'yı kolay sağlar.
- **Alternatifler**: (a) Gümüş/krom vurgu korunur — koyu zeminde düşük doygunluk, birincil eylem zayıf kalıyor; (b) Endüstriyel amber — olumsuz/uyarı tonlarına çok yakın, anlam karışıyor. Onay kapısında (FR-021) kullanıcıya (a) ile karşılaştırmalı sunulur.

## D2 — Belirteç tablosu (FR-002 değişmezlerinin sayısal tanımı)

### Renk — koyu (varsayılan)

| Belirteç | Değer | Rol |
|---|---|---|
| `--bg` | `oklch(0.13 0.004 260)` | zemin (katman 0) |
| `--surface-1` | `oklch(0.17 0.005 260)` | kart / yükseltilmiş (katman 1, ΔL +0.04) |
| `--surface-2` | `oklch(0.21 0.006 260)` | açılır menü, dialog, hover (katman 2, ΔL +0.08) |
| `--surface-glass` | `oklch(0.13 0.004 260 / 0.72)` + `backdrop-filter: saturate(180%) blur(20px)` | üst bar (katman 3); destek yoksa opak `--surface-1` |
| `--fg` | `oklch(0.97 0.003 260)` | gövde metni |
| `--fg-muted` | `oklch(0.78 0.006 260)` | ikincil metin |
| `--fg-faint` | `oklch(0.66 0.008 260)` | yardımcı metin, placeholder (≥4.5:1 hedefi, doğrulanır) |
| `--hairline` | `oklch(1 0 0 / 0.10)` | dekoratif ayraç/kart kenarı (WCAG 1.4.11 kapsamı dışı: bileşeni tanımlamak için gerekli değil) |
| `--border-control` | `oklch(0.52 0.008 260)` | input/outline buton kenarı (≥3:1) |
| `--accent` | `oklch(0.58 0.19 255)` | dolgu (birincil buton, seçili seg) — üstünde `--accent-fg` beyaz ≥4.5:1 |
| `--accent-text` | `oklch(0.74 0.14 250)` | bağlantı/vurgu metni (≥4.5:1) |
| `--accent-soft` | `oklch(0.58 0.19 255 / 0.16)` | seçili satır, chip arka planı |
| `--ring` | `oklch(0.74 0.14 250)` (opak) | odak halkası (≥3:1) |
| `--pos` / `--pos-soft` | `oklch(0.76 0.17 150)` / `/0.16` | olumlu puan |
| `--neg` / `--neg-soft` | `oklch(0.70 0.19 25)` / `/0.16` | olumsuz puan |
| `--neutral` / `--neutral-soft` | `oklch(0.66 0.008 260)` / `oklch(1 0 0 / 0.06)` | nötr puan, hover zemini |

### Renk — açık

| Belirteç | Değer |
|---|---|
| `--bg` | `oklch(0.975 0.002 260)` |
| `--surface-1` | `oklch(1 0 0)` |
| `--surface-2` | `oklch(0.955 0.003 260)` |
| `--surface-glass` | `oklch(0.975 0.002 260 / 0.72)` + blur |
| `--fg` / `--fg-muted` / `--fg-faint` | `oklch(0.21 0.005 260)` / `oklch(0.42 0.008 260)` / `oklch(0.50 0.008 260)` |
| `--hairline` / `--border-control` | `oklch(0 0 0 / 0.10)` / `oklch(0.62 0.008 260)` |
| `--accent` / `--accent-text` | `oklch(0.53 0.19 255)` / `oklch(0.50 0.18 255)` |
| `--ring` | `oklch(0.50 0.18 255)` |
| `--pos` / `--neg` | `oklch(0.52 0.15 150)` / `oklch(0.53 0.20 25)` |

Katman farkı her iki temada aynı oranda (koyu: +0.04/+0.08 açıklık; açık: yüzey-1 en açık, yüzey-2 −0.02). Tüm metin/kontrol çiftleri implement sırasında betikle ölçülür (D9); eşik altı çıkan değer açıklık ekseninde ayarlanır, ton/doygunluk korunur.

### Tipografi (Geist, 001'den; yeni font yok)

| Belirteç | Değer | 375 px | 1440 px |
|---|---|---|---|
| `--type-display` | `clamp(2.5rem, 1.6rem + 3.85vw, 4.5rem)` / lh 1.05 / ls −0.035em / 650 | 40 px | 72 px |
| `--type-title` | `clamp(1.75rem, 1.4rem + 1.5vw, 2.5rem)` / lh 1.1 / ls −0.025em / 650 | 28 px | 40 px |
| `--type-headline` | `clamp(1.25rem, 1.15rem + 0.45vw, 1.5rem)` / lh 1.25 / ls −0.015em / 600 | 20 px | 24 px |
| `--type-body` | `1.0625rem` (17 px) / lh 1.55 | | |
| `--type-callout` | `0.9375rem` (15 px) / lh 1.5 | | |
| `--type-caption` | `0.8125rem` (13 px) / lh 1.4 / ls 0.01em | | |
| `--measure` | `68ch` (gövde satır uzunluğu ≤75 karakter) | | |

### Boşluk (4 px modüler dizi)

`--space-1..10` = 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 px. Bölüm arası: mobil `--space-8` (64 px ≥56), masaüstü `--space-9` (96 px). Kart iç boşluğu `--space-5`/`--space-6`. Bileşenler yalnızca bu belirteçleri kullanır.

### Köşe, gölge, hareket, katman

- Köşe: `--radius-sm 8`, `--radius-md 12`, `--radius-lg 20`, `--radius-xl 28`, `--radius-full 999`.
- Gölge: koyu temada derinlik yüzey açıklığı + hairline ile (gölge yalnız `--shadow-pop` dialog/açılır için `0 24px 48px -12px oklch(0 0 0 / 0.6)`); açık temada `--shadow-1/2` yumuşak.
- Hareket: `--dur-fast 150ms`, `--dur 220ms`, `--dur-slow 300ms`; `--ease-standard cubic-bezier(0.25, 0.1, 0.25, 1)`, `--ease-out cubic-bezier(0.22, 1, 0.36, 1)`. `prefers-reduced-motion` → tümü kapanır (mevcut kural korunur).
- Katman: `--z-header 50`, `--z-dropdown 60`, `--z-dialog 70`, `--z-toast 80`.

## D3 — Harita koyu tema

- **Karar**: Ek karo sağlayıcısı yok. OSM karoları korunur; koyu temada `.leaflet-tile-pane`'e CSS filtresi (`invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.92) saturate(0.6)`) `:root[data-theme="dark"]` altında uygulanır. Kontroller/popup/atıf stilleri harita CSS'inde (yalnızca harita rotalarında yüklenen dosya — 001 R4) belirteçlerle yeniden yazılır; işaretçiler filtre dışında (marker pane) kalır, kontrast korunur.
- **Gerekçe**: Tema değişimi anında (CSS, yeniden yükleme yok → FR-007 ≤1 sn ve durum korunur); yeni üçüncü taraf/kullanım şartı yok (FR-018); OSM atfı aynen kalır.
- **Alternatif**: CARTO dark_all — ticari kullanımda lisans gerektirir, ek DNS/bağlantı; reddedildi.

## D4 — İkonlar

- **Karar**: `src/components/icons/` altında elle yazılmış SVG bileşenleri (24×24 viewBox, `stroke="currentColor"`, `stroke-width 1.75`, yuvarlak uçlar); server component (hook yok); dekoratifte `aria-hidden`, anlamlıda `<title>`. Gerekli set: alert, lock, mail, shield, pin, clock (bekliyor), check-circle, sun, moon, menu, close, chevron-left/right/down, arrow-up/down (sıralama), search, chat, star/plus/minus (puan işareti), upload, image, video, wifi-off (bağlantı).
- **Gerekçe**: Anayasa IV (paket yok); yalnızca import edilen ikonlar pakete girer (ağaç sallama doğal); FR-018 JS bütçesi.

## D5 — Ortak bileşenler

| Bileşen | Sözleşme |
|---|---|
| `PageHeader` (server) | `title`, `subtitle?`, `actions?` — tüm liste sayfaları ve admin |
| `EmptyState` (server) | `icon`, `title`, `description?`, `action?` |
| `Skeleton` | mevcut `.skeleton` sınıfı + `SkeletonCard/List` kalıpları; tüm `loading.tsx`'ler bunları kullanır |
| `Pagination` | **görsel** ortak bileşen; `mode="url"` (mevcut davranış, anayasa II) ve `mode="callback"` (`onPage(n)` — admin yerel durum); admin URL'leri değişmez |
| `Dialog` (client) | `open`, `onClose`, `labelledBy`; Escape kapatır, odak tuzağı, kapanınca odak tetikleyene döner, arka plan `--surface-2` scrim; admin log paneli bunu kullanır |
| `ScoreBadge` | renk + işaret (`+3`, `−2`, `0`) + `aria-label="Puan: artı 3"`; `RatingItem` bunu kullanır |
| `ProviderCard` | near sayfası dahil tek kart |
| `BrandLogo` | sohbet avatarı dahil |
| `RouteError` / `not-found` / `global-error` | 001 bileşenleri yeniden stillenir, emoji → ikon |

## D6 — Puan seçici (RateForm)

- **Karar**: Mevcut `role="radiogroup"/"radio"` korunur; roving tabindex (tek sekme durağı), ←/→ ve ↑/↓ ile değer değişir, Home/End uçlara gider (WAI-ARIA radio group). FR-017 istisnası (erişilebilirlik davranışı).

## D7 — reCAPTCHA teması

- **Karar**: 001'in `RecaptchaField`'ına `theme` prop'u aktif temadan (`data-theme`) verilir; tema değişince `resetKey` ile yeniden oluşturulur.

## D8 — Satır içi stil temizliği

- **Karar**: Görsel amaçlı tüm `style={{…}}` sınıflara taşınır; kalan izinli satır içi değerler: histogram çubuk yüksekliği (`--h` CSS değişkeni olarak), logo boyutu, harita yüksekliği, ilerleme yüzdesi. Doğrulama: `grep -rn "style={{" src | wc -l` ≤10 ve her biri yorumla "çalışma anı değeri" olarak işaretli.

## D9 — Doğrulama araçları

- Kontrast: `scripts/contrast-check.mjs` (bağımlılıksız; OKLCH→sRGB dönüşümü + WCAG oranı) globals.css'teki belirteç çiftlerini her iki tema için ölçer, eşik altını listeler; ayrıca axe (Lighthouse a11y içinde) sayfa bazında.
- Belirteç dışı değer taraması: `scripts/token-lint.mjs` — `globals.css` ve `src/**/*.tsx` içinde belirteç tanım blokları dışında ham renk (`#`, `rgb(`, `oklch(`), px/rem boşluk ve süre değerlerini raporlar (istisnalar: `0`, `1px`, `100%`, çalışma anı değerleri).
- Ekran görüntüleri: yerleşik tarayıcı ile 375×812 ve 1440×900, iki tema (`localStorage.sanayiTheme`), `specs/002-premium-dark-redesign/screenshots/<rota>-<tema>-<genişlik>.png`.
- Performans: 001'in `measure.sh` betiği + `baseline.md` "sonra" değerleri (FR-018 bütçeleri).
