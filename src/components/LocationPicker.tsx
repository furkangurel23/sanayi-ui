"use client";

/*
 * KONUM SEÇİCİ (003 / T093) — imperatif Leaflet; YALNIZCA LocationPickerClient'taki
 * `next/dynamic(..., {ssr: false})` sarmalayıcıdan yüklenir (Leaflet `window` ister — anayasa I).
 *
 * UX kararı (research R18): "işaretçiyi parmakla sürükle" yerine SABİT MERKEZ İĞNESİ.
 *  - Harita iğnenin ALTINDA kayar (dokunma, fare, ya da odaklanıp OK TUŞLARI — Leaflet
 *    `keyboard: true`; +/- yakınlaştırır). Küçük bir işaretçiyi telefonda sürüklemekten çok
 *    daha isabetli ve klavyeyle de kullanılabilir.
 *  - Yakınlaştırma (tekerlek/iki parmak) `"center"` modunda: merkez sabit kalır, iğne kaymaz.
 *  - Değer YALNIZCA "Bu konumu seç" ile oluşur (açık onay). Varsayılan/ilçe merkezi koordinatı
 *    asla sessizce gönderilmez — onaysız formda `location` alan hatası çıkar (form kontrol eder).
 *  - İlçe seçilince harita `districts.ts`'teki yaklaşık ilçe merkezine gider (başlangıç noktası).
 *  - "Konumumu kullan": tarayıcı konumuna gider (yine onay gerekir).
 *  - Ekran okuyucu / klavye alternatifi: `<details>` içinde enlem/boylam alanları, İKİ YÖNLÜ:
 *    harita kayınca alanlar güncellenir; alanlara yazıp "Haritada göster" deyince harita gider.
 *  - İstemci tarafı Ankara kutusu kontrolü; hata `aria-describedby` ile bağlı (asıl karar backend).
 *
 * `readOnly` modu (yönetici öneri ayrıntısı): iğne ve düğmeler yok; "Önerilen konum" ayrı
 * görünümlü işaretçi + olası tekrar işaretçileri. Harita TEK bilgi kaynağı değildir — çağıran
 * tekrarları ayrıca mesafeli METİN listesi olarak verir.
 *
 * Güvenlik: işaretçi ipuçları (tooltip) DOM düğümüyle ve `textContent` ile kurulur — Leaflet'e
 * string verilirse innerHTML olurdu (dükkan adı güvenilmez veri; XSS). ProvidersMap ile aynı kural.
 * Stil: ProvidersMap.css (koyu karo filtresi, kontroller, atıf) + globals.css `.picker-*`.
 * OSM karo politikası aynen: tek alan adı, bağlantılı atıf.
 */
import "leaflet/dist/leaflet.css";
import "./ProvidersMap.css";
import {useEffect, useId, useRef, useState} from "react";
import {ANKARA_CENTER, findDistrict, inAnkara} from "@/lib/districts";
import {GEO_FAILURE_TEXT, GeolocationFailure, getCurrentLocation} from "@/lib/geolocation";
import {Navigation, Pin} from "@/components/icons";
import {tileAttribution, tileUrl} from "@/lib/mapTiles";

type LeafletMap = import("leaflet").Map;
type LeafletLayerGroup = import("leaflet").LayerGroup;

export type LatLon = { lat: number; lon: number };
export type PickerMarker = LatLon & { label: string; kind: "suggested" | "duplicate" };

export type LocationPickerProps = {
    /** Onaylanmış konum (yoksa null — form "konum seçilmedi" hatası verir). */
    value: LatLon | null;
    onChange?: (v: LatLon) => void;
    /** Seçili ilçe: değişince harita o ilçenin merkezine gider. */
    district?: string;
    /** Dışarıdan gelen hata (form / backend `fieldErrors.location`). */
    error?: string;
    /** Hata öğesinin id'si — form, alanı bununla `aria-describedby` yapar. */
    errorId?: string;
    readOnly?: boolean;
    markers?: PickerMarker[];
    /** Haritanın erişilebilir adı. */
    label?: string;
};

const fmt = (n: number) => n.toFixed(6);
const NO_MARKERS: PickerMarker[] = []; // sabit referans: varsayılan [] her render'da yeni dizi olmasın

export default function LocationPicker({
                                           value, onChange, district, error, errorId, readOnly = false, markers = NO_MARKERS,
                                           label = "Konum seçme haritası",
                                       }: LocationPickerProps) {
    const mapDivRef = useRef<HTMLDivElement>(null!);
    const mapRef = useRef<LeafletMap | null>(null);
    const layerRef = useRef<LeafletLayerGroup | null>(null);
    const [ready, setReady] = useState(false);
    // Haritanın şu anki merkezi (alanlar ve "Bu konumu seç" bunu kullanır)
    const [center, setCenter] = useState<LatLon | null>(null);
    const [latText, setLatText] = useState("");
    const [lonText, setLonText] = useState("");
    const [localError, setLocalError] = useState<string | null>(null);
    const [geoStatus, setGeoStatus] = useState<string | null>(null);
    const baseId = useId();
    const instrId = `${baseId}-instr`;
    const ownErrorId = errorId ?? `${baseId}-err`;
    const statusId = `${baseId}-status`;

    // Başlangıç görünümü yalnız ilk kurulumda okunur (sonraki değişimler ayrı effect'lerde).
    const initialView = useRef(() => {
        if (value) return {c: value, z: 17};
        const d = findDistrict(district);
        if (d) return {c: d.center, z: 14};
        const m = markers[0];
        if (m) return {c: {lat: m.lat, lon: m.lon}, z: 16};
        return {c: ANKARA_CENTER, z: 11};
    });

    // 1) HARİTA KUR (bir kez)
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const L = await import("leaflet");
            const el = mapDivRef.current;
            if (!el || mapRef.current || cancelled) return;
            const {c, z} = initialView.current();
            const map = L.map(el, {
                center: [c.lat, c.lon],
                zoom: z,
                keyboard: true,              // odaklanınca ok tuşları kaydırır, +/- yakınlaştırır
                scrollWheelZoom: "center",   // yakınlaştırmada merkez (iğne) sabit kalır
                touchZoom: "center",
            });
            L.tileLayer(tileUrl(), {
                attribution: tileAttribution(), // 006: karo kaynağı tek yerden (lib/mapTiles.ts)
            }).addTo(map);
            layerRef.current = L.layerGroup().addTo(map);
            mapRef.current = map;

            const syncCenter = () => {
                const m = map.getCenter();
                const next = {lat: m.lat, lon: m.lng};
                setCenter(next);
                setLatText(fmt(next.lat));
                setLonText(fmt(next.lon));
            };
            map.on("moveend", syncCenter);
            syncCenter();
            setReady(true);
        })();

        // Kap boyutu değişirse (döndürme, ızgara) karoları yeniden ölç — ProvidersMap ile aynı.
        const ro = new ResizeObserver(() => {
            try {
                mapRef.current?.invalidateSize();
            } catch { /* harita kaldırılmış olabilir */
            }
        });
        ro.observe(mapDivRef.current);
        return () => {
            cancelled = true;
            ro.disconnect();
            mapRef.current?.remove();
            mapRef.current = null;
            layerRef.current = null;
        };
    }, []);

    // 2) İLÇE DEĞİŞİNCE merkezine uç (ilk kurulumdaki ilçe zaten başlangıç görünümüdür).
    const lastDistrict = useRef(district);
    useEffect(() => {
        if (!ready || readOnly || district === lastDistrict.current) return;
        lastDistrict.current = district;
        const d = findDistrict(district);
        if (d) mapRef.current?.setView([d.center.lat, d.center.lon], 14);
    }, [district, ready, readOnly]);

    // 3) İŞARETÇİLER: onaylanmış konum (düzenleme) ya da önerilen konum + tekrarlar (salt okunur).
    // Bağımlılık işaretçi DİZİSİNİN kimliği değil İÇERİĞİ (JSON anahtarı): çağıran her render'da
    // yeni dizi üretse bile katman yalnız içerik değişince yeniden çizilir.
    const markersKey = JSON.stringify(markers);
    const markersRef = useRef(markers);
    useEffect(() => {
        markersRef.current = markers;
    });
    useEffect(() => {
        if (!ready) return;
        (async () => {
            const L = await import("leaflet");
            const layer = layerRef.current;
            const map = mapRef.current;
            if (!layer || !map) return;
            layer.clearLayers();
            const tip = (text: string) => {
                const span = document.createElement("span");
                span.textContent = text; // düz metin — etiket yorumlanmaz
                return span;
            };
            if (!readOnly && value) {
                L.circleMarker([value.lat, value.lon], {radius: 7, className: "picker-confirmed", interactive: false})
                    .addTo(layer);
            }
            const markers = markersRef.current;
            if (readOnly) {
                markers.forEach(m => {
                    L.circleMarker([m.lat, m.lon], {
                        radius: m.kind === "suggested" ? 10 : 7,
                        className: m.kind === "suggested" ? "picker-suggested" : "picker-duplicate",
                    }).bindTooltip(tip(m.label), {permanent: m.kind === "suggested", direction: "top"}).addTo(layer);
                });
                if (markers.length > 1) {
                    map.fitBounds(L.latLngBounds(markers.map(m => [m.lat, m.lon] as [number, number])),
                        {padding: [32, 32], maxZoom: 18});
                }
            }
        })();
    }, [ready, readOnly, value, markersKey]);

    function confirm() {
        if (!center) return;
        if (!inAnkara(center.lat, center.lon)) {
            setLocalError("Bu konum Ankara il sınırlarının dışında. Haritayı Ankara içinde bir noktaya kaydırın.");
            return;
        }
        setLocalError(null);
        onChange?.({lat: Number(fmt(center.lat)), lon: Number(fmt(center.lon))});
    }

    function applyTyped() {
        const lat = Number(latText.replace(",", "."));
        const lon = Number(lonText.replace(",", "."));
        if (!Number.isFinite(lat) || !Number.isFinite(lon) || latText.trim() === "" || lonText.trim() === "") {
            setLocalError("Enlem ve boylamı sayı olarak girin (ör. 39.97 ve 32.75).");
            return;
        }
        if (!inAnkara(lat, lon)) {
            setLocalError("Bu konum Ankara il sınırlarının dışında (enlem 38,60–40,75; boylam 30,80–34,20).");
            return;
        }
        setLocalError(null);
        mapRef.current?.setView([lat, lon], Math.max(mapRef.current.getZoom(), 16));
    }

    async function useMyLocation() {
        setGeoStatus("Konum alınıyor…");
        try {
            const pos = await getCurrentLocation();
            mapRef.current?.setView([pos.lat, pos.lon], 17);
            setGeoStatus("Harita konumunuza taşındı. İğneyi dükkanın üzerine getirip “Bu konumu seç” deyin.");
        } catch (e) {
            const kind = e instanceof GeolocationFailure ? e.kind : "error";
            setGeoStatus(`${GEO_FAILURE_TEXT[kind].title}. ${GEO_FAILURE_TEXT[kind].desc}`);
        }
    }

    const shownError = localError ?? error;
    // Onaylı konum haritanın ortasından ~10 m'den fazla uzaksa "yeniden seç" ipucu
    const drifted = value && center
        && (Math.abs(value.lat - center.lat) > 0.0001 || Math.abs(value.lon - center.lon) > 0.0001);

    if (readOnly) {
        return (
            <div className="map-frame picker-frame">
                <div ref={mapDivRef} className="picker-map" role="region" aria-label={label}/>
            </div>
        );
    }

    return (
        <div className="picker stack-sm">
            <p id={instrId} className="field-hint">
                Haritayı sürükleyin ya da haritaya odaklanıp ok tuşlarıyla kaydırın (+ ve - yakınlaştırır).
                İğneyi dükkanın üzerine getirip &ldquo;Bu konumu seç&rdquo;e basın.
            </p>
            <div className="map-frame picker-frame">
                <div ref={mapDivRef} className="picker-map" role="application" aria-label={label}
                     aria-describedby={`${instrId} ${statusId}${shownError ? ` ${ownErrorId}` : ""}`}/>
                <span className="picker-pin" aria-hidden><Pin size="lg"/></span>
            </div>
            <div className="picker-actions">
                <button type="button" className="btn btn-primary" onClick={confirm} disabled={!ready}
                        aria-describedby={shownError ? ownErrorId : undefined}>
                    <Pin size="sm"/> Bu konumu seç
                </button>
                <button type="button" className="btn btn-outline" onClick={useMyLocation} disabled={!ready}>
                    <Navigation size="sm"/> Konumumu kullan
                </button>
            </div>
            <p id={statusId} className="caption muted" aria-live="polite">
                {value
                    ? <>Seçilen konum: {fmt(value.lat)}, {fmt(value.lon)}.{drifted
                        ? " Harita kaydırıldı; yeni yeri kullanmak için tekrar “Bu konumu seç”e basın." : ""}</>
                    : "Henüz konum seçilmedi."}
                {geoStatus && <> {geoStatus}</>}
            </p>
            {/* Form düzeyindeki hata (`error`) formun üstündeki uyarıda zaten duyurulur -> burada
                role YOK (iki kez okunmasın); alan `aria-describedby` ile bağlı kalır. Yalnız bu
                bileşenin KENDİ ürettiği hata (elle girilen koordinat geçersiz) anında duyurulur:
                `key` kaynağa göre değişir -> yeni öğe DOM'a role="alert" ile eklenir (var olan bir
                öğeye sonradan role eklemek ekran okuyucularda güvenilir duyurulmaz). */}
            {shownError && (
                <span key={localError ? "local" : "form"} id={ownErrorId} className="field-error"
                      role={localError ? "alert" : undefined}>{shownError}</span>
            )}
            <details className="picker-manual">
                <summary>Enlem ve boylamı elle girin</summary>
                <div className="picker-manual-fields">
                    <label className="field">
                        <span className="field-label">Enlem</span>
                        <input className="input" inputMode="decimal" value={latText}
                               aria-invalid={localError ? true : undefined}
                               onChange={e => setLatText(e.target.value)}
                               onKeyDown={e => {
                                   if (e.key === "Enter") {
                                       e.preventDefault();
                                       applyTyped();
                                   }
                               }}/>
                    </label>
                    <label className="field">
                        <span className="field-label">Boylam</span>
                        <input className="input" inputMode="decimal" value={lonText}
                               aria-invalid={localError ? true : undefined}
                               onChange={e => setLonText(e.target.value)}
                               onKeyDown={e => {
                                   if (e.key === "Enter") {
                                       e.preventDefault();
                                       applyTyped();
                                   }
                               }}/>
                    </label>
                    <button type="button" className="btn btn-outline" onClick={applyTyped}>Haritada göster</button>
                </div>
                <p className="field-hint">Harita bu noktaya gider; ardından &ldquo;Bu konumu seç&rdquo;e basın.</p>
            </details>
        </div>
    );
}
