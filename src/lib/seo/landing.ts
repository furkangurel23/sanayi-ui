/*
 * AÇILIŞ SAYFASI DİZİNİ — 005-seo-foundation (spec FR-007, FR-009, FR-014; data-model "LandingIndex").
 *
 * Backend'in sayım özeti (`GET /api/providers/facets`) tek bir karar tablosuna çevrilir:
 *  - Hangi adres VAR? (yoksa 404) -> `findBrand/findCategory/findDistrict` + `breakdownCount`.
 *  - Hangisi DİZİNE AÇIK? -> `isIndexable`: ana sayfa (marka/kategori/ilçe) ≥ 1 dükkan; kırılım
 *    (marka×ilçe, kategori×ilçe) ≥ 3 dükkan. 1–2 dükkanlı kırılım görünür ama "noindex, follow"
 *    (ince sayfa Google'da "düşük kalite" sinyali olur — kullanıcı kararı: 3+).
 *  - Dükkan sayfasındaki etiket nereye bağlanır? -> `shopChipHref` / `districtHref`.
 *  - Site haritasına ne girer? -> `sitemapLandingPaths` (yalnız dizine açıklar).
 *
 * İlçe anahtarları katlanmış (`foldSearch`) adla tutulur: dükkan kaydındaki "etimesgut" yazımı da
 * kanonik "Etimesgut" sayfasını bulur (backend facets aynı kuralla toplar).
 * Sayım özeti alınamazsa (null) bağlantılar ESKİ liste filtrelerine düşer (/providers?brandId=…) —
 * dükkan sayfası çalışmaya devam eder (research R11).
 */
import type {ProviderFacets} from "../types.ts";
import {foldSearch} from "../searchText.ts";
import {slugify} from "./slug.ts";

export type Named = { id: number; name: string; count: number; slug: string };
export type DistrictEntry = { name: string; count: number; slug: string };

export type LandingIndex = {
    brands: Map<string, Named>;            // slug -> marka
    categories: Map<string, Named>;        // slug -> kategori
    districts: Map<string, DistrictEntry>; // slug -> ilçe
    brandById: Map<number, Named>;
    categoryById: Map<number, Named>;
    districtByKey: Map<string, DistrictEntry>; // foldSearch(ilçe) -> ilçe
    brandDistrict: Map<string, number>;    // `${brandId}|${kanonik ilçe}` -> sayı
    categoryDistrict: Map<string, number>;
};

/** Kırılım sayfası en az bu kadar dükkanla dizine açık (spec FR-009). */
export const BREAKDOWN_MIN_INDEXABLE = 3;

function bySlug<T extends { name: string }>(rows: readonly T[], kind: string): Map<string, T & { slug: string }> {
    const out = new Map<string, T & { slug: string }>();
    for (const r of rows) {
        const slug = slugify(r.name);
        if (!slug) continue;
        const prev = out.get(slug);
        if (prev) {
            // İki ad aynı adrese düşüyor: ikincisi atlanır (sayfa ilkini gösterir) ve hata loglanır.
            // slug.test.mjs mevcut adlar için bunu engeller; yeni bir ad eklenirse burada görünür.
            console.error(`[seo] ${kind} adres çakışması: "${prev.name}" ve "${r.name}" -> ${slug}`);
            continue;
        }
        out.set(slug, {...r, slug});
    }
    return out;
}

export function buildLandingIndex(f: ProviderFacets): LandingIndex {
    const brands = bySlug(f.brands, "marka");
    const categories = bySlug(f.categories, "kategori");
    const districts = bySlug(f.districts, "ilçe");
    return {
        brands,
        categories,
        districts,
        brandById: new Map([...brands.values()].map((b) => [b.id, b])),
        categoryById: new Map([...categories.values()].map((c) => [c.id, c])),
        districtByKey: new Map([...districts.values()].map((d) => [foldSearch(d.name), d])),
        brandDistrict: new Map(f.brandDistricts.map((x) => [`${x.brandId}|${x.district}`, x.count])),
        categoryDistrict: new Map(f.categoryDistricts.map((x) => [`${x.categoryId}|${x.district}`, x.count])),
    };
}

export const findBrand = (ix: LandingIndex, slug: string) => ix.brands.get(slug);
export const findCategory = (ix: LandingIndex, slug: string) => ix.categories.get(slug);
export const findDistrict = (ix: LandingIndex, slug: string) => ix.districts.get(slug);

/** Ham ilçe yazımı ("etimesgut") -> kanonik ilçe girdisi; tanınmıyorsa undefined. */
export function districtOf(ix: LandingIndex, raw: string | null | undefined): DistrictEntry | undefined {
    return raw ? ix.districtByKey.get(foldSearch(raw)) : undefined;
}

export type FacetKind = "marka" | "kategori";

/** Marka×ilçe ya da kategori×ilçe dükkan sayısı (kanonik ilçe adıyla); yoksa 0. */
export function breakdownCount(ix: LandingIndex, kind: FacetKind, id: number, district: string): number {
    const map = kind === "marka" ? ix.brandDistrict : ix.categoryDistrict;
    return map.get(`${id}|${district}`) ?? 0;
}

/** Dizine açık mı? Ana sayfa ≥ 1, kırılım ≥ 3 (0 dükkanlı sayfa zaten 404). */
export function isIndexable(isBreakdown: boolean, count: number): boolean {
    return isBreakdown ? count >= BREAKDOWN_MIN_INDEXABLE : count >= 1;
}

export function landingPath(kind: FacetKind | "ilce", slug: string, districtSlug?: string): string {
    return districtSlug ? `/ankara/${kind}/${slug}/${districtSlug}` : `/ankara/${kind}/${slug}`;
}

/** Bir markanın/kategorinin dükkanı olan ilçeleri (kırılım bağlantıları; sayıya göre azalan). */
export function districtsOf(ix: LandingIndex, kind: FacetKind, id: number): Array<DistrictEntry & { cellCount: number }> {
    const out: Array<DistrictEntry & { cellCount: number }> = [];
    for (const d of ix.districts.values()) {
        const n = breakdownCount(ix, kind, id, d.name);
        if (n > 0) out.push({...d, cellCount: n});
    }
    return out.sort((a, b) => b.cellCount - a.cellCount || a.name.localeCompare(b.name, "tr"));
}

/** Bir ilçedeki markalar/kategoriler (ilçe ve kırılım sayfalarının bağlantıları; sayıya göre azalan). */
export function facetsInDistrict(ix: LandingIndex, kind: FacetKind, district: string): Array<Named & { cellCount: number }> {
    const all = kind === "marka" ? ix.brands : ix.categories;
    const out: Array<Named & { cellCount: number }> = [];
    for (const x of all.values()) {
        const n = breakdownCount(ix, kind, x.id, district);
        if (n > 0) out.push({...x, cellCount: n});
    }
    return out.sort((a, b) => b.cellCount - a.cellCount || a.name.localeCompare(b.name, "tr"));
}

/** Eski liste filtresi bağlantısı (sayım özeti yok ya da hedef sayfa yok). */
function legacyHref(kind: FacetKind | "ilce", idOrName: number | string): string {
    if (kind === "marka") return `/providers?brandId=${idOrName}`;
    if (kind === "kategori") return `/providers?categoryId=${idOrName}`;
    return `/providers?district=${encodeURIComponent(String(idOrName))}`;
}

/**
 * Dükkan sayfasındaki marka/kategori etiketi: dükkanın ilçesindeki kırılım dizine açıksa (≥3) oraya,
 * değilse ana açılış sayfasına; hedef hiç yoksa (sayım özeti 1 saat gecikmeli, Ankara dışı dükkan)
 * ya da sayım özeti alınamadıysa eski liste filtresine.
 */
export function shopChipHref(ix: LandingIndex | null, kind: FacetKind, id: number, district: string | null | undefined): string {
    if (!ix) return legacyHref(kind, id);
    const target = kind === "marka" ? ix.brandById.get(id) : ix.categoryById.get(id);
    if (!target) return legacyHref(kind, id);
    const d = districtOf(ix, district);
    if (d && isIndexable(true, breakdownCount(ix, kind, id, d.name))) {
        return landingPath(kind, target.slug, d.slug);
    }
    return landingPath(kind, target.slug);
}

/**
 * Dükkan sayfasındaki ilçe bağlantısı: ilçe sayfası varsa oraya, yoksa eski liste filtresine. İlçe yoksa ya
 * da dükkan Ankara dışındaysa null (Ustalar listesi yalnız Ankara ilçelerini süzer; "Kadıköy" filtresi yok sayılıp
 * filtresiz liste açılırdı).
 */
export function districtHref(ix: LandingIndex | null, district: string | null | undefined, city?: string | null): string | null {
    if (!district) return null;
    if (city && foldSearch(city) !== "ankara") return null;
    const d = ix ? districtOf(ix, district) : undefined;
    return d ? landingPath("ilce", d.slug) : legacyHref("ilce", district);
}

/** Site haritasına girecek açılış adresleri: yalnız dizine açıklar (SC-001). */
export function sitemapLandingPaths(ix: LandingIndex): string[] {
    const out: string[] = [];
    for (const [kind, all] of [["marka", ix.brands], ["kategori", ix.categories]] as const) {
        for (const x of all.values()) {
            out.push(landingPath(kind, x.slug));
            for (const d of ix.districts.values()) {
                if (isIndexable(true, breakdownCount(ix, kind, x.id, d.name))) out.push(landingPath(kind, x.slug, d.slug));
            }
        }
    }
    for (const d of ix.districts.values()) out.push(landingPath("ilce", d.slug));
    return out;
}
