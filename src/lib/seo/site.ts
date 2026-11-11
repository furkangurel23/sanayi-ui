/*
 * SİTE ADRESİ, DİZİNE AÇIKLIK ve SAYFA METADATA'SI — 005-seo-foundation (spec FR-003, FR-015, FR-016).
 *
 * Ortam değişkenleri `next.config.ts` `env` ile DERLEME anında koda gömülür (değişiklik yeniden derleme
 * ister): SITE_URL (kanonik/site haritası/paylaşım için mutlak adres), SITE_INDEXABLE ("true" -> arama
 * motorlarına açık; varsayılan KAPALI: test/önizleme ortamı yanlışlıkla dizine girmez),
 * GOOGLE_SITE_VERIFICATION (Search Console doğrulama kodu).
 *
 * KURAL: sayfalar `openGraph`/`robots`/`alternates`'ı KENDİLERİ yazmaz, YALNIZ `pageMetadata` ile alır.
 * NEDEN? Next metadata'yı SIĞ birleştirir: bir sayfa `openGraph: {title}` verirse kök layout'taki
 * `openGraph.images`/`siteName` TAMAMEN kaybolur (research R9'da doğrulandı). Tam nesneyi tek yerde
 * üretmek bu tuzağı kapatır; `robots` da her zaman "VE dizine açık" ile hesaplanır.
 *
 * Node test koşucusu bu dosyayı doğrudan yükler -> `@/` yok, Next türleri yalnız `import type`.
 */
import type {Metadata} from "next";

export const SITE_NAME = "Sanayi Defteri";
export const SITE_TAGLINE = "Sanayide doğru ustayı bul.";
/** Varsayılan paylaşım görseli (src/app/opengraph-image.ts) — 1200×630. */
export const OG_IMAGE = {url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME} — ${SITE_TAGLINE}`};

const LOCAL_URL = "http://localhost:3000";

/** Mutlak site adresi, sonda "/" olmadan. Tanımsızsa yerel geliştirme adresi. */
export function siteUrl(): string {
    const raw = process.env.SITE_URL?.trim() || LOCAL_URL;
    // İkinci emniyet (asıl kontrol next.config.ts'te): geçersiz değer sayfaları düşürmesin, yerel adrese düş.
    try {
        new URL(raw);
    } catch {
        console.error(`[seo] geçersiz SITE_URL "${raw}", ${LOCAL_URL} kullanılıyor`);
        return LOCAL_URL;
    }
    return raw.replace(/\/+$/, "");
}

/** Arama motorlarına açık mı? Yalnız tam olarak "true" açar (yazım hatası = kapalı = güvenli taraf). */
export function indexable(): boolean {
    return process.env.SITE_INDEXABLE === "true";
}

/** Search Console doğrulama kodu; boşsa undefined (meta etiketi hiç basılmaz). */
export function googleVerification(): string | undefined {
    return process.env.GOOGLE_SITE_VERIFICATION?.trim() || undefined;
}

/** "/providers/1" -> "https://site/providers/1" */
export function absoluteUrl(path: string): string {
    return siteUrl() + (path.startsWith("/") ? path : `/${path}`);
}

export type PageMetaInput = {
    title: string;
    /** true -> kök şablonun "| Sanayi Defteri" eki EKLENMEZ (ana sayfa başlığı zaten marka adını taşır). */
    absoluteTitle?: boolean;
    description: string;
    /** Kanonik yol ("/providers/12"); metadataBase ile mutlaklaşır. */
    path: string;
    /** false -> "noindex, follow". Dizine kapalı ortamda her zaman false. */
    index?: boolean;
    ogType?: "website" | "article";
};

export function pageMetadata({title, absoluteTitle, description, path, index = true, ogType = "website"}: PageMetaInput): Metadata {
    return {
        title: absoluteTitle ? {absolute: title} : title,
        description,
        alternates: {canonical: path},
        robots: {index: index && indexable(), follow: true},
        openGraph: {
            siteName: SITE_NAME,
            locale: "tr_TR",
            type: ogType,
            url: path,
            title,
            description,
            images: [OG_IMAGE],
        },
        twitter: {card: "summary_large_image", title, description, images: [OG_IMAGE.url]},
    };
}
