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
    /*
     * 006 — STANDALONE ÇIKTI: `next build` çalışmak için gereken her şeyi (yalnız kullanılan node_modules
     * dosyaları dahil) `.next/standalone`'a toplar; üretim imajı `node server.js` ile tüm node_modules'ü
     * taşımadan çalışır (küçük imaj). outputFileTracingRoot: dosya izleme kökü bu proje — ev dizinindeki
     * başıboş lockfile yüzünden standalone ağacı iç içe (…/standalone/Desktop/projects/…) kurulmasın.
     */
    output: "standalone",
    outputFileTracingRoot: __dirname,
};

/*
 * 006 — SIKI ÜRETİM DERLEMESİ (spec FR-008a): yalnız üretim Dockerfile'ı `STRICT_ENV=true` verir (CI ve yerel
 * derleme etkilenmez). Tarayıcıya gömülen adresler ve reCAPTCHA site anahtarı eksik/yerelse derleme DURUR:
 * aksi hâlde canlı sitede API çağrıları localhost'a gider ya da anonim oy verilemezdi (anahtar yok).
 */
function assertStrictPublicEnv(): void {
    const problems: string[] = [];
    const isPublic = (raw: string | undefined, scheme: string) => {
        try {
            const u = new URL(raw ?? "");
            return u.protocol === scheme && !LOCAL_HOSTS.has(u.hostname);
        } catch {
            return false;
        }
    };
    if (!isPublic(process.env.NEXT_PUBLIC_API_URL, "https:")) problems.push(`NEXT_PUBLIC_API_URL https ve genel olmalı (şu an: "${process.env.NEXT_PUBLIC_API_URL ?? ""}")`);
    if (!isPublic(process.env.NEXT_PUBLIC_WS_URL, "wss:")) problems.push(`NEXT_PUBLIC_WS_URL wss ve genel olmalı (şu an: "${process.env.NEXT_PUBLIC_WS_URL ?? ""}")`);
    if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim()) problems.push("NEXT_PUBLIC_RECAPTCHA_SITE_KEY boş (anonim oy verilemezdi)");
    if (problems.length) throw new Error("Üretim derlemesi durduruldu (STRICT_ENV=true):\n - " + problems.join("\n - "));
}

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

/** SITE_URL verildiyse HER ortamda geçerli bir http(s) adresi olmalı: şemasız "sanayidefteri.com" gibi bir
 *  değer kök layout'taki `new URL(...)`'ı (metadataBase) çalışma anında patlatıp TÜM sayfaları 500 yapardı. */
function assertSiteUrlShape(raw: string | undefined): void {
    if (!raw?.trim()) return;
    let ok = false;
    try {
        ok = ["http:", "https:"].includes(new URL(raw.trim()).protocol);
    } catch {
        ok = false;
    }
    if (!ok) throw new Error(`SITE_URL geçerli bir http(s) adresi olmalı (şu an: "${raw}"). Örnek: SITE_URL=https://sanayidefteri.com`);
}

export default function config(phase: string): NextConfig {
    const indexable = process.env.SITE_INDEXABLE === "true";
    assertSiteUrlShape(process.env.SITE_URL);
    if (phase === PHASE_PRODUCTION_BUILD && indexable) assertIndexableSiteUrl(process.env.SITE_URL);
    if (phase === PHASE_PRODUCTION_BUILD && process.env.STRICT_ENV === "true") assertStrictPublicEnv();

    // Kapalı modda her yanıta "dizine alma, bağlantı izleme" başlığı (HTML dışı yanıtlar dahil).
    const headers = indexable
        ? securityHeaders
        : [...securityHeaders, {key: "X-Robots-Tag", value: "noindex, nofollow"}];

    return {...nextConfig, env: {
        SITE_URL: process.env.SITE_URL ?? "",
        SITE_INDEXABLE: process.env.SITE_INDEXABLE ?? "",
        GOOGLE_SITE_VERIFICATION: process.env.GOOGLE_SITE_VERIFICATION ?? "",
        // NOT (006): API_INTERNAL_URL BİLEREK burada YOK — burada olsaydı derlemede gömülürdü; sunucu
        // tarafı onu çalışma anında okur (lib/apiBase.ts).
    }, async headers() {
        return [{source: "/(.*)", headers}];
    }};
}
