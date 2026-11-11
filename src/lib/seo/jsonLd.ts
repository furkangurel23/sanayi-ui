/*
 * YAPILANDIRILMIŞ VERİ (JSON-LD) — 005-seo-foundation (spec FR-005, FR-006; research R8).
 *
 * Arama motoru sayfayı "bu bir oto tamirhanesi; adresi, konumu, telefonu, saatleri, puanı şu" diye
 * makine-okur biçimde anlar (schema.org sözlüğü). Saf fonksiyonlar: girdi dükkan DTO'su, çıktı düz
 * nesne; `<script type="application/ld+json">` basımı `components/seo/JsonLd.tsx`'te.
 *
 * KURALLAR:
 *  - Eksik alan YAZILMAZ (boş string/null değer doğrulama aracında hata/uyarı üretir).
 *  - Kullanıcı yorum metinleri ve kullanıcı adları ASLA girmez (FR-004) — yalnız toplam puan.
 *  - Puan ölçeği bizde −5…+5: `worstRating: -5`, `bestRating: 5`. Ölçek DÖNÜŞTÜRÜLMEZ (sayfada görünen
 *    değerle tutarsız olurdu); doğrulama aracı negatif ölçeği reddederse puan özeti tümden kaldırılır.
 *  - `jsonLdScript`: `</script>` dizisi içerikte geçerse etiketi erken kapatır (XSS) -> her "<"
 *    JSON içinde `<` kaçışıyla yazılır (JSON için eşdeğer, HTML için zararsız).
 */
import type {OpeningHours, ProviderDetailDto, DayKey} from "../types.ts";
import {absoluteUrl, SITE_NAME} from "./site.ts";

type Json = Record<string, unknown>;

/** Tamir kümesi: bu kategorilerden biri varsa tür her zaman AutoRepair (spec FR-005 önceliği). */
const REPAIR = new Set([
    "Mekanik", "Oto Elektrik", "Motor Revizyon", "Şanzıman", "Diagnostik", "Fren", "Egzoz", "Oto Klima",
    "Radyatör", "Turbo", "Amortisör", "Ön Düzen", "Rot Balans", "LPG Dönüşüm", "Hibrit ve Elektrikli Araç",
]);

/** schema.org işletme türü; öncelik sırası research R8. */
export function schemaTypeFor(categories: readonly string[]): string {
    const has = (n: string) => categories.includes(n);
    if (categories.some((c) => REPAIR.has(c))) return "AutoRepair";
    if (has("Kaporta") || has("Boya")) return "AutoBodyShop";
    if (has("Lastik")) return "TireShop";
    if (has("Yedek Parça")) return "AutoPartsStore";
    if (has("Oto Yıkama")) return "AutoWash";
    return "AutoRepair";
}

const DAY_NAMES: Record<DayKey, string> = {
    MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday", THURSDAY: "Thursday",
    FRIDAY: "Friday", SATURDAY: "Saturday", SUNDAY: "Sunday",
};
const DAY_ORDER: DayKey[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

/**
 * Haftalık saatler -> `OpeningHoursSpecification` listesi. Gece aralığı (Cuma 20:00–02:00) TEK giriş
 * olarak kalır: schema.org "kapanış açılıştan küçükse ertesi güne taşar" kabul eder. `24:00` schema'da
 * geçersiz -> gün sonu `23:59`. Kapalı gün (boş liste) yazılmaz; bilgi yoksa (null) alan hiç yok.
 */
export function openingHoursSpec(hours: OpeningHours | null | undefined): Json[] | undefined {
    if (!hours) return undefined;
    const out: Json[] = [];
    for (const day of DAY_ORDER) {
        for (const r of hours[day] ?? []) {
            out.push({
                "@type": "OpeningHoursSpecification",
                dayOfWeek: `https://schema.org/${DAY_NAMES[day]}`,
                opens: r.open,
                closes: r.close === "24:00" ? "23:59" : r.close,
            });
        }
    }
    return out.length ? out : undefined;
}

/** Dükkan sayfasının işletme verisi. `path` = kanonik yol ("/providers/12"). */
export function businessJsonLd(d: ProviderDetailDto, path: string): Json {
    const out: Json = {
        "@context": "https://schema.org",
        "@type": schemaTypeFor(d.categories.map((c) => c.name)),
        name: d.name,
        url: absoluteUrl(path),
    };
    const address: Json = {"@type": "PostalAddress"};
    if (d.address) address.streetAddress = d.address;
    if (d.district) address.addressLocality = d.district;
    address.addressRegion = "Ankara";
    address.addressCountry = "TR";
    out.address = address;
    if (d.location) {
        out.geo = {"@type": "GeoCoordinates", latitude: d.location.lat, longitude: d.location.lon};
    }
    if (d.phone) out.telephone = d.phone;
    const spec = openingHoursSpec(d.openingHours);
    if (spec) out.openingHoursSpecification = spec;
    if (d.ratingCount >= 1 && d.avgScore != null) {
        out.aggregateRating = {
            "@type": "AggregateRating",
            ratingValue: Math.round(d.avgScore * 100) / 100,
            ratingCount: d.ratingCount,
            bestRating: 5,
            worstRating: -5,
        };
    }
    return out;
}

export type Crumb = { name: string; path: string };

/** Gezinti yolu (görünür Breadcrumbs ile aynı öğeler). */
export function breadcrumbJsonLd(items: readonly Crumb[]): Json {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            item: absoluteUrl(c.path),
        })),
    };
}

/** Ana sayfa: site + kuruluş (FR-006). Logo = 180 px PNG ikon (mutlak adres). */
export function siteJsonLd(): Json[] {
    return [
        {"@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/")},
        {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: SITE_NAME,
            url: absoluteUrl("/"),
            logo: absoluteUrl("/apple-icon.png"),
        },
    ];
}

/** `<script type="application/ld+json">` içeriği: "<" kaçışlı (etiket erken kapanamaz). */
export function jsonLdScript(data: unknown): string {
    return JSON.stringify(data).replace(/</g, "\\u003c");
}
