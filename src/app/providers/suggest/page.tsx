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
import {connection} from "next/server";
import SuggestPageClient from "./SuggestPageClient";
import {pageMetadata} from "@/lib/seo/site";

// 005 SEO: "noindex, follow" (rota tablosu) — openGraph/robots YALNIZ pageMetadata ile (sığ birleşme tuzağı).
export const metadata: Metadata = pageMetadata({title: "Dükkan öner", description: "Listede olmayan bir sanayi dükkanını öner.", path: "/providers/suggest", index: false});

export default async function SuggestPage() {
    // connection(): sayfa DERLEMEDE üretilmez, istek anında çizilir. Eskiden statik ön-üretimdeydi ve derleme
    // backend'e kategori/marka sorardı -> backend'siz derleme (CI, Docker imajı) kırılıyordu. Liste verisi
    // yine fetch önbelleğinden gelir (ISR 300 sn) -> her istekte backend'e gidilmez.
    await connection();
    const [categories, brands] = await Promise.all([getCategoriesAllSorted(), getBrandsAllSorted()]);
    return <SuggestPageClient categories={categories} brands={brands}/>;
}
