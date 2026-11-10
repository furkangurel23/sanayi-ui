"use client";

/*
 * HARİTA (Leaflet, imperatif kullanım — react-leaflet yok).
 *
 * Öğrenme notları:
 *  - Leaflet `window`/`document`'a dokunduğu için sunucuda çalışamaz. Bu bileşen
 *    hiçbir zaman doğrudan import edilmez; yalnızca `next/dynamic(..., {ssr: false})`
 *    sarmalayıcısı (MapSection — liste, yakınımdakiler ve detay) üzerinden yüklenir -> ayrı bir JS
 *    parçası (chunk) olur ve sadece harita gösteren rotalarda iner.
 *  - Leaflet CSS'i de BURADA import ediliyor (eskiden globals.css'te @import idi ve
 *    her sayfaya iniyordu). App Router, bir bileşenin import ettiği CSS'i o bileşeni
 *    yükleyen parçaya bağlar -> harita CSS'i de yalnızca harita olan rotalarda gelir.
 *    Sıra notu: bu CSS artık globals.css'ten SONRA yüklenir.
 *  - 002: tema uyumlu harita stilleri (koyu karo filtresi, kontroller, popup, atıf)
 *    ./ProvidersMap.css'te — leaflet CSS'inden SONRA import edilir ki onu ezsin.
 *  - Karo kaynağı OSM kullanım politikasına göre (D3): TEK alan adı
 *    `tile.openstreetmap.org` (eski `{s}.` alt alan adları kaldırıldı) ve tam atıf
 *    metni "© OpenStreetMap contributors" (bağlantılı).
 */
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "./ProvidersMap.css";
import {useEffect, useRef, useState} from "react";
import type {ProviderListItem} from "@/lib/types";
import {directionsUrls} from "@/lib/directions";
import {NAVIGATION_PATH} from "@/components/icons";

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
 * İçerik: kalın ad, "ilçe / şehir", varsa puan satırı; satırlar arasında <br>.
 *
 * 002 rev 3 (T051, FR-023): altına "Yol tarifi" bağlantıları (Google önce, Apple sonra) —
 * yine DOM ile: `href` sabit önekli (https://www.google.com/..., https://maps.apple.com/...)
 * ve hedefi encodeURIComponent'li bir URL'dir (directions.ts), metin `textContent` ile
 * girer -> XSS kuralı korunur. Görünür metin + .sr-only devamı DirectionsLinks ile aynı
 * erişilebilir adı verir; ikon NAVIGATION_PATH'ten (ikon setiyle tek kaynak) SVG olarak
 * createElementNS ile çizilir (SVG öğeleri createElement ile değil, SVG ad alanıyla kurulur).
 */
const SVG_NS = "http://www.w3.org/2000/svg";

function navigationIcon(): SVGSVGElement {
    const svg = document.createElementNS(SVG_NS, "svg");
    // IconBase ile aynı öznitelikler: 24 viewBox, currentColor çizgi, dekoratif (aria-hidden).
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.75");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("class", "icon icon-sm");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", NAVIGATION_PATH);
    svg.appendChild(path);
    return svg;
}

function buildDirections(p: ProviderListItem): HTMLElement | null {
    const urls = directionsUrls({name: p.name, lat: p.lat, lon: p.lon, district: p.district, city: p.city});
    if (!urls) return null;
    const wrap = document.createElement("div");
    wrap.className = "popup-directions";
    for (const [href, label] of [[urls.google, "Google Haritalar"], [urls.apple, "Apple Haritalar"]]) {
        const a = document.createElement("a");
        a.href = href;
        a.target = "_blank";
        a.rel = "noopener";
        a.appendChild(navigationIcon());
        a.appendChild(document.createTextNode(label));
        const sr = document.createElement("span");
        sr.className = "sr-only";
        sr.textContent = ` ile ${p.name} için yol tarifi (yeni sekmede açılır)`; // düz metin
        a.appendChild(sr);
        wrap.appendChild(a);
    }
    return wrap;
}

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
    const directions = buildDirections(p);
    if (directions) root.appendChild(directions);
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

            L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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

        /*
         * BOYUT DEĞİŞİMİ — 002 rev 3 (T048): eskiden yalnız `window` "resize" dinleniyordu.
         * Ama harita kabı pencere değişmeden de boyut değiştirebilir (ör. CSS ile gizli bir
         * kabın 768 px sınırı geçilince görünür olması, kaydırma çubuğunun belirmesi,
         * telefonun döndürülmesi). Leaflet kabının boyutunu kendisi izlemez; yanlış boyutla
         * kalırsa karolar yarım/kaymış çizilir. ResizeObserver doğrudan BU div'in boyutunu
         * izler -> her değişimde invalidateSize() ("boyutunu yeniden ölç"). Pencere
         * yeniden boyutlanması da kabı değiştirdiği için ayrı bir window dinleyicisi gerekmez.
         * İlk observe() bir kez tetiklenir; harita henüz kurulmadıysa hasMapPane sessizce geçer.
         */
        const onResize = () => {
            const m = mapRef.current;
            if (!hasMapPane(m)) return;
            try {
                m.invalidateSize();
            } catch {
            }
        };
        const resizeObserver = new ResizeObserver(onResize);
        resizeObserver.observe(mapDivRef.current);

        return () => {
            cancelled = true;
            resizeObserver.disconnect();
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

            // Bu effect de L'ye ihtiyaç duyuyor -> burada da import et
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
            // çalışma anı değeri: harita yüksekliği prop'tan gelir (çağıran sayfa belirler)
            style={{height}}
            aria-label="Harita"
            role="region"
        />
    );
}
