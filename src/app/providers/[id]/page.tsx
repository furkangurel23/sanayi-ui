/*
 * USTA DETAY SAYFASI — Server Component (SSR).
 *
 * generateMetadata: sekme başlığını usta adıyla dinamik kurar (SEO).
 * İki bağımsız veri çekimi PARALEL (Promise.all): detay + yorum sayfası (ikisi de
 * no-store, her zaman taze). Seri await'te toplam süre = detay + yorumlar olurdu;
 * paralelde = en yavaşı kadar.
 * 404 kontrolü bu sayfada DEĞİL, aynı klasördeki layout.tsx'te (neden: orada
 * açıklandı — loading.tsx'in Suspense'i yüzünden sayfadaki notFound() 404 veremez).
 * getProviderDetail React cache() ile sarılı: layout + generateMetadata + sayfa
 * aynı istekte TEK backend çağrısı yapar.
 * Yorum isteği hata verirse sayfa çökmez: .catch(() => null) -> yorum bölümünde
 * Türkçe hata kutusu, dükkan bilgisi yine görünür ("graceful degradation").
 * URL parametreleri (page, size) params.ts ile temizlenir: ?page=0/abc -> 1.
 * scoreHistogram Record<string, number> gelir; -5..+5 dizisine map'lenerek
 * eksik skorlar 0 ile doldurulur (histogram her zaman 11 çubuk).
 */
import type {Page as PageType, ProviderDetailDto, ProviderListItem, RatingDto} from "@/lib/types";
import {getProviderDetail, getProviderRatings} from "@/lib/api";
import Link from "next/link";
import {notFound} from "next/navigation";
import {parsePage, parsePositiveId, parseSize} from "@/lib/params";
import RatingItem from "@/components/RatingItem";
import Pagination from "@/components/Pagination";
// Harita: ssr:false dinamik sarmalayıcı (server component dynamic ssr:false kullanamaz).
import ProviderMapClient from "@/components/ProviderMapClient";
import MiniHistogram from "@/components/MiniHistogram";
import RateForm from "@/components/RateForm";
import ScoreBadge from "@/components/ScoreBadge";

export async function generateMetadata({params}: { params: Promise<{ id: string }> }) {
    const {id: raw} = await params;
    const id = parsePositiveId(raw);
    // Geçersiz id'de layout zaten notFound() çağırır; burada backend'e hiç sormuyoruz.
    if (id === undefined) return {title: "Usta Detayı"};
    try {
        // cache()'li çağrı: layout ile aynı isteği paylaşır (ikinci backend çağrısı yok).
        const detail = await getProviderDetail(id);
        return {title: detail?.name ?? "Usta Detayı"};
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

    // layout.tsx id'yi zaten doğruladı; yine de TypeScript için daraltıyoruz.
    const id = parsePositiveId(p.id);
    if (id === undefined) notFound();

    const rPage = parsePage(sp.page);
    const rSize = parseSize(sp.size, 10, 50);

    const [found, ratingsPage]: [ProviderDetailDto | null, PageType<RatingDto> | null] = await Promise.all([
        getProviderDetail(id),
        getProviderRatings({
            id, page: rPage, size: rSize, sortField: "createdAt", sortDir: "desc",
        }).catch(() => null), // yorumlar gelmezse sayfa yine açılır
    ]);
    // Layout null'ı zaten 404'e çevirdi (aynı cache()'li sonuç) — bu satır yalnızca
    // TypeScript'e "buradan sonra detail kesin var" demek için (narrowing).
    if (!found) notFound();
    const detail: ProviderDetailDto = found;

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
                        <ProviderMapClient items={mapItems} height={220}/>
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

                {ratingsPage === null ? (
                    // Yorum isteği başarısız oldu (backend hatası) — sayfanın geri kalanı çalışır.
                    <div className="alert alert-error" role="alert">Yorumlar şu anda yüklenemedi.</div>
                ) : ratingsPage.content.length === 0 ? (
                    <div className="empty-state">
                        <b>Henüz yorum yok.</b>
                        <span>İlk değerlendirmeyi sen yap!</span>
                    </div>
                ) : (
                    <ul className="stack-sm">
                        {ratingsPage.content.map((r) => <RatingItem key={r.id} r={r}/>)}
                    </ul>
                )}

                {ratingsPage && (
                    <Pagination page={(ratingsPage.number ?? 0) + 1} totalPages={ratingsPage.totalPages ?? 1}/>
                )}
            </section>
        </main>
    );
}
