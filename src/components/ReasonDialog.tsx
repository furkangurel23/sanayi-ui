"use client";

/*
 * GEREKÇE DİYALOĞU (003 / T097) — ortak `Dialog` üzerine kurulu; reddetme ve sahipliği geri
 * alma gibi GEREKÇESİ ZORUNLU kararlar için. `window.prompt` yerine (tarayıcı diyaloğu
 * erişilebilir değil, biçimlenemez, mobilde kötü).
 *
 * - Gerekçe boşsa gönderilmez (istemci kontrolü); backend de `@NotBlank` ile `fieldErrors.reason`
 *   döner — o da aynı yerde (alanın altında) gösterilir.
 * - 500 karakter sınırı sayaçla görünür.
 * - `onConfirm` hata fırlatırsa diyalog AÇIK kalır ve mesaj gösterilir; başarıda çağıran kapatır.
 */
import {type FormEvent, useId, useState} from "react";
import Dialog from "@/components/Dialog";
import {errorMessage, fieldErrorMap} from "@/lib/apiError";
import {MAX_NOTE_LENGTH} from "@/lib/limits";

type Props = {
    open: boolean;
    title: string;
    description?: string;
    confirmLabel: string;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    danger?: boolean;
};

export default function ReasonDialog({open, title, description, confirmLabel, onClose, onConfirm, danger = true}: Props) {
    const id = useId();
    const [reason, setReason] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    function close() {
        if (busy) return;
        setReason("");
        setError(null);
        onClose();
    }

    async function submit(e: FormEvent) {
        e.preventDefault();
        if (!reason.trim()) {
            setError("Gerekçe yazın.");
            return;
        }
        setBusy(true);
        setError(null);
        try {
            await onConfirm(reason.trim());
            setReason("");
        } catch (err) {
            setError(fieldErrorMap(err).reason ?? errorMessage(err, "İşlem başarısız."));
        } finally {
            setBusy(false);
        }
    }

    return (
        <Dialog open={open} onClose={close} labelledBy={`${id}-title`}>
            <form className="stack" onSubmit={submit} noValidate>
                <h2 id={`${id}-title`} className="headline">{title}</h2>
                {description && <p className="muted">{description}</p>}
                <div className="field">
                    <label htmlFor={`${id}-reason`} className="field-label">Gerekçe</label>
                    <textarea id={`${id}-reason`} className="textarea" rows={4} value={reason} maxLength={MAX_NOTE_LENGTH}
                              required aria-invalid={error ? true : undefined}
                              aria-describedby={`${id}-count${error ? ` ${id}-err` : ""}`}
                              onChange={e => setReason(e.target.value)}/>
                    <span id={`${id}-count`} className="field-hint">{reason.length}/{MAX_NOTE_LENGTH} — üyeye e-postayla iletilir.</span>
                    {error && <span id={`${id}-err`} className="field-error" role="alert">{error}</span>}
                </div>
                <div className="form-actions">
                    <button type="submit" className={`btn ${danger ? "btn-danger" : "btn-primary"}`} disabled={busy}>
                        {busy ? "Gönderiliyor…" : confirmLabel}
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={close} disabled={busy}>Vazgeç</button>
                </div>
            </form>
        </Dialog>
    );
}
