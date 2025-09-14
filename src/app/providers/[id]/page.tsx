/*
* Bu sayfa, URL'deki /providers/[id] parametresine gore provider detayini
*  ve yorumlarini server tarafina (SSR) ceker ve render eder.
* */

import type {Page as PageType, ProviderDetailDto, RatingDto} from "@/lib/types";
import {getProviderDetail, getProviderRatings} from "@/lib/api";
import RatingItem from "@/components/RatingItem";
import Pagination from "@/components/Pagination";

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

    const addressLine = [detail.address, detail.district, detail.city].filter(Boolean).join(" / ");
    const scoreLine = typeof detail.avgScore === "number" ?
        `${detail.avgScore.toFixed(1)} (${detail.ratingCount} oy)`
        : `${detail.ratingCount} oy`;

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

            {/* (İstersen ileride buraya mini harita da koyarız: detail.location lon/lat var) */}

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

