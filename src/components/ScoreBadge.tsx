/*
 * PUAN ROZETİ — Server Component (hook yok, olay yok -> "use client" GEREKMEZ).
 *
 * Ton mantığı: pozitif = yeşil, negatif = kırmızı, 0 / veri yok = nötr.
 * FR-014: olumlu/olumsuz bilgi YALNIZCA renkle verilmez — her zaman İŞARET de yazılır:
 *   +3.4  /  −2.0  /  0.0   (eksi için gerçek eksi işareti U+2212, kısa çizgi "-" değil:
 *   tipografik olarak artı ile aynı genişlikte ve ekran okuyucuda doğru okunur).
 * Ekran okuyucu için ayrıca tam cümle: aria-label="Puan: artı 3.4, 12 oy".
 *
 * Öğrenme notları:
 *  - `s > 0 ? ... : ...` zincirli ternary'si Kotlin'deki when'in JS karşılığı gibidir.
 *  - role="img" + aria-label: rozetin içindeki parçalı metin (işaret, sayı, "12 oy")
 *    yerine TEK anlamlı cümle okunur.
 *  - `precision`: ortalama puanlar 1 ondalıkla (+3.4), tekil yorum puanları tam sayı (+3).
 *  - `count` verilmezse "oy" satırı çizilmez (yorum satırındaki küçük rozet).
 *  - `count != null`: hem null hem undefined'ı yakalar (== null ikisine de eşittir).
 */
type Props = {
    score?: number | null;
    count?: number | null;
    size?: "sm" | "md" | "lg";
    precision?: number;
};

const MINUS = "−"; // gerçek eksi işareti

/** Puanı işaretli metne çevirir: 3.42 -> {sign:"+", value:"3.4"}; -2 -> {sign:"−", value:"2.0"} */
export function formatScore(s: number, precision = 1): { sign: string; value: string } {
    const sign = s > 0 ? "+" : s < 0 ? MINUS : "";
    return {sign, value: Math.abs(s).toFixed(precision)};
}

export default function ScoreBadge({score, count, size = "md", precision = 1}: Props) {
    const s = typeof score === "number" ? score : null;
    const tone = s === null ? "score-zero" : s > 0 ? "score-pos" : s < 0 ? "score-neg" : "score-zero";
    const f = s === null ? null : formatScore(s, precision);

    // Ekran okuyucu cümlesi: "Puan: artı 3.4, 12 oy" / "Puan yok"
    const word = s === null ? "" : s > 0 ? "artı " : s < 0 ? "eksi " : "";
    const label = (f ? `Puan: ${word}${f.value}` : "Puan yok") + (count != null ? `, ${count} oy` : "");

    return (
        <span className={`score-badge score-badge-${size} ${tone}`} role="img" aria-label={label}>
            <span>
                {f ? <><span className="score-sign">{f.sign}</span>{f.value}</> : "—"}
            </span>
            {count != null && <small>{count} oy</small>}
        </span>
    );
}
