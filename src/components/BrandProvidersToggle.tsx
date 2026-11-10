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
 *  - DOM, eski BrandCard ile BİREBİR aynı (görünüm değişmez): başlık satırı
 *    [.row-between nowrap] > [header] + [.row > actions + buton]; açıkken altında <ul>.
 *    Kapalıyken liste hiç render EDİLMEZ (eski davranış; HTML'de gizli liste yok).
 *  - Erişilebilirlik: gerçek <button> (Enter/Space klavyeyle çalışır), aria-expanded
 *    açık/kapalı durumunu, aria-controls hangi listeyi yönettiğini ekran okuyucuya söyler.
 */
import {type ReactNode, useState} from "react";

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
            <div className="row-between" style={{flexWrap: "nowrap"}}>
                {header}
                <div className="row" style={{flexShrink: 0}}>
                    {actions}
                    {hasList && (
                        <button
                            onClick={() => setOpen(v => !v)}
                            className="btn btn-outline btn-sm"
                            aria-expanded={open}
                            aria-controls={listId}
                        >
                            {open ? "Gizle" : "Ustalar"}
                        </button>
                    )}
                </div>
            </div>

            {open && hasList && (
                <ul id={listId} className="stack-sm"
                    style={{marginTop: "1rem", maxHeight: "18rem", overflow: "auto"}}>
                    {children}
                </ul>
            )}
        </div>
    );
}
