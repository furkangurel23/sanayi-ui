/*
 * HESAP API KATMANI (003) — oturum açmış ÜYENİN uçları: dükkanlarım + düzenleme (sahip),
 * önerilerim, taleplerim. client-only, Bearer belirteçli, `no-store`.
 *
 * Neden adminApi'den ayrı? Yetki modeli farklı: buradaki uçlar `/api/owner`, `/api/suggestions`,
 * `/api/claims` altında ve her doğrulanmış üyeye açık (kimin neyi göreceğine backend karar verir).
 * adminApi ise yalnız ROLE_ADMIN uçlarıdır. İki dosya, iki yetki dünyası — karışmaz.
 *
 * Kalıp adminApi ile aynı: belirteci ÇAĞIRAN verir (`ensureFreshToken()` ile tazelenmiş);
 * başarısız yanıt `toApiError` ile ApiError'a çevrilip fırlatılır — ekran `err.code`'a bakar,
 * `err.message`'ı (backend'in Türkçe metni) gösterir.
 */

"use client";

import type {
    ChangeSet, Claim, ClaimStatus, ClaimSubmitRequest, OwnedProvider, Page, ProviderEditRequest, ProviderEditView, SimilarProvider, SpringPage,
    Suggestion, SuggestionCreateRequest, SuggestionStatus,
} from "@/lib/types";
import {normalizePage} from "@/lib/page";
import {ApiError, toApiError} from "@/lib/apiError";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

/** Ortak istek yardımcısı: JSON gövde (varsa) + Bearer; 204'te `undefined` döner. */
export async function authedJson<T>(method: string, url: string, token: string, body?: unknown): Promise<T> {
    const res = await fetch(url, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(body !== undefined ? {"Content-Type": "application/json"} : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        cache: "no-store",
    });
    if (!res.ok) throw await toApiError(res);
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}

/** UI sayfası (1-based) -> Spring sayfası (0-based) sorgu metni. */
export function pageQuery(page = 1, size = 20, extra: Record<string, string | number | undefined> = {}): string {
    const u = new URLSearchParams();
    u.set("page", String(Math.max(0, page - 1)));
    u.set("size", String(size));
    Object.entries(extra).forEach(([k, v]) => {
        if (v !== undefined && v !== "") u.set(k, String(v));
    });
    return u.toString();
}

// ---------------- SAHİP: DÜKKANLARIM + DÜZENLEME ----------------

/** Aktif sahipliklerim (sahip değilsem boş liste). */
export function ownerProviders(token: string): Promise<OwnedProvider[]> {
    return authedJson("GET", `${BASE}/owner/providers`, token);
}

/** Düzenleme formu görünümü (aktif sahip veya yönetici; aksi 403/404). */
export function getEditView(token: string, id: number): Promise<ProviderEditView> {
    return authedJson("GET", `${BASE}/owner/providers/${id}`, token);
}

/** Tam yerine koyma + iyimser kilit: eski `version` -> 409 error.provider.version-conflict. */
export function updateProvider(token: string, id: number, req: ProviderEditRequest): Promise<ProviderEditView> {
    return authedJson("PUT", `${BASE}/owner/providers/${id}`, token, req);
}

/** Değişiklik geçmişi (en yeni önce; sahibin KENDİ kayıtları dışındaki tüm kayıtlarda e-posta null). */
export async function ownerHistory(token: string, id: number, page = 1, size = 20): Promise<Page<ChangeSet>> {
    return normalizePage(await authedJson<SpringPage<ChangeSet>>(
        "GET", `${BASE}/owner/providers/${id}/changes?${pageQuery(page, size)}`, token));
}

// ---------------- ÖNERİLER (üye) ----------------

/** Olası tekrar: 75 m içinde adı benzeyen gerçek dükkanlar (gönderimi ENGELLEMEZ). */
export function similarProviders(token: string, name: string, lat: number, lon: number): Promise<SimilarProvider[]> {
    const q = new URLSearchParams({name, lat: String(lat), lon: String(lon)});
    return authedJson("GET", `${BASE}/suggestions/similar?${q.toString()}`, token);
}

/** Öneri gönder -> 201; 403 doğrulanmamış, 429 (24 saatte 5), 400 alan hataları. */
export function submitSuggestion(token: string, req: SuggestionCreateRequest): Promise<Suggestion> {
    return authedJson("POST", `${BASE}/suggestions`, token, req);
}

/**
 * Önerilerim (en yeni önce). `status` SUNUCUDA süzülür (backend: büyük/küçük harf duyarsız; yok
 * veya "ALL" = hepsi; geçersiz değer 400 `error.suggestion.status-invalid`). Sayfalama da sunucuda.
 * "ALL" hiç gönderilmez: `pageQuery` undefined değeri sorguya eklemez -> URL kısa ve eski
 * backend'lerle uyumlu kalır.
 */
export async function mySuggestions(token: string, page = 1, size = 20,
                                    status?: SuggestionStatus | "ALL"): Promise<Page<Suggestion>> {
    const extra = {status: status === "ALL" ? undefined : status};
    return normalizePage(await authedJson<SpringPage<Suggestion>>(
        "GET", `${BASE}/suggestions/mine?${pageQuery(page, size, extra)}`, token));
}

export function getSuggestion(token: string, id: number): Promise<Suggestion> {
    return authedJson("GET", `${BASE}/suggestions/${id}`, token);
}

/** Geri çek (yalnız incelemedeyken; aksi 409 error.suggestion.not-pending). */
export function withdrawSuggestion(token: string, id: number): Promise<Suggestion> {
    return authedJson("POST", `${BASE}/suggestions/${id}/withdraw`, token);
}

// ---------------- SAHİPLENME TALEPLERİ (üye) ----------------

/**
 * Talep gönder — `XMLHttpRequest` ile (fetch yükleme ilerlemesini VERMEZ; XHR'nin
 * `upload.onprogress` olayı gönderilen bayt sayısını bildirir -> belirli ilerleme çubuğu).
 *
 * Gövde `multipart/form-data`: `data` parçası JSON (`Blob([...], {type: "application/json"})` —
 * Spring `@RequestPart("data")` JSON'u bu içerik türüyle bekler), `files` parçaları belgeler.
 * Content-Type başlığını ELLE yazmıyoruz: tarayıcı sınır (boundary) değeriyle kendisi yazar.
 *
 * Dönüş: `{promise, abort}` — "İptal" düğmesi `abort()` çağırır; iptal edilen istek
 * `ApiError(0, "error.upload.aborted")` ile reddedilir (çağıran bunu sessizce karşılar).
 * Hata yanıtı JSON ErrorResponse ise aynı ApiError sözleşmesine çevrilir.
 */
export function submitClaim(token: string, providerId: number, data: ClaimSubmitRequest, files: File[],
                            onProgress?: (fraction: number) => void): { promise: Promise<Claim>; abort: () => void } {
    const xhr = new XMLHttpRequest();
    const promise = new Promise<Claim>((resolve, reject) => {
        const form = new FormData();
        form.append("data", new Blob([JSON.stringify(data)], {type: "application/json"}));
        files.forEach(f => form.append("files", f, f.name));

        xhr.open("POST", `${BASE}/providers/${providerId}/claims`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.responseType = "text";
        xhr.upload.onprogress = e => {
            if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                // Başarılı yanıtın gövdesi bozuksa JSON.parse fırlatır; olay işleyicisinde
                // yakalanmayan hata Promise'i HİÇ sonuçlandırmaz -> form "Gönderiliyor…"da
                // takılırdı. Bu yüzden ayrıştırma hatası da ApiError sözleşmesiyle reddedilir.
                try {
                    resolve(JSON.parse(xhr.responseText) as Claim);
                } catch {
                    reject(new ApiError(xhr.status, "error.unknown",
                        "Sunucu yanıtı okunamadı. Talebinizin durumunu Taleplerim sayfasından kontrol edin."));
                }
                return;
            }
            try {
                const body = JSON.parse(xhr.responseText);
                reject(new ApiError(body.status ?? xhr.status, body.code ?? "error.unknown",
                    body.message ?? `İstek başarısız (${xhr.status})`, body.fieldErrors ?? undefined));
            } catch {
                reject(new ApiError(xhr.status, "error.unknown", `İstek başarısız (${xhr.status})`));
            }
        };
        xhr.onerror = () => reject(new ApiError(0, "error.network", "Bağlantı hatası. İnternet bağlantınızı kontrol edip tekrar deneyin."));
        xhr.onabort = () => reject(new ApiError(0, "error.upload.aborted", "Yükleme iptal edildi."));
        xhr.send(form);
    });
    return {promise, abort: () => xhr.abort()};
}

/**
 * Taleplerim (en yeni önce). `status` sunucuda süzülür (mySuggestions ile aynı kurallar; geçersiz
 * değer 400 `error.claim.status-invalid`), sayfalama sunucuda. "ALL" gönderilmez.
 */
export async function myClaims(token: string, page = 1, size = 20,
                               status?: ClaimStatus | "ALL"): Promise<Page<Claim>> {
    const extra = {status: status === "ALL" ? undefined : status};
    return normalizePage(await authedJson<SpringPage<Claim>>(
        "GET", `${BASE}/claims/mine?${pageQuery(page, size, extra)}`, token));
}

export function getClaim(token: string, id: number): Promise<Claim> {
    return authedJson("GET", `${BASE}/claims/${id}`, token);
}

/** Geri çek (yalnız incelemedeyken; belgeler hemen silinir). */
export function withdrawClaim(token: string, id: number): Promise<Claim> {
    return authedJson("POST", `${BASE}/claims/${id}/withdraw`, token);
}
