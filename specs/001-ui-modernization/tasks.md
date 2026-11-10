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

- [x] T012 [P] `src/lib/params.ts` (R9), tek imza kümesi: `parsePage(v: unknown): number` (1-based ≥1; `0`/negatif/`abc`/dizi → 1); `parsePositiveId(v: unknown): number | undefined`; `parseSize(v: unknown, def: number, max: number): number` (1..max, geçersiz → def); `parseScore(v: unknown): number | undefined` (-5..5 tam sayı); `clampRadiusKm(n: number): number` (1..100) ve `parseRadiusKm(v: unknown): number` (geçersiz → 10, sonra clamp); `parseEnum<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T`. Her fonksiyonda Türkçe eğitici yorum
- [x] T013 [P] `src/app/theme.ts`: `THEME_COLOR = { dark: "#…", light: "#…" }` (globals.css `--bg`: koyu `oklch(0.17 0.01 75)`, açık `oklch(0.985 0.004 85)` → hex'e çevir, yorumda kaynak) ve `themeInit` metni (kayıtlı tercihi `data-theme`'e yazar + `meta[name=theme-color]` `content`'ini günceller; hata/yok → koyu). `src/app/fonts.ts`: `export const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin", "latin-ext"] })` (R13)
- [x] T014 `src/lib/api.ts`: `toPage0(page) = Math.max(0, page - 1)` ekle; `getBrands`, `getProviders`, `getProviderRatings` (hata: `Math.max(0, page) - 1` → -1), `getProvidersNear` bunu kullansın; `getProviderDetail`'i React `cache()` ile sar, backend 404 → `null`, diğer hatalar fırlatır (dönüş `ProviderDetailDto | null`); `getProvidersNear` → `cache: "no-store"`, yarıçap `clampRadiusKm` (R12); yorumları güncelle. Tip hatası veren çağıranları minimal uyarla (asıl değişiklik Faz 4'te)

---

## Phase 4: User Story 2 — Hatalı adres ve arıza durumunda doğru sayfa (P1)

**Goal**: Gerçek 404'ler, Türkçe ve tekrar denenebilir hata ekranları, zararsız parametreler, meta/yorum hatasında ayakta kalan sayfalar, JS'siz koyu tema + theme-color, çalışan admin log paneli.

**Independent Test**: quickstart #1–#5, #9, #10, #15–#17 + admin log paneli.

- [x] T015 [US2] **404 BLOCKER düzeltmesi — route group**: `src/app/providers/loading.tsx` iç içe `[id]` segmentini de Suspense'e sarıyor (Next `loading.md`: loading iç içe layout'ları sarar) → `[id]` altındaki `notFound()` 200 akışı içinde kalır. Liste dosyalarını URL'i değiştirmeyen bir route group'a taşı: `git mv src/app/providers/page.tsx src/app/providers/(list)/page.tsx`, aynı şekilde `loading.tsx` ve `error.tsx`. `providers/near/` ve `providers/[id]/` yerinde kalır. `npm run build` rota tablosunda `/providers` hâlâ görünmeli
- [x] T016 [US2] `src/app/providers/[id]/layout.tsx` oluştur (server): `parsePositiveId(params.id)` geçersizse `notFound()`; `await getProviderDetail(id)` (cache'li) `null` ise `notFound()`; `children` döndür. Türkçe yorum: neden layout'ta ve neden route group (T015) gerekli. Kontrol: kök `src/app/loading.tsx` yok (varsa aynı sorun)
- [x] T017 [P] [US2] `src/components/RouteError.tsx` (`"use client"`): sabit Türkçe başlık "Bir şeyler ters gitti" + mesaj "Sayfa yüklenirken bir sorun oluştu. Lütfen tekrar deneyin."; ham `error.message` GÖSTERME (yalnızca `console.error(error)` + varsa küçük `error.digest`); "Tekrar dene" T004 kararına göre (`unstable_retry` yoksa `startTransition(() => { router.refresh(); reset(); })`); mevcut error.tsx sınıf/görünümünü koru (⚠️ emoji 002'de değişir)
- [x] T018 [US2] `"use client";` + `export { default } from "@/components/RouteError";` içerikli error dosyaları: `src/app/brands/error.tsx`, `src/app/providers/(list)/error.tsx`, `src/app/providers/[id]/error.tsx`, `src/app/providers/near/error.tsx` ve yeni `src/app/error.tsx` (T015, T017'ye bağlı)
- [x] T019 [P] [US2] `src/app/not-found.tsx`: Türkçe 404 ("Sayfa bulunamadı", ana sayfa + `/providers` bağlantıları, mevcut `.empty-state` / `.btn` sınıfları), `metadata.title = "Bulunamadı"`
- [x] T020 [US2] `src/app/global-error.tsx` (`"use client"`): `<html lang="tr" data-theme="dark" suppressHydrationWarning>`, `<head>`'de `<meta name="theme-color" content={THEME_COLOR.dark} suppressHydrationWarning/>` + `themeInit` script'i, `<body className={geist.variable}>`, `globals.css` import, RouteError ile aynı içerik (T013, T017'ye bağlı)
- [x] T021 [US2] `src/app/providers/[id]/page.tsx`: `generateMetadata` ve sayfa cache'li `getProviderDetail`'i kullansın (layout sonrası `null` olamaz — `notFound()` ile daralt ve yorumla); detay + yorumlar `Promise.all`, yorumlar `.catch(() => null)` → `null` ise yorum bölümünde `.alert-error` "Yorumlar şu anda yüklenemedi."; `page` = `parsePage`, `size` = `parseSize(sp.size, <mevcut varsayılan>, 50)` (satır ~45)
- [x] T022 [US2] `src/app/providers/(list)/page.tsx`: `searchParams` → `parsePage`, `parseSize(sp.size, <mevcut varsayılan>, 50)`, `parsePositiveId` (brandId, categoryId), `parseScore` (min/max), sort: `sort` parametresi (çoklu olabilir) her biri `alan,yon` — alan beyaz listesi = FilterBar'daki sort seçenekleri (`src/components/FilterBar.tsx` `SORTS`/seçenek dizisinden oku) + `ratingCount`, `id`; yön `asc|desc`; geçersiz → mevcut varsayılan sıralama. Eski `sortField`/`sortDir` URL parametreleri bugün destekleniyorsa aynı şekilde desteklenmeye devam etsin (FR-022). Meta istekleri `.catch(() => [])` (FR-019). (`Promise.all` paralelleştirmesi Faz 6/T037'de)
- [x] T023 [P] [US2] `src/app/brands/page.tsx`: `page`/`size` `params.ts` ile; `sort = parseEnum(sp.sort, ["name", "id"] as const, "name")`, `dir = parseEnum(sp.dir, ["asc", "desc"] as const, "asc")` (backend Brand alanları; listeyi `../sanayi` MetaController/BrandDto ile doğrula)
- [x] T024 [P] [US2] `src/app/providers/near/page.tsx`: `lat`/`lon` sonlu ve aralıkta (-90..90 / -180..180) değilse mevcut konum isteme ekranı; `radiusKm = parseRadiusKm(sp.radiusKm)`; ekrandaki "Yarıçap: … km" sıkıştırılmış değeri göstersin (~satır 70); `page` = `parsePage`, `size` = `parseSize(...)` (~satır 31)
- [x] T025 [US2] `src/app/layout.tsx`: `<html lang="tr" data-theme="dark" suppressHydrationWarning>`; `<head>` içinde **script'ten önce** `<meta name="theme-color" content={THEME_COLOR.dark} suppressHydrationWarning/>`, ardından `theme.ts`'ten `themeInit`; `viewport.themeColor` KULLANMA (T013)
- [x] T026 [US2] `src/components/ThemeToggle.tsx`: tema değişince `meta[name="theme-color"]` `content`'ini `THEME_COLOR` ile güncelle; yorum ekle
- [x] T027 [P] [US2] `src/lib/adminApi.ts:69` admin log yolu: `${BASE}/admin/logs/${ratingId}` → `${BASE}/admin/logs/${ratingId}/logs` (backend `ModerationLogController`: `@RequestMapping("/api/admin/logs")` + `@GetMapping("/{id}/logs")`); bugün log paneli 404 alıyor
- [x] T028 [US2] Kapı: lint + build + prod sunucuda quickstart #1–#5, #9, #10, #15–#17 (`curl -s -o /dev/null -w "%{http_code}" localhost:3000/providers/999999` → 404, `/providers/abc` → 404, `/providers/<var olan id>` → 200, `/rastgele` → 404); admin olarak log paneli kayıt getiriyor; geçici `throw` ile global-error doğrulandı ve geri alındı

---

## Phase 5: User Story 3 — Güvenli harita popup'ı (P2)

- [x] T029 [US3] `src/components/ProvidersMap.tsx` (~119–127): `bindPopup` HTML string yerine `document.createElement` ile DOM düğümü; **yalnızca mevcut üç satır** (ad — mevcut kalın biçim, ilçe/şehir, puan) `textContent` + `<br>`; yeni bağlantı/öğe EKLEME. Aynı dosyada ~157. satırdaki etkisiz Tailwind sınıf adlarını (`rounded-2xl border border-white/10`) yalnızca sil (FR-005)
- [x] T030 [US3] Kapı: adı `<img src=x onerror=alert(1)>` olan geçici bir dükkanla (admin ya da geçici DB güncellemesi) popup düz metin, alert yok; veriyi geri al; lint + build → **Commit C2** (`fix(ui): real 404s, Turkish error boundaries, param parsing, popup XSS, theme-color, admin logs path`)

---

## Phase 6: User Story 1 — Sayfalar hızlı açılır (P1) 🎯 MVP

**Goal**: Logo ağırlığı, sıralı veri, gereksiz harita/reCAPTCHA/istemci JS'i, font alt kümesi ve metin LCP'sinin kök nedeni ele alınır; görünüm aynı.

**Independent Test**: quickstart #7, #8, #11, #12 + `measure.sh` (Faz 7).

- [x] T031 [P] [US1] `brew install webp`; `scripts/optimize-logos.sh`: `public/brands/*.png` her dosyayı en-boy oranını koruyarak en uzun kenarı 96 px olacak şekilde (`sips -g pixelWidth -g pixelHeight` ile ölç, `cwebp -q 80 -m 6 -alpha_q 100 -resize <w> <h>`) `public/brands/<slug>.webp`'ye dönüştür; çalıştır; `du -ck public/brands/*.webp` toplam <300 KB, her dosya ≤10 KB (aşan olursa `-q 70` ile tekrar); PNG'leri sil (R3)
- [x] T032 [US1] `src/components/BrandLogo.tsx`: yalnızca `src` uzantısı `.webp`; diğer `<img>` öznitelikleri/stilleri AYNEN; "PNG" yorumlarını güncelle (T031)
- [x] T033 [US1] `src/components/ProvidersMap.tsx`: `leaflet/dist/leaflet.css` ve `leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css` import'larını dosyanın başına al; `src/app/globals.css` 1–2. satırdaki `@import`'ları sil (R4; T029'un popup değişikliğini koru)
- [x] T034 [US1] `src/components/MapSection.tsx`: `ProvidersMap`'i `next/dynamic(() => import("./ProvidersMap"), { ssr: false, loading: () => <div className="skeleton" style={{height}}/> })` ile yükle (`height` MapSection'daki mevcut harita yüksekliği; dosya client değilse `"use client"` ekle); anayasa I yorumu. Bu, `/providers` ve `/providers/near`'ı (near `MapSection` kullanıyor, `near/page.tsx:73`) kapsar
- [x] T035 [US1] `src/components/ProviderMapClient.tsx` (`"use client"`, aynı `dynamic` sarmalayıcı); `src/app/providers/[id]/page.tsx`'teki statik `ProvidersMap` import'unu (~satır 14) bununla değiştir
- [x] T036 [P] [US1] `src/components/RecaptchaField.tsx` (`"use client"`): `react-google-recaptcha` statik import; prop'lar `siteKey`, `theme`, `onToken(token: string | null)`, `resetKey` (değişince `key` ile remount) (R5)
- [x] T037 [US1] `src/app/providers/(list)/page.tsx`: marka, kategori ve dükkan isteklerini tek `Promise.all`'da topla (meta `.catch` T022'den korunur) (FR-009)
- [x] T038 [US1] `src/components/RateForm.tsx`: statik `ReCAPTCHA` import'u ve `captchaRef` kaldır; `RecaptchaField`'ı `next/dynamic(..., { ssr: false })` ile yükle; mount bayrağı `const mounted = useSyncExternalStore(noop, () => true, () => false)` (useEffect + setState KULLANMA — lint uyarısını 8'e çıkarır); yalnızca `siteKey && mounted && !user` iken render; gönderim sonrası `resetKey` artır; token state'te (T036)
- [x] T039 [P] [US1] `src/components/BrandProvidersToggle.tsx` (`"use client"`) — **kartın tamamını saran**, slot'lu bileşen: prop'lar `header: ReactNode` (logo + başlık bloğu), `actions: ReactNode` (Sohbet linki), `hasList: boolean`, `listId: string`, `children: ReactNode` (`<ul>` içeriği). Mevcut `BrandCard` DOM'unu birebir üretir: `.row-between(nowrap)` > [`header`] + [`.row(flexShrink:0)` > `actions` + buton (`btn btn-outline btn-sm`, `aria-expanded`, `aria-controls={listId}`, metin "Gizle"/"Ustalar")], altında `open` iken `<ul id={listId} className="stack-sm" style=(mevcut)>{children}</ul>` (kapalıyken render ETME — bugünkü davranış; HTML'e gizli liste koyma)
- [x] T040 [US1] `src/components/BrandCard.tsx`: server component (`"use client"`, `useState` kaldır); `header`/`actions`/`<li>` listesini server'da üretip `BrandProvidersToggle`'a ver; görünüm ve DOM sırası aynı; eğitici yorumu güncelle (T039). Not: liste öğeleri RSC payload'unda kalır ama marka nesnesi client prop'u olarak serileştirilmez; kazanç Faz 7'de `/brands` ölçümüyle raporlanır
- [x] T041 [P] [US1] `src/app/login/`: mevcut `page.tsx` içeriğini `LoginForm.tsx` (`"use client"`) dosyasına taşı; `page.tsx` server: `export const metadata = { title: "Giriş" }` + `<LoginForm/>` (R7)
- [x] T042 [P] [US1] `src/app/register/`: aynı kalıp → `RegisterForm.tsx` + server `page.tsx` (`title: "Kayıt Ol"`)
- [x] T043 [P] [US1] `src/app/forgot-password/`: aynı kalıp → `ForgotPasswordForm.tsx` + server `page.tsx` (`title: "Şifremi Unuttum"`)
- [x] T044 [US1] `src/app/layout.tsx`: `next/font` `Geist`'i `src/app/fonts.ts`'ten (latin + latin-ext) kullan (T013)
- [x] T045 [US1] **LCP kök neden analizi** (SC-004): metin LCP'lerinde süre "Render Delay" (`/` 4100 ms, `/login` 2071 ms — baseline.md). Prod build'de `npx lighthouse@12 ... --output=json` ile `largest-contentful-paint-element`, `mainthread-work-breakdown`, `bootup-time`, `font-display`, `render-blocking-resources` ve trace'i incele; nedeni bul (ör. font swap, hidrasyon/script değerlendirme süresi, büyük RSC payload, theme script) ve **görünümü değiştirmeden** gidermeyi dene (ör. yalnızca kullanılan font ağırlıkları, kritik olmayan client bileşenlerin ertelenmesi). Bulguları ve yapılanı "Uygulama Notları"na yaz; hedef ulaşılamıyorsa ölçülmüş nedenini baseline.md'ye yaz (SC-004 değerlendirmesi buna dayanır)
- [x] T046 [US1] Kapı: lint + build; quickstart #7, #8, #11, #12; ağ panelinde `/`, `/login`, `/chat`'te leaflet/recaptcha/stomp yok; üyeye recaptcha inmiyor; `/brands` kart aç/kapa klavye ile → **Commit C3** (`perf(ui): webp logos, parallel data, lazy map & recaptcha, server BrandCard, auth metadata`)

---

## Phase 7: Polish & Cross-Cutting

- [x] T047 Doküman senkronu: `CLAUDE.md` (Next 16.4 / React 19.3 / TS 6.0 / Node 24; react-leaflet yok → imperatif Leaflet + `dynamic(ssr:false)` sarmalayıcılar; `params.ts`; RouteError/not-found/global-error; `providers/(list)` route group + `[id]/layout.tsx` 404 kalıbı ve nedeni; admin rotaları `/admin/providers`, `/admin/users`); `README.md` (create-next-app şablonu yerine proje README'si: amaç, Node 24, `npm ci`, `npm run dev/build/lint`, env değişkenleri, backend bağlantısı)
- [x] T048 Anayasa güncellemesi **`/speckit-constitution` ile** (Governance gereği; elle düzenleme yok): Kalite Kapıları'na "Node 24 LTS (`.nvmrc`)" ve "lint: 0 hata, uyarı sayısı artmaz", I. ilkeye "konuma özel sorgular `no-store` olabilir" istisnası; sürüm 1.2.0 + Sync Impact Report
- [x] T049 Prod build + `measure.sh after <id>` (rotalar + `ROUTES=/brands` ayrıca); `baseline.md` "Sonra" tablosu, SC-001…SC-004 önce/sonra; SC-002 quickstart `curl` yöntemiyle
- [x] T050 Görünüm regresyonu: tüm rotalar koyu + açık, 375 px ve masaüstü; baseline commit'i (`git worktree add /tmp/ui-before 8aa81c2`) ile yan yana — fark yalnızca yeni 404/hata ekranları
- [x] T051 quickstart #13, #14, #18 tam akış (kayıt → doğrulama → giriş → puan → sohbet → admin)
- [x] T052 `frontend-reviewer` ile kod incelemesi (code modu, `git diff 89a6e7d..HEAD -- . ':!specs'`); BLOCKER/MAJOR bulguları düzelt
- [x] T053 `/speckit-converge`; "Converged" olana kadar eksikleri tamamla → **Commit C4** (`docs(ui): measurements, CLAUDE.md, README, constitution 1.2.0`)

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

- **T050 (görsel kontrol, 2026-11-10)**: `/providers`, `/providers/1058` (koyu, masaüstü), `/chat`, `/brands` (açık, 375 px) yerleşik tarayıcıda kontrol edildi; görünüm beklenen. `/brands` kartlarında 375 px'te 26 px yatay taşma var — DOM 001 öncesiyle birebir (frontend-reviewer doğruladı), yani önceden var olan sorun; 002 T026'ya devredildi. Açık temada 2 theme-color meta (bilinen, zararsız).
- **T051**: kayıt (201) → backend konsol logundaki doğrulama bağlantısı → `/verify-email?token=…` → otomatik giriş + ana sayfaya yönlendirme yerleşik tarayıcıda doğrulandı (test kullanıcısı sonra silindi); giriş, puanlama (anonim), sohbet listesi, admin log yolu, 404/hata ekranları ve parametre doğrulama curl + tarayıcı ile doğrulandı (implementer + frontend-reviewer).
- **T052**: frontend-reviewer code modu → APPROVE (0 BLOCKER/MAJOR). MINOR (global-error retry sonrası tema) düzeltildi: `ThemeToggle` mount'ta `applyStoredTheme()`.

### T004 — Next 16.4.6 doküman kontrolü
- (a) **`unstable_retry` artık yok, yerine kararlı `retry` var.** `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md` Version History: "v16.2.0 `unstable_retry` prop added", "v16.3.0 `retry` prop became stable". Çalışma zamanı (`dist/client/components/error-boundary.js`) `retry = () => startTransition(() => { router.refresh(); reset(); })` — yani bizim yedek planımızın birebir aynısı, resmi API olarak. **Karar**: RouteError ve global-error `retry` prop'unu kullanır; elle `router.refresh()` yazılmaz. Ayrıca prop tipi `error: unknown` (istemci bileşeninde `throw` edilen değer `Error` olmayabilir) → `digest` okunmadan önce `instanceof Error` ile daraltılır.
- (b) **`turbopack.root`** 16.4.6'da geçerli üst düzey anahtar (`05-config/01-next-config-js/turbopack.md`: "Sets the application root directory. Should be an absolute path."). **Karar**: `turbopack: { root: __dirname }` (next.config.ts derlenirken `__dirname` tanımlı; doküman örneği de `__dirname` kullanıyor).
- Not: `npm install` sonrası `npm audit` 13 bulgu (9 moderate, 4 high) gösteriyor; hepsi geliştirme araçlarının geçişli bağımlılıkları (brace-expansion, browserslist, @humanfs/node, baseline-browser-mapping …). Görev kapsamında olmadığı için `npm audit fix` çalıştırılmadı — ayrı bakım işi.

### C1 commit notu (eşzamanlı oturum)
- C1 sırasında aynı depoda başka bir oturum `f3c3252 docs(specs): 002-premium-dark-redesign …` commit'ini attı; o anda index'te `git rm` ile hazırladığım T007 silmeleri (`public/{file,globe,next,vercel,window}.svg`, `postcss.config.mjs`) o commit'e girdi. C1 (`341fe68`) geri kalan her şeyi içerir. Geçmiş yeniden yazılmadı (diğer oturum aktifti). Sonraki commit'lerde yalnızca bu özelliğin yolları açıkça `git add` edildi.

### Faz 3–5 bulguları
- **`error.tsx` re-export'u çalışıyor**: `"use client"` + `export {default} from "@/components/RouteError"` Next 16.4.6'da sorunsuz (prod'da `/brands`'e geçici `throw` ile doğrulandı: Türkçe ekran, `Hata kodu: <digest>`, ham mesaj yok; "Tekrar dene" (`retry`) sunucu verisini yeniden çekip sayfayı getirdi).
- **global-error istemcide çizilir → script çalışmaz**: kök layout'a geçici `throw` ile prod'da sunucu yalnızca `<html id="__next_error__">` kabuğunu 500 ile döndürüyor; global-error tarayıcıda render ediliyor ve React'in eklediği `<script>` (themeInit) koşmuyor → açık tema seçen kullanıcı koyu görüyordu. Çözüm: `theme.ts`'e `applyStoredTheme()` eklendi, global-error onu `useLayoutEffect`'te çağırıyor (state yok → lint uyarısı artmadı). Doğrulandı: açık tercihte `data-theme=light`, meta `#fbfaf7`, Geist fontu, başlık "Bir şeyler ters gitti | Sanayi".
- **React 19 `<meta>` hoisting → açık temada çift theme-color**: React hidrasyonda hoistable `<meta>`'yı `content` değeriyle eşleştiriyor (`react-dom-client` `getHydratableHoistableCache("meta","content")`). Script content'i açık renge çevirince React eşleşme bulamayıp head'e ikinci bir meta (`#120f0b`) ekliyor. Tarayıcı ilk meta'yı kullandığı için görünür hata yoktu ama ikinci meta bayat kalıyordu. Çözüm: tüm güncellemeler `querySelectorAll` ile TÜM theme-color etiketlerini yazıyor (`setThemeColorMeta`), ThemeToggle mount effect'i de hidrasyon sonrası eşitliyor. Açık temada iki meta etiketi kalıyor (ikisi de doğru renkte); koyu temada tek. Tamamen tek etikete indirmek için meta'nın React dışında (script ile) oluşturulması gerekirdi → JS'siz theme-color kaybolurdu; tercih edilmedi.
- **Admin log yolu**: eski yol `/api/admin/logs/{id}` backend'de 500 dönüyordu (404 değil); yeni `/api/admin/logs/{id}/logs?entity=RATING` 200 + Page döndü (admin token ile `curl`). DB'de hiç `moderation_logs` kaydı olmadığından "kayıt getiriyor" boş sayfa ile doğrulandı; test verisi oluşturulmadı.
- **T028 curl sonuçları (prod)**: `/providers/999999`, `/providers/abc`, `/providers/0`, `/providers/-1`, `/rastgele` → 404 (Türkçe not-found, başlık "Bulunamadı | Sanayi"); `/providers/1058` → 200; `?page=0|-3|abc`, `/providers?brandId=abc&size=99999&page=abc`, `/brands?sort=evil&dir=x`, `/providers/near?lat=abc` (konum ekranı), `radiusKm=500` (ekranda "Yarıçap: 100 km") → 200. JS'siz HTML'de `<html lang="tr" data-theme="dark">` + tek `<meta name="theme-color" content="#120f0b">`. Tema değiştirince meta içerikleri değişiyor (tarayıcıda doğrulandı).
- **Doğrulanmayan**: quickstart #5 (meta servisleri kapalıyken liste) ve #15 (backend durdurulup RouteError) backend'e dokunmamak için çalıştırılmadı; kod yolu (`.catch(() => [])`, RouteError) yukarıdaki geçici-throw testiyle kapsandı.
- **T030 XSS**: 1058'in adı geçici olarak `<img src=x onerror=alert(1)>` yapıldı; `/providers/near?lat=39.9448531&lon=32.7167005&radiusKm=1` haritasında işaretçiye tıklanınca popup `<strong>&lt;img src=x onerror=alert(1)&gt;</strong><br>Etimesgut / Ankara`, `img` öğesi 0, alert çağrısı 0. Ad ve `updated_at` orijinal değerlerine geri yüklendi; backend brands/providers önbelleklerinde ve UI sayfalarında kalıntı yok (grep 0). Not: backend `providerDetail` Caffeine önbelleği yüzünden detay sayfası adı değişikliği göstermiyordu; bu yüzden no-store `near` rotası kullanıldı.

### T045 — LCP kök neden analizi (prod build, Lighthouse 12.8.2 simulate/mobile, yerel; resmi "Sonra" ölçümü T049'da)
| Rota | LCP önce (baseline) | LCP şimdi (koşular) | LCP öğesi / fazlar |
|---|---|---|---|
| / | 4210 | 2438, 2387, 2425 (medyan 2425) | hero `<p>`; TTFB 461, Render Delay ~1980 |
| /login | 2499 | 2327, 2250, 2339 (medyan 2327) | `<h1>`; Render Delay ~1870 |
| /chat | 3102 | 2573, 2578 | `p.muted`; Render Delay ~2118 |
| /brands | 3104 | 2750 (tek koşu) | `p.muted`; Render Delay ~2293 |
| /providers | 5760 | 4558 (tek koşu) | harita karosu (OSM) |
| /providers/1058 | 5071 | 5283 (tek koşu) | OSM karosu `img.leaflet-tile`; Load Delay 3417, Load Time 1238 |

- **Metin LCP'lerinde "Render Delay"in kök nedeni — Lantern simülasyonu + localhost**: gözlenen (kısıtlamasız) izde FCP = LCP = ~100–170 ms ve bu ilk boyama, tüm async JS parçaları (~143 KB) ve iki font dosyası indikten SONRA oluyor (localhost'ta her şey ilk kareden önce geliyor, Chrome async script'leri ilk boyamadan önce değerlendiriyor). Lighthouse'un simülasyonu, gözlenen LCP'den önce başlayan TÜM istekleri LCP'nin bağımlılığı sayar; 1.6 Mbps + 4x CPU kısıtlamasıyla bu, "JS indir + değerlendir" süresine (~1.9–2.1 sn) dönüşür → Render Delay. Yani metin LCP'si pratikte "ilk sayfa yükündeki JS + font + LCP öncesi görseller"in toplam boyutuna bağlı.
- **Önce → şimdi kazancın ana kaynağı**: LCP öncesi kritik yolda olan 38 logo PNG'si (~3 MB, ekrandakiler lazy olsa da ilk görünüm alanında) → WebP (~64 KB toplam). `/`: 4.2 → 2.4 sn. JS: `/` 157 → 149 KB, `/chat` 155 → 146 KB (harita CSS'i ve kodu artık global değil; mono font yok).
- **Denenen/değerlendirilen ve görünümü değiştirmeden yapılamayanlar**: (1) Font ağırlığı azaltma: Geist değişken font, alt küme başına TEK dosya (latin 29.8 KB + latin-ext 17.0 KB); ağırlık seçerek küçülmüyor. latin-ext FR-014 için zorunlu (+17 KB, ~85 ms simüle). (2) Fontları preload etmemek: geç swap = görünür yazı tipi değişimi/kayma riski → yapılmadı. (3) Kalan ~140 KB JS Next/React çalışma zamanı + Header/ThemeToggle (her rotada zorunlu); ertelenecek kritik olmayan client bileşeni kalmadı (harita, reCAPTCHA, BrandCard, auth formları zaten ayrıldı). (4) `/chat`'te LCP öncesi ~54 KB logo görseli de simülasyonda bant genişliğini paylaşıyor; `<img>` öznitelikleri T032 gereği değiştirilmedi.
- **Harita rotaları**: LCP üçüncü taraf OSM karosu. Leaflet artık `dynamic(ssr:false)` parçası olduğundan karo isteği "sayfa JS'i → harita parçası → Leaflet init → karo" zincirine bağlı (Load Delay ~3.4 sn). Kartın/haritanın ilk görünümde kapalı başlaması veya statik bir önizleme görseli görünüm değişikliği gerektirir → 002 kapsamında değerlendirilmeli. Detay sayfasında anonim + site key (`.env.local`) olduğu için reCAPTCHA (Google, ~400 KB JS) da iniyor — beklenen davranış (üye için inmiyor, aşağıda T046).
- **Sonuç**: `/` ve `/login` ≤2.5 sn hedefinde; `/chat` ~2.57 sn (hedefin ~70 ms üstü, ölçüm gürültüsü sınırında); harita rotaları hedefin üstünde, ölçülmüş nedeni yukarıda ve baseline.md'de. Kod değişikliği yapılmadı (görünüm koruma kısıtı).

### T046 kapı sonuçları
- lint: 0 hata, 7 uyarı (değişmedi); `npm run build` temiz (Next 16.4.6, lockfile uyarısı yok).
- #7: `/`, `/login`, `/chat`, `/brands` Lighthouse istek listelerinde leaflet/OSM/recaptcha isteği 0; bu rotaların HTML'indeki tüm `/_next` JS parçalarında leaflet/stomp/recaptcha imzası yok; global CSS'te `.leaflet-pane` yok (Leaflet CSS yalnızca harita parçasıyla iniyor). `@stomp/stompjs` yalnızca `/chat/[brandId]` (değişmedi, ChatRoom).
- #8: `/providers/1058` anonim + site key (`.env.local`) → reCAPTCHA iframe/istekleri var; aynı sayfa üye (yerel seed admin token'ı localStorage'a konarak) → recaptcha isteği 0 ve yüklenen 12 JS parçasının hiçbirinde `grecaptcha` yok. Test sonrası token localStorage'dan silindi.
- #11: `/brands` "Ustalar" butonu klavyeyle: Enter → `aria-expanded=true`, metin "Gizle", 7 `<li>`; Space → `aria-expanded=false`, liste DOM'da yok.
- #12: sekme başlıkları "Giriş | Sanayi", "Kayıt Ol | Sanayi", "Şifremi Unuttum | Sanayi" (curl).
- Görsel spot kontrol (koyu tema, masaüstü): `/chat` logoları WebP öncesi/sonrası ekran görüntüsünde aynı; `/providers` haritası karo + işaretçi + zoom kontrolü + yuvarlak çerçeveyle çiziliyor (Leaflet CSS sırası değişikliği görünür fark yaratmadı). Tam iki tema × 375 px regresyonu T050'de.
- Not: tarayıcı profilinde test için yazılan `sanayiTheme`, `sanayiToken` anahtarları temizlendi.
- **Eşzamanlılık uyarısı**: oturum scratchpad'indeki `mark.sh` başka bir ajan (backend implementer) tarafından backend worktree'sinin tasks.md'sine işaret edecek şekilde üzerine yazılmış; bir çağrım bu yüzden backend `001-backend-modernization/tasks.md`'de T041–T043'ü yanlışlıkla işaretledi — hemen geri alındı (`[ ]`), bu dosyada başka değişiklik yapılmadı.

## Phase 8: Convergence

- [x] T054 Harita rotalarında (`/providers`, `/providers/[id]`) ve `/brands`'te LCP ≤2.5 sn hedefini karşıla per SC-004 (partial) — LCP öğesi OSM karosu / logo ızgarası; görsel değişiklik gerektirdiği için **002-premium-dark-redesign T015 (harita kabı/yer tutucu) + T038 (bütçe ölçümü)** kapsamında ele alınır; ölçüm `baseline.md` "Sonra"
  - ✅ Kapandı (2026-11-10): 002 rev 3 (US5, `e8dc1a6` + `f696a9a`) — mobilde harita varsayılan kapalı; mobil laboratuvar LCP `/providers` 4631→2494 ms, `/providers/1058` 5234→2493 ms (`specs/002-premium-dark-redesign/measurements.md`). Not: tek koşularda 2.6–2.8 sn görülebiliyor; medyan hedefin hemen altında.
