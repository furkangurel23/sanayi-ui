/*
 * BOŞ DURUM — ortak kalıp (research D5, FR-009). Server Component.
 *
 * "Sonuç yok", "henüz yorum yok", "harita kapalı", 404/hata gibi durumların hepsi aynı
 * görünür: yuvarlak ikon karosu + kalın başlık + açıklama + isteğe bağlı eylem(ler).
 *
 * Öğrenme notları:
 *  - `icon` prop'u bir JSX ÖĞESİ alır (ör. <Search/>): bileşen fonksiyonu değil, hazır
 *    çizilmiş öğe. Böylece çağıran boyut/başlık gibi ikon ayarlarını kendisi verir.
 *  - İkon dekoratiftir (aria-hidden — IconBase); anlamı başlık metni taşır.
 *  - `compact`: sayfa içi küçük boş durumlar (ör. kapalı harita) için daha az iç boşluk.
 *  - `role` verilebilir: hata ekranında "alert", diğerlerinde gerekmez (ekran okuyucu
 *    sayfa yüklendiğinde metni zaten okur).
 *  - `titleAs` (T041): başlığın HTML etiketi. Varsayılan <p> (sayfa içi küçük durumlar
 *    sayfanın başlık hiyerarşisine karışmasın). Boş durum SAYFANIN KENDİSİ olduğunda
 *    (404, kilitli sohbet, yetkisiz admin) "h1" verilir -> ayrı bir sr-only <h1>
 *    kopyasına gerek kalmaz; görünüm .empty-state-title'dan gelir (etiketten bağımsız).
 *    Öğrenme notu: `const Title = titleAs` — JSX'te büyük harfle başlayan değişken
 *    bileşen/etiket olarak kullanılabilir (<Title>); "h1" gibi bir string de olur.
 *  - `live` (T041): başlık + açıklama bir aria-live="polite" bölgesine sarılır. Durumu
 *    değişen boş durumlarda (NearLocate: konum alınıyor -> reddedildi) ekran okuyucu
 *    YALNIZCA yeni durum metnini okur; eylem alanı (form/düğmeler) bölgenin dışında
 *    kalır, yazarken/tıklarken gereksiz duyuru olmaz.
 */
import type {ReactNode} from "react";

type Props = {
    icon: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
    compact?: boolean;
    role?: "status" | "alert";
    titleAs?: "h1" | "h2" | "p";
    live?: boolean;
};

export default function EmptyState({icon, title, description, action, compact, role, titleAs = "p", live}: Props) {
    const Title = titleAs;
    const text = <>
        <Title className="empty-state-title">{title}</Title>
        {description && <p className="empty-state-desc">{description}</p>}
    </>;
    return (
        <div className={`empty-state${compact ? " empty-state-compact" : ""}`} role={role}>
            <span className="empty-state-icon">{icon}</span>
            {live ? <div className="empty-state-live" aria-live="polite">{text}</div> : text}
            {action && <div className="empty-state-action">{action}</div>}
        </div>
    );
}
