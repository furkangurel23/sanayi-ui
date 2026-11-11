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
 *
 * 002 görünümü: başlık ortak PageHeader (üst etiket + başlık + sonuç sayısı),
 * sonuç yoksa ortak EmptyState (Search ikonu), sayfalama Pagination mode="url"
 * (varsayılan — URL'e yazar). Satır içi stil yok.
 *
 * 004 — AD ARAMASI (?q=): `parseSearch` (lib/searchText.ts) kuralı uygular: kelimesiz değer
 * (?q=a, ?q=%) backend'e GİTMEZ ve kutu boş görünür; geçerliyse kırpılmış ham metin hem backend'e
 * hem FilterBar'a iner. `q`, `filterInitial`'ın parçası olduğu için FilterBar'ın `key`'ine de girer
 * -> geri/ileri tuşunda kutu doğru metne remount olur. Arama uygulanmışken sonuç yoksa aramaya özel
 * boş durum ("Aramayı temizle" + "Dükkan öner").
 */
import {getBrandsAllSorted, getCategoriesAllSorted, getProviders} from "@/lib/api";
import ProviderCard from "@/components/ProviderCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import MapSection from "@/components/MapSection";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";
import {Search} from "@/components/icons";
import {parseEnum, parsePage, parsePositiveId, parseScore, parseSize} from "@/lib/params";
import {parseSearch} from "@/lib/searchText";

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
    const q = parseSearch(sp.q);

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
            page, size, brandId, categoryId, city, district, minScore, maxScore, sorts, q,
        }),
    ]);

    /*
     * Client bileşenlerine başlangıç değerleri PROP olarak iner (Next 16 kalıbı:
     * server searchParams'ı zaten okuyor; client'ta useSearchParams'a gerek yok).
     * `key`: URL'deki filtreler değişince bileşeni REMOUNT eder -> içerideki state
     * yeni initial'lardan başlar (geri/ileri tuşu senkronu, useEffect'siz).
     */
    const filterInitial = {
        q: q ?? "",
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
            <PageHeader
                eyebrow="Keşfet"
                title="Ustalar"
                actions={<span className="chip" role="status">{data.totalElements} sonuç</span>}
            />

            <FilterBar key={filterKey} brands={brands} categories={categories} initial={filterInitial}/>

            <MapSection key={`map-${mapInitialOpen ?? "auto"}`} items={data.content} height={280}
                        initialOpen={mapInitialOpen}/>

            {q && data.totalElements === 0 ? (
                /* Arama gerçekten eşleşmedi (toplam 0). Eşleşme varken aralık dışı sayfa (ör. eski bir
                   ?q=oto&page=9 bağlantısı) bu mesajı göstermez — aşağıdaki genel boş duruma düşer. */
                <EmptyState
                    icon={<Search/>}
                    title={`“${q}” ile eşleşen dükkan bulunamadı.`}
                    description="Yazımı ya da diğer filtreleri kontrol et. Dükkan listede yoksa bize önerebilirsin."
                    action={
                        <>
                            <Link href={clearSearchHref(sp)} className="btn btn-outline">Aramayı temizle</Link>
                            <Link href="/providers/suggest" className="btn btn-primary">Dükkan öner</Link>
                        </>
                    }
                />
            ) : data.content.length === 0 ? (
                <EmptyState
                    icon={<Search/>}
                    title="Bu filtrelerle usta bulunamadı."
                    description="Filtreleri gevşetmeyi veya temizlemeyi dene."
                />
            ) : (
                <div className="grid-2">
                    {data.content.map((p) => <ProviderCard key={p.id} p={p}/>)}
                </div>
            )}

            <Pagination mode="url" page={(data.number ?? 0) + 1} totalPages={data.totalPages ?? 1}/>
        </main>
    );
}

/*
 * Boş durumdaki "Aramayı temizle" bağlantısı: aynı URL'den yalnız `q` ve `page` atılır (yeni sonuç
 * kümesinde 1. sayfadan başlanır). Çok değerli parametreler (ör. birden fazla `sort`) aynen korunur.
 * Saf fonksiyon: server'da render sırasında çalışır, window'a ihtiyaç yok.
 */
function clearSearchHref(sp: Record<string, string | string[] | undefined>): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
        if (k === "q" || k === "page" || v === undefined) continue;
        for (const one of Array.isArray(v) ? v : [v]) params.append(k, one);
    }
    const qs = params.toString();
    return qs ? `/providers?${qs}` : "/providers";
}
