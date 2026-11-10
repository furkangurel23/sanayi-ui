/*
 * PUAN HİSTOGRAMI (−5..+5) — Server Component, saf CSS ile çizilir (grafik kütüphanesi yok).
 *
 * Her çubuğun yüksekliği: (o skorun oy sayısı / en yüksek oy sayısı) yüzdesi.
 * Yükseklik bir ÇALIŞMA ANI DEĞERİ olduğu için satır içi verilir — ama doğrudan `height`
 * değil, bir CSS değişkeni olarak (`--h`); çizim kuralları globals.css'te kalır
 * (.histogram-track > i { height: max(var(--space-1), var(--h)) } -> 0 oylu skor da
 * 4 px'lik iz bırakır, eksen okunur).
 *
 * Erişilebilirlik (D12, FR-014):
 *  - Renk tek başına anlam taşımaz: her çubuğun altında İŞARETLİ değer etiketi
 *    (−5 … 0 … +5) ve her çubukta aria-label ("Puan eksi 2: 3 oy").
 *  - Liste semantiği (ul/li): ekran okuyucu "11 öğeli liste" der ve tek tek okur.
 *
 * Öğrenme notu: `style={{"--h": ...} as CSSProperties}` — TypeScript CSSProperties tipi
 * özel değişken adlarını tanımaz; `as` ile "bunun doğru olduğunu biliyorum" deriz.
 */
import type {CSSProperties} from "react";
import {formatScore} from "@/components/ScoreBadge";

type Bucket = { score: number, count: number };

export default function MiniHistogram({buckets, total}: {
    buckets: Bucket[];
    total: number,
}) {
    const max = Math.max(1, ...buckets.map(b => b.count));

    return (
        <div className="card histogram-card">
            <ul className="histogram" aria-label="Puan dağılımı">
                {buckets.map((b) => {
                    const pct = Math.round((b.count / max) * 100);
                    const tone = b.score === 0 ? "zero" : b.score > 0 ? "pos" : "neg";
                    const f = formatScore(b.score, 0);
                    const word = b.score > 0 ? "artı " : b.score < 0 ? "eksi " : "";
                    return (
                        <li key={b.score} className="histogram-bar" aria-label={`Puan ${word}${f.value}: ${b.count} oy`}
                            title={`${f.sign}${f.value}: ${b.count} oy`}>
                            <span className="histogram-track" aria-hidden>
                                {/* çalışma anı değeri: çubuk yüksekliği (oy oranı) */}
                                <i data-tone={tone} style={{"--h": `${pct}%`} as CSSProperties}/>
                            </span>
                            <span className="histogram-label" aria-hidden>{f.sign}{f.value}</span>
                        </li>
                    );
                })}
            </ul>
            <p className="caption muted">
                Toplam oy: {total} · Aralık: {"−"}5 … +5
            </p>
        </div>
    );
}
