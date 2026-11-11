import type {NextConfig} from "next";
import {PHASE_PRODUCTION_BUILD} from "next/constants";

/*
 * GÜVENLİK HEADER'LARI — her yanıta eklenir (savunma katmanı).
 *  - X-Content-Type-Options: nosniff -> tarayıcı MIME türünü "tahmin etmesin";
 *    yanlışlıkla script olarak yorumlanan içerik saldırılarını (MIME sniffing) keser.
 *  - X-Frame-Options: DENY -> site iframe'e gömülemez (clickjacking koruması).
 *  - Referrer-Policy -> dış sitelere tam URL sızdırma (query'deki token vb. riskine karşı).
 *  - Permissions-Policy -> kullanmadığımız tarayıcı yeteneklerini kapat
 *    (geolocation'ı KENDİ origin'imize açık bırakıyoruz: "Yakınımdakiler" özelliği kullanıyor).
 */
const securityHeaders = [
    {key: "X-Content-Type-Options", value: "nosniff"},
    {key: "X-Frame-Options", value: "DENY"},
    {key: "Referrer-Policy", value: "strict-origin-when-cross-origin"},
    {key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=()"},
];

const nextConfig: NextConfig = {
    /*
     * TURBOPACK KÖKÜ — Turbopack proje kökünü lockfile (package-lock.json) arayarak bulur.
     * Ev dizininde (~) başıboş bir package-lock.json olduğu için kökü yanlış (üst klasör)
     * tahmin edip "Detected additional lockfiles" uyarısı veriyordu. Kökü bu dosyanın
     * bulunduğu klasöre (__dirname = next.config.ts'in klasörü, mutlak yol) sabitliyoruz;
     * böylece modül çözümleme ve dosya izleme yalnızca bu projeyle sınırlı kalır.
     */
    turbopack: {
        root: __dirname,
    },
};

/*
 * ARAMA MOTORU ORTAM AYARLARI (005-seo-foundation, spec FR-016) — bkz. src/lib/seo/site.ts.
 *  - SITE_URL: mutlak site adresi (kanonik, site haritası, paylaşım görseli). Yerelde boş bırakılabilir.
 *  - SITE_INDEXABLE: "true" -> arama motorlarına AÇIK. Varsayılan KAPALI: her sayfa "noindex" taşır ve
 *    her yanıta `X-Robots-Tag: noindex, nofollow` eklenir — önizleme/test ortamı yanlışlıkla dizine girmez.
 *  - GOOGLE_SITE_VERIFICATION: Search Console doğrulama kodu (boşsa meta etiketi yok).
 * `env` bu değerleri DERLEME anında koda gömer -> değiştirmek yeniden derleme ister (çalışan sunucuda
 * ortam değişkenini değiştirmek etkisizdir).
 *
 * DERLEME KORUMASI: dizine AÇIK bir üretim derlemesi geçerli bir genel https adresi olmadan yapılamaz —
 * aksi hâlde kanonikler/site haritası "http://localhost:3000"ı Google'a bildirirdi (geri alması haftalar sürer).
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);

function assertIndexableSiteUrl(raw: string | undefined): void {
    let url: URL;
    try {
        url = new URL(raw ?? "");
    } catch {
        throw new Error(`SITE_INDEXABLE=true iken SITE_URL geçerli bir adres olmalı (şu an: "${raw ?? ""}"). Örnek: SITE_URL=https://sanayidefteri.com`);
    }
    if (url.protocol !== "https:" || LOCAL_HOSTS.has(url.hostname)) {
        throw new Error(`SITE_INDEXABLE=true iken SITE_URL https ve yerel olmayan bir adres olmalı (şu an: "${raw}").`);
    }
}

export default function config(phase: string): NextConfig {
    const indexable = process.env.SITE_INDEXABLE === "true";
    if (phase === PHASE_PRODUCTION_BUILD && indexable) assertIndexableSiteUrl(process.env.SITE_URL);

    // Kapalı modda her yanıta "dizine alma, bağlantı izleme" başlığı (HTML dışı yanıtlar dahil).
    const headers = indexable
        ? securityHeaders
        : [...securityHeaders, {key: "X-Robots-Tag", value: "noindex, nofollow"}];

    return {...nextConfig, env: {
        SITE_URL: process.env.SITE_URL ?? "",
        SITE_INDEXABLE: process.env.SITE_INDEXABLE ?? "",
        GOOGLE_SITE_VERIFICATION: process.env.GOOGLE_SITE_VERIFICATION ?? "",
    }, async headers() {
        return [{source: "/(.*)", headers}];
    }};
}
