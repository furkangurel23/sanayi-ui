"use client";

/*
 * "ŞU AN AÇIK/KAPALI" ADACIĞI (003 / T095) — küçük client bileşen ("island").
 *
 * Hidrasyon uyumu: ilk değer SUNUCUNUN hesapladığı `initial` prop'udur; client aynı değerle
 * başlar -> sunucu HTML'i ile ilk client render'ı birebir aynı (hydration uyarısı yok).
 * Sonra dakikada bir `isOpenAt(hours, new Date())` yeniden hesaplanır: sayfa açık kalırsa
 * (ör. 18:59 -> 19:00 kapanış) durum kendiliğinden güncellenir. setState interval GERİ
 * ÇAĞRISINDA (dış saat) — effect gövdesinde değil. Temizlik: unmount'ta clearInterval.
 *
 * Neden sunucuda tek seferlik değil? Detay yanıtı backend'de 10 dk önbellekte; "şu an"
 * sunucuda hesaplansaydı bayatlardı (research R18). Hesap Europe/Istanbul'a göre (lib).
 * Anlam yalnız renkle verilmez: metin + ikon.
 */
import {useEffect, useState} from "react";
import {isOpenAt, type Hours} from "@/lib/openingHours";
import {CheckCircle, Clock} from "@/components/icons";

export default function OpenNowStatus({hours, initial}: { hours: Hours; initial: boolean | null }) {
    const [open, setOpen] = useState(initial);

    useEffect(() => {
        const t = setInterval(() => setOpen(isOpenAt(hours, new Date())), 60_000);
        return () => clearInterval(t);
    }, [hours]);

    if (open === null) return null;
    return (
        <p className="open-now" data-open={open}>
            {open ? <CheckCircle size="sm"/> : <Clock size="sm"/>}
            <span>{open ? "Şu an açık" : "Şu an kapalı"}</span>
        </p>
    );
}
