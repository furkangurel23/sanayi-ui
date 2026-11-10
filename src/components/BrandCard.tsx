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
 *
 * 002: satır içi stiller sınıflara taşındı (.brand-card-id/.brand-card-text,
 * .brand-provider-link); "Sohbet" bağlantısı Chat ikonu taşır. Başlık bloğu dar
 * ekranda eylemlerin alt satıra inmesine izin verir (375 px taşma düzeltmesi — T026).
 */

import Link from "next/link";
import type {BrandDto} from "@/lib/types";
import BrandLogo from "@/components/BrandLogo";
import BrandProvidersToggle from "@/components/BrandProvidersToggle";
import {Chat} from "@/components/icons";

export default function BrandCard({brand}: { brand: BrandDto }) {
    const providerCount = brand.providers?.length ?? 0;

    return (
        <BrandProvidersToggle
            header={
                <div className="brand-card-id">
                    <BrandLogo name={brand.name} size={46}/>
                    <div className="brand-card-text">
                        <h3 className="card-title truncate">{brand.name}</h3>
                        <p className="card-sub">{providerCount} usta / servis</p>
                    </div>
                </div>
            }
            actions={
                <Link href={`/chat/${brand.id}`} className="btn btn-ghost btn-sm">
                    <Chat size="sm"/> Sohbet
                </Link>
            }
            hasList={providerCount > 0}
            listId={`brand-${brand.id}-providers`}
        >
            {(brand.providers ?? []).map((p) => (
                <li key={p.id}>
                    <Link href={`/providers/${p.id}`} className="brand-provider-link">
                        <span className="truncate">{p.name}</span>
                        <span className="brand-provider-loc">
                            {[p.district, p.city].filter(Boolean).join(", ")}
                        </span>
                    </Link>
                </li>
            ))}
        </BrandProvidersToggle>
    );
}
