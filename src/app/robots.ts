/*
 * robots.txt — 005-seo-foundation (spec FR-002, FR-016). Next dosya kuralı: `/robots.txt`.
 *
 * Dizine AÇIK: yalnız yönetici (/admin) ve hesap (/account) bölümleri taranmaz; site haritası bildirilir.
 * Giriş/kayıt/öneri/sahiplenme gibi sayfalar BİLEREK taranabilir kalır: içlerinde "noindex, follow"
 * işareti taşırlar ve robots'ta engellenen sayfanın içindeki işareti arama motoru GÖREMEZ (engellenen
 * adres başka sitelerden bağlantı alırsa içeriksiz olarak dizine girebilir).
 * Dizine KAPALI: tarama serbest ama site haritası bildirilmez; her sayfa/yanıt noindex taşır.
 */
import type {MetadataRoute} from "next";
import {absoluteUrl, indexable} from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
    if (!indexable()) return {rules: {userAgent: "*", allow: "/"}};
    return {
        rules: [{userAgent: "*", allow: "/", disallow: ["/admin", "/account"]}],
        sitemap: absoluteUrl("/sitemap.xml"),
    };
}
