"use client";

/*
 * KONUM ALICI — tarayıcı Geolocation API'si.
 *
 * navigator.geolocation.getCurrentPosition(basari, hata, ayarlar):
 *  - Kullanıcıdan izin ister (HTTPS veya localhost şartı!).
 *  - Başarıda koordinatları URL'e yazarız -> Server Component sayfa
 *    /providers/near?lat=..&lon=.. ile veriyi sunucuda çeker (SSR).
 * Yani "konum al" client işi, "yakınımdakileri listele" server işi — görev ayrımı net.
 *
 * Next 16 deseni: başlangıç yarıçapı SERVER sayfadan prop gelir (useSearchParams
 * gerekmez -> Suspense zorunluluğu da yok); URL'e yazma tıklama anında yapılır.
 *
 * 002 — konum DURUMLARI (spec "kapsanan durumlar"), ortak EmptyState görünümüyle:
 *   idle        -> Pin   "Konumunu paylaş"            (izin bekleniyor: henüz sorulmadı)
 *   locating    -> Clock "Konum alınıyor…"            (tarayıcı izin penceresi / GPS)
 *   denied      -> Alert "Konum izni reddedildi"      (GeolocationPositionError.code === 1)
 *   unsupported -> Alert "Konum desteklenmiyor"       (navigator.geolocation yok)
 *   error       -> Alert "Konum alınamadı"            (zaman aşımı, konum yok...)
 * Davranış aynı (aynı buton, aynı URL); yalnızca durumu daha net ANLATIYORUZ.
 * Öğrenme notu — "ayrık durum" (union string) tek bir state'te tutulur: loading/err gibi
 * birbirini dışlayan iki ayrı boolean yerine tek değişken -> imkânsız kombinasyon olmaz.
 * aria-live="polite" (EmptyState `live`): YALNIZCA başlık + açıklama canlı bölgede; durum
 * değişince ekran okuyucu yeni durumu (sırası gelince) okur. Yarıçap alanı ve düğme
 * bölgenin dışında -> yazarken her tuşta duyuru yapılmaz.
 * denied/error açıklaması HEP bizim Türkçe metnimiz: tarayıcının e.message'ı İngilizce ve
 * tarayıcıya göre değişen teknik bir metin ("User denied Geolocation") -> kullanıcıya
 * gösterilmez, geliştirici için console'a yazılır.
 */

import {type ReactNode, useState} from "react";
import {useRouter} from "next/navigation";
import EmptyState from "@/components/EmptyState";
import {Alert, Clock, Pin} from "@/components/icons";
import {GEO_FAILURE_TEXT, GeolocationFailure, getCurrentLocation} from "@/lib/geolocation";

type Status = "idle" | "locating" | "denied" | "unsupported" | "error";

export default function NearLocate({initialRadiusKm = 10}: { initialRadiusKm?: number }) {
    const router = useRouter();
    const [radius, setRadius] = useState<number>(initialRadiusKm);
    const [status, setStatus] = useState<Status>("idle");

    // 003: konum alma mantığı lib/geolocation.ts'e taşındı (konum seçici de kullanır) —
    // davranış aynı: başarıda URL'e lat/lon/yarıçap yazılır, hata türü duruma çevrilir.
    const locate = async () => {
        setStatus("locating");
        try {
            const pos = await getCurrentLocation();
            // Tıklama anında mevcut query korunur, konum + yarıçap eklenir.
            const params = new URLSearchParams(window.location.search);
            params.set("lat", String(pos.lat));
            params.set("lon", String(pos.lon));
            params.set("radiusKm", String(radius));
            params.set("page", "1");
            router.push(`/providers/near?${params.toString()}`);
            setStatus("idle");
        } catch (e) {
            setStatus(e instanceof GeolocationFailure ? e.kind : "error");
        }
    };

    // Durum -> ikon + başlık + açıklama (tek tablo; JSX'te dallanma yok)
    const view: Record<Status, { icon: ReactNode; title: string; desc: string }> = {
        idle: {icon: <Pin/>, title: "Konumunu paylaş", desc: "Yakınındaki ustaları görmek için konumuna izin ver."},
        locating: {icon: <Clock/>, title: "Konum alınıyor…", desc: "Tarayıcın izin isterse onayla."},
        denied: {icon: <Alert/>, ...GEO_FAILURE_TEXT.denied},
        unsupported: {icon: <Alert/>, ...GEO_FAILURE_TEXT.unsupported},
        error: {icon: <Alert/>, ...GEO_FAILURE_TEXT.error},
    };
    const v = view[status];
    const loading = status === "locating";

    return (
        <EmptyState
            live
            icon={v.icon}
            title={v.title}
            description={v.desc}
            action={
                <div className="locate-form">
                    <label className="field locate-radius">
                        <span className="field-label">Yarıçap (km)</span>
                        <input
                            className="input"
                            type="number"
                            min={1}
                            max={100}
                            value={radius}
                            onChange={(e) => setRadius(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                        />
                    </label>
                    <button type="button" onClick={locate} disabled={loading} className="btn btn-primary">
                        <Pin size="sm"/> {loading ? "Alınıyor…" : "Konumumu al"}
                    </button>
                </div>
            }
        />
    );
}
