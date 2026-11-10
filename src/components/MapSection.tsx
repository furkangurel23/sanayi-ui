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
 */

import {useState} from "react";
import {useRouter} from "next/navigation";
import type {ProviderListItem} from "@/lib/types";
import ProvidersMap from "@/components/ProvidersMap";

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
        <section className="stack-sm">
            <div className="row-between">
                <h2 className="section-title">Harita</h2>
                <button type="button" onClick={toggle} aria-pressed={open} className="btn btn-outline btn-sm">
                    {open ? "Gizle" : "Göster"}
                </button>
            </div>

            {open ? (
                <div className="map-frame">
                    <ProvidersMap items={items} height={height}/>
                </div>
            ) : (
                <div className="empty-state" style={{padding: "1.25rem"}}>
                    Harita kapalı. &ldquo;Göster&rdquo;e tıklayarak açabilirsiniz.
                </div>
            )}
        </section>
    );
}
