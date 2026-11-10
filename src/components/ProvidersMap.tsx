"use client";

/*
 * HARİTA (Leaflet, imperatif kullanım — react-leaflet yok).
 *
 * Öğrenme notları:
 *  - Leaflet `window`/`document`'a dokunduğu için sunucuda çalışamaz. Bu bileşen
 *    hiçbir zaman doğrudan import edilmez; yalnızca `next/dynamic(..., {ssr: false})`
 *    sarmalayıcıları (MapSection, ProviderMapClient) üzerinden yüklenir -> ayrı bir JS
 *    parçası (chunk) olur ve sadece harita gösteren rotalarda iner.
 *  - Leaflet CSS'i de BURADA import ediliyor (eskiden globals.css'te @import idi ve
 *    her sayfaya iniyordu). App Router, bir bileşenin import ettiği CSS'i o bileşeni
 *    yükleyen parçaya bağlar -> harita CSS'i de yalnızca harita olan rotalarda gelir.
 *    Sıra notu: bu CSS artık globals.css'ten SONRA yüklenir; tek override'ımız
 *    `.map-frame .leaflet-container` daha yüksek özgüllükle (0,2,0) yine kazanır.
 */
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import {useEffect, useRef, useState} from "react";
import type {ProviderListItem} from "@/lib/types";

// Runtime'a girmeyen type-only importlar. runtime'a girmez.
type LeafletMap = import("leaflet").Map;
type LeafletLayerGroup = import("leaflet").LayerGroup;
type LeafletMapWithPane = LeafletMap & {_mapPane?: HTMLElement | null};

const DEFAULT_CENTER: [number, number] = [39.925533, 32.866287]; // Ankara
const DEFAULT_ZOOM = 11;

type Props = { items: ProviderListItem[]; height?: number };

function hasMapPane(map: LeafletMap | null): map is LeafletMap & {_mapPane: HTMLElement} {
    return Boolean(map && (map as LeafletMapWithPane)._mapPane);
}

/*
 * POPUP İÇERİĞİ — GÜVENLİ (XSS'siz) kurulum.
 *
 * Leaflet bindPopup'a STRING verilirse onu innerHTML olarak basar: dükkan adı
 * `<img src=x onerror=alert(1)>` olsaydı tarayıcı bunu gerçek bir etiket sanıp
 * içindeki JavaScript'i çalıştırırdı (Cross-Site Scripting). Ad/ilçe/şehir admin
 * paneli ve içe aktarma betikleriyle girildiği için "güvenilmez veri" sayılır.
 *
 * Çözüm: HTML metni birleştirmek yerine DOM düğümü kuruyoruz. `textContent`
 * kendisine verilen metni HER ZAMAN düz yazı olarak koyar (etiket yorumlamaz);
 * Leaflet'e hazır HTMLElement verince innerHTML'e hiç dokunmaz.
 * İçerik eskisiyle birebir aynı: kalın ad, "ilçe / şehir", varsa puan satırı;
 * satırlar arasında <br>.
 */
function buildPopup(p: ProviderListItem): HTMLElement {
    const root = document.createElement("div");

    const name = document.createElement("strong");
    name.textContent = p.name;

    const lines: Node[] = [name];
    const place = [p.district, p.city].filter(Boolean).join(" / ");
    if (place) lines.push(document.createTextNode(place));
    if (typeof p.avgScore === "number") {
        lines.push(document.createTextNode(`Puan: ${p.avgScore.toFixed(1)} (${p.ratingCount ?? 0} oy)`));
    }

    lines.forEach((node, i) => {
        if (i > 0) root.appendChild(document.createElement("br"));
        root.appendChild(node);
    });
    return root;
}

export default function ProvidersMap({items, height = 260}: Props) {
    const mapDivRef = useRef<HTMLDivElement>(null!);
    const mapRef = useRef<LeafletMap | null>(null);
    const markersLayerRef = useRef<LeafletLayerGroup | null>(null);

    //haritanin haziro lup olmadigini state'te tasiyoruz.
    const [mapReady, setMapReady] = useState(false);

    // RAF id’leri (init ve updates için ayrı)
    const initRafRef = useRef<number | null>(null);
    const updateRafRef = useRef<number | null>(null);

    // 1) HARİTA KUR
    useEffect(() => {
        let cancelled = false;

        (async () => {
            // Bu importlar sadece client'ta çalışır
            const L = await import("leaflet");
            await import("leaflet-defaulticon-compatibility");

            const el = mapDivRef.current;
            if (!el || mapRef.current || cancelled) return;

            const map = L.map(el, {
                center: DEFAULT_CENTER,
                zoom: DEFAULT_ZOOM,
                scrollWheelZoom: false,
            });

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
            }).addTo(map);

            const markerLayer = L.layerGroup().addTo(map);

            mapRef.current = map;
            markersLayerRef.current = markerLayer;

            // İlk boyut hesabı — sağlamlık kontrolleri ile
            if (initRafRef.current !== null) cancelAnimationFrame(initRafRef.current);
            initRafRef.current = requestAnimationFrame(() => {
                if (cancelled) return;
                const m = mapRef.current;
                // map hâlâ aynı mı ve pane’i var mı?
                if (!hasMapPane(m)) return;
                try {
                    m.invalidateSize();
                } catch { /* sessiz geç */
                }
                initRafRef.current = null;
            });

            setMapReady(true);
        })();

        const onResize = () => {
            const m = mapRef.current;
            if (!hasMapPane(m)) return;
            try {
                m.invalidateSize();
            } catch {
            }
        };
        window.addEventListener("resize", onResize);

        return () => {
            cancelled = true;
            window.removeEventListener("resize", onResize);
            if (initRafRef.current !== null) cancelAnimationFrame(initRafRef.current);
            if (updateRafRef.current !== null) cancelAnimationFrame(updateRafRef.current);
            mapRef.current?.remove();
            mapRef.current = null;
            markersLayerRef.current = null;
            setMapReady(false);
        };
    }, []);

    // 2) MARKERLARI ÇİZ / GÜNCELLE
    useEffect(() => {
        (async () => {
            if (!mapReady) return;

            const mapInstance = mapRef.current;
            const layer = markersLayerRef.current;
            if (!mapInstance || !layer) return;

            // Bu effect de L'ye ihtiyaç duyuyor → burada da import et
            const L = await import("leaflet");

            layer.clearLayers();

            const withCoords = items.filter(
                (p): p is ProviderListItem & { lat: number; lon: number } =>
                    typeof p.lat === "number" && typeof p.lon === "number"
            );

            for (const p of withCoords) {
                L.marker([p.lat, p.lon])
                    .bindPopup(buildPopup(p))
                    .addTo(layer);
            }

            if (withCoords.length > 0) {
                const bounds = L.latLngBounds(withCoords.map((p) => [p.lat, p.lon] as [number, number]));
                mapInstance.fitBounds(bounds, {padding: [20, 20]});
            } else {
                mapInstance.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
            }

            // Görünürlük/yerleşim değişmişse düzelt — güvenli RAF
            if (updateRafRef.current !== null) cancelAnimationFrame(updateRafRef.current);
            updateRafRef.current = requestAnimationFrame(() => {
                // component unmount ya da map.remove() olmuş olabilir
                const m = mapRef.current;
                if (!m || m !== mapInstance) return;          // aynı instance mı?
                if (!hasMapPane(m)) return;                   // pane var mı?
                try {
                    m.invalidateSize();
                } catch {
                }
                updateRafRef.current = null;
            });
        })();
    }, [items, mapReady]);

    return (
        <div
            ref={mapDivRef}
            style={{height, width: "100%"}}
            aria-label="Harita"
            role="region"
        />
    );
}
