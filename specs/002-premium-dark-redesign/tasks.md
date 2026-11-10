# Tasks: Premium Koyu Tema Yeniden Tasarım

**Input**: `specs/002-premium-dark-redesign/` — spec rev 2 (+ FR-002 katman/seçim maddesi), plan (rev 2, onay kapısı), research D1–D12, contracts/design-tokens.md, quickstart.md. Ön koşul: 001 tamamlanmış, `specs/001-ui-modernization/baseline.md` "Sonra" dolu.

**Tests**: Otomatik test çatısı yok → doğrulama betikleri (`token-lint`, `contrast-check`), lint/build, Lighthouse (a11y + perf), ekran görüntüleri, quickstart elle senaryoları.

**Kurallar (her görev)**: Yalnızca `contracts/design-tokens.md`'deki belirteçler; yeni paket yok (anayasa IV); URL/davranış değişmez (FR-017, istisna: a11y klavye/odak); Türkçe eğitici yorumlar korunur/güncellenir (FR-019); her yeni bileşen dosyası Türkçe başlık yorumu taşır; seçili durum ek göstergeli (D10); dokunma hedefi ≥ `--target-min` (D2).

**Commit dilimleri**: **D1** araçlar + temel (Faz 1–2) · **D2** referans ekranlar (Faz 3) — onaya kadar push yok · **D3** yayılım (Faz 5) · **D4** doğrulama + doküman (Faz 6).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup — doğrulama araçları

- [x] T001 [P] `scripts/contrast-check.mjs` (bağımlılıksız Node): `src/app/globals.css`'ten iki temanın belirteçlerini oku; OKLCH→sRGB (gamut dışı kırp), alfa'lıları alttaki yüzeyle karıştır; `--bg`'nin hex karşılığını yazdır (T014 kullanır); katman kontrolü sırası `bg → surface-1 → surface-2` (**glass hariç**); çiftler: {fg, fg-muted, fg-faint, accent-text} × {bg, surface-1, surface-2} ≥4.5; fg × accent-soft ≥4.5; {pos, neg} × {bg, surface-1} ≥3 (grafik/ikon); histogram çubuk renkleri × surface-1 ≥3; accent-fg × accent ≥4.5; {border-control, ring} × {bg, surface-1, surface-2} ≥3; {pos, neg, neutral} × kendi soft'u (bg üstünde karıştırılmış) ≥4.5; accent-text × accent-soft ≥4.5; FR-002: accent ailesi hue'ları ±5° (tek ton), katman |ΔL| ∈ [0.02, 0.05]. Çıktı: tablo + eşik altı listesi, eşik altı varsa exit 1 (D9)
- [x] T002 [P] `scripts/token-lint.mjs`: kapsam `src/**/*.css`, `src/**/*.tsx`; yakalar: ham renk (`#hex`, `rgb(`, `hsl(`, `oklch(`, `color-mix(`, adlandırılmış renkler, SVG `fill/stroke="#…"`), ham `px/rem/em`, ham süre, ham `box-shadow`; istisnalar: `:root`/`[data-theme]` belirteç tanım blokları, `@media`/`@container` koşulları, `0`, `1px`, `100%`, `0.01ms`, `currentColor`, `href="#…"`, `var(--…)` içeren değerler. Bulgu varsa exit 1 (D9)
- [x] T002a `scripts/measure.sh` repoda (001'de oturum scratchpad'inden repoya alındı; `MEASURE_OUT` ile çıktı dizini) — çalıştığını doğrula
- [x] T003 Ön kontrol: 001 çıktıları mevcut mu (`src/lib/params.ts`, `src/app/{theme,fonts}.ts`, `src/components/{RouteError,RecaptchaField,BrandProvidersToggle,ProviderMapClient}.tsx`, `src/app/providers/(list)/`, `src/app/providers/[id]/layout.tsx`, `src/app/{login,register,forgot-password}/*Form.tsx`, leaflet CSS `ProvidersMap.tsx`'te) — eksik varsa DUR ve raporla. Sonra araçları mevcut kod üzerinde çalıştır; rapor sayılarını en alttaki "Uygulama Notları"na "önce" olarak yaz (beklenen: çok sayıda bulgu)

---

## Phase 2: Foundational — belirteçler, temel, ortak bileşenler, kabuk

- [x] T004 `src/app/globals.css` belirteç katmanı: D2 tablolarındaki tüm belirteçleri (tip alt belirteçleri `-lh/-ls/-wt`, `--container`, `--header-h`, `--card-min`, `--sel-border-w`, `--indicator-h`, `--glass-filter`, `--map-dark-filter`, koyu temada `--shadow-1/2: none` dahil) `:root` (açık) ve `:root[data-theme="dark"]` (koyu; varsayılan HTML'de `data-theme="dark"` 001'den) olarak yeniden tanımla — renk, tipografi (`--type-*`, `--measure 62ch`), boşluk `--space-1..10`, köşe, gölge, `--scrim`, hareket, katman, kontrol/ikon (`--target-min 44px`, `--control-h`, `--control-h-sm`, `--icon-*`, `--ring-width`, `--ring-offset`); eski belirteç adlarını (`--bg-elev`, `--bg-sunken`, `--border`, `--border-strong`, `--accent-strong`, `--text-*`, `--radius`, `--dur`, `--ease`, `--header-bg`, `--shadow`, `--shadow-sm`, `--shadow-lg`) yeni adlara eşleyip tüm kullanımları güncelle (geçici takma ad bırakma); "turuncu" yorumlarını (≈229, 262, 340, 448) temizle
- [x] T005 `src/app/globals.css` temel katman: `body` (`--type-body`, satır yüksekliği 1.55), başlık kademeleri (`.display`, `.title`, `.headline`, h1–h3 varsayılanları), `:focus-visible { outline: var(--ring-width) solid var(--ring); outline-offset: var(--ring-offset) }` (box-shadow değil — forced-colors), `::selection`, reduced-motion kuralı korunur, `.container` (`--space-*` gutter), `.page`/`.section` (bölüm arası mobil `--space-8`, ≥ 768 px `--space-9`), `.prose { max-inline-size: var(--measure) }`, `.truncate`, `.clamp-2`, `.table-scroll` (D12)
- [x] T006 `src/app/globals.css` bileşen sınıfları belirteçlere: `.btn` (+primary = `--accent`/`--accent-fg`, outline = `--border-control`, ghost, danger, sm/lg/icon; yükseklik `--control-h`/`--control-h-sm`; `.btn-sm`, `.btn-icon` için `::after` ile ≥`--target-min` vuruş alanı), `.card`/`.card-hover` (`--surface-1`, `--hairline`, `--radius-lg`; açık temada `--shadow-1`), `.input/.select/.textarea/.field` (`--border-control`, placeholder `--fg-faint`), `.seg` ve `.chip` (seçili: `--accent-soft` + `--accent` kenar + 600 ağırlık — D10), `.alert*`, `.skeleton`, `table.data`, `.score-*`, `.histogram*`, `.chat-*`, `.auth-*`, `.room-card`, `.empty-state`, `.hero`; **ortak bileşen sınıfları** `.page-header`, `.empty-state`, `.dialog`, `.scrim`, `.pagination`, `.icon`, `.score-sign`, `.histogram-label`, `.skeleton-card/-list/-detail` (T007–T011a yalnızca `.tsx` yazar, CSS burada); select oku SVG'sindeki ham renk (`%23918d85`) → `currentColor`'lı maske/arka plan
- [x] T007 [P] (T006'dan sonra) `src/components/icons/` — elle SVG ikonlar (24 viewBox, `stroke="currentColor"`, stroke-width 1.75, yuvarlak uç; server component; prop: `size` → `--icon-*`, `title?` verilirse `<title>` + `role="img"`, yoksa `aria-hidden`): `Alert, Lock, Mail, Shield, Pin, Clock, CheckCircle, Check, Sun, Moon, Menu, Close, ChevronLeft, ChevronRight, ChevronDown, ArrowUp, ArrowDown, Search, Chat, Plus, Minus, Upload, Image, Video, WifiOff, Star, User`; `index.ts` adlandırılmış export (D4)
- [x] T008 [P] (T006'dan sonra) `src/components/PageHeader.tsx` (server): `title`, `subtitle?`, `actions?`; `.title` kademesi, alt başlık `--fg-muted` + `.prose` (D5)
- [x] T009 [P] (T006'dan sonra) `src/components/EmptyState.tsx` (server): `icon`, `title`, `description?`, `action?` (D5)
- [x] T010 [P] (T006'dan sonra) `src/components/Dialog.tsx` (`"use client"`): `open`, `onClose`, `labelledBy`, `children`; `--scrim` perde, `--surface-2` panel, `--shadow-pop`; Escape kapatır, odak tuzağı (Tab/Shift+Tab döngü), açılışta ilk odaklanabilir öğe, kapanınca odak tetikleyiciye döner, `role="dialog" aria-modal="true" aria-labelledby` (FR-010)
- [x] T011 [P] (T006'dan sonra) `src/components/ScoreBadge.tsx`: renk + işaret metni (`+3` / `−2` / `0`, gerçek eksi işareti) + `aria-label` ("Puan: artı 3"); `MiniHistogram.tsx` çubuklarına değer etiketi ve `aria-label` (D12); `RatingItem.tsx` kendi rozetini bırakıp `ScoreBadge` kullansın (FR-009/014)
- [x] T011a [P] (T006'dan sonra) `src/components/SkeletonBlocks.tsx` (YENİ): `SkeletonCard`, `SkeletonList`, `SkeletonDetail` — rota `loading.tsx`'leri bunları kullanır
- [x] T012 `src/components/Pagination.tsx`: görsel ortak bileşen; **varsayılan** `mode="url"` (mevcut çağıranlar — liste, detay yorumları, near, brands — değişmeden derlenir; anayasa II) ve `mode="callback"` (`page`, `totalPages`, `onPage(n)` — yerel durum, URL'e dokunmaz); oklar `ChevronLeft/Right` ikonu; seçili sayfa D10 göstergeli
- [x] T013 `src/components/Header.tsx` + `ThemeToggle.tsx`: cam üst bar (`.site-header` `--surface-glass`, `@supports` backdrop/-webkit-backdrop `saturate(180%) blur(12px)`, `prefers-reduced-transparency`/forced-colors/destek yok → opak `--surface-1` — D11), aktif bağlantı alt çizgi göstergesi (D10), mobil menü (burger `Menu`/`Close` ikonları, açık hali `--surface-2`, Escape kapatır, dokunma hedefleri), kullanıcı çipi, `Sun/Moon` ikonları; `src/app/layout.tsx` footer yeni sınıflarla
- [x] T014 `src/app/theme.ts`: `THEME_COLOR` = koyu `#070709`, açık `#f6f7f8` (yeni `--bg` hex karşılıkları — contrast-check çıktısıyla doğrula)
- [x] T015 `src/components/ProvidersMap.css` (YENİ) + `ProvidersMap.tsx`: harita stillerini bu dosyaya taşı ve `ProvidersMap.tsx`'ten import et; `.map-frame { isolation: isolate }`; koyu temada `.leaflet-container` zemini `--surface-1`, `.leaflet-tile-pane` filtresi `invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.92) saturate(0.6)`; zoom/atıf kontrolleri ve popup belirteçlerle; karo URL'i `https://tile.openstreetmap.org/{z}/{x}/{y}.png` (`{s}` yok), atıf `© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors` (D3)
- [x] T016 Kapı: `node scripts/contrast-check.mjs` 0 eşik altı; lint + build → **Commit D1** (`feat(ui): design tokens, base, icons, shared components, glass header`) — push YOK

---

## Phase 3: User Story 1 + 2 — Referans ekranlar (P1)

**Goal**: Ana sayfa, dükkan listesi, dükkan detayı yeni dilde; FR-002 değişmezleri ölçülmüş.

**Independent Test**: quickstart #1–#3; FR-002 kontrol listesi; contrast-check; ekran görüntüleri.

- [ ] T017 [US1] `src/app/page.tsx` vitrin: `.display` başlık + kısa açıklama + birincil CTA (usta bul) ilk ekranda (375×667, 1440×900); kategori chip rafı, marka/sohbet odası ızgarası, "nasıl çalışır" bölümü — `.section` aralıkları, `.prose`; hero'daki tek seferlik radial renk (`globals.css:≈453`) kaldırılır/belirteçle
- [ ] T018 [US2] `src/app/providers/(list)/page.tsx` + `loading.tsx` (`SkeletonBlocks`): `PageHeader`; sonuç yok → `EmptyState` (`Search` ikonu); `FilterBar.tsx` (seg/chip seçili D10, sıralama okları `ArrowUp/Down`, "Temizle" `Close` ikonu), `ProviderCard.tsx` (yeni kart, uzun ad `.clamp-2`), `Pagination mode="url"`, `MapSection.tsx` (harita kabı)
- [ ] T019 [US2] `src/app/providers/[id]/page.tsx` + `loading.tsx` (`SkeletonDetail`): başlık alanı, yorum yok → `EmptyState`, `ScoreBadge`, chip'ler, `MiniHistogram`, yorum listesi (`RatingItem`), harita; satır içi stiller sınıflara
- [ ] T020 [US2] `src/components/RateForm.tsx`: puan seçici ARIA radio group — roving tabindex (tek sekme durağı), ←/→/↑/↓ değer değiştirir, Home/End uçlar, seçili değerde `Check` ikonu + kalın sayı (D6, D10); `RecaptchaField.tsx` aktif temayı **kendi içinde** okur: `useSyncExternalStore(subscribe = MutationObserver(document.documentElement, {attributeFilter:["data-theme"]}), getSnapshot = dataset.theme, getServerSnapshot = "dark")`; widget `key={`${resetKey}-${theme}`}` ile yeniden oluşur (token kaybı bilinçli, D7); `RateForm` `theme` prop'u vermez
- [ ] T021 [US1] Ölçüm: contrast-check, FR-002 ekran görüntüsü kontrol listesi (bölüm aralığı ≥96/≥56 px, satır ≤75 karakter, vitrin 40/72 px, ilk ekran içeriği) — sonuçları Uygulama Notları'na; yerleşik tarayıcıyla `screenshots/{home,providers,provider-detail}-{dark,light}-{375,1440}.png` + `header-mobile-menu-{dark,light}-375.png`
- [ ] T022 [US1] D1 alternatifi: gümüş/krom vurgu belirteç setini geçici uygula (yalnızca `--accent*` değerleri), aynı 3 ekranı koyu temada 375/1440 çek → `screenshots/alt-silver/…`; belirteçleri mavi sete geri al
- [ ] T023 Kapı: lint + build → **Commit D2** (`feat(ui): reference screens — home, provider list, provider detail`) — push YOK

---

## Phase 4: 🚦 Tasarım onay kapısı (FR-021)

- [ ] T024 Kullanıcıya sun: belirteç tablosu (D2 özeti), contrast-check raporu, FR-002 ölçümleri, referans ekran görüntüleri (mavi) + gümüş alternatif + mobil menü. Soru: "Bu yönle tüm sayfalara yayalım mı?" (seçenekler: mavi onay / gümüş onay / değişiklik iste)
- [ ] T025 **DUR**: T024 sunulduktan sonra `/speckit-implement` burada durur ve kullanıcının yanıtını bekler (yanıt gelmeden hiçbir Faz 5 görevi başlatılmaz). Yanıt gelince: onay tarihini ve seçimi Uygulama Notları'na yaz; gümüş seçildiyse belirteçleri değiştir, T021 ölçümlerini tekrarla; değişiklik istendiyse Faz 2–3 ilgili görevlerini yeniden aç. **Onay olmadan Faz 5 başlamaz.**

---

## Phase 5: User Story 3 + 4 — Yayılım (P2)

**Goal**: Tüm rotalar ve kapsanan durumlar tek sistemden; açık tema birinci sınıf.

**Independent Test**: quickstart #4–#8; spec Edge Cases "kapsanan durumlar" listesi.

- [ ] T026 [P] [US3] (**bilinen sorun, 001 öncesinden**: `/brands` kartı 375 px'te 26 px yatay taşıyor — `.row-between` `flexWrap: nowrap` + logo/başlık/Sohbet/Ustalar; 001'de görünüm değişmesin diye bırakıldı, burada düzelt: dar ekranda eylemler alt satıra) `src/app/brands/page.tsx` + `loading.tsx` (`SkeletonBlocks`) + `BrandCard.tsx` + `BrandProvidersToggle.tsx`: `PageHeader`, kart, `Pagination mode="url"`, toggle satır içi stillerini sınıflara
- [ ] T027 [P] [US3] `src/app/providers/near/page.tsx` + `loading.tsx` (`SkeletonBlocks`) + `NearLocate.tsx`: `PageHeader`; konum durumları (izin bekleniyor / reddedildi / desteklenmiyor / alınıyor) `EmptyState` + `Pin`/`Alert`/`Clock` ikonları; elle yazılmış kartlar → `ProviderCard`
- [ ] T028 [P] [US3] `src/app/chat/page.tsx` + `loading.tsx` (`SkeletonBlocks`): `PageHeader`, oda kartları `BrandLogo` ile; `src/components/BrandLogo.tsx` 3 satır içi stil → sınıflar (boyut çalışma anı değeri `--logo-size`), baş harf avatarı yeni dilde
- [ ] T029 [US3] `src/components/ChatRoom.tsx` + `src/app/chat/[brandId]/page.tsx`: mesaj balonları, gönderme alanı, avatar `BrandLogo`; durumlar: kilitli (giriş yok / e-posta doğrulanmamış — `Lock`), dosya yükleniyor (`Upload` + ilerleme), görsel eki **en-boy korumalı ayrılmış kutu** (`aspect-ratio` + `object-fit: contain`, yüklenince kayma yok — 001'den devralınan CLS maddesi), video eki, boş oda `EmptyState`; 10 satır içi stil sınıflara. (Bağlantı durumu göstergesi kapsam dışı — spec Out of Scope; `chat.ts`'e dokunulmaz)
- [ ] T030 [P] [US3] Kimlik akışları: `src/app/login/{page,LoginForm}.tsx`, `register/{page,RegisterForm}.tsx` ("postanı kontrol et" ekranı `Mail` ikonu), `forgot-password/*`, `verify-email/{page,VerifyEmailClient}.tsx` (bekliyor `Clock` / başarılı `CheckCircle` / hata `Alert`), `reset-password/*`: ortalanmış `.auth-card`, alan hataları alan altında, gönderiliyor/devre dışı durumları
- [ ] T031 [US3] Admin: `src/app/admin/AdminShell.tsx` (`PageHeader`, sekmeler `.seg` D10, yetkisiz ekran `Shield` + `EmptyState`), `admin/ratings/page.tsx` (17 satır içi stil, log paneli → `Dialog`, `Pagination mode="callback"`), `admin/providers/page.tsx` (ham `<a>` → `Link`, `Pagination mode="callback"`), `admin/users/page.tsx` (yerel sayfalama → `Pagination mode="callback"`); `src/components/ConfirmButton.tsx` satır içi onay yeni dilde (satır içi stil → sınıf); tablolar `.table-scroll`; admin URL'leri değişmez
- [ ] T032 [P] [US3] Hata/404/iskeletler: `src/components/RouteError.tsx`, `src/app/not-found.tsx`, `src/app/global-error.tsx` (emoji → `Alert` ikonu, yeni dil), (`loading.tsx` dosyaları ilgili rota görevlerine aittir; `error.tsx`'ler RouteError'u yeniden dışa aktardığı için dokunulmaz)
- [ ] T033 [US4] Açık tema geçişi: tüm rotaları açık temada gez, eşik altı/dengesiz yerleri belirteç seviyesinde düzelt (bileşene özel renk yok); theme-color güncellemesi ve ilk boyama (yanıp sönme yok) kontrolü
- [ ] T034 [US3] Satır içi stil temizliği ve tarama: `grep -rnE "style=\{" src` ≤10 ve her biri "çalışma anı değeri" yorumlu; emoji/metin oku taraması `grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]|[→←↑↓✕]" src` = 0 (D8, D12)
- [ ] T035 Kapı: `node scripts/token-lint.mjs` 0, contrast-check 0, lint + build → **Commit D3** (`feat(ui): roll out premium dark design to all routes and states`)

---

## Phase 6: Polish & doğrulama

- [ ] T036 Ekran görüntüsü seti (SC-001): FR-008 rotaları + kapsanan durumlar × koyu/açık × 375/1440 → `screenshots/<rota>[--<durum>]-<tema>-<genişlik>.png` (ör. `chat-room--locked-dark-375.png`); 320 px'te tüm rotalarda yatay kaydırma yok (SC-006)
- [ ] T037 Lighthouse a11y ≥95 + axe 0 serious/critical: `/`, `/providers`, `/providers/<id>`, `/login`, `/chat/<brandId>` × iki tema (SC-002; `/chat/<brandId>` oturum açmış, e-postası doğrulanmış üyeyle — localStorage token'ı önceden ayarlanmış Chrome profili); dokunma hedefi (target-size); harita işaretçi kontrastı ≥3:1 koyu filtreli karo üzerinde (FR-007)
- [ ] T038 Performans bütçeleri (FR-018): 001'in `measure.sh`'ı aynı koşullarla → rota başına JS artışı ≤5 KB gzip, globals CSS gzip ≤ 001 sonucu × 1.5, LCP ≤2.5 sn, CLS <0.1; cam üst bar mobil TBT etkisi; sonuçlar `specs/002-premium-dark-redesign/measurements.md`
- [ ] T039 quickstart #1–#8 tam akış (kayıt→doğrulama→giriş→puan→sohbet→admin) iki temada
- [ ] T040 Doküman: `CLAUDE.md` "Tasarım Sistemi" bölümü (yeni belirteçler, ikonlar, ortak bileşenler, D10 seçim kuralı, harita koyu filtre + OSM politikası notu); `ui-designer.md` gerekirse
- [ ] T041 `frontend-reviewer` kod incelemesi (code modu) + ui-designer görsel incelemesi; BLOCKER/MAJOR düzelt
- [ ] T042 `/speckit-converge` → "Converged" → **Commit D4** (`docs(ui): redesign verification, screenshots, design system docs`)

---

## Dependencies & Execution Order

- Faz 1 → Faz 2 → Faz 3 → **Faz 4 (kullanıcı onayı)** → Faz 5 → Faz 6
- T004 → T005 → T006 (aynı dosya, sıralı); T007–T011a **T006'dan sonra** paralel (yalnız `.tsx`); T012 T007'ye; T013 T004–T007'ye; T015 T004'e
- T017–T020 Faz 2'ye; T021 → T022
- T018, T019 → T011a
- Faz 5: T026, T027, T028, T030, T032 paralel (her rota görevi kendi `loading.tsx`'inin sahibi); T029, T031 T010/T012'ye; T033, T034 diğer Faz 5 görevlerinden sonra

## Parallel Example: Phase 2

```text
Task: "T007 ikon seti"
Task: "T008 PageHeader"
Task: "T009 EmptyState"
Task: "T010 Dialog"
Task: "T011 ScoreBadge + histogram + RatingItem"
```

## Implementation Strategy

- Önce ölçüm araçları, sonra sistem, sonra 3 referans ekran → kullanıcı onayı → yayılım. Onaydan önce push yok; red durumunda yalnızca belirteç/temel ve 3 ekran yeniden çalışılır.

## Uygulama Notları

(T003 önce sayıları, T021 ölçümleri, T024–T025 onay kaydı burada.)

### T001–T003 — araçlar ve "önce" sayıları (2026-11-10)

- **T001** `scripts/contrast-check.mjs`: OKLCH→OKLab→sRGB (kanal kırpma), alfa'lılar gama-kodlu sRGB'de alttaki yüzeyle karıştırılır, WCAG 2.x oranı. Çiftler T001 listesindeki gibi; ek olarak rozet soft'u `--surface-1` üstünde de ölçülür (kart içindeki rozetler). Tanımsız belirteç = eşik altı (eski CSS'te de çalışsın diye). Dönüştürücü doğrulaması: eski `--bg` değerleri için `#120f0b` / `#fbfaf7` üretti — 001'in `theme.ts` hex'leriyle birebir aynı.
- **T002** `scripts/token-lint.mjs`: CSS bildirimleri + TSX `style={…}` nesneleri, SVG `fill/stroke/color` öznitelikleri ve string içindeki ham renkler. React'te sayı değerli boyut (`height: 32`) = px olarak sayılır. Bilinçli ek katılık: ham `blur()/saturate()/…` filtreleri (sözleşme "Gösterge/efekt" satırı) ve `var()` içeren değerlerdeki ham uzunluklar da yakalanır (ör. `calc(100dvh - var(--header-h) - 2rem)` → `2rem` bulgu). Yalnızca style içinde CSS değişkenine (`{"--h": …}`) verilen değerler çalışma anı değeri sayılır.
- **T002a** `scripts/measure.sh` çalışıyor: prod build + `npm run start` (:3000), `ROUTES="/" MEASURE_OUT=<scratchpad>/lh bash scripts/measure.sh pre002 1058` → `/`: Perf 98, LCP 2428 ms, CLS 0, TBT 22 ms, JS 148.7 KB, toplam 259.8 KB (002 öncesi ek referans). Global CSS (002 öncesi build): 21.6 KB ham / **6.0 KB gzip** → FR-018 tavanı ≈ 9.0 KB gzip.
- **T003** 001 çıktıları tam (params.ts, theme.ts, fonts.ts, RouteError, RecaptchaField, BrandProvidersToggle, ProviderMapClient, `providers/(list)/`, `providers/[id]/layout.tsx`, *Form.tsx'ler, leaflet CSS ProvidersMap.tsx'te). **Önce** sayıları:
  - contrast-check: **65 eşik altı** (koyu 32, açık 33; çoğu yeni belirteçlerin — surface-1/2, accent-text, border-control, neutral — tanımsız olmasından; tanımlı olanlarda örn. açık `--fg-faint × --bg` 3.78, açık `--ring × --bg` 1.81, koyu `--neg × --neg-soft` 4.47), exit 1.
  - token-lint: **269 bulgu** (globals.css 178, admin/ratings 17, providers/[id]/page 10, ChatRoom 9, …), exit 1.
  - `grep -rnE "style=\{" src | wc -l` = **128**; emoji/metin oku taraması = **25**.

### T004–T016 — temel (Faz 2) kararları ve ölçümler

- **T004** Belirteçler D2 tablolarıyla birebir (renk, tip alt belirteçleri, boşluk, köşe, gölge, hareket, katman, kontrol/ikon, gösterge/efekt). Eski adlar kaldırıldı, takma ad bırakılmadı: `--bg-elev → --surface-1`, `--bg-sunken → --surface-2/--bg`, `--border → --hairline`, `--border-strong → --border-control`, `--accent-strong` (yok; gradyan kalktı), `--text-* → --type-*` (TSX'teki 7 `var(--text-2xl)` → `var(--type-title)`), `--radius → --radius-md`, `--ease → --ease-standard/--ease-out`, `--header-bg → --surface-glass`, `--shadow/-sm/-lg → --shadow-1/-2/-pop`. Metin olarak kullanılan `var(--accent)` (admin + detay, 4 yer) → `var(--accent-text)` (koyuda `--accent` dolgu rengi metin için AA altı). "Turuncu" yorumları dosya yeniden yazılırken temizlendi.
- **T005/T006** Ek kararlar: (1) Koyu temada birincil buton hover'ı zemini AÇMAZ — beyaz %6 katman beyaz metni 4.46:1'e düşürüyordu (betikle ölçüldü); koyuda hover 1px `--accent-text` kenar ışığı, açıkta `--neutral-soft` (siyah %5) katmanı (5.79:1). (2) `.btn-danger` dolu kırmızı yerine `--neg-soft` zemin + `--neg` metin/kenar (koyuda beyaz metin `--neg` üstünde AA altı kalıyordu). (3) Seçim kenarı (D10) `border` ile; seg/sayfalama öğelerinde kenar baştan saydam durur → seçimde boyut değişmez. (4) Select oku: data-URI SVG yerine `currentColor`'lı iki üçgen gradyan. (5) Marka logo pedi: açıkta `--surface-1`, koyuda `--fg` (ham `#f4f5f7` kaldırıldı). (6) Liste/kategori chip'leri ve seg/btn-sm/btn-icon görsel 36 px + `::after` 44 px vuruş alanı.
- **T007** 27 ikon `src/components/icons/{IconBase,icons}.tsx` + `index.ts` (tek dosyada adlandırılmış export'lar; IconBase `size`→`.icon-sm/md/lg`, `title` → `role="img"` + `<title>`).
- **T008–T011a** PageHeader'a sözleşmede olmayan tek isteğe bağlı `eyebrow` alanı eklendi (mevcut "Keşfet/Markalar/Topluluk" üst etiketleri metin değişmeden korunsun diye). ScoreBadge: `size` (sm/md/lg), `precision`, `count` verilmezse "oy" satırı yok; gerçek eksi U+2212; `role="img"` + `aria-label` ("Puan: artı 3.4, 12 oy"). MiniHistogram: `height` prop'u kaldırıldı (tek çağıran vermiyordu), çubuk yüksekliği `--h` CSS değişkeni (%), ul/li + her çubukta aria-label ve işaretli etiket.
- **T012** Pagination: `mode="url"` varsayılan (4 çağıran değişmeden derlendi), `mode="callback"`; < 640 px "Sayfa X / Y", ≥ 640 px numaralı pencere (1 … p−1 p p+1 … son), seçili `aria-current="page"` + D10.
- **T013** Cam üst bar `@supports` + reduced-transparency + forced-colors yedekleri; nav `aria-current`; mobil menü üst barın altında `position:absolute` panel (`--surface-2`, `--z-dropdown`), Escape kapatır ve odağı menü düğmesine verir, `aria-controls`; kullanıcı çipi `.user-chip` (satır içi stil kalktı). Footer `.footer-inner` + logo işareti, metin aynı.
- **T014** contrast-check çıktısı: koyu `--bg` = `#070709`, açık `--bg` = `#f6f7f8` → `THEME_COLOR` güncellendi.
- **T015** `ProvidersMap.css` (leaflet CSS'inden sonra import): zemin `--surface-1`, koyu karo filtresi `--map-dark-filter` yalnız `.leaflet-tile-pane`, zoom kontrolleri 44 px, atıf/popup belirteçle; karo URL'i `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, atıf "© OpenStreetMap contributors". `.map-frame { isolation: isolate }` globals'ta.
- **T016 kapı**: contrast-check **0 eşik altı** (en zayıf: koyu `--accent-fg × --accent` 4.92, `--border-control × --surface-2` 3.22; açık `--accent-text × --accent-soft@bg` 4.76, `--border-control × --surface-2` 3.19); lint 0 hata / 7 uyarı (taban); build ✓. token-lint 269 → 80 (globals.css 0; kalanlar Faz 3/5 sayfalarının satır içi stilleri). Global CSS 35.4 KB ham / **7.6 KB gzip** (tavan ≈ 9.0 KB).
