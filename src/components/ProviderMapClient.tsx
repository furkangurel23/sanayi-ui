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
 *  - loading: detay sayfasındaki harita yüksekliğiyle (220 px) aynı iskelet -> harita
 *    gelince sayfa zıplamaz (CLS yok). `loading` prop göremediği için değer sabittir.
 */
import dynamic from "next/dynamic";

const ProviderMapClient = dynamic(() => import("@/components/ProvidersMap"), {
    ssr: false,
    loading: () => <div className="skeleton" style={{height: 220}}/>,
});

export default ProviderMapClient;
