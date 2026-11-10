# Data Model: 001-ui-modernization

Bu özellik backend veri modelini ve `src/lib/types.ts` DTO'larını **değiştirmez**. Yalnızca istemci tarafında şu değer tipleri tanımlanır/netleşir:

## SearchParams (server sayfa girdisi)

Ham `searchParams: Promise<Record<string, string | string[] | undefined>>` → `params.ts` yardımcılarıyla doğrulanmış değerler:

| Alan | Tip | Kural |
|---|---|---|
| page | `number` | ≥1, varsayılan 1 |
| size | `number` | 1..max, varsayılan rota başına |
| brandId / categoryId | `number \| undefined` | pozitif tam sayı |
| minScore / maxScore | `number \| undefined` | -5..5 |
| radiusKm | `number` | 1..100, varsayılan 10 |

## Theme

| Durum | Kaynak | Not |
|---|---|---|
| `"dark" \| "light"` | `localStorage.sanayiTheme` → yoksa `"dark"` | Sunucu HTML'i `data-theme="dark"` ile gelir; `themeInit` kayıtlı tercihi uygular; `<meta name="theme-color">` `--bg` ile senkron |

## Brand logo varlığı

| Alan | Değer |
|---|---|
| Yol | `/brands/<slug>.webp` |
| Boyut | 96×96 kutuya sığdırılmış, şeffaf; ≤10 KB |
| Yedek | `HAS_LOGO` dışında baş harf monogramı (değişmez) |
