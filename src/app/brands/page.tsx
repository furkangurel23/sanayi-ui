/*
 * MARKALAR SAYFASI — Server Component.
 * Spring Page yanıtı normalizePage'den geçer; sayfa numarası UI'da 1-based,
 * backend'de 0-based'dir (data.number + 1 dönüşümüne dikkat).
 * URL parametreleri params.ts ile temizlenir: sort/dir BEYAZ LİSTE ile okunur
 * (backend Brand alanları: id, name) — ?sort=evil&dir=x gibi değerler backend'e
 * gitmez, varsayılan "name,asc" kullanılır.
 *
 * 002: başlık ortak PageHeader kalıbıyla (üst etiket + başlık + açıklama), marka yoksa
 * ortak EmptyState; satır içi stil kalmadı.
 */
import {getBrands, getFacets} from "@/lib/api";
import {buildLandingIndex, landingPath} from "@/lib/seo/landing";
import type {BrandDto, Page as PageType, ProviderFacets} from "@/lib/types";
import BrandCard from "@/components/BrandCard";
import Pagination from "@/components/Pagination";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import {Search} from "@/components/icons";
import {parseEnum, parsePage, parseSize} from "@/lib/params";
import type {Metadata} from "next";
import {pageMetadata} from "@/lib/seo/site";

type SearchParams = { [_: string]: string | string[] | undefined };

/** URL -> doğrulanmış sayfalama/sıralama (sayfa ve generateMetadata ortak). */
function readBrandParams(sp: SearchParams) {
    return {
        page: parsePage(sp.page),
        size: parseSize(sp.size, 20, 50),
        sort: parseEnum(sp.sort, ["name", "id"] as const, "name"),
        dir: parseEnum(sp.dir, ["asc", "desc"] as const, "asc"),
    };
}

/*
 * 005 SEO (spec FR-013, R12): sorgusuz /brands dizine açık; sayfalı/sıralı yazımlar "noindex, follow"
 * ve kendine kanonik (yalnız doğrulanmış, varsayılandan farklı değerler; sabit sıra).
 */
export async function generateMetadata({searchParams}: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
    const f = readBrandParams(await searchParams);
    const qs = new URLSearchParams();
    if (f.page > 1) qs.set("page", String(f.page));
    if (f.size !== 20) qs.set("size", String(f.size));
    if (f.sort !== "name") qs.set("sort", f.sort);
    if (f.dir !== "asc") qs.set("dir", f.dir);
    const query = qs.toString();
    return pageMetadata({
        title: "Markalar",
        description: "Araba markana bakan Ankara sanayi ustaları: markanı seç, o markayla çalışan servisleri ve sohbet odasını gör.",
        path: query ? `/brands?${query}` : "/brands",
        index: !query,
    });
}

export default async function BrandsPage({
                                             searchParams,
                                         }: {
    searchParams: Promise<SearchParams>;
}) {
    const {page, size, sort, dir} = readBrandParams(await searchParams);

    const [data, facets]: [PageType<BrandDto>, ProviderFacets | null] = await Promise.all([
        getBrands({page, size, sort, dir}),
        getFacets().catch(() => null), // 005: marka açılış bağlantıları; hata -> bağlantı yok
    ]);
    const landing = facets ? buildLandingIndex(facets) : null;

    return (
        <main className="container page">
            <PageHeader
                eyebrow="Markalar"
                title="Markana bakan ustalar"
                subtitle="Markanı seç; o markayla çalışan ustaları gör, sohbet odasına katıl."
            />

            {data.content.length === 0 ? (
                <EmptyState icon={<Search/>} title="Marka bulunamadı."/>
            ) : (
                <div className="grid-2 grid-start">
                    {data.content.map((b) => {
                        // Dükkanı olan markaya "Ankara {Marka} ustaları" bağlantısı (açılış sayfası varsa).
                        const target = landing?.brandById.get(b.id);
                        return <BrandCard key={b.id} brand={b} landingHref={target ? landingPath("marka", target.slug) : undefined}/>;
                    })}
                </div>
            )}

            <Pagination page={(data.number ?? 0) + 1} totalPages={data.totalPages ?? 1}/>
        </main>
    );
}
