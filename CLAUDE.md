# Sanayi UI — Frontend (Next.js + TypeScript)

Ankara sanayi dükkanı puanlama platformunun frontend'i. Backend: `../sanayi` (Spring Boot, :8080).

## Hızlı Başlangıç

```bash
nvm use          # .nvmrc → Node 24 LTS (tek kaynak; CI de bunu okur)
npm ci
npm run dev     # http://localhost:3000 (Turbopack)
npm run build   # prod build
npm run lint
```

Env: `NEXT_PUBLIC_API_URL` (default `http://localhost:8080/api`), `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (anonim oylar için).

Ölçüm: `scripts/measure.sh <etiket> <providerId>` (prod build + `npm run start` açıkken; Lighthouse mobil, 3 koşu medyan). Baz/sonra değerler `specs/001-ui-modernization/baseline.md`.

## Yapı

- Next.js 16.4 + React 19.3 + TypeScript 6.0 (`~6.0.3` sabit — typescript-eslint peer `<6.1`), Node 24 LTS. UI kütüphanesi YOK — tasarım sistemi elle yazılmış CSS (`globals.css`).
- `src/app/` — App Router sayfaları: `/`, `/brands`, `/providers`, `/providers/[id]`, `/providers/near`, `/chat`, `/chat/[brandId]`, `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`, `/admin/ratings`, `/admin/providers`, `/admin/users`. Liste sayfası `src/app/providers/(list)/` route group'unda (URL yine `/providers`) — neden: aşağıda 404 kalıbı.
- `src/components/` — Header (auth durumu + tema), ChatRoom (STOMP canlı sohbet), ProviderCard, FilterBar, RateForm, MapSection/ProviderMapClient → ProvidersMap (imperatif Leaflet; `next/dynamic(ssr:false)` sarmalayıcılarla yalnızca harita rotalarında, Leaflet CSS bileşen içinde import), RecaptchaField (dinamik, yalnız anonim + mount sonrası), BrandCard (server) + BrandProvidersToggle (küçük client), RouteError (ortak hata ekranı), MiniHistogram, ScoreBadge, Pagination...
- `src/lib/api.ts` — server-side fetch; liste uçları ISR (`revalidate: 60-300`), detay/yorum `no-store` (detay `cache()` ile istek içi tekil; backend 404 → `null`), yakınımdakiler `no-store` (konuma özel sorgu — anayasa I istisnası). `toPage0` tek sayfa dönüştürücü.
- `src/lib/params.ts` — searchParams doğrulama (`parsePage/Size/PositiveId/Score/RadiusKm/Enum`): geçersiz değer backend'e asla gitmez (NaN/negatif sayfa yok); sort alanları beyaz listeli.
- `src/app/theme.ts` / `fonts.ts` — theme-color sabitleri + `themeInit`/`applyStoredTheme`; Geist (latin + latin-ext).
- `src/lib/auth.ts` + `useAuth.ts` — JWT localStorage'da (`sanayiToken`); `useSyncExternalStore` ile reaktif.
- `src/lib/authApi.ts` — login/register/verify/forgot/reset uçları (client).
- `src/lib/chat.ts` — sohbet REST + `@stomp/stompjs` bağlantısı (`/topic/brands.{id}`), dosya yükleme.
- `src/lib/page.ts` — `normalizePage`: Spring'in eski/yeni Page JSON formatlarını tek tipe çevirir.
- `src/lib/types.ts` — backend DTO'larının TS karşılıkları.

## Konvansiyonlar

- Veri çekme Server Component'ta; etkileşim (form, harita) client component (`"use client"`).
- Sayfa numarası UI'da 1-based, backend'e 0-based gönderilir.
- Sort paramı Spring formatı: `sort=field,dir` (çoklu eklenebilir).
- Puan aralığı -5..+5; yorum max 500 karakter. Anonim kimlik `localStorage.sanayiAnonId`.
- Harita bileşenleri sadece client'ta yüklenir (leaflet SSR'da patlar) — `dynamic(..., { ssr: false })`, yalnızca client sarmalayıcıda (Server Component'te `ssr:false` yasak).
- **404 kalıbı**: `notFound()` bir `loading.tsx` Suspense sınırının İÇİNDE çağrılırsa akış 200 ile başlamış olur → durum kodu 404 olmaz. Bu yüzden detay doğrulaması `providers/[id]/layout.tsx`'te ve liste dosyaları `providers/(list)/` grubunda (liste loading'i [id]'yi sarmasın). Yeni dinamik rota eklerken aynı kuralı uygula.
- **Hata ekranları**: tüm `error.tsx`'ler `RouteError`'u yeniden dışa aktarır (sabit Türkçe metin, ham hata gösterilmez, `retry` sunucu verisini yeniden çeker); kök düzen hataları `global-error.tsx`; Türkçe 404 `not-found.tsx`.
- Tema: sunucu HTML'i `data-theme="dark"` (JS'siz de koyu), `themeInit` kayıtlı tercihi uygular; `<meta name="theme-color">` script'ten önce gelir ve ThemeToggle ile güncellenir (`viewport.themeColor` kullanılmaz).

## Tasarım Sistemi (globals.css) — 002 premium koyu

- Tailwind/UI kütüphanesi YOK; tamamen el yazımı CSS. Yön: Apple Pro sayfası dili — **koyu öncelikli** (sunucu HTML'i `data-theme="dark"`), neredeyse siyah soğuk nötr zemin, yüzeyler AÇIKLIKLA katmanlanır, **tek vurgu tonu mavi** (hue ≈255; onay 2026-11-10). Açık tema birinci sınıf (`localStorage.sanayiTheme`, FOUC'suz init script, ThemeToggle).
- **Belirteç sözleşmesi**: `specs/002-premium-dark-redesign/contracts/design-tokens.md` (değerler research D2). Bileşenler YALNIZCA bunları kullanır:
  - Yüzey `--bg / --surface-1 (kart) / --surface-2 (açılır, dialog, hover) / --surface-glass (yalnız üst bar)`; metin `--fg / --fg-muted / --fg-faint`; kenar `--hairline` (dekoratif) / `--border-control` (input, outline buton ≥3:1).
  - Vurgu `--accent` (dolgu) + `--accent-fg`, `--accent-text` (bağlantı), `--accent-soft` (seçili zemin), `--ring`; anlam `--pos/--neg/--neutral(-soft)` (yalnız puan/durum, her zaman işaret/metinle).
  - Tip `--type-display/title/headline/body/callout/caption` (+ `-lh/-ls/-wt`), `--measure` (48ch ≈ ≤75 karakter — Geist'te ölçüldü); boşluk `--space-1..10` (4 px dizi); köşe `--radius-sm..xl/full`; gölge `--shadow-1/2/pop` (koyuda yalnız pop); hareket `--dur-fast/--dur/--dur-slow` + `--ease-*`; katman `--z-*`; kontrol `--target-min 44px`, `--control-h(-sm)`, `--icon-sm/md/lg`; efekt `--sel-border-w`, `--indicator-h`, `--glass-filter`, `--map-dark-filter`.
  - Ham değer yasak: renk/px/rem/süre/gölge/filtre (istisna `0`, `1px`, `100%`, `0.01ms`, media koşulları, CSS değişkeni üzerinden çalışma anı değerleri). Denetim: `node scripts/token-lint.mjs` (0 olmalı), kontrast: `node scripts/contrast-check.mjs` (iki tema, 0 eşik altı).
- **D10 seçim kuralı**: seçili/aktif durum ASLA yalnız `--accent-soft` zeminle gösterilmez — ek gösterge şart: seg/chip/sayfalama → `--accent` kenar (`--sel-border-w`) + 600 ağırlık; nav → alt çizgi (mobil menüde sol çizgi); puan seçici → Check ikonu + kalın sayı. `aria-current`/`aria-pressed`/`aria-checked` ile birlikte.
- **Satır içi stil**: yalnız çalışma anı değerleri, CSS değişkeni olarak ve "çalışma anı değeri" yorumuyla (`--h` histogram, `--logo-size` BrandLogo, `--map-h` harita kabı, harita yüksekliği). Hedef ≤10 (`grep -rnE "style=\{" src`).
- **İkonlar**: `src/components/icons/` — elle SVG (24 viewBox, `currentColor`, 1.75 çizgi), server-safe; `size` sm/md/lg; `title` verilirse `role="img"`, yoksa `aria-hidden`. Emoji ve metin okları (→ ← ✕ …) YASAK — tarama: `grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]|[→←↑↓✕]" src` = 0 (yorumlar dahil).
- **Ortak bileşenler**: `PageHeader` (eyebrow? + başlık + açıklama + eylemler — tüm liste/admin sayfaları), `EmptyState` (ikon + başlık + açıklama + eylem; boş/kilitli/hata/404), `SkeletonBlocks` (`SkeletonList/Card/Detail` — tüm `loading.tsx`), `Pagination` (`mode="url"` varsayılan / `mode="callback"` admin, URL'e dokunmaz), `Dialog` (Escape, odak tuzağı, odak iadesi, `aria-labelledby`), `ScoreBadge` (renk + gerçek eksi işareti + aria-label), `ProviderCard` (yakınımdakiler dahil, `distanceKm?`), `BrandLogo` (sohbet dahil).
- **Bileşen sınıfları**: `.btn(-primary/-outline/-ghost/-danger/-sm/-lg/-icon)` (küçükler `::after` ile 44 px vuruş alanı), `.card(-hover)`, `.input/.select/.textarea/.field(-error/-hint)` (alan hatası ALANIN ALTINDA, `aria-invalid` + `aria-describedby`), `.seg`, `.chip(-accent/-pos/-neg)`, `.chip-cluster` (saran chip kümesi), `.alert-*`, `.status-icon[data-tone]`, `.auth-card`, `.chat-*` (ek: en-boy korumalı `.chat-attachment`), `.table-wrap` (tablo yatay kaydırması kabın içinde), `.page/.sections/.section` (bölüm aralığı mobil 64 / masaüstü 96 px).
- **Cam üst bar**: `@supports` backdrop-filter → `--surface-glass` + `--glass-filter`; destek yok / `prefers-reduced-transparency` / forced-colors → opak.
- **Harita**: stiller `src/components/ProvidersMap.css` (yalnız harita rotalarında yüklenir); koyu temada yalnız `.leaflet-tile-pane`'e `--map-dark-filter` (işaretçiler filtresiz → kontrast korunur; tema değişimi anlık, harita durumu korunur). `.map-frame { isolation: isolate }` Leaflet z-index'lerini kapsar. **OSM politikası**: karo URL'i tek alan adı `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, atıf "© OpenStreetMap contributors" bağlantılı kalır; yoğun üretim trafiği OSM politikasına aykırı olabilir → ileride ücretli/kendi karo sunucusu.
- Erişilebilirlik: `:focus-visible` = `outline` (`--ring`, forced-colors'ta görünür), `prefers-reduced-motion` tüm hareketi kapatır, dokunma hedefi ≥44 px, WCAG AA (betikle ölçülür). Dil: Türkçe UI metinleri.

## Notlar

- **URL-state kalıbı (Next 16 standardımız — useSearchParams KULLANMA)**: (1) URL'i SERVER sayfa okur (`await searchParams`), client bileşene başlangıç değerlerini PROP olarak indirir; (2) client, URL'e yazarken TIKLAMA ANINDA `new URLSearchParams(window.location.search)` ile mevcut query'yi kopyalar; (3) geri/ileri senkronu için server sayfa client bileşene URL'den türetilmiş `key` verir (key değişince remount = state reset). Örnekler: FilterBar, Pagination, MapSection, NearLocate, verify-email/reset-password (token prop olarak iner). `useSearchParams` yalnızca admin ekranı gibi tam-SPA sayfalarda ve MUTLAKA `<Suspense>` içinde kullanılır.
- **Dev-only tuzak (Turbopack)**: `next dev`'de bir route'un İLK derlenişinde hydration takılabilir (butonlar ölü, console temiz) — sayfayı bir kez yenilemek çözer. Prod build'te bu sorun YOKTUR (doğrulandı); dev'de görürsen panik yapmadan yenile.
- reCAPTCHA localde kapalı (backend `RECAPTCHA_ENABLED` default false); prod'da env ile açılır + `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` verilir.
- `NEXT_PUBLIC_WS_URL` (default: API origin + `/ws`) — sohbet WebSocket adresi.
- eslint-config-next'in eklentileri (react/import/jsx-a11y) henüz ESLint 10 desteklemiyor → ESLint 9'da kal. TypeScript 7 de typescript-eslint peer'ı nedeniyle bekliyor.
- Logolar `public/brands/*.webp` (96 px, ≤10 KB); yeniden üretmek için `scripts/optimize-logos.sh` (macOS: `sips` + `cwebp`).
- Ayrıntılı analiz backend reposunda: `../sanayi/docs/PROJECT_ANALYSIS.md`

## Çalışma Akışı (Spec Kit) ve Session Devamlılığı

- Ayrıntılı kullanım rehberi: `docs/CALISMA_REHBERI.md`. Proje kuralları: `.specify/memory/constitution.md` (her plan buna göre kontrol edilir).
- Yeni özellik akışı (Claude chat'inde, sırayla, her adımı gözden geçirerek):
  `/speckit-specify <brief>` → (`/speckit-clarify`) → `/speckit-plan <teknik tercih>` → `/speckit-tasks` → (`/speckit-analyze`) → `/speckit-implement` → `/speckit-converge`
- Çıktılar `specs/NNN-ozellik/` altında: `spec.md` (brief), `plan.md`, `tasks.md` (checkbox'lı görevler). Bunlar commit'lenir.
- **Yeni session'a başlarken**: önce `specs/` altındaki aktif özelliğin `tasks.md`'sini oku, işaretlenmemiş (`- [ ]`) ilk görevden devam et; bitirdiğin görevi `- [x]` yap.
- Kod gezinme: `token-savior` MCP araçlarını (sembol bazlı arama/okuma) `Read`/`Grep`'ten önce tercih et — tüm dosyayı okumak yerine sembolü getir.
