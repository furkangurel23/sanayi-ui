"use client"; //geolocation kullanacagiz. tarayi API'lari

import {useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";

export default function NearLocate() {
    const router = useRouter();
    const sp = useSearchParams();

    //URL'de radius varsa onu baslangic degeri yap; yoksa 10 km.

    const [radius, setRadius] = useState<number>(() => {
        const r = Number(sp.get("radiusKm") ?? "10");
        return Number.isFinite(r) ? r : 10;
    });

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
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;

                const params = new URLSearchParams(sp.toString());
                params.set("lat", String(lat));
                params.set("lon", String(lon));
                params.set("radiusKm", String(radius));
                params.set("page", "1");

                //Client-side navigation: SSR sayfa yeni parametrelerle yeniden fetch eder
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
        <div className="rounded-2xl border border-white/10 p-4 space-y-3">
            <p className="text-sm opacity-80">
                Yakınınızdaki ustaları görmek için konumunuza izin verin.
            </p>

            <div className="flex items-center gap-2">
                <label className="text-sm w-28">Yarıçap (km)</label>
                <input
                    type="number"
                    min={1}
                    max={100}
                    value={radius}
                    onChange={(e) => setRadius(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                    className="w-24 rounded-lg border border-white/20 bg-transparent px-2 py-1 text-sm"
                />
                <button
                    type="button"
                    onClick={locate}
                    disabled={loading}
                    className="rounded-lg border border-white/20 px-3 py-1 text-sm disabled:opacity-50"
                >
                    {loading ? "Alınıyor..." : "Konumumu al"}
                </button>
            </div>

            {err && <div className="text-sm text-red-400">{err}</div>}
        </div>
    );
}