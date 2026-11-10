# Sanayi UI Constitution

Next.js frontend'inin değişmez kuralları. Her `/speckit-plan` bu dosyaya göre "Constitution Check" yapar; ihlal varsa plan gerekçe yazmak zorundadır. Ayrıntılar ve örnekler `CLAUDE.md`'de.

## Core Principles

### I. Server-First Veri Akışı
Veri çekme Server Component'ta (`src/lib/api.ts`; liste uçları ISR `revalidate: 60-300`, detay/yorum `no-store`). Etkileşim gerektiren parçalar (form, harita, sohbet) `"use client"` bileşenidir. Harita bileşenleri yalnızca `dynamic(..., { ssr: false })` ile yüklenir.

### II. URL-State Kalıbı (NON-NEGOTIABLE)
URL'i server sayfa okur (`await searchParams`) ve client'a prop olarak indirir; client yazarken tıklama anında `new URLSearchParams(window.location.search)` kopyalar; geri/ileri senkronu URL'den türetilen `key` ile sağlanır. `useSearchParams` yalnızca tam-SPA ekranlarda ve `<Suspense>` içinde kullanılır.

### III. Backend Sözleşmesine Sadakat
Tipler `src/lib/types.ts`'te backend DTO'larıyla birebir tutulur. Sayfalama UI'da 1-based, backend'e 0-based; sort `field,dir` formatında; Page JSON `normalizePage` ile okunur. Backend sözleşmesi gerektiren bir özellik önce backend (`../sanayi`) spec'inde tanımlanır.

### IV. El Yazımı Tasarım Sistemi
UI kütüphanesi ve Tailwind yok. Yeni stil `globals.css` token'ları (`--bg/--fg/--accent/...`, OKLCH) ve mevcut bileşen sınıflarıyla (`.btn`, `.card`, `.input`, `.chip`...) yazılır; tek seferlik renk/ölçü değeri sokulmaz. Açık/koyu tema `html[data-theme]` ile desteklenir.

### V. Erişilebilir ve Türkçe
UI metinleri Türkçe. `:focus-visible`, `prefers-reduced-motion` ve WCAG AA kontrast korunur. Her etkileşimli öğe klavyeyle kullanılabilir.

## Kalite Kapıları

- Görev "bitti" sayılmadan önce `npm run lint` ve `npm run build` temiz geçer.
- Görsel değişiklikler dev sunucuda (`npm run dev`) hem açık hem koyu temada, mobil genişlikte kontrol edilir.
- Puan -5..+5, yorum max 500 karakter; JWT `localStorage.sanayiToken`, anonim kimlik `localStorage.sanayiAnonId`.
- ESLint 9'da kalınır (eslint-config-next henüz ESLint 10 desteklemiyor).

## Geliştirme Akışı

- Yeni özellik: `/speckit-specify` → (`/speckit-clarify`) → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`. Çıktılar `specs/NNN-ozellik/` altında durur; yeni session oradan devam eder.
- **Review kapıları**: `spec.md`, `plan.md`, `tasks.md` (analyze ile birlikte) ve implementasyon sonrası kod, ayrı bir agent'ta `frontend-reviewer` ile incelenir. BLOCKER/MAJOR bulgular düzeltilmeden sonraki adıma geçilmez.
- Her özellik kendi commit'i ile kapanır.
- Küçük düzeltmeler (tek bileşen, davranış değişmiyor) spec gerektirmez.

## Governance

Bu constitution diğer pratiklerin üstündedir; `CLAUDE.md` onun ayrıntılı uygulama rehberidir. Değişiklik `/speckit-constitution` ile yapılır, sürüm artırılır ve gerekçesi Sync Impact Report'ta yazılır. Karmaşıklık ekleyen her sapma planın "Complexity Tracking" bölümünde gerekçelendirilir.

**Version**: 1.1.0 | **Ratified**: 2026-11-10 | **Last Amended**: 2026-11-10
