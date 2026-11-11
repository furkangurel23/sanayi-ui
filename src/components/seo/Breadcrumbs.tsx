/*
 * GEZİNTİ YOLU (005-seo-foundation, spec US1-8 / FR-010) — sunucu bileşeni.
 *
 * "Ana sayfa › Etimesgut oto sanayi ustaları › Dükkan": kullanıcıya nerede olduğunu gösterir, arama
 * motoruna site hiyerarşisini anlatır (aynı öğeler `breadcrumbJsonLd` ile yapılandırılmış veri olarak
 * da basılır). Erişilebilirlik: <nav aria-label> + sıralı liste; son öğe bağlantı değil,
 * `aria-current="page"`. Ayırıcı dekoratif ikon (aria-hidden) — metin ok (›) ekran okuyucuda
 * "büyüktür" diye okunurdu.
 */
import Link from "next/link";
import {ChevronRight} from "@/components/icons";
import type {Crumb} from "@/lib/seo/jsonLd";

export default function Breadcrumbs({items}: { items: readonly Crumb[] }) {
    return (
        <nav aria-label="Gezinti yolu" className="breadcrumbs caption">
            <ol>
                {items.map((c, i) => {
                    const last = i === items.length - 1;
                    return (
                        <li key={c.path}>
                            {last
                                ? <span aria-current="page">{c.name}</span>
                                : <Link href={c.path}>{c.name}</Link>}
                            {!last && <ChevronRight size="sm"/>}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
