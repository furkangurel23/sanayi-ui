/*
 * AÇILIŞ SAYFASI GÖRÜNÜMLERİ (005-seo-foundation) — beş rota dosyası bunları çağırır; rota dosyaları
 * yalnız parametreyi okur. Her görünüm `{meta, page}` döner ya da hedef yoksa `null` (rota 404 verir;
 * asıl 404 kararı Suspense dışındaki layout'ta — UI anayasası I).
 *
 * Kurallar (spec FR-009/FR-010, contracts/ui-seo-routes.md):
 *  - Ana sayfa (marka/kategori/ilçe) ≥1 dükkanla dizine açık; kırılım ≥3 (1–2 -> "noindex, follow").
 *  - Gösterilen sayı = liste yanıtının toplamı (60 sn taze); var/yok ve dizin kararı sayım özetinden.
 *  - Bağlantılar yalnız dükkanı olan hedeflere, sayılarıyla.
 */
import type {Metadata} from "next";
import type {ReactNode} from "react";
import LandingPage, {type LinkSection} from "@/components/seo/LandingPage";
import {pageMetadata} from "@/lib/seo/site";
import {landingDescription, landingTitle} from "@/lib/seo/text";
import {sitesInDistrict} from "@/lib/seo/industrialSites";
import {
    breakdownCount, districtsOf, type FacetKind, facetsInDistrict, findBrand, findCategory, findDistrict,
    isIndexable, landingPath, type LandingIndex,
} from "@/lib/seo/landing";
import {landingIndex, landingShops, providersHref} from "./landing";

export type LandingView = { meta: Metadata; page: ReactNode };

const HOME = {name: "Ana sayfa", path: "/"};

function findFacet(ix: LandingIndex, kind: FacetKind, slug: string) {
    return kind === "marka" ? findBrand(ix, slug) : findCategory(ix, slug);
}

function filterOf(kind: FacetKind, id: number, district?: string) {
    return kind === "marka" ? {brandId: id, district} : {categoryId: id, district};
}

/** /ankara/marka/{m} ve /ankara/kategori/{k} */
export async function facetMainView(kind: FacetKind, slug: string): Promise<LandingView | null> {
    const ix = await landingIndex();
    const f = findFacet(ix, kind, slug);
    if (!f) return null;
    const data = await landingShops(filterOf(kind, f.id));
    const title = landingTitle(kind, f.name);
    const description = landingDescription(kind, f.name, data.totalElements);
    const path = landingPath(kind, f.slug);
    const sections: LinkSection[] = [{
        id: "by-district",
        title: `İlçelere göre ${f.name} ustaları`,
        links: districtsOf(ix, kind, f.id).map((d) => ({href: landingPath(kind, f.slug, d.slug), label: d.name, count: d.cellCount})),
    }];
    return {
        meta: pageMetadata({title, description, path, index: isIndexable(false, f.count)}),
        page: <LandingPage title={title} description={description} total={data.totalElements} shops={data.content}
                           crumbs={[HOME, {name: title, path}]} allHref={providersHref(filterOf(kind, f.id))}
                           sections={sections}/>,
    };
}

/** /ankara/marka/{m}/{i} ve /ankara/kategori/{k}/{i} */
export async function facetBreakdownView(kind: FacetKind, slug: string, districtSlug: string): Promise<LandingView | null> {
    const ix = await landingIndex();
    const f = findFacet(ix, kind, slug);
    const d = findDistrict(ix, districtSlug);
    if (!f || !d) return null;
    const cell = breakdownCount(ix, kind, f.id, d.name);
    if (cell === 0) return null;
    const data = await landingShops(filterOf(kind, f.id, d.name));
    const title = landingTitle(kind, f.name, d.name);
    const description = landingDescription(kind, f.name, data.totalElements, d.name);
    const path = landingPath(kind, f.slug, d.slug);
    const mainTitle = landingTitle(kind, f.name);
    const districtTitle = landingTitle("ilce", d.name);
    const otherKindLabel = kind === "marka" ? "markalar" : "kategoriler";
    const sections: LinkSection[] = [
        {
            id: "related",
            title: "İlgili sayfalar",
            links: [
                {href: landingPath(kind, f.slug), label: mainTitle, count: f.count},
                {href: landingPath("ilce", d.slug), label: districtTitle, count: d.count},
            ],
        },
        {
            id: "same-district",
            title: `${d.name} ilçesinde diğer ${otherKindLabel}`,
            links: facetsInDistrict(ix, kind, d.name).filter((x) => x.id !== f.id)
                .map((x) => ({href: landingPath(kind, x.slug, d.slug), label: x.name, count: x.cellCount})),
        },
        {
            id: "other-districts",
            title: `Diğer ilçelerde ${f.name} ustaları`,
            links: districtsOf(ix, kind, f.id).filter((x) => x.name !== d.name)
                .map((x) => ({href: landingPath(kind, f.slug, x.slug), label: x.name, count: x.cellCount})),
        },
    ];
    return {
        meta: pageMetadata({title, description, path, index: isIndexable(true, cell)}),
        page: <LandingPage title={title} description={description} total={data.totalElements} shops={data.content}
                           crumbs={[HOME, {name: mainTitle, path: landingPath(kind, f.slug)}, {name: d.name, path}]}
                           allHref={providersHref(filterOf(kind, f.id, d.name))} sections={sections}/>,
    };
}

/** /ankara/ilce/{i}: ilçedeki dükkanlar + kategori dağılımı + markalar + sanayi siteleri. */
export async function districtView(districtSlug: string): Promise<LandingView | null> {
    const ix = await landingIndex();
    const d = findDistrict(ix, districtSlug);
    if (!d) return null;
    const data = await landingShops({district: d.name});
    const sites = sitesInDistrict(d.name);
    const title = landingTitle("ilce", d.name);
    const description = landingDescription("ilce", d.name, data.totalElements, undefined, sites);
    const path = landingPath("ilce", d.slug);
    const sections: LinkSection[] = [
        {
            id: "categories",
            title: `${d.name} ilçesinde kategoriler`,
            links: facetsInDistrict(ix, "kategori", d.name)
                .map((c) => ({href: landingPath("kategori", c.slug, d.slug), label: c.name, count: c.cellCount})),
        },
        {
            id: "brands",
            title: `${d.name} ilçesinde markalar`,
            links: facetsInDistrict(ix, "marka", d.name)
                .map((b) => ({href: landingPath("marka", b.slug, d.slug), label: b.name, count: b.cellCount})),
        },
    ];
    const extra = sites.length > 0
        ? <p className="muted">Sanayi siteleri: {sites.join(", ")}</p>
        : undefined;
    return {
        meta: pageMetadata({title, description, path, index: isIndexable(false, d.count)}),
        page: <LandingPage title={title} description={description} total={data.totalElements} shops={data.content}
                           crumbs={[HOME, {name: title, path}]} allHref={providersHref({district: d.name})}
                           sections={sections} extra={extra}/>,
    };
}
