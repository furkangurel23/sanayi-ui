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

    // 1) HARİTAYI KUR
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
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
            }).addTo(map);

            const markerLayer = L.layerGroup().addTo(map);

            mapRef.current = map;
            markersLayerRef.current = markerLayer;

            //ilk boyut hesaplamasi
            requestAnimationFrame(() => map.invalidateSize());
            setMapReady(true);
        })(); // <-- ÖNEMLİ: IIFE ÇAĞRISI

        const onResize = () => mapRef.current?.invalidateSize();
        window.addEventListener("resize", onResize);

        return () => {
            cancelled = true;
            window.removeEventListener("resize", onResize);
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
                    typeof (p as any).lat === "number" && typeof (p as any).lon === "number"
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
                        ]
                            .filter(Boolean)
                            .join("<br/>")
                    )
                    .addTo(layer);
            }

            if (withCoords.length > 0) {
                const bounds = L.latLngBounds(
                    withCoords.map((p) => [p.lat, p.lon] as [number, number])
                );
                mapInstance.fitBounds(bounds, {padding: [20, 20]});
            } else {
                mapInstance.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
            }

            //Görünürlük / yerleşim değişmişse düzelt
            requestAnimationFrame(() => mapInstance.invalidateSize());
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
