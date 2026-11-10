"use client";

/*
 * KONUM SEÇİCİ SARMALAYICISI (003 / T093) — MapSection ile aynı kalıp (anayasa I):
 * Leaflet'i yükleyen LocationPicker'ı `next/dynamic(..., {ssr: false})` ile ayrı parça
 * olarak yükler. `ssr: false` yalnız CLIENT bileşende kullanılabilir — bu dosya "use client".
 * Server Component'ler (sayfalar) bu sarmalayıcıyı import eder, LocationPicker'ı DOĞRUDAN etmez.
 *
 * CLS 0: yüklenirken harita ile AYNI yükseklikte iskelet (`--map-h`) + düğme satırı iskeleti
 * çizilir; yükseklik kaba `--map-h` CSS değişkeniyle verilir (çalışma anı değeri — çağıran
 * sayfa belirler), iskelet ve harita aynı değeri okur.
 */
import dynamic from "next/dynamic";
import type {CSSProperties} from "react";
import type {LocationPickerProps} from "@/components/LocationPicker";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
    ssr: false,
    loading: () => (
        <div className="stack-sm" aria-hidden>
            <div className="skeleton skeleton-map picker-skeleton"/>
            <div className="skeleton picker-skeleton-actions"/>
        </div>
    ),
});

export default function LocationPickerClient({height = 320, ...props}: LocationPickerProps & { height?: number }) {
    return (
        // çalışma anı değeri: harita yüksekliği (prop) -> iskelet ve harita aynı boyda
        <div className="picker-wrap" style={{"--map-h": `${height}px`} as CSSProperties}>
            <LocationPicker {...props}/>
        </div>
    );
}
