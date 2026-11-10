"use client";

/*
 * ONAY BUTONU — iki aşamalı yıkıcı işlem butonu.
 *
 * window.confirm() yerine INLINE onay: buton tıklanınca "Emin misiniz? [Evet] [Vazgeç]"
 * satır içi belirir. Neden? confirm() tarayıcı diyaloğu blur'lu/çirkin ve mobilde kötü;
 * inline onay hem tasarımımıza uyar hem yanlışlıkla silmeyi (double-tap) engeller.
 *
 * Silme sebebi opsiyonel prompt ile alınır (moderation_logs'a yazılır).
 *
 * 002: satır içi stil -> .confirm-inline; "Emin misin?" metni caption + muted.
 * Onay moduna geçince odak "Evet"e verilmez (yanlışlıkla Enter'la silmeyi önlemek için
 * kullanıcı bilinçli olarak Tab'lar) — davranış 001 ile aynı.
 *
 * 003: `srLabel` — listede satır satır tekrarlanan düğmeler ("Geri çek", "Geri al") ekran
 * okuyucunun düğme listesinde hep aynı adla görünür; hangi kayda ait oldukları anlaşılmaz.
 * `srLabel` verilirse görünür metnin ardına `.sr-only` ": {srLabel}" eklenir (ör. "Geri çek:
 * Usta Oto"). Diğer satır düğmeleriyle ("İncele: …") aynı kalıp — aria-label değil, görünür
 * metnin DEVAMI (sesli komutla "Geri çek" demek yine çalışır: WCAG 2.5.3 etiket-ad uyumu).
 */

import {useState} from "react";

export default function ConfirmButton({
                                          label,
                                          confirmLabel = "Emin misin?",
                                          onConfirm,
                                          askReason = false,
                                          className = "btn btn-danger btn-sm",
                                          srLabel,
                                      }: {
    label: string;
    confirmLabel?: string;
    onConfirm: (reason?: string) => Promise<void> | void;
    askReason?: boolean;
    className?: string;
    /** Ekran okuyucu için kayıt adı (görünmez ": {srLabel}" devamı). */
    srLabel?: string;
}) {
    const [armed, setArmed] = useState(false);
    const [busy, setBusy] = useState(false);

    async function run() {
        setBusy(true);
        try {
            const reason = askReason ? (window.prompt("Sebep (opsiyonel):") ?? undefined) : undefined;
            await onConfirm(reason);
        } finally {
            setBusy(false);
            setArmed(false);
        }
    }

    if (!armed) {
        return (
            <button type="button" className={className} onClick={() => setArmed(true)}>
                {label}{srLabel && <span className="sr-only">: {srLabel}</span>}
            </button>
        );
    }

    return (
        <span className="confirm-inline">
            <span className="caption muted">{confirmLabel}</span>
            <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={run}>
                {busy ? "…" : "Evet"}{srLabel && <span className="sr-only">, {label}: {srLabel}</span>}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setArmed(false)}>
                Vazgeç{srLabel && <span className="sr-only">: {srLabel}</span>}
            </button>
        </span>
    );
}
