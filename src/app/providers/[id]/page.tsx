/*
 * USTA DETAY SAYFASI — Server Component (SSR).
 *
 * generateMetadata: sekme başlığını usta adıyla dinamik kurar (SEO).
 * İki ayrı veri çekimi: detay (cache'li) + yorum sayfası (no-store, her zaman taze).
 * scoreHistogram Record<string, number> gelir; -5..+5 dizisine map'lenerek
 * eksik skorlar 0 ile doldurulur (histogram her zaman 11 çubuk).
 */
import type {Page as PageType, ProviderDetailDto, ProviderListItem, RatingDto} from "@/lib/types";
import {getProviderDetail, getProviderRatings} from "@/lib/api";
import Link from "next/link";
import RatingItem from "@/components/RatingItem";
import Pagination from "@/components/Pagination";
import ProvidersMap from "@/components/ProvidersMap";
import MiniHistogram from "@/components/MiniHistogram";
import RateForm from "@/components/RateForm";
import ScoreBadge from "@/components/ScoreBadge";

export async function generateMetadata({params}: { params: Promise<{ id: string }> }) {
    const {id} = await params;
    try {
        const detail = await getProviderDetail(Number(id));
        return {title: detail.name};
    } catch {
        return {title: "Usta Detayı"};
    }
}

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

    const rPage = Number(sp.page ?? "1");
    const rSize = Number(sp.size ?? "10");

    const detail: ProviderDetailDto = await getProviderDetail(id);
    const ratingsPage: PageType<RatingDto> = await getProviderRatings({
        id, page: rPage, size: rSize, sortField: "createdAt", sortDir: "desc",
    });

    const addressLine = [detail.address, detail.district, detail.city].filter(Boolean).join(", ");

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
        count: Number(detail.scoreHistogram?.[String(s)] ?? 0),
    }));
    const histogramTotal = buckets.reduce((sum, b) => sum + b.count, 0);

    return (
        <main className="container page" style={{maxWidth: "56rem"}}>
            {/* Başlık kartı */}
            <section className="card stack" style={{padding: "1.5rem"}}>
                <div className="row-between" style={{alignItems: "flex-start"}}>
                    <div className="stack-sm" style={{gap: "0.35rem", minWidth: 0}}>
                        <h1 style={{fontSize: "var(--text-2xl)", letterSpacing: "-0.02em"}}>{detail.name}</h1>
                        <div className="card-sub">{addressLine || "Adres bilgisi yok"}</div>
                        {detail.phone && (
                            <a className="text-sm" style={{color: "var(--accent)", fontWeight: 550}}
                               href={`tel:${detail.phone}`}>
                                {detail.phone}
                            </a>
                        )}
                    </div>
                    <ScoreBadge score={detail.avgScore} count={detail.ratingCount}/>
                </div>

                {(detail.brands.length > 0 || detail.categories.length > 0) && (
                    <div className="row" style={{flexWrap: "wrap", gap: "0.4rem"}}>
                        {detail.brands.map(b => (
                            <Link key={`b${b.id}`} href={`/providers?brandId=${b.id}`}
                                  className="chip chip-accent">{b.name}</Link>
                        ))}
                        {detail.categories.map(c => (
                            <Link key={`c${c.id}`} href={`/providers?categoryId=${c.id}`}
                                  className="chip">{c.name}</Link>
                        ))}
                    </div>
                )}
            </section>

            {/* Konum */}
            {mapItems.length > 0 && (
                <section className="stack-sm">
                    <h2 className="section-title">Konum</h2>
                    <div className="map-frame">
                        <ProvidersMap items={mapItems} height={220}/>
                    </div>
                </section>
            )}

            {/* Puan dağılımı */}
            {detail.ratingCount > 0 && (
                <section className="stack-sm">
                    <h2 className="section-title">Puan dağılımı</h2>
                    <div className="row" style={{alignItems: "stretch", gap: "1rem", flexWrap: "wrap"}}>
                        <div className="card stack-sm"
                             style={{minWidth: "9rem", justifyItems: "center", alignContent: "center"}}>
                            <div style={{fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.03em"}}>
                                {typeof detail.avgScore === "number" ? detail.avgScore.toFixed(2) : "—"}
                            </div>
                            <div className="text-xs faint">{detail.ratingCount} oy ortalaması</div>
                        </div>
                        <div style={{flex: 1, minWidth: "16rem"}}>
                            <MiniHistogram buckets={buckets} total={histogramTotal || detail.ratingCount}/>
                        </div>
                    </div>
                </section>
            )}

            {/* Puan/yorum formu */}
            <RateForm providerId={id}/>

            {/* Yorumlar */}
            <section className="stack">
                <div className="row-between">
                    <h2 className="section-title">Yorumlar</h2>
                    <span className="chip">{detail.ratingCount} değerlendirme</span>
                </div>

                {ratingsPage.content.length === 0 ? (
                    <div className="empty-state">
                        <b>Henüz yorum yok.</b>
                        <span>İlk değerlendirmeyi sen yap!</span>
                    </div>
                ) : (
                    <ul className="stack-sm">
                        {ratingsPage.content.map((r) => <RatingItem key={r.id} r={r}/>)}
                    </ul>
                )}

                <Pagination page={(ratingsPage.number ?? 0) + 1} totalPages={ratingsPage.totalPages ?? 1}/>
            </section>
        </main>
    );
}
