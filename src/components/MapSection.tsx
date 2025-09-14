"use client";

import {useEffect, useMemo, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import type {ProviderListItem} from "@/lib/types";
import ProvidersMap from "@/components/ProvidersMap";

type Props = { items: ProviderListItem[]; height?: number };


export default function MapSection({items, height = 280}: Props) {
    const router = useRouter();                // URL'yi programatik değiştirmek için
    const sp = useSearchParams();              // Mevcut query string'i okumak için

    // 2) Listede koordinatı olan kayıt var mı? (Varsayılan açık/kapalı kararı)
    const anyWithCoords = useMemo(
        () => items.some(p => typeof p.lat === "number" && typeof p.lon === "number"),
        [items]
    );

    // 3) Başlangıç durumu:
    //    - URL'de ?showMap=1/0 varsa onu kullan
    //    - yoksa listede koordinat varsa "açık", yoksa "kapalı"
    const initialOpen = useMemo(() => {
        const raw = sp.get("showMap");
        if (raw === "1") return true;
        if (raw === "0") return false;
        return anyWithCoords;
    }, [sp, anyWithCoords]);

    const [open, setOpen] = useState<boolean>(initialOpen);

    // 4) Geri/ileri ile URL değişirse, form state'i URL ile senkron kalsın
    useEffect(() => {
        setOpen(initialOpen);
    }, [initialOpen]);

    // 5) Toggle: UI state'i ve URL'yi birlikte güncelle
    const toggle = () => {
        const next = !open;
        setOpen(next);
        const params = new URLSearchParams(sp.toString());
        params.set("showMap", next ? "1" : "0");
        router.push(`?${params.toString()}`); // client-side navigation
    };

    return (
        <section className="space-y-2">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Harita</h2>
                <button
                    type="button"
                    onClick={toggle}
                    aria-pressed={open}
                    className="rounded-lg border border-white/20 px-3 py-1 text-sm hover:border-white/40"
                    title={open ? "Haritayı gizle" : "Haritayı göster"}
                >
                    {open ? "Gizle" : "Göster"}
                </button>
            </div>

            {/* 6) Harita sadece 'open' iken render edilir (değilse unmount) */}
            {open ? (
                <ProvidersMap key="open" items={items} height={height}/>
            ) : (
                <div className="rounded-2xl border border-white/10 p-4 text-sm opacity-80">
                    Harita kapalı. “Göster”e tıklayarak açabilirsiniz.
                </div>
            )}
        </section>
    );
}
