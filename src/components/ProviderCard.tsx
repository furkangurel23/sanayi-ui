/*
 * USTA KARTI — Server Component. Kartın tamamı <Link> (tıklanabilir alan büyük olsun).
 * next/link: client-side navigasyon + görünürlükte otomatik prefetch -> anında geçiş hissi.
 */
import type {ProviderListItem} from "@/lib/types";
import Link from "next/link";
import ScoreBadge from "@/components/ScoreBadge";

export default function ProviderCard({p}: { p: ProviderListItem }) {
    const location = [p.district, p.city].filter(Boolean).join(", ");

    return (
        <Link href={`/providers/${p.id}`} className="card card-hover">
            <div className="row-between" style={{alignItems: "flex-start", flexWrap: "nowrap"}}>
                <div className="stack-sm" style={{gap: "0.2rem", minWidth: 0}}>
                    <div className="card-title truncate">{p.name}</div>
                    <div className="card-sub truncate">{location || "Konum bilgisi yok"}</div>
                    {p.phone && <div className="text-xs faint">{p.phone}</div>}
                </div>
                <ScoreBadge score={p.avgScore} count={p.ratingCount}/>
            </div>
        </Link>
    );
}
