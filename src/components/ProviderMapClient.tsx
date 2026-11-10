"use client";

/*
 * USTA DETAYI HARİTA SARMALAYICISI — tek görevi ProvidersMap'i istemcide, ayrı bir
 * parça (chunk) olarak yüklemek.
 *
 * Öğrenme notları:
 *  - Detay sayfası bir SERVER component; server component'ta
 *    `dynamic(..., { ssr: false })` KULLANILAMAZ (Next hata verir: "ssr: false is not
 *    allowed with next/dynamic in Server Components"). Çözüm: dinamik import'u küçük
 *    bir CLIENT bileşene koyup server sayfadan onu kullanmak — bu dosya o köprü.
 *  - Leaflet sunucuda çalışamaz (window ister) -> ssr:false; harita JS'i ve CSS'i
 *    yalnızca bu rota açıldığında iner (anayasa I).
 *  - loading: `loading` fonksiyonu prop GÖREMEZ. 002'den itibaren iskelet yüksekliği
 *    sabit sayı değil: sayfa .map-frame kabına `--map-h` CSS değişkenini verir,
 *    .skeleton-map onu okur -> harita gelince sayfa zıplamaz (CLS yok) ve sayı tek yerde.
 */
import dynamic from "next/dynamic";
import type {ComponentProps} from "react";
import {preconnect} from "react-dom";

const ProvidersMap = dynamic(() => import("@/components/ProvidersMap"), {
    ssr: false,
    loading: () => <div className="skeleton skeleton-map" aria-hidden/>,
});

/*
 * 002 / T038: karo sunucusuna bağlantıyı erken aç (LCP öğesi OSM karosu). preconnect()
 * render sırasında çağrılır; sunucu render'ında <head>'e <link rel="preconnect"> düşer.
 * ComponentProps<typeof ProvidersMap>: sarmalanan bileşenin prop tipini aynen devralır.
 */
export default function ProviderMapClient(props: ComponentProps<typeof ProvidersMap>) {
    preconnect("https://tile.openstreetmap.org");
    return <ProvidersMap {...props}/>;
}
