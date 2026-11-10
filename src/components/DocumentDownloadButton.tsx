"use client";

/*
 * BELGE İNDİR (003 / T116) — yalnız yönetici. Belge ucu Bearer belirteci ister; düz
 * <a href> başlık ekleyemez. Bu yüzden: fetch (Bearer) -> Blob -> `URL.createObjectURL`
 * ile geçici "blob:" adresi -> görünmez <a download> tıklanır -> tarayıcı dosyayı KAYDEDER
 * (sekmede açmaz; backend de `Content-Disposition: attachment` döner) -> `revokeObjectURL`
 * ile bellek bırakılır. Dosya adı sunucunun kuralıyla aynı biçimde üretilir
 * (`talep-<talep>-belge-<belge>.<uzantı>`) — kullanıcının yüklediği özgün ad dosya adına
 * GİRMEZ (yalnız ekranda metin olarak gösterilir).
 * Her indirme backend'de `moderation_logs` CLAIM_DOCUMENT_VIEW olarak kaydedilir.
 */
import {useState} from "react";
import type {ClaimDocumentMeta} from "@/lib/types";
import {ensureFreshToken} from "@/lib/auth";
import {downloadClaimDocument} from "@/lib/adminApi";
import {errorMessage} from "@/lib/apiError";
import {Download} from "@/components/icons";

const EXT: Record<string, string> = {"application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png"};

export default function DocumentDownloadButton({claimId, doc}: { claimId: number; doc: ClaimDocumentMeta }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const label = doc.originalName ?? `Belge ${doc.id}`;

    async function download() {
        setBusy(true);
        setError(null);
        try {
            const token = await ensureFreshToken();
            if (!token) throw new Error("Oturumunuzun süresi doldu. Yeniden giriş yapın.");
            const blob = await downloadClaimDocument(token, claimId, doc.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `talep-${claimId}-belge-${doc.id}.${EXT[doc.contentType] ?? "bin"}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            // Tarayıcı indirmeyi başlattıktan sonra geçici adresi bırak
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) {
            setError(errorMessage(e, "Belge indirilemedi."));
        } finally {
            setBusy(false);
        }
    }

    return (
        <span className="stack-sm">
            <button type="button" className="btn btn-outline btn-sm" onClick={download} disabled={busy || doc.deleted}>
                <Download size="sm"/> {busy ? "İndiriliyor…" : doc.deleted ? "Silindi" : "İndir"}
                <span className="sr-only">: {label}</span>
            </button>
            {error && <span className="field-error" role="alert">{error}</span>}
        </span>
    );
}
