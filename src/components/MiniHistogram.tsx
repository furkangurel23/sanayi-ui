/*
 * PUAN HİSTOGRAMI (-5..+5) — Server Component, saf CSS ile çizilir (grafik kütüphanesi yok).
 * Her çubuğun yüksekliği: (o skorun oy sayısı / en yüksek oy sayısı) * alan yüksekliği.
 * Math.max(4, h): 0 oyluk skorlar da 4px'lik iz bıraksın (eksen okunabilirliği).
 */
type Bucket = { score: number, count: number };

export default function MiniHistogram({buckets, total, height = 72}: {
    buckets: Bucket[];
    total: number,
    height?: number;
}) {
    const max = Math.max(1, ...buckets.map(b => b.count));

    return (
        <div className="card" style={{padding: "0.9rem 1.1rem"}}>
            <div className="histogram" style={{height}}>
                {buckets.map((b) => {
                    const h = Math.round((b.count / max) * (height - 18));
                    const tone = b.score === 0 ? "zero" : b.score > 0 ? "pos" : "neg";
                    return (
                        <div key={b.score} className="histogram-bar" title={`${b.score}: ${b.count} oy`}>
                            <i data-tone={tone} style={{height: Math.max(4, h)}} aria-hidden/>
                            <span>{b.score}</span>
                        </div>
                    );
                })}
            </div>
            <div className="text-xs faint" style={{marginTop: "0.5rem"}}>
                Toplam oy: {total} · Aralık: -5 … +5
            </div>
        </div>
    );
}
