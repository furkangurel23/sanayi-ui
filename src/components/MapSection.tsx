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

import {useState} from "react";
import dynamic from "next/dynamic";
import {useRouter} from "next/navigation";
import type {ProviderListItem} from "@/lib/types";

const ProvidersMap = dynamic(() => import("@/components/ProvidersMap"), {
    ssr: false,
    // `loading` fonksiyonu bileşenin prop'larını (height) GÖREMEZ; bu yüzden iskelet
    // MapSection'ın varsayılan harita yüksekliğiyle (280 px — /providers ve /near'ın
    // kullandığı değer) sabit çizilir. Farklı yükseklik kullanılırsa burası da güncellenmeli.
    loading: () => <div className="skeleton" style={{height: 280}}/>,
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
