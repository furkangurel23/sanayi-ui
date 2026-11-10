/*
 * YAKINIMDAKİLER — iki modlu sayfa:
 *  1) URL'de lat/lon YOK -> veri çekilmez, sadece NearLocate (konum izni) gösterilir.
 *  2) lat/lon VAR -> PostGIS destekli /providers/near ucu SUNUCUDA çağrılır,
 *     sonuçlar mesafeleriyle listelenir.
 * "Konum alma" client'ın, "mesafe hesabı" veritabanının işi — her iş doğru katmanda.
 *
 * URL doğrulama: lat -90..90, lon -180..180 aralığında SONLU sayı değilse (ör. ?lat=abc,
 * ?lat=999) mod 1'e (konum isteme ekranı) düşeriz. Yarıçap params.ts parseRadiusKm ile
 * 1..100 km'ye sıkıştırılır ve ekranda backend'e giden (sıkıştırılmış) değer gösterilir.
 * Veri `no-store` çekilir: sorgu kullanıcının konumuna özel (api.ts'te açıklama).
 */
import Link from "next/link";
import {getProvidersNear} from "@/lib/api";
import type {NearItem, Page as PageType, ProviderListItem} from "@/lib/types";
import MapSection from "@/components/MapSection";
import Pagination from "@/components/Pagination";
import NearLocate from "@/components/NearLocate";
import ScoreBadge from "@/components/ScoreBadge";
import {parsePage, parseRadiusKm, parseSize} from "@/lib/params";

/** Koordinatı okur: tek string, sonlu sayı ve [-limit, limit] aralığında değilse null. */
function parseCoord(v: string | string[] | undefined, limit: number): number | null {
    if (typeof v !== "string" || v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
}

export const metadata = {
    title: "Yakınımdaki Ustalar",
};

export default async function ProvidersNearPage({
                                                    searchParams,
                                                }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const sp = await searchParams;

    const lat = parseCoord(sp.lat, 90);
    const lon = parseCoord(sp.lon, 180);
    const radiusKm = parseRadiusKm(sp.radiusKm); // 1..100, geçersiz -> 10
    const page = parsePage(sp.page);
    const size = parseSize(sp.size, 20, 50);

    if (lat === null || lon === null) {
        return (
            <main className="container page" style={{maxWidth: "44rem"}}>
                <div className="stack-sm">
                    <span className="eyebrow">Konum</span>
                    <h1 className="section-title" style={{fontSize: "var(--type-title)"}}>Yakınımdaki ustalar</h1>
                    <p className="muted text-sm">
                        Konumunu paylaştıktan sonra belirlediğin yarıçap içindeki ustaları mesafeleriyle listeleriz.
                    </p>
                </div>
                {/* Yarıçap server'dan prop iner — client'ta useSearchParams'a gerek yok. */}
                <NearLocate initialRadiusKm={radiusKm}/>
            </main>
        );
    }

    const data: PageType<NearItem> = await getProvidersNear({lat, lon, radiusKm, page, size});

    const forMap: ProviderListItem[] = data.content.map((n) => ({
        id: n.id,
        name: n.name,
        city: n.city,
        district: n.district,
        phone: undefined,
        avgScore: n.avgScore ?? undefined,
        ratingCount: n.ratingCount ?? undefined,
        lat: n.lat ?? undefined,
        lon: n.lon ?? undefined,
    }));

    return (
        <main className="container page">
            <div className="row-between">
                <div className="stack-sm">
                    <span className="eyebrow">Konum</span>
                    <h1 className="section-title" style={{fontSize: "var(--type-title)"}}>Yakınımdaki ustalar</h1>
                </div>
                <span className="chip">Yarıçap: {radiusKm} km · {data.totalElements} sonuç</span>
            </div>

            <MapSection items={forMap} height={280}/>

            {data.content.length === 0 ? (
                <div className="empty-state">
                    <b>Bu yarıçapta usta bulunamadı.</b>
                    <span>Yarıçapı büyütmeyi dene.</span>
                </div>
            ) : (
                <div className="grid-2">
                    {data.content.map((n) => (
                        <Link key={n.id} href={`/providers/${n.id}`} className="card card-hover">
                            <div className="row-between" style={{alignItems: "flex-start", flexWrap: "nowrap"}}>
                                <div className="stack-sm" style={{gap: "0.2rem", minWidth: 0}}>
                                    <div className="card-title truncate">{n.name}</div>
                                    <div className="card-sub truncate">
                                        {[n.district, n.city].filter(Boolean).join(", ")}
                                    </div>
                                    <span className="chip" style={{width: "fit-content"}}>
                                        {n.distanceKm.toFixed(1)} km uzakta
                                    </span>
                                </div>
                                <ScoreBadge score={n.avgScore} count={n.ratingCount}/>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <Pagination page={(data.number ?? 0) + 1} totalPages={data.totalPages ?? 1}/>
        </main>
    );
}
