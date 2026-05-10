// src/components/ProviderCard.tsx
import type {ProviderListItem} from "@/lib/types";
import Link from "next/link";

export default function ProviderCard({p}: { p: ProviderListItem }) {
    const averageScore = typeof p.avgScore === "number" ? p.avgScore : null;
    const location = [p.city, p.district].filter(Boolean).join(" / ");

    const scoreTone = averageScore === null ? "text-white/60" : averageScore < 0 ? "text-rose-300" : averageScore === 0 ? "text-white/80" : "text-emerald-300";

    return (
        <Link
            href={`/providers/${p.id}`}
            className="block rounded-xl border border-white/10 p-4 transition hover:border-white/30 hover:bg-white/[0.03]"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="truncate text-base font-semibold">{p.name}</div>
                    <div className="mt-1 text-xs opacity-70">
                        {location || "Konum bilgisi yok"}
                    </div>
                    {p.phone && <div className="mt-1 text-xs opacity-70">{p.phone}</div>}
                </div>

                <div className="shrink-0 text-right">
                    <div className={`text-lg font-bold ${scoreTone}`}>
                        {averageScore?.toFixed(1) ?? "-"}
                    </div>
                    <div className="text-[11px] opacity-70">{p.ratingCount ?? 0} oy</div>
                </div>
            </div>
        </Link>
    );
}
