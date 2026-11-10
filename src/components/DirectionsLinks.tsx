/*
 * YOL TARİFİ BAĞLANTILARI (002 rev 3 / US5, FR-023) — Server Component.
 *
 * "Arabadaki kullanıcı": ustayı buldu, tek dokunuşla telefonundaki harita uygulamasında
 * yol tarifini başlatır. URL'leri saf fonksiyon `directionsUrls` (src/lib/directions.ts)
 * üretir; bu bileşen yalnızca iki bağlantıyı çizer. Hedef yoksa (ne koordinat ne sokak
 * adresi) HİÇBİR ŞEY çizmez — `return null` React'te "boş çıktı" demektir.
 *
 * Öğrenme notları:
 *  - Hook/olay yok -> "use client" GEREKMEZ; HTML sunucuda hazır gelir, JS indirmez.
 *    (ProviderCard gibi server bileşenlerinin içinde de, footer prop'u olarak da çalışır.)
 *  - `target="_blank"` + `rel="noopener"`: bağlantı yeni sekmede/uygulamada açılır;
 *    noopener, açılan sayfanın `window.opener` ile bizim sekmemize dokunmasını engeller.
 *  - ERİŞİLEBİLİR AD: görünür metin "Google Haritalar"; ekran okuyucu için devamı .sr-only
 *    span'de (" ile <ad> için yol tarifi (yeni sekmede açılır)"). aria-label KULLANMIYORUZ:
 *    aria-label görünür metni EZER; sesli komutla "Google Haritalar'a dokun" diyen kullanıcı
 *    için erişilebilir adın görünür metinle BAŞLAMASI gerekir (WCAG 2.5.3 label-in-name).
 *  - Sıra: Google önce (Android'de Apple bağlantısı yalnız web açar — directions.ts notu).
 *  - variant: "buttons" (detay başlığı, 44 px .btn) | "compact" (kart altı, 36 px .btn-sm;
 *    görünmez ::after 44×44 vuruş alanı — .btn-sm kuralı, FR-013).
 */
import {directionsUrls, type DirectionsTarget} from "@/lib/directions";
import {Navigation} from "@/components/icons";

type Props = DirectionsTarget & { variant: "buttons" | "compact" };

export default function DirectionsLinks({variant, ...target}: Props) {
    const urls = directionsUrls(target);
    if (!urls) return null;

    const btn = variant === "compact" ? "btn btn-outline btn-sm" : "btn btn-outline";
    const links = [
        {href: urls.google, label: "Google Haritalar"},
        {href: urls.apple, label: "Apple Haritalar"},
    ];

    return (
        <div className={`directions directions-${variant}`}>
            {links.map(l => (
                <a key={l.label} className={btn} href={l.href} target="_blank" rel="noopener">
                    <Navigation size="sm"/>
                    {l.label}
                    <span className="sr-only"> ile {target.name} için yol tarifi (yeni sekmede açılır)</span>
                </a>
            ))}
        </div>
    );
}
