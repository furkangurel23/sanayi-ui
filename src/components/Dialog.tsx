"use client";

/*
 * DIALOG — ortak modal kalıbı (research D5, FR-010). Client Component.
 *
 * Neden client? Klavye (Escape, Tab) dinleyicileri ve odak yönetimi tarayıcı ister.
 *
 * Davranış sözleşmesi (FR-010 / WAI-ARIA "Dialog (Modal)"):
 *  - role="dialog" + aria-modal="true" + aria-labelledby (başlığın id'si) -> ekran okuyucu
 *    "X iletişim kutusu" diye duyurur ve arka planı okumaz.
 *  - AÇILINCA: panelin içindeki İLK odaklanabilir öğe odak alır.
 *  - Tab / Shift+Tab: odak panelin İÇİNDE döner (odak tuzağı — focus trap); sondan Tab
 *    ilk öğeye, baştan Shift+Tab son öğeye sarar.
 *  - Escape: kapatır (onClose). Perdeye (scrim) tıklamak da kapatır.
 *  - KAPANINCA: odak, dialog'u açan öğeye (tetikleyici) geri döner — klavye kullanıcısı
 *    sayfada kaldığı yeri kaybetmez.
 *  - AÇIKKEN arka plan KAYMAZ (T041): <html> öğesine overflow: hidden verilir; temizlikte
 *    ÖNCEKİ değer geri yazılır (boş string = stil yok). Aksi halde dialog içinde tekerlek/
 *    dokunma ile kaydırma sınıra gelince alttaki sayfa kayar ("scroll chaining").
 *    Neden <body> değil <html>? Sayfanın kaydırma kabı kök öğe (document.documentElement);
 *    body'de overflow bazı tarayıcılarda kökün kaydırmasını durdurmaz.
 *
 * Öğrenme notları:
 *  - useRef<HTMLDivElement>(null): DOM düğümüne "kalıcı kutu"; render'lar arasında değişmez.
 *  - useEffect(..., [open]): `open` değişince çalışır; dönen fonksiyon "temizlik"tir
 *    (dinleyici kaldırılır, odak iade edilir). Effect'in kurulduğu andaki
 *    document.activeElement = tetikleyici buton -> temizlikte ona odak veririz.
 *  - onCloseRef: onClose her render'da yeni fonksiyon olabilir; effect'i her seferinde
 *    yeniden kurmamak için en güncelini ref'te tutuyoruz ("latest ref" kalıbı).
 */
import {type ReactNode, useEffect, useRef} from "react";

type Props = {
    open: boolean;
    onClose: () => void;
    /** Dialog başlığını taşıyan öğenin id'si (aria-labelledby). */
    labelledBy: string;
    children: ReactNode;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Dialog({open, onClose, labelledBy, children}: Props) {
    const panelRef = useRef<HTMLDivElement>(null);
    const onCloseRef = useRef(onClose);

    // "latest ref": render sırasında değil, commit sonrası güncellenir (React kuralı).
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!open) return;
        const trigger = document.activeElement as HTMLElement | null;
        const panel = panelRef.current;
        const focusables = () => Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);

        // Arka plan kaydırma kilidi (bkz. dosya başı); eski değer temizlikte geri yazılır.
        const root = document.documentElement;
        const prevOverflow = root.style.overflow;
        root.style.overflow = "hidden";

        // Açılışta ilk odaklanabilir öğe (yoksa panelin kendisi — tabIndex=-1)
        (focusables()[0] ?? panel)?.focus();

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onCloseRef.current();
                return;
            }
            if (e.key !== "Tab") return;
            const list = focusables();
            if (list.length === 0) {
                e.preventDefault();
                return;
            }
            const first = list[0];
            const last = list[list.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("keydown", onKey);
            root.style.overflow = prevOverflow; // kaydırma kilidini kaldır
            trigger?.focus(); // odak tetikleyiciye döner
        };
    }, [open]);

    if (!open) return null;

    return (
        <div
            className="scrim"
            // Yalnızca perdenin KENDİSİNE tıklanınca kapat (panel içindeki tıklamalar değil)
            onMouseDown={e => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div ref={panelRef} className="dialog" role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}>
                {children}
            </div>
        </div>
    );
}
