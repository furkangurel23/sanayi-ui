/*
 * AÇILIŞ SAYFASI GÖVDESİ (005-seo-foundation, spec FR-010) — beş açılış rotası ortak kullanır.
 *
 * Sıra: gezinti yolu -> tek H1 + dükkan sayılı kısa açıklama -> dükkan listesi (en fazla 50; puanlılar
 * önce) -> fazlası varsa "Tümünü gör" (filtreli Ustalar listesine) -> ilgili açılış sayfalarına sayılı
 * bağlantılar. Gezinti yolu ayrıca JSON-LD olarak basılır. Gösterilen sayı liste yanıtının toplamıdır.
 */
import type {ReactNode} from "react";
import Link from "next/link";
import type {ProviderListItem} from "@/lib/types";
import type {Crumb} from "@/lib/seo/jsonLd";
import {breadcrumbJsonLd} from "@/lib/seo/jsonLd";
import PageHeader from "@/components/PageHeader";
import ProviderCard from "@/components/ProviderCard";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import LandingLinks, {type LandingLink} from "@/components/seo/LandingLinks";

export type LinkSection = { id: string; title: string; links: LandingLink[] };

type Props = {
    title: string;
    description: string;
    total: number;
    shops: ProviderListItem[];
    crumbs: Crumb[];
    allHref: string;
    sections: LinkSection[];
    /** İlçe sayfası gibi ek içerik (ör. sanayi siteleri satırı). */
    extra?: ReactNode;
};

export default function LandingPage({title, description, total, shops, crumbs, allHref, sections, extra}: Props) {
    return (
        <main className="container page">
            <JsonLd data={breadcrumbJsonLd(crumbs)}/>
            <Breadcrumbs items={crumbs}/>
            <PageHeader
                eyebrow="Ankara"
                title={title}
                subtitle={description}
                actions={<span className="chip">{total} dükkan</span>}
            />
            {extra}
            <div className="grid-2">
                {shops.map((p) => <ProviderCard key={p.id} p={p}/>)}
            </div>
            {total > shops.length && (
                <p>
                    <Link href={allHref} className="btn btn-outline">Tümünü gör ({total})</Link>
                </p>
            )}
            {sections.map((s) => <LandingLinks key={s.id} id={s.id} title={s.title} links={s.links}/>)}
        </main>
    );
}
