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

## Sonra

(implement sonunda doldurulur)
