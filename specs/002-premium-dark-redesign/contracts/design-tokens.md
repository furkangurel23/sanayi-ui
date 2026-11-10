# Tasarım Belirteci Sözleşmesi (002)

Bileşenlerin kullanabileceği **tek** görsel yüzey. Değerler `research.md` D2'de; burada yalnızca adlar ve kullanım kuralları.

| Grup | Belirteçler | Kural |
|---|---|---|
| Yüzey | `--bg`, `--surface-1`, `--surface-2`, `--surface-glass` | Sayfa zemini `--bg`; kart `--surface-1`; açılır/dialog/hover `--surface-2`; yalnızca üst bar `--surface-glass` |
| Metin | `--fg`, `--fg-muted`, `--fg-faint` | Placeholder ve yardımcı metin en az `--fg-faint` (≥4.5:1) |
| Kenar | `--hairline`, `--border-control` | Dekoratif ayraç/kart `--hairline`; input/outline buton `--border-control` (≥3:1) |
| Vurgu (tek ton) | `--accent`, `--accent-fg`, `--accent-text`, `--accent-soft`, `--ring` | Dolgu `--accent` + metin `--accent-fg`; bağlantı `--accent-text`; seçili zemin `--accent-soft` **yalnız başına seçim göstergesi olamaz** — her seçili öğe ek gösterge taşır (kenar `--accent`, check ikonu ya da alt çizgi + kalınlık; D10); odak `outline: var(--ring-width) solid var(--ring)` |
| Perde | `--scrim` | Dialog/çekmece arka perdesi |
| Kontrol/ikon | `--target-min`, `--control-h`, `--control-h-sm`, `--icon-sm/md/lg`, `--ring-width`, `--ring-offset` | Her etkileşimli öğenin vuruş alanı ≥ `--target-min` (metin içi bağlantı hariç) |
| Anlam | `--pos(-soft)`, `--neg(-soft)`, `--neutral(-soft)` | Yalnızca puan/durum anlamı; vurgu sayılmaz; her zaman işaret/metinle birlikte |
| Tipografi | `--type-display/title/headline/body/callout/caption` (+ her biri için `-lh`, `-ls`, `-wt`), `--measure` | Başlıklar yalnızca bu kademeler; gövde `max-inline-size: var(--measure)` |
| Boşluk | `--space-1`…`--space-10` | gap/padding/margin yalnızca bunlar (istisna `0`) |
| Köşe | `--radius-sm/md/lg/xl/full` | |
| Gölge | `--shadow-1`, `--shadow-2`, `--shadow-pop` | Koyu temada yalnızca `--shadow-pop` |
| Hareket | `--dur-fast/--dur/--dur-slow`, `--ease-standard/--ease-out` | reduced-motion'da kapanır |
| Yerleşim | `--container`, `--header-h`, `--card-min` | |
| Gösterge/efekt | `--sel-border-w`, `--indicator-h`, `--glass-filter`, `--map-dark-filter`, `--marker-outline` (rev 3: harita işaretçi konturu — açıkta koyu, koyuda açık; FR-024) | Ham `blur()/saturate()/filter/drop-shadow()` yazılmaz |
| Katman | `--z-header/dropdown/dialog/toast` | Harita kabı `isolation: isolate` (Leaflet 400/1000 z-index'leri dışarı taşmaz) |

İzinli ham değerler: `0`, `1px` (hairline genişliği), `100%`, `0.01ms` (reduced-motion), `@media`/`@container` sorgu koşulları, `currentColor` ve çalışma anında hesaplanan değerler (CSS değişkeni üzerinden). Doğrulama: `node scripts/token-lint.mjs` = 0 bulgu.
