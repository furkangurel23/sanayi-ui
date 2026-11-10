/*
 * MARKALAR SAYFASI — Server Component.
 * Spring Page yanıtı normalizePage'den geçer; sayfa numarası UI'da 1-based,
 * backend'de 0-based'dir (data.number + 1 dönüşümüne dikkat).
 */
import {getBrands} from "@/lib/api";
import type {BrandDto, Page as PageType} from "@/lib/types";
import BrandCard from "@/components/BrandCard";
import Pagination from "@/components/Pagination";

export const metadata = {
    title: "Markalar",
};

export default async function BrandsPage({
                                             searchParams,
                                         }: {
    searchParams: Promise<{ [_: string]: string | string[] | undefined }>;
}) {
    const sp = await searchParams;

    const page = Number(sp.page ?? "1");
    const size = Number(sp.size ?? "20");
    const sort = String(sp.sort ?? "name");
    const dir = (sp.dir as "asc" | "desc") ?? "asc";

    const data: PageType<BrandDto> = await getBrands({page, size, sort, dir});

    return (
        <main className="container page">
            <div className="stack-sm">
                <span className="eyebrow">Markalar</span>
                <h1 className="section-title" style={{fontSize: "var(--text-2xl)"}}>Markana bakan ustalar</h1>
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
