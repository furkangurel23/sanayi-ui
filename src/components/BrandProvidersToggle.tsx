"use client";

/*
 * MARKA KARTI AÇ/KAPA — BrandCard'ın tek etkileşimli parçası (küçük client bileşen).
 *
 * Öğrenme notları — "slot" (yuva) kalıbı:
 *  - Server Component, Client Component'e JSX'i PROP olarak verebilir (`children`,
 *    `header`, `actions` gibi ReactNode prop'lar). Bu JSX SUNUCUDA render edilir;
 *    client bileşen onu yalnızca "yerine koyar", içeriğini bilmez.
 *  - Kazanç: Eskiden BrandCard'ın tamamı "use client"tı -> marka nesnesinin tamamı
 *    (tüm usta listesiyle) client bileşen prop'u olarak JSON'a serileştirilip
 *    tarayıcıya gidiyor, kart kodu da JS paketine giriyordu. Şimdi client tarafta
 *    yalnızca bu küçük aç/kapa mantığı var; Link/BrandLogo gibi parçalar server'da kalır.
 *  - Yapı: başlık satırı [.brand-card-head] > [header] + [.brand-card-actions > actions +
 *    buton]; açıkken altında <ul>. Kapalıyken liste hiç render EDİLMEZ (eski davranış;
 *    HTML'de gizli liste yok).
 *  - 002 (T026): eskiden başlık satırı "nowrap" idi -> 375 px'te kart 26 px yatay taşıyordu.
 *    Artık .brand-card-head SARAR: yer yoksa eylemler alt satıra iner (CSS, globals.css).
 *    Satır içi stiller (nowrap, marginTop, maxHeight) sınıflara taşındı. Butondaki
 *    ChevronDown açıkken döner — dönüşü CSS `[aria-expanded="true"]` seçicisiyle yapar,
 *    yani görsel durum ARIA durumundan türetilir (iki ayrı state tutulmaz).
 *  - Erişilebilirlik: gerçek <button> (Enter/Space klavyeyle çalışır), aria-expanded
 *    açık/kapalı durumunu, aria-controls hangi listeyi yönettiğini ekran okuyucuya söyler.
 */
import {type ReactNode, useState} from "react";
import {ChevronDown} from "@/components/icons";

type Props = {
    header: ReactNode;   // logo + başlık bloğu (server'da render edilir)
    actions: ReactNode;  // "Sohbet" bağlantısı
    hasList: boolean;    // usta yoksa buton hiç gösterilmez
    listId: string;      // <ul> id'si (aria-controls hedefi)
    children: ReactNode; // <li> öğeleri
};

export default function BrandProvidersToggle({header, actions, hasList, listId, children}: Props) {
    const [open, setOpen] = useState(false);

    return (
        <div className="card">
            <div className="brand-card-head">
                {header}
                <div className="brand-card-actions">
                    {actions}
                    {hasList && (
                        <button
                            onClick={() => setOpen(v => !v)}
                            className="btn btn-outline btn-sm"
                            aria-expanded={open}
                            aria-controls={listId}
                        >
                            {open ? "Gizle" : "Ustalar"}
                            <ChevronDown size="sm" className="toggle-chevron"/>
                        </button>
                    )}
                </div>
            </div>

            {open && hasList && (
                <ul id={listId} className="brand-providers">
                    {children}
                </ul>
            )}
        </div>
    );
}
