/*
 * MARKALAR SAYFASI — Server Component.
 * Spring Page yanıtı normalizePage'den geçer; sayfa numarası UI'da 1-based,
 * backend'de 0-based'dir (data.number + 1 dönüşümüne dikkat).
 * URL parametreleri params.ts ile temizlenir: sort/dir BEYAZ LİSTE ile okunur
 * (backend Brand alanları: id, name) — ?sort=evil&dir=x gibi değerler backend'e
 * gitmez, varsayılan "name,asc" kullanılır.
 */
import {getBrands} from "@/lib/api";
import type {BrandDto, Page as PageType} from "@/lib/types";
import BrandCard from "@/components/BrandCard";
import Pagination from "@/components/Pagination";
import {parseEnum, parsePage, parseSize} from "@/lib/params";

export const metadata = {
    title: "Markalar",
};

export default async function BrandsPage({
                                             searchParams,
                                         }: {
    searchParams: Promise<{ [_: string]: string | string[] | undefined }>;
}) {
    const sp = await searchParams;

    const page = parsePage(sp.page);
    const size = parseSize(sp.size, 20, 50);
    const sort = parseEnum(sp.sort, ["name", "id"] as const, "name");
    const dir = parseEnum(sp.dir, ["asc", "desc"] as const, "asc");

    const data: PageType<BrandDto> = await getBrands({page, size, sort, dir});

    return (
        <main className="container page">
            <div className="stack-sm">
                <span className="eyebrow">Markalar</span>
                <h1 className="section-title" style={{fontSize: "var(--type-title)"}}>Markana bakan ustalar</h1>
                <p className="muted text-sm">Markanı seç; o markayla çalışan ustaları gör, sohbet odasına katıl.</p>
            </div>

            {data.content.length === 0 ? (
                <div className="empty-state">Marka bulunamadı.</div>
            ) : (
                <div className="grid-2">
                    {data.content.map((b) => <BrandCard key={b.id} brand={b}/>)}
                </div>
            )}

            <Pagination page={(data.number ?? 0) + 1} totalPages={data.totalPages ?? 1}/>
        </main>
    );
}
