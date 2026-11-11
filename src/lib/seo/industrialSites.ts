/*
 * ANKARA SANAYİ SİTELERİ — 005-seo-foundation (spec Edge Cases, research R10).
 *
 * İnsanlar "Ostim Mercedes servisi" diye arar: dükkanın adresinde bilinen bir sanayi sitesinin adı
 * geçiyorsa başlık/açıklamaya eklenir (text.ts) ve ilçe sayfası ilçedeki siteleri sayar.
 *
 * İKİ KORUMA (gerçek veride yanlış eşleşme örnekleri var):
 *  1. BÜTÜN KELİME: adres `foldSearch` ile katlanıp kelimelere bölünür; "Siteleri" kelimesi "Siteler"
 *     sayılmaz ("İvedik Organize Sanayi Siteleri" -> yalnız İvedik).
 *  2. İLÇE: sitenin bulunduğu ilçe dükkanın ilçesiyle AYNI olmalı — Mamak'taki "İvedik Cad." ya da
 *     Çankaya'daki "Ostim yolu" gibi sokak adları sanayi sitesi sayılmaz.
 * Birden çok ad geçerse adres metninde İLK geçen kazanır ("Ostim OSB, İvedik yolu" -> Ostim).
 */
import {foldSearch} from "../searchText.ts";

export type IndustrialSite = { name: string; district: string };

export const INDUSTRIAL_SITES: readonly IndustrialSite[] = [
    {name: "Ostim", district: "Yenimahalle"},
    {name: "İvedik", district: "Yenimahalle"},
    {name: "Gimat", district: "Yenimahalle"},
    {name: "Şaşmaz", district: "Etimesgut"},
    {name: "Siteler", district: "Altındağ"},
];

const KEYED = INDUSTRIAL_SITES.map((s) => ({...s, key: foldSearch(s.name), districtKey: foldSearch(s.district)}));

/** Dükkanın bulunduğu sanayi sitesinin adı; yoksa null. */
export function industrialSiteOf(address: string | null | undefined, district: string | null | undefined): string | null {
    if (!address || !district) return null;
    const districtKey = foldSearch(district);
    const words = foldSearch(address).split(" ");
    for (const w of words) {
        const hit = KEYED.find((s) => s.key === w && s.districtKey === districtKey);
        if (hit) return hit.name;
    }
    return null;
}

/** Bir ilçedeki sanayi sitelerinin adları (ilçe sayfası). */
export function sitesInDistrict(district: string): string[] {
    const key = foldSearch(district);
    return KEYED.filter((s) => s.districtKey === key).map((s) => s.name);
}
