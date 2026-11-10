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

import type {ChangeSet, OwnedProvider, Page, ProviderEditRequest, ProviderEditView, SpringPage} from "@/lib/types";
import {normalizePage} from "@/lib/page";
import {toApiError} from "@/lib/apiError";

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

/** Değişiklik geçmişi (en yeni önce; yönetici kayıtlarında e-posta null). */
export async function ownerHistory(token: string, id: number, page = 1, size = 20): Promise<Page<ChangeSet>> {
    return normalizePage(await authedJson<SpringPage<ChangeSet>>(
        "GET", `${BASE}/owner/providers/${id}/changes?${pageQuery(page, size)}`, token));
}
