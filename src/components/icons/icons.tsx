/*
 * ÇİZGİ İKON SETİ — elle yazılmış SVG'ler (paket yok — anayasa IV, FR-006/FR-020).
 *
 * Kurallar (research D4): 24×24 viewBox, stroke="currentColor", stroke-width 1.75,
 * yuvarlak uç/birleşim (IconBase'te). Her ikon küçük bir server component:
 *   <Search/>              -> dekoratif (aria-hidden)
 *   <Alert title="Uyarı"/> -> anlamlı (role="img" + <title>)
 *   <Check size="sm"/>     -> 16 px
 * Emoji ikonlar (uyarı, kilit, posta, kum saati, onay, konum) ve metin okları/çarpı işareti
 * yerine bunlar kullanılır (FR-006; tarama komutu tasks.md T034'te).
 */
import IconBase, {type IconProps} from "./IconBase";

export const Alert = (p: IconProps) => (
    <IconBase {...p}><path d="M12 3.5 2.5 20h19L12 3.5Z"/><path d="M12 10v4.5"/><path d="M12 17.5h.01"/></IconBase>
);
export const Lock = (p: IconProps) => (
    <IconBase {...p}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></IconBase>
);
export const Mail = (p: IconProps) => (
    <IconBase {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/></IconBase>
);
export const Shield = (p: IconProps) => (
    <IconBase {...p}><path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6L12 3Z"/></IconBase>
);
export const Pin = (p: IconProps) => (
    <IconBase {...p}><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.5"/></IconBase>
);
export const Clock = (p: IconProps) => (
    <IconBase {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></IconBase>
);
export const CheckCircle = (p: IconProps) => (
    <IconBase {...p}><circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.75 2.75L16 10"/></IconBase>
);
export const Check = (p: IconProps) => (
    <IconBase {...p}><path d="m5 12.5 4.5 4.5L19 7.5"/></IconBase>
);
export const Sun = (p: IconProps) => (
    <IconBase {...p}>
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>
    </IconBase>
);
export const Moon = (p: IconProps) => (
    <IconBase {...p}><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z"/></IconBase>
);
export const Menu = (p: IconProps) => (
    <IconBase {...p}><path d="M4 7h16M4 12h16M4 17h16"/></IconBase>
);
export const Close = (p: IconProps) => (
    <IconBase {...p}><path d="M6 6l12 12M18 6 6 18"/></IconBase>
);
export const ChevronLeft = (p: IconProps) => (
    <IconBase {...p}><path d="m15 5-7 7 7 7"/></IconBase>
);
export const ChevronRight = (p: IconProps) => (
    <IconBase {...p}><path d="m9 5 7 7-7 7"/></IconBase>
);
export const ChevronDown = (p: IconProps) => (
    <IconBase {...p}><path d="m5 9 7 7 7-7"/></IconBase>
);
export const ArrowUp = (p: IconProps) => (
    <IconBase {...p}><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></IconBase>
);
export const ArrowDown = (p: IconProps) => (
    <IconBase {...p}><path d="M12 5v14M5.5 12.5 12 19l6.5-6.5"/></IconBase>
);
export const Search = (p: IconProps) => (
    <IconBase {...p}><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></IconBase>
);
export const Chat = (p: IconProps) => (
    <IconBase {...p}><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12Z"/></IconBase>
);
export const Plus = (p: IconProps) => (
    <IconBase {...p}><path d="M12 5v14M5 12h14"/></IconBase>
);
export const Minus = (p: IconProps) => (
    <IconBase {...p}><path d="M5 12h14"/></IconBase>
);
export const Upload = (p: IconProps) => (
    <IconBase {...p}><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></IconBase>
);
export const Image = (p: IconProps) => (
    <IconBase {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9.5" r="1.75"/><path d="m21 16-5-5-9 9"/></IconBase>
);
export const Video = (p: IconProps) => (
    <IconBase {...p}><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10.5 5-3v9l-5-3"/></IconBase>
);
export const WifiOff = (p: IconProps) => (
    <IconBase {...p}>
        <path d="M3 3l18 18"/>
        <path d="M8.5 16.5a5 5 0 0 1 7 0"/>
        <path d="M5 13a10 10 0 0 1 5.2-2.8M19 13a10 10 0 0 0-2.3-1.7"/>
        <path d="M2 9.5a15 15 0 0 1 4.3-2.8M22 9.5A15 15 0 0 0 11 5.6"/>
        <path d="M12 20h.01"/>
    </IconBase>
);
export const Star = (p: IconProps) => (
    <IconBase {...p}><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z"/></IconBase>
);
export const User = (p: IconProps) => (
    <IconBase {...p}><circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></IconBase>
);
/* Ataç — sohbet "ek ekle" düğmesi (002 yayılımında ChatRoom'daki satır içi SVG buraya taşındı) */
export const Paperclip = (p: IconProps) => (
    <IconBase {...p}><path d="m21.4 11.1-9.2 9.1a6 6 0 0 1-8.5-8.5l8.6-8.5a4 4 0 0 1 5.7 5.6l-8.6 8.6a2 2 0 0 1-2.8-2.8l8.5-8.5"/></IconBase>
);
/*
 * Navigasyon oku — "Yol tarifi" bağlantıları (002 rev 3 / US5, FR-023). Yol çizimi sabit
 * olarak da dışa açılır: ProvidersMap popup'ı JSX değil DOM API'siyle kurulduğu için
 * (XSS kuralı) aynı ikonu document.createElementNS ile çizer -> tek kaynak, iki kullanım.
 */
export const NAVIGATION_PATH = "M3.5 10.5 20.5 3.5l-7 17-2.25-7.75L3.5 10.5Z";
export const Navigation = (p: IconProps) => (
    <IconBase {...p}><path d={NAVIGATION_PATH}/></IconBase>
);
