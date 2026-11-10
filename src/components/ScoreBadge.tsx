/*
 * PUAN ROZETİ — Server Component (hook yok, olay yok -> "use client" GEREKMEZ).
 * Ton mantığı: pozitif=yeşil, negatif=kırmızı, 0/veri yok=nötr.
 * `s > 0 ? ... : ...` zincirli ternary'si Kotlin'deki when'in JS karşılığı gibidir.
 */
export default function ScoreBadge({score, count}: { score?: number | null; count?: number | null }) {
    const s = typeof score === "number" ? score : null;
    const tone = s === null ? "score-zero" : s > 0 ? "score-pos" : s < 0 ? "score-neg" : "score-zero";
    return (
        <span className={`score-badge ${tone}`}>
            {s === null ? "—" : (s > 0 ? `+${s.toFixed(1)}` : s.toFixed(1))}
            <small>{count ?? 0} oy</small>
        </span>
    );
}
