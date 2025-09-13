"use client";

import {useEffect, useMemo, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import type {ProviderListItem} from "@/lib/types";
import ProvidersMap from "@/components/ProvidersMap";

type Props = {
    items: ProviderListItem[],
    height?: number;
}

export default function MapSection({items, height = 280}: Props) {
    const router = useRouter(); //Programatik gezinme (URL guncellemek icin)
    const sp = useSearchParams(); // Mevcut URL query'lerini okur (client)


    // Listede koordinati olan kayit var mi? (Varsayilan karar icin kullanacagiz)
    const anyWithCoords = useMemo(
        () => items.some((p): p is ProviderListItem & { lat: number, lon: number } =>
            typeof p.lat === "number" && typeof p.lng === "number"),
        [items]
    );

    /*
    * Baslangic acik/kapali duruu:
    *   - Eger URL'de ?showMap=0/1 verilmesse onu kullan
    *   - Yoksa listede koordinat varsa "acik", yoksa "kapali" baslat.
    * */

    const initialOpen = useMemo(() => {
        const raw = sp.get("showMap");
        if (raw === "1") return true;
        if (raw === "0") return false;
        return anyWithCoords;
    }, [sp, anyWithCoords]);

    const [open, setOpen] = useState<boolean>(initialOpen);

    //URL degisirse (geri/ileri tusu), UI durumunu RUL ile senkron tut,
    useEffect(() => {
        setOpen(initialOpen)
    }, [initialOpen]);

    const toggle = () => {
        const next = !open;
        setOpen(next);
        const params = new URLSearchParams(sp.toString());
        params.set("showMap", next ? "1" : "0");
        router.push(`?${params.toString()}`);
    };

    return (
        <section className="space-y-2">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Harita</h2>
                <button
                    type="button"
                    onClick={toggle}
                    aria-pressed={open} // Erişilebilirlik: toggle state
                    className="rounded-lg border border-white/20 px-3 py-1 text-sm hover:border-white/40"
                    title={open ? "Haritayı gizle" : "Haritayı göster"}
                >
                    {open ? "Gizle" : "Göster"}
                </button>
            </div>

            {/* ▼ open=false iken ProvidersMap'i hiç render etmiyoruz (unmount olur) */}
            {/* Client bileşen; DOM'a Leaflet'i çizer */}

            {open ? (
                <ProvidersMap items={items}
                              height={height}/>
            ) : (
                <div className="rounded-2xl border border-white/10 p-4 text-sm opacity-80">
                    Harita kapalı. “Göster”e tıklayarak açabilirsiniz.
                </div>
            )}
        </section>
    );

}