/*
 * SİTE HARİTASI — 005-seo-foundation (spec FR-001, SC-001). Next dosya kuralı: `/sitemap.xml`.
 *
 * İçerik: ana sayfa, Ustalar, Markalar + sayfası açılan her gerçek dükkan (son değişiklik zamanıyla,
 * backend `/api/providers/sitemap`; ~2,8 bin satır tek istekte, 50 bin sınırının çok altında).
 * Açılış sayfaları (/ankara/…) ayrı bir adımda eklenir (yalnız dizine açık olanlar).
 *
 * `await connection()`: sitemap.ts Next'te varsayılan olarak DERLEMEDE üretilir — o anda backend
 * kapalıysa derleme kırılır, açıksa harita derleme anında donar. connection() isteği dinamik yapar;
 * tazelik fetch önbelleğinden gelir (dükkan listesi 86400 sn, spec: en geç 24 saatte yenilenir).
 * Hata FIRLATILIR (500): eksik bir haritayı "tam" diye sunmak dükkanları dizinden düşürtebilirdi.
 */
import type {MetadataRoute} from "next";
import {connection} from "next/server";
import {getSitemapEntries} from "@/lib/api";
import {absoluteUrl} from "@/lib/seo/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    await connection();
    const shops = await getSitemapEntries();
    return [
        {url: absoluteUrl("/")},
        {url: absoluteUrl("/providers")},
        {url: absoluteUrl("/brands")},
        ...shops.map((s) => ({url: absoluteUrl(`/providers/${s.id}`), lastModified: s.updatedAt})),
    ];
}
