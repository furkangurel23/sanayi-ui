"use client";

import {useState} from "react";
import type {BrandDto} from "@/lib/types";

export default function BrandCard({brand}: { brand: BrandDto }) {
    const [open, setOpen] = useState(false);
    //useState etkilesim icin gerekli. App Router'da sadece gereken parcayi use client yapariz, geri kalan server'da kalir -> performans
    //TODO useState tam olarak nedir, ne ise yarar?
    const providerCount = brand.providers?.length ?? 0;

    return (
        <div className="rounded-2xl border p-4 shadow-sm bg-white/5 border-white/10">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold">{brand.name}</h3>
                    <p className="text-sm opacity-80">{providerCount} usta / servis</p>
                </div>
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="text-sm rounded-xl px-3 py-1 border border-white/20 hover:border-white/40"
                    aria-expanded={open}
                    aria-controls={`brand-${brand.id}-providers`}
                >
                    {open ? "Gizle" : "Göster"}
                </button>
            </div>

            {open && providerCount > 0 && (
                <ul
                    id={`brand-${brand.id}-providers`}
                    className="mt-3 space-y-2 max-h-72 overflow-auto pr-1"
                >
                    {brand.providers.map((p) => (
                        <li key={p.id} className="rounded-lg border border-white/10 p-2">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="font-medium">{p.name}</div>
                                    <div className="text-xs opacity-70">
                                        {[p.district, p.city].filter(Boolean).join(" / ")}
                                    </div>
                                </div>
                                <a
                                    href={`/provider/${p.id}`}
                                    className="text-xs underline underline-offset-2"
                                >
                                    Detay
                                </a>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
