import type {RatingDto} from "@/lib/types";

function formatDate(iso: string) {
    try {
        return new Date(iso).toLocaleDateString("tr-TR");
    } catch {
        return iso;
    }
}

export default function RatingItem({r}: { r: RatingDto }) {
    const scoreText = `${r.score} puan`;
    const isAnonymous = r.anonymous ?? r.isAnonymous ?? false;
    const who = isAnonymous ? "Anonim" : (r.userDisplayName || "Kullanıcı");

    return (
        <li className="rounded-xl border border-white/10 p-3">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="font-medium">{who}</div>
                    <div className="text-xs opacity-70">{formatDate(r.createdAt)}</div>
                </div>
                <div className="text-sm font-semibold">{scoreText}</div>
            </div>
            {r.comment && <p className="mt-2 text-sm leading-relaxed">{r.comment}</p>}
        </li>
    );
}
