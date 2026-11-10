"use client";

/*
 * DÜKKAN FORMU (003 / T096) — dört mod, tek bileşen:
 *   "suggest"        üye dükkan önerisi (not alanı var, saat yok; adres VEYA telefon zorunlu)
 *   "owner"          sahip düzenlemesi (saatler dahil; iyimser kilit + 409 akışı)
 *   "admin"          yönetici düzenlemesi (sahip ile aynı alanlar)
 *   "suggestApprove" yöneticinin öneriyi DÜZELTEREK onaylaması (öneri alanları + not)
 *
 * Kontrollü form: tüm alanlar tek `values` state'inde. Gönderimi ÇAĞIRAN yapar (`onSubmit`):
 * hangi uca, hangi `version` ile gideceğini bilen odur; form yalnız alanları, istemci ön
 * doğrulamasını ve hata gösterimini yönetir (tek sorumluluk).
 *
 * Hata gösterimi (proje standardı):
 *  - Alan hataları ALANIN ALTINDA; girdi `aria-invalid` + `aria-describedby` ile hataya bağlı.
 *    Anahtarlar backend `fieldErrors` ile aynı (name, district, location, categoryIds,
 *    openingHours.MONDAY[0] …) -> istemci ön kontrolü ve sunucu hatası AYNI yerde görünür.
 *  - Üstte özet uyarı (`role="alert"`, odak alır): klavye/ekran okuyucu kullanıcısı formun
 *    neden gitmediğini hemen duyar.
 *
 * 409 SÜRÜM ÇAKIŞMASI (iyimser kilit — research R5):
 *  Siz düzenlerken başka biri (ör. yönetici) kaydettiyse backend 409 döner. Taslağınız
 *  KAYBOLMAZ: `onConflict()` güncel değerleri (ve yeni sürümü) getirir; alanlara güncel
 *  değerler yazılır, sizin değerinizin farklı olduğu her alanın altında "Sizin değeriniz: …"
 *  ve "Benimkini kullan" düğmesi çıkar. Uyarı `role="alert"` ile duyurulur ve odak alır.
 *  Sonraki kayıt yeni sürümle gider -> artık 409 almaz.
 */
import {type FormEvent, type ReactNode, useEffect, useId, useRef, useState} from "react";
import type {IdName} from "@/lib/types";
import {ApiError, errorMessage, fieldErrorMap} from "@/lib/apiError";
import {DISTRICT_NAMES} from "@/lib/districts";
import {validateHours} from "@/lib/openingHours";
import {MAX_NOTE_LENGTH} from "@/lib/limits";
import {fieldDiffers, fieldLabel, formatFieldValue, type ProviderFormValues} from "@/lib/providerFields";
import ChipMultiSelect from "@/components/ChipMultiSelect";
import LocationPickerClient from "@/components/LocationPickerClient";
import OpeningHoursEditor from "@/components/OpeningHoursEditor";

export type ProviderFormMode = "suggest" | "owner" | "admin" | "suggestApprove";

type Props = {
    mode: ProviderFormMode;
    categories: IdName[];
    brands: IdName[];
    initial: ProviderFormValues;
    submitLabel: string;
    submittingLabel?: string;
    /** Gönderim; başarıda (isteğe bağlı) sunucunun normalleştirdiği değerleri döndürür. Hata = fırlatır. */
    onSubmit: (values: ProviderFormValues) => Promise<ProviderFormValues | void>;
    /** 409 sürüm çakışmasında güncel değerleri getirir (sahip/yönetici). */
    onConflict?: () => Promise<ProviderFormValues>;
    /** Ad veya onaylı konum değişince (öneri: olası tekrar kontrolü). */
    onIdentityChange?: (name: string, location: ProviderFormValues["location"]) => void;
    /** Gönder düğmesinin hemen üstüne yerleşen içerik (ör. "Bu dükkan zaten olabilir"). */
    beforeSubmit?: ReactNode;
    /** Gönder düğmesinin yanındaki ikincil eylem (ör. "Vazgeç"). */
    secondaryAction?: ReactNode;
    /** Başarı mesajı (sahip/yönetici kaydı sonrası ekranda kalır). */
    successText?: string;
};

const CONFLICT_CODES = new Set(["error.provider.version-conflict", "error.common.concurrent-modification"]);

export default function ProviderEditForm({
                                             mode, categories, brands, initial, submitLabel, submittingLabel = "Kaydediliyor…",
                                             onSubmit, onConflict, onIdentityChange, beforeSubmit, secondaryAction,
                                             successText = "Değişiklikler kaydedildi.",
                                         }: Props) {
    const id = useId();
    const [values, setValues] = useState<ProviderFormValues>(initial);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [alert, setAlert] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [conflictDraft, setConflictDraft] = useState<ProviderFormValues | null>(null);
    const alertRef = useRef<HTMLDivElement>(null);
    // Her yeni uyarıda artan sayaç: effect uyarı DOM'a girdikten SONRA odağı ona taşır.
    const [alertSeq, setAlertSeq] = useState(0);
    useEffect(() => {
        if (alertSeq > 0) alertRef.current?.focus();
    }, [alertSeq]);

    const isSuggest = mode === "suggest" || mode === "suggestApprove";
    const withHours = mode === "owner" || mode === "admin";
    const errId = (k: string) => `${id}-${k.replace(/[^a-zA-Z0-9]/g, "-")}-err`;

    function set<K extends keyof ProviderFormValues>(key: K, v: ProviderFormValues[K]) {
        const next = {...values, [key]: v};
        setValues(next);
        if ((key === "name" || key === "location") && onIdentityChange) onIdentityChange(next.name, next.location);
        setSuccess(null);
        // Kullanıcı alanı düzeltince o alanın hatasını kaldır (eski hata yanıltmasın)
        if (errors[key as string]) setErrors(e => {
            const rest = {...e};
            delete rest[key as string];
            return rest;
        });
    }

    /** İstemci ön doğrulaması — kesin karar backend'in; burada yalnız bariz eksikler. */
    function validate(v: ProviderFormValues): Record<string, string> {
        const e: Record<string, string> = {};
        if (!v.name.trim()) e.name = "Dükkan adını girin.";
        else if (v.name.trim().length > 150) e.name = "Ad en fazla 150 karakter olabilir.";
        if (!v.district) e.district = "İlçe seçin.";
        if (!v.location) e.location = "Haritada dükkanın yerini bulup “Bu konumu seç”e basın.";
        if (v.categoryIds.length === 0) e.categoryIds = "En az bir kategori seçin.";
        if (v.address.length > 500) e.address = "Adres en fazla 500 karakter olabilir.";
        if (isSuggest && !v.address.trim() && !v.phone.trim()) e.address = "Adres veya telefondan en az birini girin.";
        if (v.note.length > MAX_NOTE_LENGTH) e.note = `Not en fazla ${MAX_NOTE_LENGTH} karakter olabilir.`;
        if (withHours) Object.assign(e, validateHours(v.openingHours));
        return e;
    }

    function focusAlert() {
        setAlertSeq(n => n + 1);
    }

    async function submit(ev: FormEvent) {
        ev.preventDefault();
        setSuccess(null);
        const local = validate(values);
        if (Object.keys(local).length > 0) {
            setErrors(local);
            setAlert("Formda düzeltilmesi gereken alanlar var.");
            focusAlert();
            return;
        }
        setBusy(true);
        setErrors({});
        setAlert(null);
        try {
            const normalized = await onSubmit(values);
            if (normalized) setValues(normalized);
            setConflictDraft(null);
            if (!isSuggest) setSuccess(successText);
        } catch (err) {
            if (err instanceof ApiError && err.status === 409 && CONFLICT_CODES.has(err.code) && onConflict) {
                try {
                    const fresh = await onConflict();
                    setConflictDraft(values);
                    setValues(fresh);
                    setAlert("Dükkan siz düzenlerken güncellendi. Alanlarda güncel değerler var; sizin değerinizin farklı olduğu alanların altında kendi değerinizi görüp “Benimkini kullan” ile geri alabilirsiniz. Sonra tekrar kaydedin.");
                } catch (e2) {
                    setAlert(errorMessage(e2, "Güncel değerler alınamadı. Sayfayı yenileyin."));
                }
            } else {
                const fe = fieldErrorMap(err);
                setErrors(fe);
                setAlert(Object.keys(fe).length > 0
                    ? `Formda düzeltilmesi gereken alanlar var. ${errorMessage(err)}`
                    : errorMessage(err, "Kaydedilemedi."));
            }
            focusAlert();
        } finally {
            setBusy(false);
        }
    }

    /** 409 sonrası: bu alanda kullanıcının değeri güncelden farklıysa ipucu + geri alma düğmesi. */
    function conflictHint(key: keyof ProviderFormValues) {
        if (!conflictDraft || !fieldDiffers(conflictDraft, values, key)) return null;
        return (
            <div className="conflict-hint">
                <span>Sizin değeriniz: {formatFieldValue(key, conflictDraft[key], {categories, brands})}</span>
                <button type="button" className="btn btn-outline btn-sm"
                        onClick={() => set(key, conflictDraft[key])}>
                    Benimkini kullan<span className="sr-only">: {fieldLabel(key)}</span>
                </button>
            </div>
        );
    }

    const fieldA11y = (k: string) => ({
        "aria-invalid": errors[k] ? true : undefined,
        "aria-describedby": errors[k] ? errId(k) : undefined,
    });
    const fieldError = (k: string) => errors[k] && <span id={errId(k)} className="field-error">{errors[k]}</span>;

    return (
        <form className="card form-card stack" onSubmit={submit} noValidate>
            {alert && (
                <div ref={alertRef} tabIndex={-1} className={`alert ${conflictDraft ? "alert-info" : "alert-error"}`}
                     role="alert">{alert}</div>
            )}

            <div className="field">
                <label htmlFor={`${id}-name`} className="field-label">Dükkan adı</label>
                <input id={`${id}-name`} className="input" value={values.name} maxLength={150} autoComplete="off" required
                       onChange={e => set("name", e.target.value)} {...fieldA11y("name")}/>
                {fieldError("name")}
                {conflictHint("name")}
            </div>

            <ChipMultiSelect label="Kategoriler" required options={categories} selected={values.categoryIds}
                             hint="En az bir kategori seçin."
                             onChange={ids => set("categoryIds", ids)} error={errors.categoryIds}
                             errorId={errId("categoryIds")}/>
            {conflictHint("categoryIds")}

            <ChipMultiSelect label="Markalar" options={brands} selected={values.brandIds}
                             hint="Dükkanın uzmanlaştığı markalar (isteğe bağlı)."
                             onChange={ids => set("brandIds", ids)} error={errors.brandIds}
                             errorId={errId("brandIds")}/>
            {conflictHint("brandIds")}

            <div className="field">
                <label htmlFor={`${id}-district`} className="field-label">İlçe</label>
                <select id={`${id}-district`} className="select" value={values.district} required
                        onChange={e => set("district", e.target.value)} {...fieldA11y("district")}>
                    <option value="">İlçe seçin</option>
                    {DISTRICT_NAMES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {fieldError("district")}
                {conflictHint("district")}
            </div>

            <div className="field">
                <label htmlFor={`${id}-address`} className="field-label">Adres{isSuggest ? "" : " (isteğe bağlı)"}</label>
                <input id={`${id}-address`} className="input" value={values.address} maxLength={500} autoComplete="street-address"
                       onChange={e => set("address", e.target.value)} {...fieldA11y("address")}/>
                {isSuggest && <span className="field-hint">Adres veya telefondan en az biri gerekli.</span>}
                {fieldError("address")}
                {conflictHint("address")}
            </div>

            <div className="field">
                <label htmlFor={`${id}-phone`} className="field-label">Telefon{isSuggest ? "" : " (isteğe bağlı)"}</label>
                <input id={`${id}-phone`} className="input" type="tel" inputMode="tel" value={values.phone} autoComplete="tel"
                       placeholder="0312 555 12 34"
                       onChange={e => set("phone", e.target.value)} {...fieldA11y("phone")}/>
                <span className="field-hint">Türkiye numarası; +90 biçimine çevrilir.</span>
                {fieldError("phone")}
                {conflictHint("phone")}
            </div>

            <fieldset className="field form-fieldset">
                <legend className="field-label">Konum</legend>
                <LocationPickerClient value={values.location} onChange={v => set("location", v)}
                                      district={values.district || undefined}
                                      error={errors.location} errorId={errId("location")}/>
                {conflictHint("location")}
            </fieldset>

            {withHours && (
                <fieldset className="field form-fieldset">
                    <legend className="field-label">Çalışma saatleri</legend>
                    <OpeningHoursEditor value={values.openingHours} onChange={v => set("openingHours", v)}
                                        errors={errors}/>
                    {conflictHint("openingHours")}
                </fieldset>
            )}

            {isSuggest && (
                <div className="field">
                    <label htmlFor={`${id}-note`} className="field-label">Not (isteğe bağlı)</label>
                    <textarea id={`${id}-note`} className="textarea" value={values.note} maxLength={MAX_NOTE_LENGTH} rows={3}
                              onChange={e => set("note", e.target.value)} {...fieldA11y("note")}/>
                    <span className="field-hint">{values.note.length}/{MAX_NOTE_LENGTH}</span>
                    {fieldError("note")}
                </div>
            )}

            {beforeSubmit}

            {success && <div className="alert alert-success" role="status">{success}</div>}

            <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
                    {busy ? submittingLabel : submitLabel}
                </button>
                {secondaryAction}
            </div>
        </form>
    );
}
