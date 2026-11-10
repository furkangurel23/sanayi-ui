/*
 * USTA KARTI — Server Component. Kartın tamamı tıklanabilir (büyük dokunma alanı).
 * next/link: client-side navigasyon + görünürlükte otomatik prefetch -> anında geçiş hissi.
 *
 * 002: uzun dükkan adı tek satırda kesilmek yerine en fazla 2 satır (.clamp-2 — D12),
 * konum satırı Pin ikonuyla; satır içi stiller sınıflara taşındı (.provider-card*).
 * Puan rozeti renk + işaret + aria-label taşır (ScoreBadge).
 *
 * `distanceKm?`: yakınımdakiler sayfası da AYNI kartı kullanır (FR-009 — eskiden orada
 * elle yazılmış ikinci bir kart vardı). Verilirse altta "x km uzakta" chip'i çizilir.
 * toFixed(1): sayıyı tek ondalıklı metne çevirir (2.345 -> "2.3").
 *
 * 002 rev 3 (T050) — "STRETCHED LINK" (gerilmiş bağlantı) kalıbı + `footer?`:
 *  - Yakınımdakiler kartının altına yol tarifi bağlantıları (DirectionsLinks) eklendi.
 *    Eskiden kartın TAMAMI bir <a> idi; içine ikinci bir <a> koymak GEÇERSİZ HTML'dir
 *    (iç içe etkileşimli öğe: tarayıcı DOM'u bozar, ekran okuyucu karışır, tıklamanın
 *    hangi bağlantıya gideceği belirsizleşir).
 *  - Çözüm: kart bir <article> olur; detay bağlantısı (<Link>) yalnız ana içeriği sarar ve
 *    `.provider-card-link::after { position:absolute; inset:0 }` ile görünmez bir katmanı
 *    TÜM KARTIN üstüne gerer -> kartın her yerine tıklamak yine detaya gider.
 *    (::after, en yakın `position: relative` ataya — .provider-card — göre konumlanır.)
 *  - `footer` bu katmanın KARDEŞİ ve `position: relative; z-index: 1` ile ÜSTÜNDE durur ->
 *    içindeki bağlantılar ayrı ayrı tıklanır, kart bağlantısını tetiklemez.
 *  - Odak halkası: Link odaklanınca halka Link'in kendisine değil ::after katmanına çizilir
 *    -> klavye kullanıcısı halkayı (eskisi gibi) kartın çevresinde görür.
 *  - Görünüm (card-hover, aralıklar) önceki kartla aynıdır; footer verilmeyen kullanımlar
 *    (liste sayfası) görsel olarak değişmez.
 */
import type {ReactNode} from "react";
import type {ProviderListItem} from "@/lib/types";
import Link from "next/link";
import ScoreBadge from "@/components/ScoreBadge";
import {formatPhoneTR} from "@/lib/phone";
import {Pin} from "@/components/icons";

type Props = { p: ProviderListItem; distanceKm?: number; footer?: ReactNode };

export default function ProviderCard({p, distanceKm, footer}: Props) {
    const location = [p.district, p.city].filter(Boolean).join(", ");

    return (
        <article className="card card-hover provider-card">
            <Link href={`/providers/${p.id}`} className="provider-card-link">
                <div className="provider-card-body">
                    <div className="card-title clamp-2">{p.name}</div>
                    <div className="provider-card-meta">
                        <Pin size="sm"/>
                        <span className="truncate">{location || "Konum bilgisi yok"}</span>
                    </div>
                    {p.phone && <div className="caption faint">{formatPhoneTR(p.phone)}</div>}
                    {distanceKm !== undefined && (
                        <span className="chip provider-card-extra">{distanceKm.toFixed(1)} km uzakta</span>
                    )}
                </div>
                <ScoreBadge score={p.avgScore} count={p.ratingCount}/>
            </Link>
            {footer && <div className="provider-card-footer">{footer}</div>}
        </article>
    );
}
