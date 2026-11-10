/*
 * MARKA KARTI — açılır/kapanır usta listesi (Server Component).
 *
 * Eskiden bu dosyanın tamamı "use client"tı (useState için). Artık kart SUNUCUDA
 * render ediliyor; yalnızca aç/kapa butonu küçük bir client bileşende
 * (BrandProvidersToggle). App Router felsefesi: etkileşimi mümkün olan EN KÜÇÜK
 * parçaya indir, gerisi server'da kalsın -> daha küçük JS bundle, daha hızlı sayfa.
 *
 * Nasıl? "Slot" kalıbı: başlık (logo + ad), aksiyon (Sohbet linki) ve liste öğeleri
 * burada JSX olarak üretilip toggle'a PROP/children olarak verilir. Marka nesnesi
 * (BrandDto) client'a prop olarak serileştirilmez; giden yalnızca hazır JSX'tir.
 * Not: liste öğeleri kapalıyken de RSC payload'unda taşınır (toggle açılınca
 * anında görünsün diye) — ama artık kart kodu ve marka verisi client paketinde değil.
 *
 * Erişilebilirlik (toggle'da): aria-expanded + aria-controls, ekran okuyucuya
 * "bu buton şu bölgeyi açıp kapatır" bilgisini verir.
 */

import Link from "next/link";
import type {BrandDto} from "@/lib/types";
import BrandLogo from "@/components/BrandLogo";
import BrandProvidersToggle from "@/components/BrandProvidersToggle";

export default function BrandCard({brand}: { brand: BrandDto }) {
    const providerCount = brand.providers?.length ?? 0;

    return (
        <BrandProvidersToggle
            header={
                <div className="row" style={{minWidth: 0}}>
                    <BrandLogo name={brand.name} size={46}/>
                    <div style={{minWidth: 0}}>
                        <h3 className="card-title truncate">{brand.name}</h3>
                        <p className="card-sub">{providerCount} usta / servis</p>
                    </div>
                </div>
            }
            actions={<Link href={`/chat/${brand.id}`} className="btn btn-ghost btn-sm">Sohbet</Link>}
            hasList={providerCount > 0}
            listId={`brand-${brand.id}-providers`}
        >
            {(brand.providers ?? []).map((p) => (
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
        </BrandProvidersToggle>
    );
}
