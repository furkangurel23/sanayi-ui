"use client";

import {useEffect, useRef, useState} from "react";
import type {ProviderListItem} from "@/lib/types";

// Runtime'a girmeyen type-only importlar. runtime'a girmez.
type LeafletMap = import("leaflet").Map;
type LeafletLayerGroup = import("leaflet").LayerGroup;

const DEFAULT_CENTER: [number, number] = [39.925533, 32.866287]; // Ankara
const DEFAULT_ZOOM = 11;

type Props = { items: ProviderListItem[]; height?: number };

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
            if (initRafRef.current) cancelAnimationFrame(initRafRef.current!!);
            initRafRef.current = requestAnimationFrame(() => {
                if (cancelled) return;
                const m = mapRef.current;
                // map hâlâ aynı mı ve pane’i var mı?
                if (!m || (m as any)._mapPane == null) return;
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
            if (!m || (m as any)._mapPane == null) return;
            try {
                m.invalidateSize();
            } catch {
            }
        };
        window.addEventListener("resize", onResize);

        return () => {
            cancelled = true;
            window.removeEventListener("resize", onResize);
            if (initRafRef.current) cancelAnimationFrame(initRafRef.current!!);
            if (updateRafRef.current) cancelAnimationFrame(updateRafRef.current!!);
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
                    typeof (p as ProviderListItem).lat === "number" && typeof (p as ProviderListItem).lon === "number"
            );

            for (const p of withCoords) {
                L.marker([p.lat, p.lon])
                    .bindPopup(
                        [
                            `<strong>${p.name}</strong>`,
                            [p.district, p.city].filter(Boolean).join(" / "),
                            typeof p.avgScore === "number"
                                ? `Puan: ${p.avgScore.toFixed(1)} (${p.ratingCount ?? 0} oy)`
                                : undefined,
                        ].filter(Boolean).join("<br/>")
                    )
                    .addTo(layer);
            }

            if (withCoords.length > 0) {
                const bounds = L.latLngBounds(withCoords.map((p: any) => [p.lat, p.lon] as [number, number]));
                mapInstance.fitBounds(bounds, {padding: [20, 20]});
            } else {
                mapInstance.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
            }

            // Görünürlük/yerleşim değişmişse düzelt — güvenli RAF
            if (updateRafRef.current) cancelAnimationFrame(updateRafRef.current!!);
            updateRafRef.current = requestAnimationFrame(() => {
                // component unmount ya da map.remove() olmuş olabilir
                const m = mapRef.current;
                if (!m || m !== mapInstance) return;          // aynı instance mı?
                if ((m as any)._mapPane == null) return;      // pane var mı?
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
            className="rounded-2xl border border-white/10"
            style={{height, width: "100%"}}
            aria-label="Harita"
            role="region"
        />
    );
}
