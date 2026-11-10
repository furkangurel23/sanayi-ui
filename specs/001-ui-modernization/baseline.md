# Baseline Ölçümleri (FR-025)

## Ölçüm koşulları

- Üretim derlemesi: `npm run build && npm run start` (Next 16.2.10 — önce), localhost:3000; backend yerel (:8080, seed verisi, dükkan id 1058).
- Lighthouse 12 CLI, `--only-categories=performance --form-factor=mobile --throttling-method=simulate`, headless Chrome; rota başına 3 koşu, **medyan**.
- JS: Lighthouse `network-requests` içindeki `resourceType=Script` transferSize toplamı (Next 16 `next build` artık "First Load JS" göstermiyor).
- Logo: `/chat` sona kaydırılınca 38 logonun tamamı iner → `public/brands/*` toplam boyutu (deterministik çapraz kontrol) + Lighthouse toplam transfer.
- Betik: oturum scratchpad'indeki `measure.sh` (aynı betik "sonra" ölçümünde kullanılır).

## Önce — 2026-11-10

| Rota | Perf | LCP (ms) | CLS | TBT (ms) | JS transfer (KB) | Toplam transfer (KB) | leaflet/recaptcha/stomp |
|---|---|---|---|---|---|---|---|
| / | 86 | 4210 | 0.000 | 22 | 157.2 | 940.8 | - |
| /providers | 79 | 5760 | 0.000 | 45 | 204.0 | 516.3 | - |
| /providers/1058 | 80 | 5071 | 0.000 | 127 | 563.3 | 878.4 | recaptcha (anonim) |
| /chat | 94 | 3102 | 0.000 | 18 | 155.0 | 3135.4 | - |
| /login | 98 | 2499 | 0.000 | 19 | 156.4 | 280.8 | - |

| /brands | 94 | 3104 | 0.000 | 20 | 158.1 | 1851.3 | - |

- Logo dosyaları: 38 adet, toplam **3000 KB**; en büyük `seat.png` 601 KB.
- Not: LCP önce değerleri SC-004 hedefinin (≤2.5 sn) üzerinde; "sonra" ölçümünde hedefe ulaşılamazsa fark ve nedeni burada raporlanır.

## LCP öğeleri (önce, Lighthouse `largest-contentful-paint-element`)

| Rota | LCP öğesi | Fazlar (ms) |
|---|---|---|
| / | hero `<p>` | TTFB 458, Render Delay 4100 |
| /chat | açıklama `<p class="muted">` | TTFB 455, Render Delay 2646 |
| /login | `<h1>` | TTFB 453, Render Delay 2071 |
| /providers | OSM harita karosu `<img>` | Load Delay 4105, Load Time 241, Render Delay 957 |
| /providers/1058 | OSM harita karosu `<img>` | Load Delay 2671, Load Time 1927 |

Gözlem: metin LCP'lerinde süre neredeyse tamamen "Render Delay" (yükleme değil); harita rotalarında LCP üçüncü taraf karo görseli. Render-blocking yalnızca 9 KB'lık tek CSS (~155 ms). Ana iş parçacığı: `/` 2144 ms, `/providers` 2284 ms.

## Sonra — 2026-11-10 (Next 16.4.6, Node 24, C1–C3 sonrası; aynı koşullar)

| Rota | Perf | LCP (ms) | CLS | TBT (ms) | JS transfer (KB) | Toplam transfer (KB) | leaflet/recaptcha/stomp |
|---|---|---|---|---|---|---|---|
| / | 98 | 2412 | 0.000 | 53 | 148.7 | 261.2 | - |
| /providers | 81 | 5277 | 0.000 | 40 | 197.9 | 429.9 | - |
| /providers/1058 | 79 | 5244 | 0.000 | 164 | 558.0 | 829.0 | recaptcha (anonim — beklenen) |
| /chat | 97 | 2505 | 0.000 | 22 | 145.9 | 312.9 | - |
| /login | 98 | 2348 | 0.000 | 19 | 147.3 | 226.6 | - |
| /brands | 96 | 2727 | 0.000 | 21 | 148.6 | 281.8 | - |

- Logo dosyaları: 38 WebP, toplam ≈64 KB (disk bloğu sayımıyla `du` 152 KB), en büyük `honda.webp` 2.7 KB.
- SC-002 (5 koşu medyan TTFB): `/providers/1058` 8.2 ms ≤ max(API detay 2.2, yorumlar 3.2) + 50 ms ✓; `/providers` 8.4 ms ≤ max(API liste 15.0, brands 1.8, categories 2.1) + 50 ms ✓.

## SC değerlendirmesi

| SC | Hedef | Sonuç |
|---|---|---|
| SC-001 | `/chat` logolar <300 KB, tek ≤10 KB | ✅ ≈64 KB toplam (−%98), en büyük 2.7 KB; `/chat` toplam transfer 3135 → 313 KB |
| SC-002 | veri toplama ≤ en yavaş istek + 50 ms | ✅ (yukarıda) |
| SC-003 | `/`, `/login`, `/chat` ilk yükte harita/recaptcha/stomp yok; JS artmaz | ✅ hiçbirinde yok; JS tüm rotalarda azaldı (−5…−9 KB) |
| SC-004 | LCP ≤2.5 sn, CLS <0.1, TBT artmaz | ⚠️ **Kısmi.** CLS her yerde 0. LCP: `/` 4210→2412 ✅, `/login` 2499→2348 ✅, `/chat` 3102→2505 (hedefin 5 ms üstü, ölçüm gürültüsü sınırında), `/brands` 3104→2727 ❌, `/providers` 5760→5277 ❌, `/providers/[id]` 5071→5244 ❌ (≈ aynı). Harita rotalarında LCP öğesi üçüncü taraf OSM karosu ve harita artık ayrı parça olarak yüklendiği için gecikiyor (T045 notları); düzeltmesi görsel değişiklik gerektirdiğinden 002'ye devredildi (harita yer tutucu/LCP adayı). TBT: `/` 22→53 ve detay 127→164 arttı (React 19.3 + Next 16.4 çalışma zamanı; mutlak değerler düşük, Perf puanları `/` 86→98). |
| SC-005 | 404'ler, beyaz ekran/500 yok | ✅ (C2 kapısı, curl) |
| SC-006 | kullanılmayan paket 0 | ✅ `npm outdated` yalnız typescript/eslint/@types/node |
| SC-007 | lint 0 hata ≤7 uyarı, build, CI Node 24 | ✅ 0/7, build temiz; CI dosyası `.nvmrc` kullanıyor (uzak CI koşusu push edilmediği için doğrulanmadı) |

## LCP kök neden (T045, ön ölçüm — resmi "Sonra" tablosu T049'da)

- Metin LCP'li rotalarda (`/`, `/login`, `/chat`, `/brands`) "Render Delay", Lighthouse simülasyonunun gözlenen ilk boyamadan önce başlayan tüm istekleri (async JS ~143 KB, iki Geist woff2 ~47 KB, ilk görünüm alanındaki logolar) LCP bağımlılığı saymasından kaynaklanıyor; localhost'ta ilk boyama bu kaynaklar indikten sonra oluyor. Logo PNG→WebP ile `/` 4210 → ~2425 ms, `/login` 2499 → ~2327 ms, `/chat` 3102 → ~2575 ms.
- Harita rotalarında LCP üçüncü taraf OSM karosu; karo isteği harita parçasının (dynamic, ssr:false) yüklenmesini bekliyor (Load Delay ~3.4 sn). Görünümü değiştirmeden (harita kapalı başlatma / statik önizleme olmadan) giderilemiyor → 002.
- Ayrıntı ve koşu değerleri: `tasks.md` → Uygulama Notları → T045.

