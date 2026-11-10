/*
 * TEK YORUM SATIRI — Server Component (salt görüntüleme).
 * toLocaleDateString("tr-TR", {...}): tarihi Türkçe formatlar ("8 Temmuz 2026").
 * `r.anonymous ?? r.isAnonymous ?? false`: backend iki isimden birini gönderebilir;
 * ?? zinciri ilk null/undefined OLMAYAN değeri alır.
 *
 * 002: kendi elle yazılmış rozeti yerine ortak ScoreBadge (size="sm", tam sayı) kullanır —
 * işaret (+/−) ve aria-label ("Puan: artı 3") tek yerden gelir (FR-009/FR-014).
 * Satır içi stiller sınıflara taşındı (.rating-item, .rating-head ... globals.css).
 */
import type {RatingDto} from "@/lib/types";
import ScoreBadge from "@/components/ScoreBadge";

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

    return (
        <li className="card rating-item">
            <div className="rating-head">
                <div className="rating-who">
                    <span className="chat-avatar" aria-hidden>{who.charAt(0).toUpperCase()}</span>
                    <div className="min-w-0">
                        <div className="rating-name truncate">{who}</div>
                        <div className="caption faint">{formatDate(r.createdAt)}</div>
                    </div>
                </div>
                <ScoreBadge score={r.score} size="sm" precision={0}/>
            </div>
            {r.comment && <p className="rating-comment">{r.comment}</p>}
        </li>
    );
}
