/*
 * API TABAN ADRESİ — 006-production-deploy (spec FR-009a). Sunucu ile tarayıcı API'ye FARKLI yoldan ulaşır.
 *
 * Canlıda arayüz bir konteynerde çalışır; sayfaları SUNUCUDA üretirken (SSR/ISR, site haritası, sunucu
 * eylemleri) API'ye iç ağdan gider: `API_INTERNAL_URL=http://api:8080/api`. Genel adrese
 * (`https://{alan}/api`) gitseydi istek sunucudan çıkıp aynı sunucuya geri dönerdi (DNS + sertifikaya
 * bağımlı; ilk açılışta sertifika yokken her sayfa 500 verirdi). Tarayıcı ise iç adı bilemez → genel adres.
 *
 * ÖNEMLİ FARK:
 *  - `NEXT_PUBLIC_API_URL` DERLEMEDE koda gömülür (tarayıcı paketine girer).
 *  - `API_INTERNAL_URL` ÇALIŞMA ANINDA okunur (next.config `env`'ine BİLEREK konmaz; konsaydı gömülürdü).
 *  - Değer her çağrıda okunur (modül sabiti değil) → sunucu ortam değişkeni değişince yeniden derleme gerekmez.
 * Hiçbiri verilmezse yerel geliştirme adresi (davranış eskisiyle aynı).
 *
 * Node test koşucusu doğrudan yükler → `@/` yok.
 */
const LOCAL = "http://localhost:8080/api";

function trim(u: string): string {
    return u.replace(/\/+$/, "");
}

/** Tarayıcının (ve işaretlemeye yazılan URL'lerin) kullandığı GENEL adres. */
export function publicApiBase(): string {
    // Literal erişim şart: Next yalnız `process.env.NEXT_PUBLIC_…` biçimini derlemede yerine koyar.
    return trim(process.env.NEXT_PUBLIC_API_URL || LOCAL);
}

/** Sunucuda iç adres (varsa), tarayıcıda genel adres. Sunucu tarafı veri çekme bunu kullanır. */
export function apiBase(): string {
    if (typeof window === "undefined" && process.env.API_INTERNAL_URL) {
        return trim(process.env.API_INTERNAL_URL);
    }
    return publicApiBase();
}
