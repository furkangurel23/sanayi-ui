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
 *
 * 002: başlık ortak PageHeader, sonuç yok -> EmptyState (Pin), kartlar ortak ProviderCard
 * (mesafe chip'iyle); konum ekranı dar sütunda (.container-tight = 44rem). Satır içi stil yok.
 */
import {getProvidersNear} from "@/lib/api";
import type {NearItem, Page as PageType, ProviderListItem} from "@/lib/types";
import MapSection from "@/components/MapSection";
import Pagination from "@/components/Pagination";
import NearLocate from "@/components/NearLocate";
import ProviderCard from "@/components/ProviderCard";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import {Pin} from "@/components/icons";
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
            <main className="container container-tight page">
                <PageHeader
                    eyebrow="Konum"
                    title="Yakınımdaki ustalar"
                    subtitle="Konumunu paylaştıktan sonra belirlediğin yarıçap içindeki ustaları mesafeleriyle listeleriz."
                />
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
            <PageHeader
                eyebrow="Konum"
                title="Yakınımdaki ustalar"
                actions={<span className="chip">Yarıçap: {radiusKm} km · {data.totalElements} sonuç</span>}
            />

            <MapSection items={forMap} height={280}/>

            {data.content.length === 0 ? (
                <EmptyState
                    icon={<Pin/>}
                    title="Bu yarıçapta usta bulunamadı."
                    description="Yarıçapı büyütmeyi dene."
                />
            ) : (
                <div className="grid-2">
                    {/* forMap[i] ile data.content[i] aynı sırada: kart verisi ProviderListItem,
                        mesafe NearItem'dan gelir. */}
                    {forMap.map((p, i) => (
                        <ProviderCard key={p.id} p={p} distanceKm={data.content[i].distanceKm}/>
                    ))}
                </div>
            )}

            <Pagination page={(data.number ?? 0) + 1} totalPages={data.totalPages ?? 1}/>
        </main>
    );
}
