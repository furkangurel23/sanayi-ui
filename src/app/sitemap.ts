/*
 * SİTE HARİTASI — 005-seo-foundation (spec FR-001, SC-001). Next dosya kuralı: `/sitemap.xml`.
 *
 * İçerik: ana sayfa, Ustalar, Markalar + sayfası açılan her gerçek dükkan (son değişiklik zamanıyla,
 * backend `/api/providers/sitemap`; ~2,8 bin satır tek istekte, 50 bin sınırının çok altında).
 * + dizine AÇIK açılış sayfaları (/ankara/…; ana ≥1, kırılım ≥3 dükkan — lib/seo/landing.ts). 1–2 dükkanlı
 * kırılımlar "noindex" olduğu için haritada YOK (haritada noindex adres = çelişkili sinyal).
 *
 * `await connection()`: sitemap.ts Next'te varsayılan olarak DERLEMEDE üretilir — o anda backend
 * kapalıysa derleme kırılır, açıksa harita derleme anında donar. connection() isteği dinamik yapar;
 * tazelik fetch önbelleğinden gelir (dükkan listesi 86400 sn, spec: en geç 24 saatte yenilenir).
 * Hata FIRLATILIR (500): eksik bir haritayı "tam" diye sunmak dükkanları dizinden düşürtebilirdi.
 */
import type {MetadataRoute} from "next";
import {connection} from "next/server";
import {getFacets, getSitemapEntries} from "@/lib/api";
import {buildLandingIndex, sitemapLandingPaths} from "@/lib/seo/landing";
import {absoluteUrl} from "@/lib/seo/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    await connection();
    const [shops, facets] = await Promise.all([getSitemapEntries(), getFacets()]);
    return [
        {url: absoluteUrl("/")},
        {url: absoluteUrl("/providers")},
        {url: absoluteUrl("/brands")},
        ...sitemapLandingPaths(buildLandingIndex(facets)).map((path) => ({url: absoluteUrl(path)})),
        ...shops.map((s) => ({url: absoluteUrl(`/providers/${s.id}`), lastModified: s.updatedAt})),
    ];
}
