/*
 * USTA KARTI — Server Component. Kartın tamamı <Link> (tıklanabilir alan büyük olsun).
 * next/link: client-side navigasyon + görünürlükte otomatik prefetch -> anında geçiş hissi.
 *
 * 002: uzun dükkan adı tek satırda kesilmek yerine en fazla 2 satır (.clamp-2 — D12),
 * konum satırı Pin ikonuyla; satır içi stiller sınıflara taşındı (.provider-card*).
 * Puan rozeti renk + işaret + aria-label taşır (ScoreBadge).
 *
 * `distanceKm?`: yakınımdakiler sayfası da AYNI kartı kullanır (FR-009 — eskiden orada
 * elle yazılmış ikinci bir kart vardı). Verilirse altta "x km uzakta" chip'i çizilir.
 * toFixed(1): sayıyı tek ondalıklı metne çevirir (2.345 -> "2.3").
 */
import type {ProviderListItem} from "@/lib/types";
import Link from "next/link";
import ScoreBadge from "@/components/ScoreBadge";
import {Pin} from "@/components/icons";

export default function ProviderCard({p, distanceKm}: { p: ProviderListItem; distanceKm?: number }) {
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
                {distanceKm !== undefined && (
                    <span className="chip provider-card-extra">{distanceKm.toFixed(1)} km uzakta</span>
                )}
            </div>
            <ScoreBadge score={p.avgScore} count={p.ratingCount}/>
        </Link>
    );
}
