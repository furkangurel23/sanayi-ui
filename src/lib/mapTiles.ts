/*
 * HARİTA KAROSU KAYNAĞI — 006-production-deploy (spec FR-023): karo adresi ve atfı TEK yerden.
 *
 * Varsayılan OpenStreetMap kamu karo sunucusu. OSM kullanım politikası: görünür atıf, geçerli Referer
 * (tarayıcı kökeni gönderir), toplu indirme yok, ağır trafik yok. Trafik artarsa başka bir sağlayıcıya
 * GEÇİŞ = iki ortam değişkeni (`NEXT_PUBLIC_TILE_URL`, `NEXT_PUBLIC_TILE_ATTRIBUTION`) + yeniden derleme.
 * Kullananlar: ProvidersMap, LocationPicker (karo + atıf), MapSection ve liste layout'u (preconnect).
 *
 * Node test koşucusu doğrudan yükler → `@/` yok.
 */
export const DEFAULT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const DEFAULT_TILE_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function tileUrl(): string {
    return process.env.NEXT_PUBLIC_TILE_URL || DEFAULT_TILE_URL;
}

export function tileAttribution(): string {
    return process.env.NEXT_PUBLIC_TILE_ATTRIBUTION || DEFAULT_TILE_ATTRIBUTION;
}

/** preconnect için köken ("https://tile.openstreetmap.org"); şablon ayrıştırılamazsa null. */
export function tileOrigin(): string | null {
    try {
        return new URL(tileUrl().replace(/\{[a-z]\}/g, "0")).origin;
    } catch {
        return null;
    }
}
