"use client";

/*
 * MARKA KARTI — açılır/kapanır usta listesi.
 *
 * Yalnızca bu bileşen "use client" (useState için); listeyi basan sayfa Server
 * Component kalır. App Router felsefesi: etkileşimi mümkün olan EN KÜÇÜK parçaya indir,
 * gerisi server'da kalsın -> daha küçük JS bundle, daha hızlı sayfa.
 *
 * Erişilebilirlik: aria-expanded + aria-controls, ekran okuyucuya "bu buton
 * şu bölgeyi açıp kapatır" bilgisini verir.
 */

import {useState} from "react";
import Link from "next/link";
import type {BrandDto} from "@/lib/types";
import BrandLogo from "@/components/BrandLogo";

export default function BrandCard({brand}: { brand: BrandDto }) {
    const [open, setOpen] = useState(false);
    const providerCount = brand.providers?.length ?? 0;

    return (
        <div className="card">
            <div className="row-between" style={{flexWrap: "nowrap"}}>
                <div className="row" style={{minWidth: 0}}>
                    <BrandLogo name={brand.name} size={46}/>
                    <div style={{minWidth: 0}}>
                        <h3 className="card-title truncate">{brand.name}</h3>
                        <p className="card-sub">{providerCount} usta / servis</p>
                    </div>
                </div>
                <div className="row" style={{flexShrink: 0}}>
                    <Link href={`/chat/${brand.id}`} className="btn btn-ghost btn-sm">Sohbet</Link>
                    {providerCount > 0 && (
                        <button
                            onClick={() => setOpen(v => !v)}
                            className="btn btn-outline btn-sm"
                            aria-expanded={open}
                            aria-controls={`brand-${brand.id}-providers`}
                        >
                            {open ? "Gizle" : "Ustalar"}
                        </button>
                    )}
                </div>
            </div>

            {open && providerCount > 0 && (
                <ul id={`brand-${brand.id}-providers`} className="stack-sm"
                    style={{marginTop: "1rem", maxHeight: "18rem", overflow: "auto"}}>
                    {brand.providers.map((p) => (
                        <li key={p.id}>
                            <Link href={`/providers/${p.id}`} className="row-between nav-link"
                                  style={{width: "100%"}}>
                                <span className="truncate">{p.name}</span>
                                <span className="text-xs faint" style={{flexShrink: 0}}>
                                    {[p.district, p.city].filter(Boolean).join(", ")}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
