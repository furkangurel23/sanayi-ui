"use client";

/*
 * "BU DÜKKAN BENİM" — SAHİPLENME TALEBİ FORMU (003 / T113).
 *
 * Akış:
 *  1) ÖN KONTROL: `GET /api/claims/mine?status=PENDING` + `GET /api/owner/providers` — bu
 *     dükkan için incelemede talebiniz varsa ya da zaten sahibiyseniz kullanıcı formu hiç
 *     doldurmasın: kontrol SAYFA AÇILIŞINDA yapılır (useAuthedData) ve form yerine durum kartı
 *     çizilir ("Dükkanı düzenle" / "Taleplerim"). Gönderimde AYNI kontrol bir kez daha yapılır
 *     (sayfa açıkken başka sekmede talep gönderilmiş olabilir) -> 30 MB'a kadar dosya boşuna
 *     yüklenmez. Kesin karar yine backend'in 409'udur.
 *  2) İstemci kontrolleri (`lib/limits.ts` — backend sınırlarının aynası): 1–3 belge, her biri
 *     ≤10 MB, uzantı JPG/PNG/PDF; ad-soyad, telefon, açıklama (≤500, sayaçlı) zorunlu; aydınlatma
 *     metni onay kutusu VARSAYILAN İŞARETSİZ ve işaretlenmeden gönderilmez. Kesin denetim backend'de
 *     (dosya türü uzantıdan değil İÇERİKTEN koklanır).
 *  3) Yükleme `XMLHttpRequest` (lib/accountApi.submitClaim): belirli ilerleme çubuğu (yerel
 *     <progress> = role="progressbar") + "İptal" (`abort()`).
 *  4) Hata eşleme (backend kodu -> kısa Türkçe metin; sözleşme ui-sanayi-ui.md): 413, 415, 400
 *     (alan hataları alanların altında; belge sayısı / görsel çok büyük), 409 (incelemede talep /
 *     zaten sahip), 429 (24 saatte 3), KVKK sürüm uyuşmazlığı ("sayfayı yenileyin").
 *  5) Başarı: `kind=DISPUTE` -> "itiraz olarak incelemeye alındı" (dükkanın sahibi ya da
 *     bekleyen başka talebi var); aksi "incelemeye alındı".
 */
import {type FormEvent, useEffect, useId, useRef, useState} from "react";
import Link from "next/link";
import type {Claim} from "@/lib/types";
import {ensureFreshToken} from "@/lib/auth";
import {useAuthedData} from "@/lib/useAuthedData";
import {ApiError, errorMessage} from "@/lib/apiError";
import {myClaims, ownerProviders, submitClaim} from "@/lib/accountApi";
import {
    CLAIM_FILE_ACCEPT, MAX_CLAIM_FILE_BYTES, MAX_CLAIM_FILE_MB, MAX_CLAIM_FILES, MAX_CLAIM_IMAGE_MEGAPIXELS, MAX_CLAIM_REQUEST_MB, MAX_NOTE_LENGTH,
} from "@/lib/limits";
import {CLAIM_PRIVACY_VERSION} from "@/lib/legal";
import {CLAIM_PRIVACY_SUMMARY} from "@/content/claim-privacy-2026-11-10";
import {CheckCircle, Clock, File as FileIcon, Upload} from "@/components/icons";

const ALLOWED_EXT = CLAIM_FILE_ACCEPT.split(",");
const MB = 1024 * 1024;

function formatSize(bytes: number): string {
    return bytes >= MB ? `${(bytes / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Backend hatasını kısa Türkçe metne + alan hatalarına çevirir (koda göre — metne değil). */
function mapClaimError(e: unknown): { alert: string; fields: Record<string, string> } {
    if (!(e instanceof ApiError)) return {alert: errorMessage(e, "Talep gönderilemedi."), fields: {}};
    const fe = e.fieldErrors ?? {};
    if (fe.kvkkVersion || e.code === "error.claim.kvkk-version-mismatch") {
        return {alert: "Aydınlatma metni güncellendi; sayfayı yenileyip metni yeniden onaylayın.", fields: {}};
    }
    switch (e.code) {
        case "error.upload.too-large":
            // 413 iki yerden gelir: dosya başı sınır (10 MB) ya da isteğin tamamı (31 MB, gövde hiç
            // ayrıştırılmadan). Backend metni aşılan sınırı sayıyla söyler -> alan altında o gösterilir.
            return {
                alert: `Belgeler çok büyük: her biri en fazla ${MAX_CLAIM_FILE_MB} MB, toplamı en fazla ${MAX_CLAIM_REQUEST_MB} MB olabilir.`,
                fields: {files: e.message},
            };
        case "error.claim.document-type":
            return {alert: `Yalnız JPG, PNG veya PDF yükleyebilirsiniz. ${e.message}`, fields: {files: e.message}};
        case "error.claim.document-corrupt":
            return {alert: e.message, fields: {files: e.message}};
        case "error.claim.document-count":
            return {alert: "En fazla 3 belge yükleyebilirsiniz.", fields: {files: e.message}};
        case "error.claim.image-too-large":
            return {alert: `Görsel çok büyük (en fazla ${MAX_CLAIM_IMAGE_MEGAPIXELS} megapiksel). Daha küçük bir görsel seçin.`, fields: {files: e.message}};
        case "error.claim.already-pending":
            return {alert: "Bu dükkan için incelemede bir talebiniz var.", fields: {}};
        case "error.claim.already-owner":
            return {alert: "Bu dükkanın sahibi zaten sizsiniz.", fields: {}};
        case "error.claim.rate-limited":
            return {alert: "24 saatte en fazla 3 sahiplenme talebi gönderebilirsiniz.", fields: {}};
    }
    const fields = Object.fromEntries(Object.entries(fe).filter(([, m]) => m.length > 0).map(([k, m]) => [k, m[0]]));
    return {
        alert: Object.keys(fields).length > 0 ? "Formda düzeltilmesi gereken alanlar var." : e.message,
        fields,
    };
}

type Props = { providerId: number; providerName: string };

export default function ClaimForm({providerId, providerName}: Props) {
    const id = useId();
    const [files, setFiles] = useState<File[]>([]);
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [description, setDescription] = useState("");
    const [accepted, setAccepted] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [alert, setAlert] = useState<string | null>(null);
    const [progress, setProgress] = useState<number | null>(null);
    const [result, setResult] = useState<Claim | null>(null);
    const abortRef = useRef<(() => void) | null>(null);
    // "İptal" ön kontrol sırasında (XHR henüz başlamadan) da basılabilir: istek bayrağı
    const cancelRef = useRef(false);
    const fileInput = useRef<HTMLInputElement>(null);
    const alertRef = useRef<HTMLDivElement>(null);
    const [alertSeq, setAlertSeq] = useState(0);

    // Açılış ön kontrolü (bkz. dosya başı, adım 1). Hata (ör. ağ) formu ENGELLEMEZ: kontrol
    // gönderimde tekrarlanır, backend de 409 döner. `owner`/`pending` gelene kadar form görünür.
    const precheck = useAuthedData(`claim-precheck:${providerId}`, async token => {
        const [mine, owned] = await Promise.all([myClaims(token, 1, 200, "PENDING"), ownerProviders(token)]);
        return {
            owner: owned.some(o => o.providerId === providerId),
            pending: mine.content.some(c => c.provider.id === providerId && c.status === "PENDING"),
        };
    });

    // Yeni uyarı DOM'a girdikten sonra odağı ona taşı (klavye/ekran okuyucu hemen duyar).
    useEffect(() => {
        if (alertSeq > 0) alertRef.current?.focus();
    }, [alertSeq]);

    // Sayfadan ayrılınca (bileşen kalkınca) süren isteği iptal et: aksi halde XHR arka planda
    // tamamlanır ve kullanıcı vazgeçtiğini sanırken talep OLUŞUR. `cancelRef` ön kontrol
    // aşamasını (XHR henüz yokken) da durdurur. Boş bağımlılık dizisi = temizlik yalnız unmount'ta.
    // (Ref'ler DOM'a bağlı değil, değerleri bilerek "o anki" haliyle okunur.)
    useEffect(() => () => {
        cancelRef.current = true;
        abortRef.current?.();
    }, []);

    // Yükleme sürerken sekme kapatma / yenileme / adres çubuğuyla ayrılma: tarayıcının kendi
    // "Siteden ayrılınsın mı?" uyarısı (metni tarayıcı belirler; `preventDefault` yeterli).
    const busySending = progress !== null;
    useEffect(() => {
        if (!busySending) return;
        const warn = (e: BeforeUnloadEvent) => e.preventDefault();
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [busySending]);

    const showAlert = (text: string) => {
        setAlert(text);
        setAlertSeq(n => n + 1);
    };
    const errId = (k: string) => `${id}-${k}-err`;
    const a11y = (k: string) => ({
        "aria-invalid": errors[k] ? true : undefined,
        "aria-describedby": errors[k] ? errId(k) : undefined,
    });
    const clearError = (k: string) => errors[k] && setErrors(e => {
        const rest = {...e};
        delete rest[k];
        return rest;
    });

    function addFiles(list: FileList | null) {
        if (!list) return;
        const incoming = Array.from(list);
        const merged = [...files];
        for (const f of incoming) {
            if (!merged.some(m => m.name === f.name && m.size === f.size)) merged.push(f);
        }
        if (merged.length > MAX_CLAIM_FILES) {
            setErrors(e => ({...e, files: `En fazla ${MAX_CLAIM_FILES} belge yükleyebilirsiniz; fazlası eklenmedi.`}));
        } else {
            clearError("files");
        }
        setFiles(merged.slice(0, MAX_CLAIM_FILES));
        // Aynı dosyanın yeniden seçilebilmesi için girdiyi boşalt
        if (fileInput.current) fileInput.current.value = "";
    }

    function validate(): Record<string, string> {
        const e: Record<string, string> = {};
        if (files.length === 0) e.files = "En az bir belge ekleyin (vergi levhası, oda kaydı, kira sözleşmesi…).";
        const big = files.find(f => f.size > MAX_CLAIM_FILE_BYTES);
        const badType = files.find(f => !ALLOWED_EXT.some(ext => f.name.toLowerCase().endsWith(ext)));
        if (big) e.files = `Dosya 10 MB'tan büyük: ${big.name}`;
        else if (badType) e.files = `Yalnız JPG, PNG veya PDF yükleyebilirsiniz: ${badType.name}`;
        if (!fullName.trim()) e.fullName = "Adınızı ve soyadınızı girin.";
        else if (fullName.trim().length > 100) e.fullName = "En fazla 100 karakter.";
        if (!phone.trim()) e.phone = "Size ulaşabileceğimiz bir telefon numarası girin.";
        if (!description.trim()) e.description = "Dükkanla ilişkinizi kısaca anlatın.";
        if (!accepted) e.kvkkAccepted = "Devam etmek için aydınlatma metnini onaylayın.";
        return e;
    }

    async function submit(ev: FormEvent) {
        ev.preventDefault();
        const local = validate();
        setErrors(local);
        if (Object.keys(local).length > 0) {
            showAlert("Formda düzeltilmesi gereken alanlar var.");
            return;
        }
        setAlert(null);
        setProgress(0);
        cancelRef.current = false;
        const aborted = () => new ApiError(0, "error.upload.aborted", "Yükleme iptal edildi.");
        try {
            const token = await ensureFreshToken();
            if (!token) throw new ApiError(401, "error.auth.unauthorized", "Oturumunuzun süresi doldu. Yeniden giriş yapın.");

            // 1) Ön kontrol — dosyalar yüklenmeden (gereksiz yükleme yok). Yalnız BEKLEYEN talepler
            //    sunucuda süzülerek istenir (`status=PENDING`): eski/kapanmış talepler sayfayı doldurmaz.
            const [mine, owned] = await Promise.all([myClaims(token, 1, 200, "PENDING"), ownerProviders(token)]);
            if (owned.some(o => o.providerId === providerId)) {
                setProgress(null);
                showAlert("Bu dükkanın sahibi zaten sizsiniz.");
                return;
            }
            if (mine.content.some(c => c.provider.id === providerId && c.status === "PENDING")) {
                setProgress(null);
                showAlert("Bu dükkan için incelemede bir talebiniz var. Durumunu Taleplerim sayfasından izleyebilirsiniz.");
                return;
            }

            if (cancelRef.current) throw aborted();

            // 2) Yükleme (ilerlemeli, iptal edilebilir)
            const req = submitClaim(token, providerId, {
                fullName: fullName.trim(), phone: phone.trim(), description: description.trim(),
                kvkkVersion: CLAIM_PRIVACY_VERSION, kvkkAccepted: accepted,
            }, files, f => setProgress(Math.round(f * 100)));
            abortRef.current = req.abort;
            const created = await req.promise;
            setResult(created);
        } catch (e) {
            if (e instanceof ApiError && e.code === "error.upload.aborted") {
                showAlert("Yükleme iptal edildi. Hazır olduğunuzda yeniden gönderebilirsiniz.");
            } else {
                const mapped = mapClaimError(e);
                setErrors(mapped.fields);
                showAlert(mapped.alert);
            }
        } finally {
            abortRef.current = null;
            setProgress(null);
        }
    }

    if (result) {
        const dispute = result.kind === "DISPUTE";
        return (
            <div className="card form-card stack" role="status">
                <span className="status-icon" data-tone="pos"><CheckCircle size="lg"/></span>
                <h2 className="headline">
                    {dispute ? "Talebiniz itiraz olarak incelemeye alındı" : "Talebiniz incelemeye alındı"}
                </h2>
                <p className="muted">
                    {dispute
                        ? "Bu dükkanın onaylı bir sahibi ya da incelemede başka bir talebi var. Yönetici belgeleri karşılaştırıp karar verecek."
                        : "Yönetici belgelerinizi inceleyip karar verince e-posta alacaksınız."}
                </p>
                <div className="form-actions">
                    <Link href="/account/claims" className="btn btn-primary">Taleplerim</Link>
                    <Link href={`/providers/${providerId}`} className="btn btn-outline">Dükkan sayfasına dön</Link>
                </div>
            </div>
        );
    }

    // Sahip ya da bekleyen talep varsa form yerine durum kartı — dosya seçmeye bile gerek yok.
    if (precheck.data?.owner || precheck.data?.pending) {
        const owner = precheck.data.owner;
        return (
            <div className="card form-card stack" role="status">
                <span className="status-icon" data-tone={owner ? "pos" : "neutral"}>
                    {owner ? <CheckCircle size="lg"/> : <Clock size="lg"/>}
                </span>
                <h2 className="headline">
                    {owner ? "Bu dükkanın sahibi zaten sizsiniz" : "Bu dükkan için incelemede bir talebiniz var"}
                </h2>
                <p className="muted">
                    {owner
                        ? "Dükkan bilgilerini ve çalışma saatlerini düzenleme sayfasından güncelleyebilirsiniz."
                        : "Yönetici karar verince e-posta alacaksınız. Durumunu Taleplerim sayfasından izleyebilirsiniz."}
                </p>
                <div className="form-actions">
                    {owner
                        ? <Link href={`/account/providers/${providerId}/edit`} className="btn btn-primary">Dükkanı düzenle</Link>
                        : <Link href="/account/claims" className="btn btn-primary">Taleplerim</Link>}
                    <Link href={`/providers/${providerId}`} className="btn btn-outline">Dükkan sayfasına dön</Link>
                </div>
            </div>
        );
    }

    const uploading = progress !== null;

    return (
        <form className="card form-card stack" onSubmit={submit} noValidate>
            {alert && <div ref={alertRef} tabIndex={-1} className="alert alert-error" role="alert">{alert}</div>}

            {/* Formdaki her alan zorunlu: tek tek yıldız yerine baştan söylenir (gönderince
                sürprize dönmesin); ekran okuyucular için alanlarda ayrıca aria-required var. */}
            <p className="caption muted">Tüm alanlar zorunludur.</p>

            <fieldset className="field form-fieldset">
                <legend className="field-label">Sahipliği gösteren belgeler</legend>
                <p id={`${id}-files-hint`} className="field-hint">
                    Vergi levhası, oda/esnaf kaydı ya da kira sözleşmesi. JPG, PNG veya PDF; en fazla {MAX_CLAIM_FILES} dosya,
                    her biri en çok 10 MB. Belgeleri yalnız yöneticiler görür.
                </p>
                <label className="btn btn-outline file-pick">
                    <Upload size="sm"/> Dosya seç
                    <input ref={fileInput} type="file" multiple accept={CLAIM_FILE_ACCEPT} className="sr-only"
                           disabled={uploading || files.length >= MAX_CLAIM_FILES}
                           aria-describedby={`${id}-files-hint${errors.files ? ` ${errId("files")}` : ""}`}
                           onChange={e => addFiles(e.target.files)}/>
                </label>
                {files.length > 0 && (
                    <ul className="file-list">
                        {files.map((f, i) => (
                            <li key={`${f.name}-${f.size}`} className="file-item">
                                <FileIcon size="sm"/>
                                <span className="file-name">{f.name}</span>
                                <span className="caption muted">{formatSize(f.size)}</span>
                                <button type="button" className="btn btn-ghost btn-sm" disabled={uploading}
                                        onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                                    Kaldır<span className="sr-only">: {f.name}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                {errors.files && <span id={errId("files")} className="field-error">{errors.files}</span>}
            </fieldset>

            <div className="field">
                <label htmlFor={`${id}-fullName`} className="field-label">Ad soyad</label>
                <input id={`${id}-fullName`} className="input" aria-required="true" value={fullName} maxLength={100} autoComplete="name"
                       onChange={e => {
                           setFullName(e.target.value);
                           clearError("fullName");
                       }} {...a11y("fullName")}/>
                {errors.fullName && <span id={errId("fullName")} className="field-error">{errors.fullName}</span>}
            </div>

            <div className="field">
                <label htmlFor={`${id}-phone`} className="field-label">Telefon</label>
                <input id={`${id}-phone`} className="input" aria-required="true" type="tel" inputMode="tel" value={phone} autoComplete="tel"
                       placeholder="0532 555 12 34"
                       onChange={e => {
                           setPhone(e.target.value);
                           clearError("phone");
                       }} {...a11y("phone")}/>
                {errors.phone && <span id={errId("phone")} className="field-error">{errors.phone}</span>}
            </div>

            <div className="field">
                <label htmlFor={`${id}-description`} className="field-label">Açıklama</label>
                <textarea id={`${id}-description`} className="textarea" aria-required="true" rows={4} value={description}
                          maxLength={MAX_NOTE_LENGTH}
                          placeholder="Ör. Dükkanı 15 yıldır işletiyorum; vergi levhası ektedir."
                          onChange={e => {
                              setDescription(e.target.value);
                              clearError("description");
                          }} {...a11y("description")}/>
                <span className="field-hint">Dükkanla ilişkinizi kısaca anlatın · {description.length}/{MAX_NOTE_LENGTH}</span>
                {errors.description && <span id={errId("description")} className="field-error">{errors.description}</span>}
            </div>

            <div className="stack-sm kvkk-box">
                <p className="callout">
                    Kişisel verileriniz{" "}
                    <Link href="/legal/claim-privacy" target="_blank" rel="noopener" className="link-accent">
                        aydınlatma metnine<span className="sr-only"> (yeni sekmede açılır)</span>
                    </Link>{" "}
                    göre işlenir (sürüm {CLAIM_PRIVACY_VERSION}).
                </p>
                <details className="kvkk-summary">
                    <summary>Kısa özet</summary>
                    <ul className="legal-list">
                        {CLAIM_PRIVACY_SUMMARY.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                </details>
                <label className="checkbox checkbox-top">
                    <input type="checkbox" checked={accepted}
                           onChange={e => {
                               setAccepted(e.target.checked);
                               clearError("kvkkAccepted");
                           }} {...a11y("kvkkAccepted")}/>
                    <span>Aydınlatma metnini okudum; bilgilerimin ve belgelerimin bu talebin değerlendirilmesi için işlenmesini kabul ediyorum.</span>
                </label>
                {errors.kvkkAccepted && <span id={errId("kvkkAccepted")} className="field-error">{errors.kvkkAccepted}</span>}
            </div>

            {uploading && (
                <div className="stack-sm upload-progress">
                    <label htmlFor={`${id}-progress`} className="caption muted">
                        Belgeler yükleniyor: %{progress}
                    </label>
                    <progress id={`${id}-progress`} className="progress" max={100} value={progress ?? 0}/>
                </div>
            )}

            <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-lg" disabled={uploading}>
                    {uploading ? "Gönderiliyor…" : "Talebi gönder"}
                </button>
                {uploading && (
                    <button type="button" className="btn btn-outline" onClick={() => {
                        cancelRef.current = true;
                        abortRef.current?.();
                    }}>İptal</button>
                )}
            </div>
            <p className="caption muted">Talep: {providerName}</p>
        </form>
    );
}
