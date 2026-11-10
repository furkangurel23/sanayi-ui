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
 */
import type {ReactNode} from "react";

type Props = {
    icon: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
    compact?: boolean;
    role?: "status" | "alert";
};

export default function EmptyState({icon, title, description, action, compact, role}: Props) {
    return (
        <div className={`empty-state${compact ? " empty-state-compact" : ""}`} role={role}>
            <span className="empty-state-icon">{icon}</span>
            <p className="empty-state-title">{title}</p>
            {description && <p className="empty-state-desc">{description}</p>}
            {action && <div className="empty-state-action">{action}</div>}
        </div>
    );
}
