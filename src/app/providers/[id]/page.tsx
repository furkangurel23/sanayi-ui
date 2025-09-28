/*
* Bu sayfa, URL'deki /providers/[id] parametresine gore provider detayini
*  ve yorumlarini server tarafina (SSR) ceker ve render eder.
* */

import type {Page as PageType, ProviderDetailDto, ProviderListItem, RatingDto} from "@/lib/types";
import {getProviderDetail, getProviderRatings} from "@/lib/api";
import RatingItem from "@/components/RatingItem";
import Pagination from "@/components/Pagination";
import ProvidersMap from "@/components/ProvidersMap";
import MiniHistogram from "@/components/MiniHistogram";

// (SEO) baslik: provider adini rumtime'da biliyoruz -> dinamik metadaa yazilabilir; simdilik sabit baslik veriyoruz.

export const metadata = {
    title: "Usta Detayı | Sanayi",
};

//Next 15: params/searchParams Promise -> tipleri boyle yazariz.
export default async function ProviderDetailPage({
                                                     params,
                                                     searchParams,
                                                 }: {
    params: Promise<{ id: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const p = await params;
    const sp = await searchParams;

    const id = Number(p.id);
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error(`Geçersiz usta id: ${p.id}`);
    }

    //Yorumlar icin ayri sayfalama (1-based)
    const rPage = Number(sp.page ?? "1");
    const rSize = Number(sp.size ?? "10");

    // --Veri cek: Detay + Yorumlar
    // Tip karmasasi yasamamak icin iki adimda: performans sikintisi yok (detay cacheli)

    const detail: ProviderDetailDto = await getProviderDetail(id);
    const ratingsPage: PageType<RatingDto> = await getProviderRatings({
        id,
        page: rPage,
        size: rSize,
        sortField: "createdAt",
        sortDir: "desc",
    });

    const histogramSample: PageType<RatingDto> =
        detail.ratingCount > 0
            ? await getProviderRatings({
                id,
                page: 1,
                size: Math.min(100, detail.ratingCount),
                sortField: "createdAt",
                sortDir: "desc",
            })
            : {content: [], number: 0, size: 0, totalPages: 0, totalElements: 0} as any;


    const addressLine = [detail.address, detail.district, detail.city].filter(Boolean).join(" / ");
    const scoreLine = typeof detail.avgScore === "number" ?
        `${detail.avgScore.toFixed(1)} (${detail.ratingCount} oy)`
        : `${detail.ratingCount} oy`;

    //Harita icin tek ogelik liste(ProvidersMap signature'ina uyacak sekilde)

    const mapItems: ProviderListItem[] = detail.location
        ? [{
            id: detail.id,
            name: detail.name,
            city: detail.city ?? undefined,
            district: detail.district ?? undefined,
            phone: detail.phone ?? undefined,
            avgScore: typeof detail.avgScore === "number" ? detail.avgScore : undefined,
            ratingCount: detail.ratingCount,
            lat: detail.location.lat,
            lon: detail.location.lon,
        }]
        : [];

    const range = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
    const buckets = range.map(s => ({
        score: s,
        count: histogramSample.content.filter(r => r.score === s).length
    }));

    const sampleTotal = histogramSample.content.length;
    const top3 = histogramSample.content.slice(0, 3)


    return (
        <main className="mx-auto max-w-4xl p-4 space-y-6">
            {/* Üst başlık ve özet bilgiler */}
            <section className="space-y-2">
                <h1 className="text-2xl font-bold">{detail.name}</h1>
                <div className="text-sm opacity-80">{addressLine || "Adres bilgisi yok"}</div>
                {detail.phone && (
                    <div className="text-sm">
                        Tel: <a className="underline underline-offset-2" href={`tel:${detail.phone}`}>{detail.phone}</a>
                    </div>
                )}
                <div className="text-sm">Puan: <span className="font-semibold">{scoreLine}</span></div>
            </section>

            {/* Marka ve kategoriler etiketleri */}
            <section className="space-y-2">
                <div className="flex flex-wrap gap-2">
                    {detail.brands.map(b => (
                        <span key={b.id} className="text-xs rounded-lg border border-white/15 px-2 py-1">
              {b.name}
            </span>
                    ))}
                </div>
                <div className="flex flex-wrap gap-2">
                    {detail.categories.map(c => (
                        <span key={c.id} className="text-xs rounded-lg border border-white/15 px-2 py-1">
              {c.name}
            </span>
                    ))}
                </div>
            </section>

            {/* Mini harita */}
            {mapItems.length > 0 && (
                <section className="space-y-2">
                    <h2 className="text-lg font-semibold">Konum</h2>
                    <ProvidersMap items={mapItems} height={220}/>
                </section>
            )}

            {/* İstatistikler: histogram + özet */}
            {detail.ratingCount > 0 && (
                <section className="space-y-2">
                    <h2 className="text-lg font-semibold">Puan Dağılımı</h2>
                    <div className="flex items-center gap-4">
                        <div className="text-sm min-w-36">
                            <div className="opacity-80">Ortalama</div>
                            <div className="text-2xl font-bold leading-none">
                                {typeof detail.avgScore === "number" ? detail.avgScore.toFixed(2) : "-"}
                            </div>
                            <div className="text-xs opacity-70">{detail.ratingCount} oy</div>
                        </div>
                        <div className="flex-1">
                            <MiniHistogram buckets={buckets} total={sampleTotal}/>
                        </div>
                    </div>
                </section>
            )}

            {/* Son 3 yorum (yalnızca ilk sayfada göster) */}
            {detail.ratingCount > 0 && rPage === 1 && top3.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">Son 3 yorum</h2>
                    <ul className="space-y-2">
                        {top3.map(r => <RatingItem key={`top3-${r.id}`} r={r}/>)}
                    </ul>
                </section>
            )}


            {/* Yorumlar listesi + sayfalama */}
            <section className="space-y-3">
                <h2 className="text-lg font-semibold">Yorumlar</h2>

                {ratingsPage.content.length === 0 ? (
                    <div className="text-sm opacity-80 rounded-xl border border-white/10 p-3">
                        Henüz yorum yok.
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {ratingsPage.content.map((r) => (
                            <RatingItem key={r.id} r={r}/>
                        ))}
                    </ul>
                )}

                {/* Aynı Pagination bileşenini kullanıyoruz; query param adı `page` */}
                <div className="pt-2">
                    <Pagination
                        page={(ratingsPage.number ?? 0) + 1}
                        totalPages={ratingsPage.totalPages ?? 1}
                    />
                </div>
            </section>


        </main>
    );
}

