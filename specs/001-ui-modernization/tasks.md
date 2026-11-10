# Tasks: UI Bakım ve Performans Modernizasyonu

**Input**: `specs/001-ui-modernization/` (spec rev 2, plan rev 2, research R1–R19, contracts/routes.md, data-model.md, quickstart.md, baseline.md)

**Status**: rev 2 — speckit-analyze + frontend-reviewer (tasks) bulguları işlendi (route group ile 404, sıra/commit düzeltmesi, anayasa `/speckit-constitution` ile, BrandCard slot'ları, LCP kök neden görevi, `/brands` baz ölçümü, `parseSize`, sort beyaz listeleri).

**Tests**: Projede test çatısı yok, spec otomatik test istemiyor → test görevi yok. Doğrulama = faz kapılarında `npm run lint` (0 hata, ≤7 uyarı) + `npm run build` + quickstart elle senaryoları.

**Kurallar (her görev)**: Türkçe eğitici yorumları koru, davranış değiştiyse yorumu güncelle (R17); görünüm değişmez (FR-024); URL'ler değişmez (FR-022); yeni çalışma zamanı bağımlılığı yok; komutlar `source ~/.nvm/nvm.sh && nvm use` (Node 24) sonrası. grep doğrulamalarında `-w` kullan ve `globals.css`'i (tanımın kendisi) hariç tut.

**Fazlar uygulama sırasıyla yazılmıştır** (ID'ler = çalışma sırası). Commit dilimleri: **C1** ortam + bağımlılık + ölü kod (Faz 1–2) · **C2** hata/güvenlik düzeltmeleri (Faz 3–5) · **C3** performans (Faz 6) · **C4** ölçüm + dokümanlar (Faz 7).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup — çalışma ortamı ve bağımlılıklar

- [x] T001 Node 24 LTS kur ve sabitle: `nvm install 24`; repo köküne `.nvmrc` (içerik `24`); `package.json`'a `"engines": { "node": ">=24 <25" }`
- [x] T002 `.github/workflows/ci.yml`: `node-version: "20"` → `node-version-file: .nvmrc`; yorumu "Node 24 LTS, .nvmrc tek kaynak" olarak güncelle
- [x] T003 `package.json`: `next` 16.4.6, `eslint-config-next` 16.4.6, `react`/`react-dom` 19.3.1, `@types/react`/`@types/react-dom` ^19.3.0, `@types/node` ^24, `@types/leaflet` ^1.9.22, `@stomp/stompjs` ^7.5.0, `eslint` ^9.39.5, `typescript` `~6.0.3`; `zod` ve `react-leaflet` kaldır; `npm install` ile `package-lock.json` yenile
- [x] T004 Yükseltilmiş dokümanları oku (`node_modules/next/dist/docs/01-app/**/error.md`, `**/upgrading/version-16.md`, turbopack config sayfası): (a) `unstable_retry` 16.4.6'da hâlâ var mı (16.2.10'da `error.md:117`'de var) → varsa RouteError onu kullanır; (b) `turbopack.root` anahtarı. Kararları en alttaki "Uygulama Notları"na yaz
- [x] T005 `next.config.ts`: T004'te doğrulanan kök ayarını ekle (`turbopack: { root: __dirname }`); `npm run build` çıktısında "Detected additional lockfiles" uyarısı kalmasın (R18). `~/package-lock.json`'a DOKUNMA
- [x] T006 Kapı: `npm run lint` (0 hata, ≤7 uyarı) + `npm run build`

---

## Phase 2: User Story 4 — Güncel ve sade bağımlılıklar (P2) — ölü kod

**Goal**: Kullanılmayan dosya/kod/CSS yok. (Doküman senkronu Faz 7'de — anlattığı dosyalar o zaman var olur.)

**Independent Test**: `npm outdated` + grep'ler + lint/build.

- [x] T007 [P] [US4] Ölü dosyaları sil: `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`, `postcss.config.mjs`; çalışma ağacındaki `.DS_Store`'lar (git'te izlenmiyor). Önce her biri için `grep -rnw <ad> src public next.config.ts` = 0
- [x] T008 [P] [US4] Kullanılmayan export'ları sil: `src/lib/auth.ts` `authHeader()` (dikkat: `authHeaderFresh` ayrı fonksiyon, kalır), `src/lib/apiError.ts` `isErrorCode()` — önce `grep -rnw "authHeader\|isErrorCode" src` yalnızca tanımları göstermeli
- [x] T009 [P] [US4] `src/app/globals.css`: `.mono`, `.stack-lg`, `.field-error`, `.alert-info`, `.chat-pending`, `.divider` kurallarını sil. Doğrulama: `grep -rnw -- "mono\|stack-lg\|field-error\|alert-info\|chat-pending\|divider" src --include=*.tsx --include=*.ts` sınıf kullanımı göstermemeli (`brand-logo-mono`, `chat-day-divider` farklı sınıflardır, `-w` bunları ayırır — sonucu tek tek kontrol et); başka kural değişmesin
- [x] T010 [US4] `src/app/layout.tsx`: `Geist_Mono` import'unu, `geistMono` sabitini ve `body` className'deki mono değişkenini kaldır (`.mono` artık yok); mono/"turuncu" yorumlarını güncelle
- [x] T011 [US4] Kapı: `npm outdated` → yalnızca `typescript`, `eslint`, `@types/node`; `grep -rn "zod\|react-leaflet" src package.json` = 0; lint + build → **Commit C1** (`chore(ui): Node 24, Next 16.4.6, remove unused deps and dead code`)

---

## Phase 3: Foundational — paylaşılan yardımcılar

- [ ] T012 [P] `src/lib/params.ts` (R9), tek imza kümesi: `parsePage(v: unknown): number` (1-based ≥1; `0`/negatif/`abc`/dizi → 1); `parsePositiveId(v: unknown): number | undefined`; `parseSize(v: unknown, def: number, max: number): number` (1..max, geçersiz → def); `parseScore(v: unknown): number | undefined` (-5..5 tam sayı); `clampRadiusKm(n: number): number` (1..100) ve `parseRadiusKm(v: unknown): number` (geçersiz → 10, sonra clamp); `parseEnum<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T`. Her fonksiyonda Türkçe eğitici yorum
- [ ] T013 [P] `src/app/theme.ts`: `THEME_COLOR = { dark: "#…", light: "#…" }` (globals.css `--bg`: koyu `oklch(0.17 0.01 75)`, açık `oklch(0.985 0.004 85)` → hex'e çevir, yorumda kaynak) ve `themeInit` metni (kayıtlı tercihi `data-theme`'e yazar + `meta[name=theme-color]` `content`'ini günceller; hata/yok → koyu). `src/app/fonts.ts`: `export const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin", "latin-ext"] })` (R13)
- [ ] T014 `src/lib/api.ts`: `toPage0(page) = Math.max(0, page - 1)` ekle; `getBrands`, `getProviders`, `getProviderRatings` (hata: `Math.max(0, page) - 1` → -1), `getProvidersNear` bunu kullansın; `getProviderDetail`'i React `cache()` ile sar, backend 404 → `null`, diğer hatalar fırlatır (dönüş `ProviderDetailDto | null`); `getProvidersNear` → `cache: "no-store"`, yarıçap `clampRadiusKm` (R12); yorumları güncelle. Tip hatası veren çağıranları minimal uyarla (asıl değişiklik Faz 4'te)

---

## Phase 4: User Story 2 — Hatalı adres ve arıza durumunda doğru sayfa (P1)

**Goal**: Gerçek 404'ler, Türkçe ve tekrar denenebilir hata ekranları, zararsız parametreler, meta/yorum hatasında ayakta kalan sayfalar, JS'siz koyu tema + theme-color, çalışan admin log paneli.

**Independent Test**: quickstart #1–#5, #9, #10, #15–#17 + admin log paneli.

- [ ] T015 [US2] **404 BLOCKER düzeltmesi — route group**: `src/app/providers/loading.tsx` iç içe `[id]` segmentini de Suspense'e sarıyor (Next `loading.md`: loading iç içe layout'ları sarar) → `[id]` altındaki `notFound()` 200 akışı içinde kalır. Liste dosyalarını URL'i değiştirmeyen bir route group'a taşı: `git mv src/app/providers/page.tsx src/app/providers/(list)/page.tsx`, aynı şekilde `loading.tsx` ve `error.tsx`. `providers/near/` ve `providers/[id]/` yerinde kalır. `npm run build` rota tablosunda `/providers` hâlâ görünmeli
- [ ] T016 [US2] `src/app/providers/[id]/layout.tsx` oluştur (server): `parsePositiveId(params.id)` geçersizse `notFound()`; `await getProviderDetail(id)` (cache'li) `null` ise `notFound()`; `children` döndür. Türkçe yorum: neden layout'ta ve neden route group (T015) gerekli. Kontrol: kök `src/app/loading.tsx` yok (varsa aynı sorun)
- [ ] T017 [P] [US2] `src/components/RouteError.tsx` (`"use client"`): sabit Türkçe başlık "Bir şeyler ters gitti" + mesaj "Sayfa yüklenirken bir sorun oluştu. Lütfen tekrar deneyin."; ham `error.message` GÖSTERME (yalnızca `console.error(error)` + varsa küçük `error.digest`); "Tekrar dene" T004 kararına göre (`unstable_retry` yoksa `startTransition(() => { router.refresh(); reset(); })`); mevcut error.tsx sınıf/görünümünü koru (⚠️ emoji 002'de değişir)
- [ ] T018 [US2] `"use client";` + `export { default } from "@/components/RouteError";` içerikli error dosyaları: `src/app/brands/error.tsx`, `src/app/providers/(list)/error.tsx`, `src/app/providers/[id]/error.tsx`, `src/app/providers/near/error.tsx` ve yeni `src/app/error.tsx` (T015, T017'ye bağlı)
- [ ] T019 [P] [US2] `src/app/not-found.tsx`: Türkçe 404 ("Sayfa bulunamadı", ana sayfa + `/providers` bağlantıları, mevcut `.empty-state` / `.btn` sınıfları), `metadata.title = "Bulunamadı"`
- [ ] T020 [US2] `src/app/global-error.tsx` (`"use client"`): `<html lang="tr" data-theme="dark" suppressHydrationWarning>`, `<head>`'de `<meta name="theme-color" content={THEME_COLOR.dark} suppressHydrationWarning/>` + `themeInit` script'i, `<body className={geist.variable}>`, `globals.css` import, RouteError ile aynı içerik (T013, T017'ye bağlı)
- [ ] T021 [US2] `src/app/providers/[id]/page.tsx`: `generateMetadata` ve sayfa cache'li `getProviderDetail`'i kullansın (layout sonrası `null` olamaz — `notFound()` ile daralt ve yorumla); detay + yorumlar `Promise.all`, yorumlar `.catch(() => null)` → `null` ise yorum bölümünde `.alert-error` "Yorumlar şu anda yüklenemedi."; `page` = `parsePage`, `size` = `parseSize(sp.size, <mevcut varsayılan>, 50)` (satır ~45)
- [ ] T022 [US2] `src/app/providers/(list)/page.tsx`: `searchParams` → `parsePage`, `parseSize(sp.size, <mevcut varsayılan>, 50)`, `parsePositiveId` (brandId, categoryId), `parseScore` (min/max), sort: `sort` parametresi (çoklu olabilir) her biri `alan,yon` — alan beyaz listesi = FilterBar'daki sort seçenekleri (`src/components/FilterBar.tsx` `SORTS`/seçenek dizisinden oku) + `ratingCount`, `id`; yön `asc|desc`; geçersiz → mevcut varsayılan sıralama. Eski `sortField`/`sortDir` URL parametreleri bugün destekleniyorsa aynı şekilde desteklenmeye devam etsin (FR-022). Meta istekleri `.catch(() => [])` (FR-019). (`Promise.all` paralelleştirmesi Faz 6/T037'de)
- [ ] T023 [P] [US2] `src/app/brands/page.tsx`: `page`/`size` `params.ts` ile; `sort = parseEnum(sp.sort, ["name", "id"] as const, "name")`, `dir = parseEnum(sp.dir, ["asc", "desc"] as const, "asc")` (backend Brand alanları; listeyi `../sanayi` MetaController/BrandDto ile doğrula)
- [ ] T024 [P] [US2] `src/app/providers/near/page.tsx`: `lat`/`lon` sonlu ve aralıkta (-90..90 / -180..180) değilse mevcut konum isteme ekranı; `radiusKm = parseRadiusKm(sp.radiusKm)`; ekrandaki "Yarıçap: … km" sıkıştırılmış değeri göstersin (~satır 70); `page` = `parsePage`, `size` = `parseSize(...)` (~satır 31)
- [ ] T025 [US2] `src/app/layout.tsx`: `<html lang="tr" data-theme="dark" suppressHydrationWarning>`; `<head>` içinde **script'ten önce** `<meta name="theme-color" content={THEME_COLOR.dark} suppressHydrationWarning/>`, ardından `theme.ts`'ten `themeInit`; `viewport.themeColor` KULLANMA (T013)
- [ ] T026 [US2] `src/components/ThemeToggle.tsx`: tema değişince `meta[name="theme-color"]` `content`'ini `THEME_COLOR` ile güncelle; yorum ekle
- [ ] T027 [P] [US2] `src/lib/adminApi.ts:69` admin log yolu: `${BASE}/admin/logs/${ratingId}` → `${BASE}/admin/logs/${ratingId}/logs` (backend `ModerationLogController`: `@RequestMapping("/api/admin/logs")` + `@GetMapping("/{id}/logs")`); bugün log paneli 404 alıyor
- [ ] T028 [US2] Kapı: lint + build + prod sunucuda quickstart #1–#5, #9, #10, #15–#17 (`curl -s -o /dev/null -w "%{http_code}" localhost:3000/providers/999999` → 404, `/providers/abc` → 404, `/providers/<var olan id>` → 200, `/rastgele` → 404); admin olarak log paneli kayıt getiriyor; geçici `throw` ile global-error doğrulandı ve geri alındı

---

## Phase 5: User Story 3 — Güvenli harita popup'ı (P2)

- [ ] T029 [US3] `src/components/ProvidersMap.tsx` (~119–127): `bindPopup` HTML string yerine `document.createElement` ile DOM düğümü; **yalnızca mevcut üç satır** (ad — mevcut kalın biçim, ilçe/şehir, puan) `textContent` + `<br>`; yeni bağlantı/öğe EKLEME. Aynı dosyada ~157. satırdaki etkisiz Tailwind sınıf adlarını (`rounded-2xl border border-white/10`) yalnızca sil (FR-005)
- [ ] T030 [US3] Kapı: adı `<img src=x onerror=alert(1)>` olan geçici bir dükkanla (admin ya da geçici DB güncellemesi) popup düz metin, alert yok; veriyi geri al; lint + build → **Commit C2** (`fix(ui): real 404s, Turkish error boundaries, param parsing, popup XSS, theme-color, admin logs path`)

---

## Phase 6: User Story 1 — Sayfalar hızlı açılır (P1) 🎯 MVP

**Goal**: Logo ağırlığı, sıralı veri, gereksiz harita/reCAPTCHA/istemci JS'i, font alt kümesi ve metin LCP'sinin kök nedeni ele alınır; görünüm aynı.

**Independent Test**: quickstart #7, #8, #11, #12 + `measure.sh` (Faz 7).

- [ ] T031 [P] [US1] `brew install webp`; `scripts/optimize-logos.sh`: `public/brands/*.png` her dosyayı en-boy oranını koruyarak en uzun kenarı 96 px olacak şekilde (`sips -g pixelWidth -g pixelHeight` ile ölç, `cwebp -q 80 -m 6 -alpha_q 100 -resize <w> <h>`) `public/brands/<slug>.webp`'ye dönüştür; çalıştır; `du -ck public/brands/*.webp` toplam <300 KB, her dosya ≤10 KB (aşan olursa `-q 70` ile tekrar); PNG'leri sil (R3)
- [ ] T032 [US1] `src/components/BrandLogo.tsx`: yalnızca `src` uzantısı `.webp`; diğer `<img>` öznitelikleri/stilleri AYNEN; "PNG" yorumlarını güncelle (T031)
- [ ] T033 [US1] `src/components/ProvidersMap.tsx`: `leaflet/dist/leaflet.css` ve `leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css` import'larını dosyanın başına al; `src/app/globals.css` 1–2. satırdaki `@import`'ları sil (R4; T029'un popup değişikliğini koru)
- [ ] T034 [US1] `src/components/MapSection.tsx`: `ProvidersMap`'i `next/dynamic(() => import("./ProvidersMap"), { ssr: false, loading: () => <div className="skeleton" style={{height}}/> })` ile yükle (`height` MapSection'daki mevcut harita yüksekliği; dosya client değilse `"use client"` ekle); anayasa I yorumu. Bu, `/providers` ve `/providers/near`'ı (near `MapSection` kullanıyor, `near/page.tsx:73`) kapsar
- [ ] T035 [US1] `src/components/ProviderMapClient.tsx` (`"use client"`, aynı `dynamic` sarmalayıcı); `src/app/providers/[id]/page.tsx`'teki statik `ProvidersMap` import'unu (~satır 14) bununla değiştir
- [ ] T036 [P] [US1] `src/components/RecaptchaField.tsx` (`"use client"`): `react-google-recaptcha` statik import; prop'lar `siteKey`, `theme`, `onToken(token: string | null)`, `resetKey` (değişince `key` ile remount) (R5)
- [ ] T037 [US1] `src/app/providers/(list)/page.tsx`: marka, kategori ve dükkan isteklerini tek `Promise.all`'da topla (meta `.catch` T022'den korunur) (FR-009)
- [ ] T038 [US1] `src/components/RateForm.tsx`: statik `ReCAPTCHA` import'u ve `captchaRef` kaldır; `RecaptchaField`'ı `next/dynamic(..., { ssr: false })` ile yükle; mount bayrağı `const mounted = useSyncExternalStore(noop, () => true, () => false)` (useEffect + setState KULLANMA — lint uyarısını 8'e çıkarır); yalnızca `siteKey && mounted && !user` iken render; gönderim sonrası `resetKey` artır; token state'te (T036)
- [ ] T039 [P] [US1] `src/components/BrandProvidersToggle.tsx` (`"use client"`) — **kartın tamamını saran**, slot'lu bileşen: prop'lar `header: ReactNode` (logo + başlık bloğu), `actions: ReactNode` (Sohbet linki), `hasList: boolean`, `listId: string`, `children: ReactNode` (`<ul>` içeriği). Mevcut `BrandCard` DOM'unu birebir üretir: `.row-between(nowrap)` > [`header`] + [`.row(flexShrink:0)` > `actions` + buton (`btn btn-outline btn-sm`, `aria-expanded`, `aria-controls={listId}`, metin "Gizle"/"Ustalar")], altında `open` iken `<ul id={listId} className="stack-sm" style=(mevcut)>{children}</ul>` (kapalıyken render ETME — bugünkü davranış; HTML'e gizli liste koyma)
- [ ] T040 [US1] `src/components/BrandCard.tsx`: server component (`"use client"`, `useState` kaldır); `header`/`actions`/`<li>` listesini server'da üretip `BrandProvidersToggle`'a ver; görünüm ve DOM sırası aynı; eğitici yorumu güncelle (T039). Not: liste öğeleri RSC payload'unda kalır ama marka nesnesi client prop'u olarak serileştirilmez; kazanç Faz 7'de `/brands` ölçümüyle raporlanır
- [ ] T041 [P] [US1] `src/app/login/`: mevcut `page.tsx` içeriğini `LoginForm.tsx` (`"use client"`) dosyasına taşı; `page.tsx` server: `export const metadata = { title: "Giriş" }` + `<LoginForm/>` (R7)
- [ ] T042 [P] [US1] `src/app/register/`: aynı kalıp → `RegisterForm.tsx` + server `page.tsx` (`title: "Kayıt Ol"`)
- [ ] T043 [P] [US1] `src/app/forgot-password/`: aynı kalıp → `ForgotPasswordForm.tsx` + server `page.tsx` (`title: "Şifremi Unuttum"`)
- [ ] T044 [US1] `src/app/layout.tsx`: `next/font` `Geist`'i `src/app/fonts.ts`'ten (latin + latin-ext) kullan (T013)
- [ ] T045 [US1] **LCP kök neden analizi** (SC-004): metin LCP'lerinde süre "Render Delay" (`/` 4100 ms, `/login` 2071 ms — baseline.md). Prod build'de `npx lighthouse@12 ... --output=json` ile `largest-contentful-paint-element`, `mainthread-work-breakdown`, `bootup-time`, `font-display`, `render-blocking-resources` ve trace'i incele; nedeni bul (ör. font swap, hidrasyon/script değerlendirme süresi, büyük RSC payload, theme script) ve **görünümü değiştirmeden** gidermeyi dene (ör. yalnızca kullanılan font ağırlıkları, kritik olmayan client bileşenlerin ertelenmesi). Bulguları ve yapılanı "Uygulama Notları"na yaz; hedef ulaşılamıyorsa ölçülmüş nedenini baseline.md'ye yaz (SC-004 değerlendirmesi buna dayanır)
- [ ] T046 [US1] Kapı: lint + build; quickstart #7, #8, #11, #12; ağ panelinde `/`, `/login`, `/chat`'te leaflet/recaptcha/stomp yok; üyeye recaptcha inmiyor; `/brands` kart aç/kapa klavye ile → **Commit C3** (`perf(ui): webp logos, parallel data, lazy map & recaptcha, server BrandCard, auth metadata`)

---

## Phase 7: Polish & Cross-Cutting

- [ ] T047 Doküman senkronu: `CLAUDE.md` (Next 16.4 / React 19.3 / TS 6.0 / Node 24; react-leaflet yok → imperatif Leaflet + `dynamic(ssr:false)` sarmalayıcılar; `params.ts`; RouteError/not-found/global-error; `providers/(list)` route group + `[id]/layout.tsx` 404 kalıbı ve nedeni; admin rotaları `/admin/providers`, `/admin/users`); `README.md` (create-next-app şablonu yerine proje README'si: amaç, Node 24, `npm ci`, `npm run dev/build/lint`, env değişkenleri, backend bağlantısı)
- [ ] T048 Anayasa güncellemesi **`/speckit-constitution` ile** (Governance gereği; elle düzenleme yok): Kalite Kapıları'na "Node 24 LTS (`.nvmrc`)" ve "lint: 0 hata, uyarı sayısı artmaz", I. ilkeye "konuma özel sorgular `no-store` olabilir" istisnası; sürüm 1.2.0 + Sync Impact Report
- [ ] T049 Prod build + `measure.sh after <id>` (rotalar + `ROUTES=/brands` ayrıca); `baseline.md` "Sonra" tablosu, SC-001…SC-004 önce/sonra; SC-002 quickstart `curl` yöntemiyle
- [ ] T050 Görünüm regresyonu: tüm rotalar koyu + açık, 375 px ve masaüstü; baseline commit'i (`git worktree add /tmp/ui-before 8aa81c2`) ile yan yana — fark yalnızca yeni 404/hata ekranları
- [ ] T051 quickstart #13, #14, #18 tam akış (kayıt → doğrulama → giriş → puan → sohbet → admin)
- [ ] T052 `frontend-reviewer` ile kod incelemesi (code modu, `git diff 89a6e7d..HEAD -- . ':!specs'`); BLOCKER/MAJOR bulguları düzelt
- [ ] T053 `/speckit-converge`; "Converged" olana kadar eksikleri tamamla → **Commit C4** (`docs(ui): measurements, CLAUDE.md, README, constitution 1.2.0`)

---

## Dependencies & Execution Order

Fazlar yukarıdan aşağı uygulanır (ID sırası = çalışma sırası). Faz içi bağımlılıklar:

- T003 → T004 → T005 → T006
- T012, T013 → T014 → Faz 4
- T015 → T016, T018, T022; T017 → T018, T020; T013 → T020, T025 → T026
- T029 (popup) → T033 (aynı dosya, T029 değişikliği korunur)
- T031 → T032; T033 → T034, T035; T036 → T038; T039 → T040; T022 → T037; T013 → T044
- T047 → T048 → T049 → T050 → T051 → T052 → T053

### Paralel fırsatlar

- Faz 2: T007, T008, T009
- Faz 3: T012, T013
- Faz 4: T017, T019, T023, T024, T027
- Faz 6: T031, T036, T039, T041, T042, T043

## Parallel Example: User Story 1

```text
Task: "T031 logoları WebP'ye çevir"
Task: "T036 RecaptchaField.tsx"
Task: "T039 BrandProvidersToggle.tsx"
Task: "T041 login page + LoginForm"
Task: "T042 register page + RegisterForm"
Task: "T043 forgot-password page + ForgotPasswordForm"
```

## Implementation Strategy

- Önce düşük riskli zemin (C1), sonra davranış düzeltmeleri (C2), sonra performans (C3), en son ölçüm/doküman (C4). Her commit kendi başına lint + build geçer ve tek başına geri alınabilir.
- US1 (MVP değeri) ölçülebilir faydasıyla Faz 7'de raporlanır.

## Uygulama Notları

(T004, T045 kararları ve uygulama sırasında öğrenilenler buraya yazılır.)

### T004 — Next 16.4.6 doküman kontrolü
- (a) **`unstable_retry` artık yok, yerine kararlı `retry` var.** `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md` Version History: "v16.2.0 `unstable_retry` prop added", "v16.3.0 `retry` prop became stable". Çalışma zamanı (`dist/client/components/error-boundary.js`) `retry = () => startTransition(() => { router.refresh(); reset(); })` — yani bizim yedek planımızın birebir aynısı, resmi API olarak. **Karar**: RouteError ve global-error `retry` prop'unu kullanır; elle `router.refresh()` yazılmaz. Ayrıca prop tipi `error: unknown` (istemci bileşeninde `throw` edilen değer `Error` olmayabilir) → `digest` okunmadan önce `instanceof Error` ile daraltılır.
- (b) **`turbopack.root`** 16.4.6'da geçerli üst düzey anahtar (`05-config/01-next-config-js/turbopack.md`: "Sets the application root directory. Should be an absolute path."). **Karar**: `turbopack: { root: __dirname }` (next.config.ts derlenirken `__dirname` tanımlı; doküman örneği de `__dirname` kullanıyor).
- Not: `npm install` sonrası `npm audit` 13 bulgu (9 moderate, 4 high) gösteriyor; hepsi geliştirme araçlarının geçişli bağımlılıkları (brace-expansion, browserslist, @humanfs/node, baseline-browser-mapping …). Görev kapsamında olmadığı için `npm audit fix` çalıştırılmadı — ayrı bakım işi.
