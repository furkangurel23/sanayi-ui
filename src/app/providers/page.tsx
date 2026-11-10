/*
 * USTALAR LİSTESİ — Server Component + URL tabanlı filtreleme.
 *
 * Next 15+ notu: searchParams artık Promise'tir -> await edilmeden okunamaz.
 * Tüm filtre/sayfa/sıralama durumu URL'dedir; FilterBar URL'i değiştirir,
 * bu sayfa sunucuda yeniden çalışır ve veriyi backend'den çeker (SSR + ISR).
 *
 * Sıralama: birincil alan + stabil ikincil alanlar (ratingCount, id) —
 * eşit değerli kayıtların sayfalar arasında zıplamasını önler.
 */
import {getBrandsAllSorted, getCategoriesAllSorted, getProviders} from "@/lib/api";
import ProviderCard from "@/components/ProviderCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import MapSection from "@/components/MapSection";

export const metadata = {
    title: "Ustalar",
};

export default async function ProvidersPage({
                                                searchParams,
                                            }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const sp = await searchParams;

    const page = Number(sp.page ?? "1");
    const size = Number(sp.size ?? "20");
    const brandId = sp.brandId ? Number(sp.brandId) : undefined;
    const categoryId = sp.categoryId ? Number(sp.categoryId) : undefined;
    const city = typeof sp.city === "string" ? sp.city : undefined;
    const district = typeof sp.district === "string" ? sp.district : undefined;
    const minScore = sp.minScore ? Number(sp.minScore) : undefined;
    const maxScore = sp.maxScore ? Number(sp.maxScore) : undefined;

    let sortField = "avgScore";
    let sortDir: "asc" | "desc" = "desc";

    const sortsInUrl = Array.isArray(sp.sort) ? sp.sort : sp.sort ? [sp.sort] : [];
    if (sortsInUrl.length > 0 && typeof sortsInUrl[0] === "string" && sortsInUrl[0].includes(",")) {
        const [f, d] = (sortsInUrl[0] as string).split(",");
        sortField = f;
        sortDir = (d === "asc" ? "asc" : "desc");
    } else {
        if (typeof sp.sortField === "string") sortField = sp.sortField;
        if (sp.sortDir === "asc" || sp.sortDir === "desc") sortDir = sp.sortDir;
    }

    const sorts: Array<{ field: string; dir: "asc" | "desc" }> = [{field: sortField, dir: sortDir}];
    if (sortField !== "ratingCount") sorts.push({field: "ratingCount", dir: "desc"});
    if (sortField !== "id") sorts.push({field: "id", dir: "asc"});

    const [brands, categories] = await Promise.all([
        getBrandsAllSorted(),
        getCategoriesAllSorted(),
    ]);

    const data = await getProviders({
        page, size, brandId, categoryId, city, district, minScore, maxScore, sorts,
    });

    /*
     * Client bileşenlerine başlangıç değerleri PROP olarak iner (Next 16 kalıbı:
     * server searchParams'ı zaten okuyor; client'ta useSearchParams'a gerek yok).
     * `key`: URL'deki filtreler değişince bileşeni REMOUNT eder -> içerideki state
     * yeni initial'lardan başlar (geri/ileri tuşu senkronu, useEffect'siz).
     */
    const filterInitial = {
        brandId: brandId ? String(brandId) : "",
        categoryId: categoryId ? String(categoryId) : "",
        city: city ?? "",
        district: district ?? "",
        minScore: minScore !== undefined ? String(minScore) : "",
        maxScore: maxScore !== undefined ? String(maxScore) : "",
        sortField,
        sortDir,
    };
    const filterKey = JSON.stringify(filterInitial);
    const showMapParam = typeof sp.showMap === "string" ? sp.showMap : undefined;
    const mapInitialOpen = showMapParam === "1" ? true : showMapParam === "0" ? false : undefined;

    return (
        <main className="container page">
            <div className="row-between">
                <div className="stack-sm">
                    <span className="eyebrow">Keşfet</span>
                    <h1 className="section-title" style={{fontSize: "var(--text-2xl)"}}>Ustalar</h1>
                </div>
                <span className="chip">{data.totalElements} sonuç</span>
            </div>

            <FilterBar key={filterKey} brands={brands} categories={categories} initial={filterInitial}/>

            <MapSection key={`map-${mapInitialOpen ?? "auto"}`} items={data.content} height={280}
                        initialOpen={mapInitialOpen}/>

            {data.content.length === 0 ? (
                <div className="empty-state">
                    <b>Bu filtrelerle usta bulunamadı.</b>
                    <span>Filtreleri gevşetmeyi veya temizlemeyi dene.</span>
                </div>
            ) : (
                <div className="grid-2">
                    {data.content.map((p) => <ProviderCard key={p.id} p={p}/>)}
                </div>
            )}

            <Pagination page={(data.number ?? 0) + 1} totalPages={data.totalPages ?? 1}/>
        </main>
    );
}
