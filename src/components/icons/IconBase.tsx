/*
 * İKON TABANI — tüm çizgi ikonların ortak <svg> kabı (research D4).
 *
 * Öğrenme notları:
 *  - Bu bir SERVER component'tır: hook yok, olay yok -> "use client" GEREKMEZ. Yine de
 *    client bileşenlerinden (Header, RateForm...) import edilebilir; o zaman client
 *    paketine girer. Yalnızca import edilen ikonlar pakete girer (ağaç sallama / tree-shaking).
 *  - Renk: stroke="currentColor" -> ikon, içinde bulunduğu metnin rengini alır
 *    (buton rengi değişince ikon da değişir; ham renk yazılmaz).
 *  - Boyut: CSS sınıfı .icon / .icon-sm / .icon-lg (globals.css) — değerler belirteçten
 *    (--icon-sm/md/lg). width/height özniteliği vermiyoruz; boyut tek kaynaktan gelir.
 *  - Erişilebilirlik: `title` verilmezse ikon DEKORATİFTİR -> aria-hidden (ekran okuyucu
 *    atlar; yanındaki metin zaten anlamı taşır). `title` verilirse anlamlıdır ->
 *    role="img" + <title> (erişilebilir ad).
 *  - focusable="false": eski Edge/IE'de SVG'nin Tab sırasına girmesini engeller.
 */
import type {ReactNode} from "react";

export type IconSize = "sm" | "md" | "lg";

export type IconProps = {
    /** sm = 16 px, md = 20 px (varsayılan), lg = 24 px — belirteç: --icon-* */
    size?: IconSize;
    /** Verilirse ikon anlamlı sayılır (role="img" + <title>); verilmezse dekoratif (aria-hidden). */
    title?: string;
    className?: string;
};

export default function IconBase({size = "md", title, className, children}: IconProps & { children: ReactNode }) {
    // Koşullu öznitelik nesnesi: spread (...) ile <svg>'ye yayılır.
    const a11y = title ? {role: "img"} : {"aria-hidden": true as const};
    const cls = ["icon", size !== "md" ? `icon-${size}` : "", className ?? ""].filter(Boolean).join(" ");
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            focusable="false"
            className={cls}
            {...a11y}
        >
            {title && <title>{title}</title>}
            {children}
        </svg>
    );
}
