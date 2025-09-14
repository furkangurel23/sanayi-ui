import {getProvidersNear} from "@/lib/api";
import type {NearItem, Page as PageType, ProviderListItem} from "@/lib/types";
import MapSection from "@/components/MapSection";
import Pagination from "@/components/Pagination";
import NearLocate from "@/components/NearLocate";

export const metadata = {
    title: "Yakınımdaki Ustalar | Sanayi",
};

export default async function ProvidersNearPage({
                                                    searchParams,
                                                }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const sp = await searchParams;

    const lat = sp.lat ? Number(sp.lat) : null!;
    const lon = sp.lon ? Number(sp.lon) : null!;
    const radiusKm = sp.radiusKm ? Number(sp.radiusKm) : 10;
    const page = Number(sp.page ?? "1");
    const size = Number(sp.size ?? "20");
    //lat/lon yoksa "konum al" bolumunu goster, veri cekme.
    if (!Number.isFinite(lat as number) || !Number.isFinite(lon as number)) {
        return (
            <main className="mx-auto max-w-5xl p-4 space-y-4">
                <h1 className="text-2xl font-bold">Yakınımdaki Ustalar</h1>
                <NearLocate/>
                <p className="text-sm opacity-70">
                    Konumunu paylaştıktan sonra bu sayfa, belirlediğin yarıçap içindeki işletmeleri listeler.
                </p>
            </main>
        );
    }
    //lat/lon mevcutsa listeleri server'da cek
    const data: PageType<NearItem> = await getProvidersNear({
        lat: lat as number,
        lon: lon as number,
        radiusKm,
        page,
        size
    });

    // Harita için, nearItem -> ProviderLıstItem şeklinde dönüştür (lat/lon varsa marker çizer)
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

    /*
    * Önemli Next.js noktaları:
    *   Konum yoksa SSR veri çekmeyip sadece client NearLocate gösteriyoruz.
    *   Konum varsa SSR ile getProvidersNear → hızlı ilk yükleme.
    *   MapSection client tarafında aç/kapa + URL senkronu korur.
    * */

    return (
        <main className="mx-auto max-w-5xl p-4 space-y-4">
            <h1 className="text-2xl font-bold">Yakınımdaki Ustalar</h1>

            {/* Bilgi satırı */}
            <div className="text-sm opacity-80">
                Merkez: {lat.toFixed(5)}, {lon.toFixed(5)} &middot; Yarıçap: {radiusKm} km
            </div>

            {/* Harita: lat/lng yoksa boş görünür; varsa marker'lar çıkar */}
            <MapSection items={forMap} height={280}/>

            {/* Liste */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.content.map((n) => (
                    <a
                        key={n.id}
                        href={`/providers/${n.id}`}
                        className="rounded-2xl border border-white/10 p-4 hover:border-white/30 transition"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="font-semibold">{n.name}</div>
                                <div className="text-xs opacity-70">
                                    {[n.district, n.city].filter(Boolean).join(" / ")}
                                </div>
                                <div className="text-xs opacity-70 mt-1">
                                    {typeof n.avgScore === "number"
                                        ? `Puan: ${n.avgScore.toFixed(1)} (${n.ratingCount ?? 0} oy)`
                                        : `${n.ratingCount ?? 0} oy`}
                                </div>
                            </div>
                            <div className="text-sm font-semibold">{n.distanceKm.toFixed(1)} km</div>
                        </div>
                    </a>
                ))}
            </div>

            <div className="pt-4">
                <Pagination page={(data.number ?? 0) + 1} totalPages={data.totalPages ?? 1}/>
            </div>
        </main>
    );
}