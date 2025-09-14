"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {useState} from "react";

type CommonProps = {
    className?: string;
    radiusKm?: number;
    label?: string;
}

//1. Sadee link: Near sayfasına götür, NearLocate orada konumu alır.
export function NearLinkButton({className, radiusKm = 10, label = "Yakınımdakiler"}: CommonProps) {
    const href = `/providers/near?radiusKm=${radiusKm}`;
    return (
        <Link
            href={href}
            className={className ?? "rounded-lg border px-3 py-1 text-sm hover:border-white/40"}
            title="Yakınımdaki ustaları göster"
        >
            {label}
        </Link>
    );
}

export function NearInstantButton({className, radiusKm = 10, label = "Yakınımdakiler"}: CommonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const goNear = () => {
        if (loading) return;
        setLoading(true);

        if (!("gelocation" in navigator)) {
            setLoading(false);
            alert("Tarayıcınız konum desteği sunmuyor.");
            return;
        }

        //HTTPS/localhost gereksinimi
        const isSecure = typeof window !== "undefined" && (location.protocol === "https:" || location.hostname === "localhost");
        if (!isSecure) {
            setLoading(false);
            alert("Konum için HTTPS ya da localhost gerekir.");
            return;
        }

        navigator.gelocation.getCurrentPosition(
            (pos) => {
                const {lat, lon} = pos.coords;
                router.push(`/providers/near?lat=${lat}&lon=${lon}&radiusKm=${radiusKm}`);
            },
            (err) => {
                console.log(err);
                alert("Konum alınamadı. İzin vermeyi deneyin veya sonra daha sonra tekrar deneyin.");
                setLoading(false);
            },
            {enableHighAccuracy: true, timeout: 10000, maximumAge: 30000}
        );
    };

    return (
        <button
            type="button"
            onClick={goNear}
            disabled={loading}
            className={className ?? "rounded-lg border px-3 py-1 text-sm hover:border-white/40 disabled:opacity-60"}
            title="Yakınımdaki ustaları göster"
            aria-busy={loading}
        >
            {loading ? "Konum alınıyor..." : label}
        </button>
    );
}