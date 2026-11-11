/*
 * AÇILIŞ ROTALARININ ORTAK VERİSİ (005-seo-foundation). `_lib` alt çizgili klasör: Next bunu rota
 * saymaz (özel klasör) — yalnız /ankara/... rotaları içe aktarır.
 *
 *  - `landingIndex()`: sayım özeti -> karar tablosu. React cache(): aynı istekteki layout +
 *    generateMetadata + sayfa TEK hesap yapar (fetch'in kendisi zaten 3600 sn önbellekli).
 *    Hata FIRLATILIR (geçici backend hatası sayfayı "yok" ilan etmesin -> 5xx, 404 değil).
 *  - `landingShops()`: sayfadaki liste. Sıra (spec FR-010): puanlılar önce ortalamaya göre azalan
 *    (backend avgScore'u NULLS LAST sıralar), sonra puan sayısı, ad, kimlik — kararlı.
 */
import {cache} from "react";
import {getFacets, getProviders} from "@/lib/api";
import {buildLandingIndex} from "@/lib/seo/landing";

export const landingIndex = cache(async () => buildLandingIndex(await getFacets()));

export const LANDING_LIMIT = 50;
const LANDING_SORTS = [
    {field: "avgScore", dir: "desc" as const},
    {field: "ratingCount", dir: "desc" as const},
    {field: "name", dir: "asc" as const},
    {field: "id", dir: "asc" as const},
];

export function landingShops(filter: { brandId?: number; categoryId?: number; district?: string }) {
    return getProviders({...filter, size: LANDING_LIMIT, sorts: LANDING_SORTS});
}

/** "Tümünü gör" -> filtreli Ustalar listesi (ilçe kanonik adla). */
export function providersHref(filter: { brandId?: number; categoryId?: number; district?: string }): string {
    const qs = new URLSearchParams();
    if (filter.categoryId) qs.set("categoryId", String(filter.categoryId));
    if (filter.brandId) qs.set("brandId", String(filter.brandId));
    if (filter.district) qs.set("district", filter.district);
    return `/providers?${qs.toString()}`;
}
