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
 */

import {useState} from "react";
import {useRouter} from "next/navigation";

export default function NearLocate({initialRadiusKm = 10}: { initialRadiusKm?: number }) {
    const router = useRouter();
    const [radius, setRadius] = useState<number>(initialRadiusKm);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const locate = () => {
        setErr(null);
        setLoading(true);

        if (!navigator.geolocation) {
            setErr("Tarayıcınız konum desteğini sunmuyor.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                // Tıklama anında mevcut query korunur, konum + yarıçap eklenir.
                const params = new URLSearchParams(window.location.search);
                params.set("lat", String(pos.coords.latitude));
                params.set("lon", String(pos.coords.longitude));
                params.set("radiusKm", String(radius));
                params.set("page", "1");
                router.push(`/providers/near?${params.toString()}`);
                setLoading(false);
            },
            (e) => {
                setErr(e.message || "Konum alınamadı.");
                setLoading(false);
            },
            {enableHighAccuracy: true, timeout: 10000}
        );
    };

    return (
        <div className="card stack">
            <p className="card-sub">Yakınındaki ustaları görmek için konumuna izin ver.</p>

            <div className="row" style={{flexWrap: "wrap"}}>
                <label className="field" style={{width: "9rem"}}>
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
                <button
                    type="button"
                    onClick={locate}
                    disabled={loading}
                    className="btn btn-primary"
                    style={{alignSelf: "flex-end"}}
                >
                    {loading ? "Alınıyor…" : "📍 Konumumu al"}
                </button>
            </div>

            {err && <div className="alert alert-error">{err}</div>}
        </div>
    );
}
