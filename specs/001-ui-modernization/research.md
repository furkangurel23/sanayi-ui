# Research: 001-ui-modernization

Tarih: 2026-11-10. Kaynaklar: salt-okunur UI denetimi, `npm view`, frontend-reviewer spec incelemesi, Next 16 yükseltme rehberi.

## R1 — Sürüm hedefleri

| Paket | Şimdi | Hedef | Karar / gerekçe |
|---|---|---|---|
| next | 16.2.10 | **16.4.6** | Aynı ana sürüm; 17 yok. 16.2.6 öncesi güvenlik paketi zaten geçildi. 16.4 Cache Components'i *önerir* ama varsayılan olarak yalnızca yeni projelerde açar; mevcut projede `cacheComponents` kapalı kalır → davranış değişmez. |
| eslint-config-next | 16.2.10 | **16.4.6** | `next` ile kilit adım. |
| react / react-dom | 19.2.7 | **19.3.1** | Next 16.4 React 19.3 ile test edildi. Form/effect/hydration davranışı elle doğrulanır (quickstart). |
| @types/react, @types/react-dom | ^19 | **19.3.x** | |
| @types/node | ^26 | **^24** | Node 24 çalışma ortamıyla hizalanır (FR-006). `npm outdated`'da latest 26 olarak kalır — spec Kapsam Dışı'na eklendi. |
| @types/leaflet | ^1.9.20 | **1.9.22** | |
| @stomp/stompjs | 7.3.0 | **7.5.0** | Minor. |
| eslint | 9.39.4 | **9.39.5** | 9.x hattı. |
| typescript | 6.0.3 (`^6`) | **`~6.0.3`** (sabitlenir) | TS 7: typescript-eslint 8.72.2 peer `<6.1.0`; `^6` aralığı 6.1 çıkınca peer'ı kırar. |
| eslint 10 | — | yok | eslint-plugin-react `^9.7`, import `^9`, jsx-a11y `^9` peer. |
| leaflet | 1.9.4 | kalır | 2.0 beta; global `L` yok, API kırıcı. |
| zod, react-leaflet | var | **kaldır** | `src/` altında hiçbir import yok (doğrulandı). |
| leaflet-defaulticon-compatibility, react-google-recaptcha | güncel | kalır | Bakımsız ama son sürüm; kullanılıyorlar. |

**Alternatif**: Next canary 16.5 / `next upgrade --agent` — reddedildi (ön sürüm).

## R2 — Çalışma ortamı: Node 24 LTS

- **Karar**: Node **24.22.2** (Latest LTS "Krypton"). `.nvmrc` = `24`, `package.json` `engines.node` = `">=24 <25"`, CI `node-version-file: .nvmrc`.
- **Gerekçe**: Node 20 desteği 2026-04-30'da bitti; Next 16 min 20.9. nvm makinede kurulu, `nvm install 24` yeterli.
- **Alternatif**: Node 22 (Maintenance LTS) — reddedildi, daha kısa destek süresi.

## R3 — Marka logoları

- **Karar**: `public/brands/*.png` (boyutlar 640×426'dan 3840×2160'a kadar değişken, toplam ≈3.0 MB) tek seferlik `scripts/optimize-logos.sh` ile **en uzun kenarı 96 px olacak şekilde, şeffaflık korunarak WebP**'ye (`cwebp -q 80 -m 6 -alpha_q 100 -resize`) dönüştürülür; PNG'ler silinir. `cwebp` Homebrew `webp` paketinden gelir (npm bağımlılığı eklenmez; `sharp` yalnızca `next`'in opsiyonel bağımlılığı olduğu için ona güvenilmez). `BrandLogo` yalnızca `src` uzantısını değiştirir; mevcut `<img>` öznitelikleri ve stilleri (`loading="lazy"`, `maxWidth/maxHeight 78%`, `object-fit: contain`) **olduğu gibi** kalır → kutu ve görünüm aynı. Çapraz kontrol: `du -ck public/brands/*.webp`.
- **Gerekçe**: Logolar 46 px gösteriliyor; 2x yoğunlukta 92 px yeter. Önceden boyutlanmış statik dosya, `next/image` optimizer'ının çalışma zamanı maliyeti ve `/_next/image` istekleri olmadan ≤10 KB hedefini karşılar. Görünüm aynı kalır (aynı kutu, `object-fit: contain`).
- **Alternatif**: `next/image` — reddedildi: 38 küçük logo için optimizer/önbellek yükü, `sizes` ayarı ve uzak/statik farkı; kazanç yok. SVG — kaynak dataset'te tutarlı SVG yok.

## R4 — Harita yükleme (anayasa I)

- **Karar**: `ProvidersMap` yalnızca `next/dynamic(() => import("./ProvidersMap"), { ssr: false, loading: <iskelet aynı yükseklikte> })` ile yüklenir; dinamik sarmalayıcı tek bir client dosyasında (`MapSection.tsx` ve detay sayfası için `ProviderMapClient.tsx`) durur. `leaflet/dist/leaflet.css` ve `leaflet-defaulticon-compatibility` CSS'i `globals.css`'ten çıkarılıp `ProvidersMap.tsx` içinde import edilir → App Router CSS'i yalnızca bu parçayı yükleyen rotalarda iner.
- **Gerekçe**: Şu an `ProvidersMap` statik import ediliyor (Leaflet effect içinde dinamik olsa da bileşen kodu ve global CSS her sayfada). Sunucu bileşeni `dynamic(ssr:false)` kullanamaz; bu yüzden sarmalayıcı client bileşeni gerekir.
- **Alternatif**: IntersectionObserver ile görünür olunca yükleme — kapsam dışı (002'de değerlendirilebilir).

## R5 — reCAPTCHA

- **Karar**: Yeni `RecaptchaField.tsx` (client) `react-google-recaptcha`'yı statik import eder ve `onToken(token|null)` + `resetKey` (değişince remount = sıfırlama) prop'larıyla çalışır. `RateForm` bunu `next/dynamic(..., { ssr:false })` ile render eder; **yalnızca mount sonrası** (`useEffect` ile `mounted=true`) ve `siteKey && mounted && !user` iken. Neden: `useAuth`'un sunucu anlık görüntüsü `null` (`useAuth.ts:39`); hydration render'ında kullanıcı "anonim" görünür ve bayrak olmadan dinamik import üyeye de tetiklenir.
- **Gerekçe**: `react-google-recaptcha` sınıf bileşeni + async script loader; `dynamic` üzerinden ref iletimi güvenilmez. Prop tabanlı sözleşme ref'e gerek bırakmaz.

## R6 — Marka kartı

- **Karar**: `BrandCard` server component olur; aynı başlık satırındaki "Ustalar/Gizle" butonu küçük bir client bileşen `BrandProvidersToggle` olur ve dükkan listesini (server'da render edilmiş JSX) `children` olarak alır: `<button aria-expanded aria-controls>` + `<div id hidden={!open}>`. Buton, metin ve düzen birebir aynı (FR-024). Kazanç: marka verisi client bileşen prop'u olarak serileştirilmez; yalnızca liste HTML'i taşınır. `/brands` toplam transferi önce/sonra ölçülür.
- **Alternatif**: `<details>/<summary>` — reddedildi: `<summary>` details'in ilk çocuğu olmak zorunda; mevcut düzende buton başlık satırında "Sohbet" bağlantısının yanında → ya iç içe etkileşimli öğe (a11y ihlali) ya da `display: contents` gibi riskli CSS ve görsel değişiklik.

## R7 — Auth sayfaları başlık

- **Karar**: `login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx` server bileşen olur, `export const metadata = { title: "Giriş" | "Kayıt Ol" | "Şifremi Unuttum" }`; mevcut içerik `LoginForm.tsx`, `RegisterForm.tsx`, `ForgotPasswordForm.tsx` (aynı klasörde, `"use client"`) dosyalarına taşınır (verify-email/reset-password ile aynı kalıp).

## R8 — Hata/404 sınırları

- **Karar**:
  - `src/components/RouteError.tsx` (client): sabit Türkçe başlık/mesaj, ham `error.message` gösterilmez (yalnızca `console.error` + `error.digest` küçük yazı). "Tekrar dene": yükseltilen Next sürümünün `error.md` dokümanı (`node_modules/next/dist/docs`) kontrol edilir; `unstable_retry` (sunucu verisini yeniden çeken resmi yol) varsa o kullanılır, yoksa belgelenen `reset()` + `router.refresh()` (`startTransition` içinde). Seçim tasks'ta kayıt altına alınır.
  - Mevcut dört `error.tsx` + yeni kök `src/app/error.tsx`: `"use client"` + `export { default } from "@/components/RouteError"` (belirsizliği kaldırmak için yönerge açıkça yazılır); build sonrası bilinçli hata ile doğrulanır.
  - `src/app/global-error.tsx`: kendi `<html lang="tr" data-theme="dark" suppressHydrationWarning><body className={geist.variable}>`'si, aynı `themeInit` script'i (açık tema seçen kullanıcı için) ve `globals.css` import'u ile kök düzen hatalarını yakalar. Geist yükleyici ve `themeInit` `src/app/theme.ts`/`fonts.ts` içine taşınıp layout ile paylaşılır.
  - `src/app/not-found.tsx`: Türkçe 404, ana sayfa/dükkan listesi bağlantıları.
  - Route group (**tasks incelemesi BLOCKER**): `src/app/providers/loading.tsx` iç içe `[id]` layout'unu da sarıyor; liste dosyaları (`page`, `loading`, `error`) URL'i değiştirmeyen `src/app/providers/(list)/` grubuna taşınır, böylece `[id]/layout.tsx` hiçbir loading sınırının içinde kalmaz.
  - Detay 404 (**BLOCKER düzeltmesi**): `providers/[id]/loading.tsx` sayfayı Suspense içine aldığı için sayfada çağrılan `notFound()` durum kodunu 404 yapamaz (akış 200 ile başlamış olur — Next `loading.md`, `streaming.md`). Bu yüzden yeni **`src/app/providers/[id]/layout.tsx`** (server) id'yi doğrular (`!Number.isInteger(id) || id <= 0` → `notFound()`), `cache()`'lenmiş `getProviderDetail(id)`'yi bekler ve `null` (backend 404) gelirse `notFound()` çağırır. Layout aynı segmentin loading sınırının üstünde çalıştığı için 404 doğru döner. `getProviderDetail` 404'te `null` döner, diğer hatalarda fırlatır. `generateMetadata`, layout ve sayfa aynı `cache()`'lenmiş fonksiyonu kullanır (istek başına tek backend çağrısı).

## R9 — URL parametre ayrıştırma

- **Karar**: `src/lib/params.ts`: `parsePage(v) → 1-based tam sayı ≥1 (geçersiz → 1)`, `parsePositiveId(v) → number | undefined`, `parseSize(v, max=50) → 1..max`, `parseScore(v) → -5..5 | undefined`, `parseEnum(v, allowed, fallback)` (`/brands` `sort`/`dir` ve `/providers` sort alanları beyaz listeyle). `api.ts` `toPage0(page) = Math.max(0, page - 1)` tek yardımcıya bağlanır (`getProviderRatings` hatası düzelir). Tüm server sayfaları `searchParams`'ı bu yardımcılarla okur.

## R10 — Paralel veri + hata toleransı

- **Karar**: `providers/page.tsx`: `Promise.all([getBrandsAllSorted().catch(() => []), getCategoriesAllSorted().catch(() => []), getProviders(...)])`. Detay: `Promise.all([getProviderDetail(id), getProviderRatings(...).catch(() => null)])`; `null` → yorum bölümünde Türkçe `.alert-error`.

## R11 — Popup XSS

- **Karar**: `bindPopup` için HTML string yerine `document.createElement` ile kurulan DOM düğümü; **yalnızca mevcut üç satır** (ad, ilçe/şehir, puan) `textContent` + `<br>` ile kurulur; yeni bağlantı/öğe eklenmez (FR-022/024).

## R12 — Yakınımdakiler

- **Karar**: `getProvidersNear` → `cache: "no-store"` (konuma özel sorgu; ISR anahtarı her koordinat için ayrı kayıt üretir — anayasa I'in 60-300 aralığına bilinçli istisna, Complexity Tracking'de). Yarıçap `clamp(1, 100)` tek yerde (`params.ts`), sayfa sıkıştırılmış değeri gösterir.

## R13 — Yazı tipi

- **Karar**: `Geist` `subsets: ["latin", "latin-ext"]`; `Geist_Mono` ve `.mono` kaldırılır. 002 bu yazı tipini korur (002 FR-003).

## R14 — Tema (JS'siz koyu + theme-color)

- **Karar**: `<html data-theme="dark">` sunucuda yazılır (JS'siz de koyu); `themeInit` kayıtlı tercihi uygular. `viewport.themeColor` **kullanılmaz** (medya sorgusu tabanlı; elle seçilen temayı izleyemez; çift meta riski). `<head>` içinde `<meta name="theme-color" content="#…" suppressHydrationWarning>` **script'ten önce** yer alır; `themeInit` ve `ThemeToggle` `content`'i günceller. Renkler `src/app/theme.ts`'te tek sabit çiftinde (hex; OKLCH meta'da her tarayıcıda desteklenmiyor), `--bg` değerlerinin hex karşılığı.

## R15 — Ölçüm yöntemi (FR-025)

- **Karar**: `npm run build && npm run start` (prod), yerel arka uç seed verisiyle. `npx lighthouse@12 <url> --only-categories=performance --form-factor=mobile --throttling-method=simulate`, her rota 3 kez, medyan. JS: Next 16 `next build` artık "First Load JS" göstermediği için Lighthouse `network-requests` içindeki Script transferSize toplamı. Logo: `public/brands/*` toplam boyutu (sona kaydırınca hepsi iner) + Lighthouse toplam transfer. Ölçülen rotalar: `/`, `/providers`, `/providers/[id]`, `/chat`, `/login` (+ sonra ölçümünde `/brands`). SC-002 (veri toplama): sayfanın sunucu yanıt süresi (`curl -w %{time_starttransfer}`, `no-store` rotalar, 5 koşu medyan) ile aynı backend çağrılarının tek tek `curl` sürelerinin maksimumu karşılaştırılır. Önce değerler `baseline.md`'de kayıtlı.

## R16 — Ölü kod listesi (FR-004/005)

- Silinecek: `public/{file,globe,next,vercel,window}.svg`, `postcss.config.mjs`, çalışma ağacındaki `.DS_Store` dosyaları (git'te izlenmiyor, `.gitignore`'da zaten var — yalnızca yerel temizlik), `lib/auth.ts` `authHeader()`, `lib/apiError.ts` `isErrorCode()`, CSS `.mono .stack-lg .field-error .alert-info .chat-pending .divider` (her biri silmeden önce tekrar grep'lenir), `ProvidersMap.tsx` Tailwind kalıntısı sınıf adları (yerine hiçbir şey).
- `src/types/react-google-recaptcha.d.ts` ve `leaflet-defaulticon-compatibility.d.ts` kalır (paketler kalıyor).

## R17 — Eğitici yorumlar (FR-023)

- **Karar**: Dokunulan her dosyada mevcut Türkçe yorumlar korunur; yorumun anlattığı davranış değiştiyse (ör. `BrandCard` "use client" gerekçesi, `layout.tsx` "turuncu" ve `Geist_Mono` notları, `BrandLogo` "PNG" notu, `api.ts` near revalidate açıklaması) yorum yeni davranışı anlatacak şekilde güncellenir. Yeni dosyalar (params, RouteError, RecaptchaField, BrandProvidersToggle, providers/[id]/layout, not-found, global-error) kavramı öğreten Türkçe başlık yorumu taşır (ör. "neden layout'ta notFound", "neden mount sonrası").

## R18 — Çalışma kökü uyarısı

- **Bulgu**: `next build` "Detected additional lockfiles" uyarısı veriyor; ev dizininde (`~/package-lock.json`) başıboş bir lockfile var ve Next çalışma kökünü yanlış çıkarabiliyor.
- **Karar**: Kullanıcının ev dizinindeki dosyaya dokunulmaz; `next.config.ts`'e `turbopack: { root: __dirname }` (veya Next 16.4'teki eşdeğeri, dokümandan doğrulanır) eklenerek kök sabitlenir; uyarı kaybolur.

## R19 — Leaflet CSS sırası

- **Bulgu**: Leaflet CSS globals'tan sonra yüklenecek (cascade sırası değişir). Tek override `.map-frame .leaflet-container` (0,2,0) özgüllükle kazanır.
- **Karar**: Harita rotaları iki temada görsel olarak kontrol edilir (quickstart #13).
