/*
 * SAYFA BAŞLIĞI — ortak kalıp (research D5, FR-009). Server Component.
 *
 * Tüm liste sayfaları (ustalar, markalar, yakınımdakiler, sohbet odaları, admin) başlığı
 * TEK biçimde gösterir: (isteğe bağlı küçük üst etiket) + başlık + kısa açıklama + eylemler.
 *
 * Öğrenme notları:
 *  - Props tipindeki `?` (subtitle?: ...) "verilmeyebilir" demek; JSX'te `{subtitle && ...}`
 *    ile yalnızca varsa çizilir (koşullu render).
 *  - `actions` bir ReactNode: çağıran taraf buton, chip, bağlantı... ne isterse verir
 *    ("slot" kalıbı — bileşen içeriği bilmez, yalnızca YERİNİ belirler).
 *  - Başlık h1 + .title kademesi (28 -> 40 px); açıklama .prose ile ≤ 62ch (FR-002).
 *  - `eyebrow` sözleşmeye (D5) eklenen tek isteğe bağlı alan: mevcut sayfalardaki
 *    "Keşfet / Markalar / Topluluk" gibi üst etiketler metin değişmeden korunur.
 */
import type {ReactNode} from "react";

type Props = {
    title: ReactNode;
    subtitle?: ReactNode;
    actions?: ReactNode;
    eyebrow?: ReactNode;
};

export default function PageHeader({title, subtitle, actions, eyebrow}: Props) {
    return (
        <header className="page-header">
            <div className="page-header-text">
                {eyebrow && <span className="eyebrow">{eyebrow}</span>}
                <h1 className="title">{title}</h1>
                {subtitle && <p className="page-header-sub prose">{subtitle}</p>}
            </div>
            {actions && <div className="page-header-actions">{actions}</div>}
        </header>
    );
}
