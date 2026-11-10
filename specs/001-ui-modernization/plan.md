# Implementation Plan: UI Bakım ve Performans Modernizasyonu

**Branch**: `001-ui-modernization` | **Date**: 2026-11-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-ui-modernization/spec.md` (rev 2)

## Summary

Next 16.4.6 / React 19.3 / Node 24 LTS'e yükselt, `zod` ve `react-leaflet`'i ve ölü kodu kaldır; logoları 96 px WebP'ye çevir, sayfa verilerini paralelleştir, harita ve reCAPTCHA'yı yalnızca gereken yerde yükle, marka kartını ve auth sayfalarını sunucu bileşenine taşı; 404/hata sınırlarını, sayfa parametresi ayrıştırmayı, popup XSS'i, JS'siz temayı düzelt. Önce/sonra ölçüm `baseline.md`'ye yazılır. Görünüm değişmez.

## Technical Context

**Language/Version**: TypeScript 6.0.x, Node 24 LTS (24.22.2)

**Primary Dependencies**: Next 16.4.6 (App Router, Turbopack), React 19.3.1, Leaflet 1.9.4 (+ leaflet-defaulticon-compatibility), @stomp/stompjs 7.5, react-google-recaptcha 3.1

**Storage**: N/A (tarayıcı localStorage: `sanayiToken`, `sanayiAnonId`, `sanayiTheme`)

**Testing**: Test çatısı yok; doğrulama = `npm run lint` (0 hata, ≤7 uyarı), `npm run build`, CI, tarayıcıda elle akış kontrolü (quickstart), Lighthouse CLI ölçümü

**Target Platform**: Modern tarayıcılar (mobil öncelikli), Node 24 sunucu

**Project Type**: Web uygulaması (frontend; backend ayrı repo `../sanayi`)

**Performance Goals**: `/chat` logo transferi <300 KB (logo ≤10 KB); LCP ≤2.5 sn, CLS <0.1 (mobil lab); veri toplama ≤ en yavaş istek + 50 ms; harita/recaptcha/stomp, harita/form dışı rotaların ilk yükünde yok

**Constraints**: URL ve davranış değişmez; görünüm değişmez; anayasa II URL-state kalıbı; yeni çalışma zamanı bağımlılığı eklenmez

**Scale/Scope**: 15 rota, 16 bileşen, ~40 dosyaya dokunulur

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| İlke | Durum | Not |
|---|---|---|
| I. Server-first veri akışı; harita yalnızca `dynamic(ssr:false)` | ✅ (düzeltiliyor) | Şu an ihlal var (statik import + global CSS); R4 ile uyumlu hale gelir. Yakınımdakiler `no-store` → ISR aralığı istisnası (Complexity Tracking). |
| II. URL-state kalıbı | ✅ | Sayfalama/FilterBar değişmez; `params.ts` yalnızca server tarafı okumayı sağlamlaştırır. |
| III. Backend sözleşmesine sadakat | ✅ | Sözleşme değişmez; `types.ts` dokunulmaz. 404 → `notFound()` mevcut backend kodunu kullanır. |
| IV. El yazımı tasarım sistemi | ✅ | Yeni stil yok; ölü sınıflar silinir; UI kütüphanesi yok. |
| V. Erişilebilir ve Türkçe | ✅ | `<details>` klavye/durum; hata ekranları sabit Türkçe. |
| Kalite kapıları (lint/build, iki tema, mobil) | ✅ | Lint ölçütü "0 hata, ≤7 uyarı" — mevcut uyarılar artmaz. |
| ESLint 9'da kalınır | ✅ | 9.39.5. |

**Post-design re-check** (rev 2, frontend-reviewer plan incelemesi sonrası): yeni ihlal yok; tek bilinçli istisna Complexity Tracking'de. Görünüm koruması için BrandCard `<details>` yerine aynı buton + `hidden`, popup'a öğe eklenmez, logo `<img>` öznitelikleri değişmez.

## Project Structure

### Documentation (this feature)

```text
specs/001-ui-modernization/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/routes.md   # rota → durum kodu / parametre ayrıştırma sözleşmesi
├── baseline.md           # önce/sonra ölçümleri (implement sırasında)
├── checklists/requirements.md
└── tasks.md              # /speckit-tasks
```

### Source Code (repository root)

```text
.nvmrc                              # YENİ: 24
.github/workflows/ci.yml            # node-version-file: .nvmrc
package.json / package-lock.json    # sürümler, engines, typescript ~6.0.3, zod & react-leaflet çıkar
next.config.ts                      # turbopack.root (R18)
postcss.config.mjs                  # SİL
README.md                           # proje README'si
CLAUDE.md, .specify/memory/constitution.md   # doküman senkronu
scripts/optimize-logos.sh           # YENİ: tek seferlik PNG→WebP (cwebp, brew webp)
public/brands/*.webp                # YENİ (PNG'ler silinir); public/*.svg şablonları SİL
src/
├── app/
│   ├── layout.tsx                  # Geist latin-ext, mono yok, data-theme="dark", theme-color meta (script'ten önce)
│   ├── theme.ts / fonts.ts         # YENİ: themeInit + renk sabitleri, Geist yükleyici (layout ve global-error paylaşır)
│   ├── globals.css                 # leaflet @import'ları çıkar, ölü sınıflar çıkar
│   ├── not-found.tsx               # YENİ
│   ├── error.tsx                   # YENİ (RouteError re-export)
│   ├── global-error.tsx            # YENİ
│   ├── brands/{page,error}.tsx
│   ├── providers/(list)/{page,loading,error}.tsx  # route group'a taşındı (URL aynı) — [id] layout'u loading sınırı dışında kalsın; Promise.all + catch, params.ts
│   ├── providers/[id]/layout.tsx              # YENİ: id doğrulama + cache()'li detay + notFound() (404 durum kodu, loading üstünde)
│   ├── providers/[id]/{page,error}.tsx         # Promise.all, cache(), harita client sarmalayıcı
│   ├── providers/near/{page,error}.tsx         # clamp gösterimi
│   ├── login/{page.tsx,LoginForm.tsx}          # server page + client form
│   ├── register/{page.tsx,RegisterForm.tsx}
│   └── forgot-password/{page.tsx,ForgotPasswordForm.tsx}
├── components/
│   ├── RouteError.tsx              # YENİ ortak hata ekranı
│   ├── RecaptchaField.tsx          # YENİ (mount sonrası, yalnız anonim)
│   ├── BrandProvidersToggle.tsx    # YENİ küçük client toggle (aria-expanded + hidden)
│   ├── ProviderMapClient.tsx       # YENİ dynamic sarmalayıcı (detay)
│   ├── MapSection.tsx              # dynamic ProvidersMap
│   ├── ProvidersMap.tsx            # CSS import, popup DOM, Tailwind kalıntısı
│   ├── RateForm.tsx                # dynamic RecaptchaField
│   ├── BrandCard.tsx               # server; listeyi children olarak toggle'a verir
│   ├── BrandLogo.tsx               # .webp
│   └── ThemeToggle.tsx             # theme-color güncelle
└── lib/
    ├── params.ts                   # YENİ ayrıştırma yardımcıları
    ├── api.ts                      # toPage0, getProviderDetail 404→null + cache, near no-store
    └── auth.ts, apiError.ts        # kullanılmayan export'lar
```

**Structure Decision**: Mevcut tek-proje Next App Router yapısı korunur; yeni dosyalar mevcut klasör kalıplarına eklenir (rota-yanı client form dosyaları verify-email/reset-password kalıbıyla aynı).

## Implementation Phases (commit dilimleri)

1. **Baz ölçüm** — ✅ tamamlandı (2026-11-10, `baseline.md` "önce").
2. **Ortam ve bağımlılıklar** — Node 24 (.nvmrc/engines/CI), sürüm yükseltmeleri, zod/react-leaflet kaldır, ölü dosya/kod/CSS/font, doküman senkronu. Kapı: lint + build. *Commit 1.*
3. **Hata ve parametre düzeltmeleri** — `params.ts`, `api.ts`, not-found/error/global-error/RouteError, detay 404, liste/detay hata toleransı, popup XSS, near no-store/clamp, JS'siz koyu tema + theme-color. Kapı: lint + build + US2/US3 elle (detay 404 `curl` ile durum kodu, bilinçli hata ile RouteError/global-error). *Commit 2.*
4. **Performans** — logolar WebP, paralel veri, harita dynamic + CSS taşıma, reCAPTCHA dynamic, BrandCard server, auth sayfaları server+form. Kapı: lint + build + US1 elle + ağ kontrolü. *Commit 3.*
5. **Son ölçüm ve doğrulama** — `baseline.md` "sonra", SC tablosu, tüm rotalar iki temada gezilir. *Commit 4 (docs).*

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Anayasa I: `/providers/near` ISR yerine `no-store` | Sorgu kullanıcının konumuna özel; ISR her koordinat için ayrı önbellek kaydı üretir (sınırsız) | Koordinat yuvarlama gösterilen mesafeleri değiştirir (FR-022 ihlali); `revalidate: 30` zaten aralık dışı ve aynı sorunu taşır |
