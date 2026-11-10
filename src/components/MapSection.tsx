"use client";

/*
 * HARİTA BÖLÜMÜ — aç/kapa durumu URL ile senkron (?showMap=1/0).
 *
 * Neden URL'de? Kullanıcı filtre değiştirip sayfa yeniden çekildiğinde veya linki
 * paylaştığında harita tercihi korunsun.
 *
 * Next 16 deseni (useSearchParams'SIZ):
 *  - Başlangıç değeri (initialOpen) SERVER sayfadan prop olarak gelir — server
 *    zaten searchParams'ı okuyor, client'ta tekrar okumaya gerek yok.
 *  - URL'e yazma işi TIKLAMA ANINDA window.location.search'ten yapılır
 *    (event handler yalnızca tarayıcıda çalışır, güvenlidir).
 *  - Geri/ileri senkronu: URL değişince server sayfa yeni initialOpen ile render
 *    eder; sayfa bileşene `key={String(open)}` verdiği için bileşen REMOUNT olur
 *    ve state yeni değerden başlar (React'in "key ile resetleme" kalıbı).
 *
 * Performans: harita SADECE open iken render edilir (kapalıyken unmount) —
 * leaflet gibi ağır bir kütüphane boşuna çalışmaz.
 *
 * next/dynamic + ssr:false (anayasa I): ProvidersMap'i statik import etmek yerine
 * dinamik yüklüyoruz. Böylece harita kodu + Leaflet CSS'i AYRI bir parça (chunk) olur;
 * yalnızca bu bileşen ekranda harita çizdiğinde indirilir. `ssr: false` sunucuda hiç
 * render etmez (Leaflet `window` ister). Not: `ssr: false` yalnızca CLIENT bileşen
 * içinde kullanılabilir — bu dosya zaten "use client". Yüklenirken aynı yükseklikte
 * bir .skeleton gösterilir -> düzen kayması (CLS) olmaz.
 * Kullanan rotalar: /providers ve /providers/near.
 */

import {type CSSProperties, useState} from "react";
import dynamic from "next/dynamic";
import {useRouter} from "next/navigation";
import type {ProviderListItem} from "@/lib/types";
import EmptyState from "@/components/EmptyState";
import {Pin} from "@/components/icons";

const ProvidersMap = dynamic(() => import("@/components/ProvidersMap"), {
    ssr: false,
    // `loading` fonksiyonu bileşenin prop'larını (height) GÖREMEZ. Bu yüzden yükseklik
    // .map-frame kabına `--map-h` CSS değişkeni olarak verilir; iskelet (.skeleton-map)
    // onu okur -> sabit sayı kopyalanmaz, harita gelince sayfa zıplamaz (CLS yok).
    loading: () => <div className="skeleton skeleton-map" aria-hidden/>,
});

type Props = { items: ProviderListItem[]; height?: number; initialOpen?: boolean };

export default function MapSection({items, height = 280, initialOpen}: Props) {
    const router = useRouter();

    // initialOpen verilmemişse: koordinatı olan kayıt varsa açık başla.
    const anyWithCoords = items.some(p => typeof p.lat === "number" && typeof p.lon === "number");
    const [open, setOpen] = useState<boolean>(initialOpen ?? anyWithCoords);

    const toggle = () => {
        const next = !open;
        setOpen(next); // anında görsel tepki (optimistic)
        // Tıklama anında mevcut query korunarak sadece showMap güncellenir.
        const params = new URLSearchParams(window.location.search);
        params.set("showMap", next ? "1" : "0");
        router.push(`?${params.toString()}`);
    };

    return (
        <section className="stack">
            <div className="section-head">
                <h2 className="headline">Harita</h2>
                <button type="button" onClick={toggle} aria-pressed={open} className="btn btn-outline btn-sm">
                    {open ? "Gizle" : "Göster"}
                </button>
            </div>

            {open ? (
                // çalışma anı değeri: harita yüksekliği (prop) -> iskelet ve harita aynı boyda
                <div className="map-frame" style={{"--map-h": `${height}px`} as CSSProperties}>
                    <ProvidersMap items={items} height={height}/>
                </div>
            ) : (
                <EmptyState
                    compact
                    icon={<Pin/>}
                    title="Harita kapalı."
                    description={<>&ldquo;Göster&rdquo;e tıklayarak açabilirsiniz.</>}
                />
            )}
        </section>
    );
}
