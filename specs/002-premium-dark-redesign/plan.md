# Implementation Plan: Premium Koyu Tema Yeniden Tasarım

**Branch**: `002-premium-dark-redesign` | **Date**: 2026-11-10 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/002-premium-dark-redesign/spec.md` (rev 2). Ön koşul: 001-ui-modernization tamamlanmış ve `baseline.md` "sonra" değerleri kayıtlı.

## Summary

`globals.css`'i belirteç-önce bir tasarım sistemine dönüştür (koyu öncelikli, tek mavi vurgu, katmanlı nötr yüzeyler, 4 px boşluk dizisi, akışkan yazı ölçeği), elle yazılmış SVG ikon seti ve ortak bileşenler (PageHeader, EmptyState, Pagination iki mod, Dialog, ScoreBadge işaretli) ekle; önce üst bar/alt bilgi + 3 referans ekranı (ana sayfa, dükkan listesi, dükkan detayı) yap, **kullanıcı onayı** al (FR-021), sonra tüm rotalara ve kapsanan durumlara yay. Harita koyu temada CSS filtresiyle. Davranış/URL değişmez.

## Technical Context

**Language/Version**: TypeScript 6.0.x, Node 24 (001'den)

**Primary Dependencies**: Next 16.4.6, React 19.3 — **yeni bağımlılık yok** (ikonlar elle, kontrast/belirteç betikleri bağımlılıksız Node)

**Storage**: N/A (`localStorage.sanayiTheme`)

**Testing**: lint (0 hata, ≤7 uyarı) + build; `scripts/contrast-check.mjs`, `scripts/token-lint.mjs`; Lighthouse a11y + perf (mobil, iki tema); yerleşik tarayıcıda ekran görüntüleri; quickstart elle senaryoları

**Target Platform**: Modern tarayıcılar, 320 px – 1440+ px

**Project Type**: Web uygulaması (frontend)

**Performance Goals (FR-018)**: rota başına JS artışı ≤5 KB gzip; genel CSS ≤ 001 sonucunun 1.5 katı (gzip); LCP ≤2.5 sn, CLS <0.1; harita stilleri yalnız harita rotalarında; yeni üçüncü taraf yok (D3 ile karo sağlayıcısı da gerekmedi)

**Constraints**: anayasa II (URL-state), IV (el yazımı CSS, paket yok), V (Türkçe, a11y); 001 FR-021 tema davranışı

**Scale/Scope**: 15 rota + ~25 kapsanan durum; ~30 bileşen/sayfa dosyası; globals.css yeniden yapılandırma

## Constitution Check

| İlke | Durum | Not |
|---|---|---|
| I. Server-first | ✅ | Yeni ortak bileşenlerin çoğu server (PageHeader, EmptyState, ikonlar); yalnızca Dialog ve Pagination(callback) client. |
| II. URL-state | ✅ | Pagination `mode="url"` mevcut kalıbı korur; admin `mode="callback"` (yerel durum, URL değişmez — spec FR-009). |
| III. Backend sözleşmesi | ✅ | Değişmez. |
| IV. El yazımı tasarım sistemi | ✅ | Belirteçler globals.css'te; ikonlar elle SVG; paket yok. |
| V. Erişilebilir ve Türkçe | ✅ | Kontrast betiği + axe; radio group klavye kalıbı; dialog odak yönetimi. |
| Kalite kapıları | ✅ | lint/build + iki tema + mobil + ekran görüntüleri. |

**Post-design re-check**: ihlal yok.

## Project Structure

```text
specs/002-premium-dark-redesign/
├── spec.md, plan.md, research.md (D1–D9), quickstart.md
├── contracts/design-tokens.md      # belirteç sözleşmesi (bileşenlerin kullanabileceği tek yüzey)
├── screenshots/                    # SC-001 kanıtları
└── tasks.md

scripts/contrast-check.mjs, scripts/token-lint.mjs      # YENİ (bağımlılıksız)
src/app/globals.css                                     # belirteçler + temel + bileşen sınıfları (yeniden düzenlenir)
src/app/theme.ts                                        # theme-color hex'leri yeni --bg'ye güncellenir
src/components/icons/*.tsx                              # YENİ ikon seti
src/components/{PageHeader,EmptyState,Dialog,SkeletonBlocks}.tsx   # YENİ
src/components/{Pagination,ScoreBadge,RatingItem,ProviderCard,BrandLogo,BrandCard,
               Header,ThemeToggle,FilterBar,MapSection,ProvidersMap,MiniHistogram,
               RateForm,RecaptchaField,ChatRoom,NearLocate,ConfirmButton,RouteError}.tsx
src/app/**/{page,loading,layout}.tsx (15 rota), not-found.tsx, global-error.tsx
src/app/admin/AdminShell.tsx, admin/*/page.tsx
```

## Implementation Phases

1. **Araçlar** — `contrast-check.mjs`, `token-lint.mjs`; mevcut durumun raporu (önce).
2. **Temel** — belirteçler (D2) iki tema, reset/tipografi/boşluk, `.btn/.card/.input/.seg/.chip` vb. bileşen sınıflarının belirteçlere taşınması; ikon seti; PageHeader, EmptyState, ScoreBadge; Header (cam üst bar, mobil menü, kullanıcı çipi) + footer; `theme.ts` hex güncellemesi.
3. **Referans ekranlar** — ana sayfa (vitrin), dükkan listesi (FilterBar, ProviderCard, Pagination url modu, harita + koyu filtre), dükkan detayı (başlık, ScoreBadge, histogram, RateForm radio group, yorumlar, harita). Ölçüm: FR-002 değişmezleri, kontrast betiği, ekran görüntüleri (2 tema × 375/1440).
4. **🚦 Tasarım onay kapısı (FR-021)** — belirteç tablosu + 12 ekran görüntüsü + D1 alternatifi (gümüş vurgu) kullanıcıya sunulur. Onay yoksa geri bildirim → Faz 2/3 tekrar. Onay tarihi tasks.md'ye.
5. **Yayılım** — markalar, yakınımdakiler (konum durumları), sohbet listesi + oda (kilitli, yükleniyor, ekler, bağlantı durumu, en-boy korumalı görsel), kimlik akışları (tüm durumlar), admin (PageHeader, tablolar, Pagination callback, Dialog log paneli, yetkisiz ekran), 404/hata/global-error, tüm loading iskeletleri, reCAPTCHA teması; satır içi stil temizliği (D8).
6. **Doğrulama** — token-lint 0, satır içi ≤10, kontrast 0 ihlal, Lighthouse a11y ≥95 + axe 0 serious/critical (5 rota × 2 tema), FR-018 bütçeleri (`measure.sh`), 320 px yatay kaydırma kontrolü, ekran görüntüsü seti tamam, quickstart akışları; frontend-reviewer (code) + converge.

Commit dilimleri: (1) araçlar+temel, (2) referans ekranlar [onay öncesi], (3) yayılım, (4) doğrulama/doküman.

## Complexity Tracking

Yok.
