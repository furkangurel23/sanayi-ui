"use client";

/*
 * ONAY BUTONU — iki aşamalı yıkıcı işlem butonu.
 *
 * window.confirm() yerine INLINE onay: buton tıklanınca "Emin misiniz? [Evet] [Vazgeç]"
 * satır içi belirir. Neden? confirm() tarayıcı diyaloğu blur'lu/çirkin ve mobilde kötü;
 * inline onay hem tasarımımıza uyar hem yanlışlıkla silmeyi (double-tap) engeller.
 *
 * Silme sebebi opsiyonel prompt ile alınır (moderation_logs'a yazılır).
 */

import {useState} from "react";

export default function ConfirmButton({
                                          label,
                                          confirmLabel = "Emin misin?",
                                          onConfirm,
                                          askReason = false,
                                          className = "btn btn-danger btn-sm",
                                      }: {
    label: string;
    confirmLabel?: string;
    onConfirm: (reason?: string) => Promise<void> | void;
    askReason?: boolean;
    className?: string;
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
                {label}
            </button>
        );
    }

    return (
        <span className="row" style={{gap: "0.35rem"}}>
            <span className="text-xs muted">{confirmLabel}</span>
            <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={run}>
                {busy ? "…" : "Evet"}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setArmed(false)}>
                Vazgeç
            </button>
        </span>
    );
}
