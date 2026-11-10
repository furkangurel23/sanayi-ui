/*
 * DÜKKAN ÖNER (003 / T106) — sunucu sayfası.
 *
 * Rota notu: `/providers/suggest` STATİK bir segmenttir; Next statik segmenti dinamik `[id]`'den
 * ÖNCE eşleştirir (yani "suggest" bir dükkan id'si sanılmaz). Liste dosyaları `(list)` route
 * group'unda olduğu için listenin loading.tsx'i bu sayfayı sarmaz.
 * Kategori/marka adları ISR ile sunucuda çekilir ve prop iner; form ve oturum client'ta.
 */
import type {Metadata} from "next";
import {getBrandsAllSorted, getCategoriesAllSorted} from "@/lib/api";
import SuggestPageClient from "./SuggestPageClient";

export const metadata: Metadata = {title: "Dükkan öner", robots: {index: false}};

export default async function SuggestPage() {
    const [categories, brands] = await Promise.all([getCategoriesAllSorted(), getBrandsAllSorted()]);
    return <SuggestPageClient categories={categories} brands={brands}/>;
}
