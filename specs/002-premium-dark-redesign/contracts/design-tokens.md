# Tasarım Belirteci Sözleşmesi (002)

Bileşenlerin kullanabileceği **tek** görsel yüzey. Değerler `research.md` D2'de; burada yalnızca adlar ve kullanım kuralları.

| Grup | Belirteçler | Kural |
|---|---|---|
| Yüzey | `--bg`, `--surface-1`, `--surface-2`, `--surface-glass` | Sayfa zemini `--bg`; kart `--surface-1`; açılır/dialog/hover `--surface-2`; yalnızca üst bar `--surface-glass` |
| Metin | `--fg`, `--fg-muted`, `--fg-faint` | Placeholder ve yardımcı metin en az `--fg-faint` (≥4.5:1) |
| Kenar | `--hairline`, `--border-control` | Dekoratif ayraç/kart `--hairline`; input/outline buton `--border-control` (≥3:1) |
| Vurgu (tek ton) | `--accent`, `--accent-fg`, `--accent-text`, `--accent-soft`, `--ring` | Dolgu `--accent` + metin `--accent-fg`; bağlantı `--accent-text`; seçili zemin `--accent-soft`; odak `--ring` |
| Anlam | `--pos(-soft)`, `--neg(-soft)`, `--neutral(-soft)` | Yalnızca puan/durum anlamı; vurgu sayılmaz; her zaman işaret/metinle birlikte |
| Tipografi | `--type-display/title/headline/body/callout/caption`, `--measure` | Başlıklar yalnızca bu kademeler; gövde `max-inline-size: var(--measure)` |
| Boşluk | `--space-1`…`--space-10` | gap/padding/margin yalnızca bunlar (istisna `0`) |
| Köşe | `--radius-sm/md/lg/xl/full` | |
| Gölge | `--shadow-1`, `--shadow-2`, `--shadow-pop` | Koyu temada yalnızca `--shadow-pop` |
| Hareket | `--dur-fast/--dur/--dur-slow`, `--ease-standard/--ease-out` | reduced-motion'da kapanır |
| Katman | `--z-header/dropdown/dialog/toast` | |

İzinli ham değerler: `0`, `1px` (hairline genişliği), `100%`, ve çalışma anında hesaplanan değerler (CSS değişkeni üzerinden). Doğrulama: `node scripts/token-lint.mjs` = 0 bulgu.
