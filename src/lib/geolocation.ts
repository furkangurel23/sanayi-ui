/*
 * TARAYICI KONUMU (003 / T090) — NearLocate'teki mantık buraya taşındı; "Yakınımdakiler" ve
 * konum seçici (LocationPicker "Konumumu kullan") AYNI fonksiyonu kullanır.
 *
 * navigator.geolocation.getCurrentPosition geri çağırma (callback) tabanlıdır; burada
 * Promise'e sarılır -> çağıran `await` ile kullanır. Hata türü tek bir "ayrık" koda iner:
 *   "unsupported" (API yok), "denied" (izin reddi, code 1), "error" (zaman aşımı, konum yok).
 * Tarayıcının İngilizce teknik mesajı kullanıcıya gösterilmez; console'a yazılır.
 * Not: HTTPS veya localhost şartı vardır (güvenli bağlam).
 */
export type GeoFailure = "unsupported" | "denied" | "error";

export class GeolocationFailure extends Error {
    readonly kind: GeoFailure;

    constructor(kind: GeoFailure) {
        super(kind);
        this.name = "GeolocationFailure";
        this.kind = kind;
    }
}

export function getCurrentLocation(timeoutMs = 10000): Promise<{ lat: number; lon: number }> {
    return new Promise((resolve, reject) => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
            reject(new GeolocationFailure("unsupported"));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            pos => resolve({lat: pos.coords.latitude, lon: pos.coords.longitude}),
            e => {
                // e.code: 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
                console.warn("Geolocation hatası:", e.code, e.message);
                reject(new GeolocationFailure(e.code === e.PERMISSION_DENIED ? "denied" : "error"));
            },
            {enableHighAccuracy: true, timeout: timeoutMs},
        );
    });
}

/** Hata türünün Türkçe açıklaması (iki ekran aynı metni kullanır). */
export const GEO_FAILURE_TEXT: Record<GeoFailure, { title: string; desc: string }> = {
    denied: {title: "Konum izni reddedildi", desc: "Tarayıcı ayarlarından bu site için konum iznini açıp tekrar dene."},
    unsupported: {title: "Konum desteklenmiyor", desc: "Tarayıcınız konum desteğini sunmuyor."},
    error: {title: "Konum alınamadı", desc: "Biraz sonra tekrar dene."},
};
