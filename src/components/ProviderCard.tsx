/*
 * USTA KARTI — Server Component. Kartın tamamı <Link> (tıklanabilir alan büyük olsun).
 * next/link: client-side navigasyon + görünürlükte otomatik prefetch -> anında geçiş hissi.
 *
 * 002: uzun dükkan adı tek satırda kesilmek yerine en fazla 2 satır (.clamp-2 — D12),
 * konum satırı Pin ikonuyla; satır içi stiller sınıflara taşındı (.provider-card*).
 * Puan rozeti renk + işaret + aria-label taşır (ScoreBadge).
 */
import type {ProviderListItem} from "@/lib/types";
import Link from "next/link";
import ScoreBadge from "@/components/ScoreBadge";
import {Pin} from "@/components/icons";

export default function ProviderCard({p}: { p: ProviderListItem }) {
    const location = [p.district, p.city].filter(Boolean).join(", ");

    return (
        <Link href={`/providers/${p.id}`} className="card card-hover provider-card">
            <div className="provider-card-body">
                <div className="card-title clamp-2">{p.name}</div>
                <div className="provider-card-meta">
                    <Pin size="sm"/>
                    <span className="truncate">{location || "Konum bilgisi yok"}</span>
                </div>
                {p.phone && <div className="caption faint">{p.phone}</div>}
            </div>
            <ScoreBadge score={p.avgScore} count={p.ratingCount}/>
        </Link>
    );
}
