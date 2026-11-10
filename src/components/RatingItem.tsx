/*
 * TEK YORUM SATIRI — Server Component (salt görüntüleme).
 * toLocaleDateString("tr-TR", {...}): tarihi Türkçe formatlar ("8 Temmuz 2026").
 * `r.anonymous ?? r.isAnonymous ?? false`: backend iki isimden birini gönderebilir;
 * ?? zinciri ilk null/undefined OLMAYAN değeri alır.
 */
import type {RatingDto} from "@/lib/types";

function formatDate(iso: string) {
    try {
        return new Date(iso).toLocaleDateString("tr-TR", {day: "numeric", month: "long", year: "numeric"});
    } catch {
        return iso;
    }
}

export default function RatingItem({r}: { r: RatingDto }) {
    const isAnonymous = r.anonymous ?? r.isAnonymous ?? false;
    const who = isAnonymous ? "Anonim" : (r.userDisplayName || "Kullanıcı");
    const tone = r.score > 0 ? "score-pos" : r.score < 0 ? "score-neg" : "score-zero";

    return (
        <li className="card" style={{padding: "0.9rem 1.1rem"}}>
            <div className="row-between" style={{flexWrap: "nowrap"}}>
                <div className="row" style={{minWidth: 0}}>
                    <span className="chat-avatar" aria-hidden>{who.charAt(0).toUpperCase()}</span>
                    <div style={{minWidth: 0}}>
                        <div className="text-sm truncate" style={{fontWeight: 650}}>{who}</div>
                        <div className="text-xs faint">{formatDate(r.createdAt)}</div>
                    </div>
                </div>
                <span className={`score-badge ${tone}`} style={{fontSize: "1rem", minWidth: "2.8rem"}}>
                    {r.score > 0 ? `+${r.score}` : r.score}
                </span>
            </div>
            {r.comment && <p className="text-sm" style={{marginTop: "0.6rem"}}>{r.comment}</p>}
        </li>
    );
}
