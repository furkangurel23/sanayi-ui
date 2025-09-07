// src/components/ProviderCard.tsx
import type {ProviderListItem} from "@/lib/types";

export default function ProviderCard({p}: { p: ProviderListItem }) {
    return (
        <a
            href={`/provider/${p.id}`}
            className="block rounded-2xl border border-white/10 p-4 hover:border-white/30 transition"
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-base font-semibold">{p.name}</div>
                    <div className="text-xs opacity-70">
                        {[p.city, p.district].filter(Boolean).join(" / ")}
                    </div>
                    {p.phone && <div className="text-xs opacity-70 mt-1">{p.phone}</div>}
                </div>

                <div className="text-right">
                    <div className="text-lg font-bold">{p.avgScore?.toFixed(1) ?? "-"}</div>
                    <div className="text-[11px] opacity-70">{p.ratingCount ?? 0} oy</div>
                </div>
            </div>
        </a>
    );
}
