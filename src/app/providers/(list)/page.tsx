/*
 * USTALAR LİSTESİ — Server Component + URL tabanlı filtreleme.
 *
 * Next 15+ notu: searchParams artık Promise'tir -> await edilmeden okunamaz.
 * Tüm filtre/sayfa/sıralama durumu URL'dedir; FilterBar URL'i değiştirir,
 * bu sayfa sunucuda yeniden çalışır ve veriyi backend'den çeker (SSR + ISR).
 *
 * Sıralama: birincil alan + stabil ikincil alanlar (ratingCount, id) —
 * eşit değerli kayıtların sayfalar arasında zıplamasını önler.
 *
 * URL GÜVENİLMEZ GİRDİDİR: tüm parametreler params.ts yardımcılarıyla okunur.
 * ?page=abc -> 1, ?size=99999 -> 20, ?brandId=abc -> filtre yok, ?minScore=9 -> yok;
 * sort alanı/yönü beyaz listede değilse varsayılan sıralama. Böylece backend'e
 * asla NaN, negatif sayfa ya da rastgele bir sort alanı gitmez.
 *
 * Meta veriler (marka/kategori) .catch(() => []) ile korunur: o servisler hata
 * verirse dükkanlar yine listelenir, yalnızca filtre seçenekleri boş kalır.
 */
import {getBrandsAllSorted, getCategoriesAllSorted, getProviders} from "@/lib/api";
import ProviderCard from "@/components/ProviderCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import MapSection from "@/components/MapSection";
import {parseEnum, parsePage, parsePositiveId, parseScore, parseSize} from "@/lib/params";

/*
 * Sıralanabilir alanlar — BEYAZ LİSTE. FilterBar'daki SORT_FIELDS seçenekleri
 * (avgScore, ratingCount, name) + stabil ikincil sıralamada kullandığımız id.
 * FilterBar'a yeni bir sıralama seçeneği eklenirse buraya da eklenmeli.
 * (FilterBar "use client" bir modül; ondan sabit import etmek server'da istemci
 * referansı verir, değeri değil — bu yüzden listeyi burada tutuyoruz.)
 */
const SORT_FIELDS = ["avgScore", "ratingCount", "name", "id"] as const;
const SORT_DIRS = ["asc", "desc"] as const;

export const metadata = {
    title: "Ustalar",
};

export default async function ProvidersPage({
                                                searchParams,
                                            }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const sp = await searchParams;

    const page = parsePage(sp.page);
    const size = parseSize(sp.size, 20, 50);
    const brandId = parsePositiveId(sp.brandId);
    const categoryId = parsePositiveId(sp.categoryId);
    const city = typeof sp.city === "string" ? sp.city : undefined;
    const district = typeof sp.district === "string" ? sp.district : undefined;
    const minScore = parseScore(sp.minScore);
    const maxScore = parseScore(sp.maxScore);

    let sortField: (typeof SORT_FIELDS)[number] = "avgScore";
    let sortDir: "asc" | "desc" = "desc";

    // URL'de `sort` birden çok kez olabilir (?sort=name,asc&sort=ratingCount,desc&sort=id,asc).
    // Birincil sıralama İLKİdir; ikincilleri aşağıda biz yeniden türetiyoruz.
    // Eski biçim (?sortField=..&sortDir=..) de desteklenmeye devam eder (URL'ler değişmez).
    const sortsInUrl = Array.isArray(sp.sort) ? sp.sort : sp.sort ? [sp.sort] : [];
    if (sortsInUrl.length > 0 && typeof sortsInUrl[0] === "string" && sortsInUrl[0].includes(",")) {
        const [f, d] = (sortsInUrl[0] as string).split(",");
        const field = parseEnum(f, SORT_FIELDS, "avgScore");
        // Alan beyaz listede değilse varsayılan sıralamanın TAMAMINA dön (avgScore,desc);
        // yön asc değilse desc (önceki davranış).
        if (field === f) {
            sortField = field;
            sortDir = parseEnum(d, SORT_DIRS, "desc");
        }
    } else {
        sortField = parseEnum(sp.sortField, SORT_FIELDS, "avgScore");
        sortDir = parseEnum(sp.sortDir, SORT_DIRS, "desc");
    }

    const sorts: Array<{ field: string; dir: "asc" | "desc" }> = [{field: sortField, dir: sortDir}];
    if (sortField !== "ratingCount") sorts.push({field: "ratingCount", dir: "desc"});
    if (sortField !== "id") sorts.push({field: "id", dir: "asc"});

    // Üç bağımsız istek TEK Promise.all'da PARALEL: toplam bekleme = en yavaş istek
    // (eskiden meta bitince dükkan isteği başlıyordu: meta + dükkan süresi toplanıyordu).
    // Meta istekleri hata verirse boş listeye düşer; dükkan isteği hata verirse sayfa
    // error.tsx'e (RouteError) gider — dükkansız bir liste sayfası anlamsız.
    const [brands, categories, data] = await Promise.all([
        getBrandsAllSorted().catch(() => []),
        getCategoriesAllSorted().catch(() => []),
        getProviders({
            page, size, brandId, categoryId, city, district, minScore, maxScore, sorts,
        }),
    ]);

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
