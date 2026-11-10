/*
 * DÜKKAN ALANLARI — form değeri, istek gövdesi ve Türkçe alan adları (003).
 *
 * Tek kaynak: düzenleme formu (sahip/yönetici), öneri formu, öneri onayı ve değişiklik
 * geçmişi aynı alan adlarını kullanır. Alan anahtarları backend'in değişiklik kaydı ve
 * fieldErrors anahtarlarıyla AYNI: name, address, district, phone, location, categoryIds,
 * brandIds, openingHours (+ öneride note).
 */
import type {IdName, OpeningHours, ProviderEditRequest, ProviderEditView} from "@/lib/types";
import {DAY_LABELS, DAYS, formatDay, type Hours} from "@/lib/openingHours";
import {formatPhoneTR} from "@/lib/phone";

export type ProviderFormValues = {
    name: string;
    address: string;
    district: string;
    phone: string;
    location: { lat: number; lon: number } | null;
    categoryIds: number[];
    brandIds: number[];
    openingHours: OpeningHours | null;
    note: string;
};

export const FIELD_LABELS: Record<string, string> = {
    name: "Ad",
    address: "Adres",
    district: "İlçe",
    phone: "Telefon",
    location: "Konum",
    categoryIds: "Kategoriler",
    brandIds: "Markalar",
    openingHours: "Çalışma saatleri",
    note: "Not",
};

export const ATTENTION_LABELS: Record<string, string> = {
    NAME_CHANGED: "Ad belirgin biçimde değişti",
    MOVED_FAR: "Konum 200 m'den fazla taşındı",
};

export function fieldLabel(key: string): string {
    return FIELD_LABELS[key] ?? key;
}

/** Düzenleme görünümü -> form değerleri (null'lar boş metne). */
export function viewToForm(v: ProviderEditView): ProviderFormValues {
    return {
        name: v.name ?? "",
        address: v.address ?? "",
        district: v.district ?? "",
        phone: v.phone ?? "",
        location: typeof v.lat === "number" && typeof v.lon === "number" ? {lat: v.lat, lon: v.lon} : null,
        categoryIds: v.categories.map(c => c.id),
        brandIds: v.brands.map(b => b.id),
        openingHours: v.openingHours ?? null,
        note: "",
    };
}

export function emptyForm(): ProviderFormValues {
    return {
        name: "", address: "", district: "", phone: "", location: null,
        categoryIds: [], brandIds: [], openingHours: null, note: "",
    };
}

/** Form -> PUT gövdesi (konum form tarafından zorunlu kılınır; boş metinler null olur). */
export function formToEditRequest(f: ProviderFormValues, version: number): ProviderEditRequest {
    return {
        version,
        name: f.name.trim(),
        address: f.address.trim() || null,
        district: f.district,
        phone: f.phone.trim() || null,
        lat: f.location!.lat,
        lon: f.location!.lon,
        categoryIds: f.categoryIds,
        brandIds: f.brandIds,
        openingHours: f.openingHours,
    };
}

/** İki form değerinin bir alanı farklı mı? (409 çakışmasında "Sizin değeriniz" ipucu) */
export function fieldDiffers(a: ProviderFormValues, b: ProviderFormValues, key: keyof ProviderFormValues): boolean {
    const norm = (v: unknown) => Array.isArray(v) ? JSON.stringify([...v].sort()) : JSON.stringify(v ?? null);
    if (key === "name" || key === "address" || key === "phone" || key === "district" || key === "note") {
        return String(a[key]).trim() !== String(b[key]).trim();
    }
    return norm(a[key]) !== norm(b[key]);
}

function names(ids: unknown, list: IdName[]): string {
    if (!Array.isArray(ids) || ids.length === 0) return "(yok)";
    const byId = new Map(list.map(x => [x.id, x.name]));
    return ids.map(id => byId.get(Number(id)) ?? `#${id}`).join(", ");
}

function hoursText(h: unknown): string {
    if (!h || typeof h !== "object") return "Bilgi yok";
    const hours = h as Partial<Hours>;
    return DAYS.map(d => `${DAY_LABELS[d]}: ${formatDay(hours[d])}`).join("; ");
}

/**
 * Bir alan değerini insan için metne çevirir (değişiklik geçmişi ve çakışma ipucu).
 * Kategori/marka id'leri adlarla, konum "enlem, boylam", saatler gün gün yazılır.
 */
export function formatFieldValue(key: string, value: unknown, ctx: { categories: IdName[]; brands: IdName[] }): string {
    if (value === null || value === undefined || value === "") {
        return key === "openingHours" ? "Bilgi yok" : "(boş)";
    }
    switch (key) {
        case "categoryIds":
            return names(value, ctx.categories);
        case "brandIds":
            return names(value, ctx.brands);
        case "phone":
            return formatPhoneTR(String(value));
        case "location": {
            const v = value as { lat?: number; lon?: number };
            return typeof v.lat === "number" && typeof v.lon === "number"
                ? `${v.lat.toFixed(5)}, ${v.lon.toFixed(5)}` : "(boş)";
        }
        case "openingHours":
            return hoursText(value);
        default:
            return String(value);
    }
}

