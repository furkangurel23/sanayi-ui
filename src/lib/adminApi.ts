/*
 * ADMIN API katmanı — client-only, token'lı (Bearer), no-store.
 *
 * Neden ayrı dosya? api.ts SSR/ISR (cache, revalidate) odaklıdır; admin çağrıları
 * ise tarayıcıdan JWT ile yapılır ve asla cache'lenmemelidir. İki dünyayı ayırmak
 * hem Next cache semantiğini hem de güvenliği temiz tutar.
 *
 * Hata standardı: başarısız yanıt toApiError ile ApiError'a çevrilip fırlatılır;
 * ekran err.code'a bakar, err.message'ı gösterir (proje geneli sözleşme).
 */

"use client";

import type {
    AdminProviderItem, AdminRatingItem, AdminUserItem, ChangeSet, ModerationLogItem, Page, ProviderEditRequest,
    ProviderEditView, QueueCounts, SpringPage,
} from "@/lib/types";
import {authedJson, pageQuery} from "@/lib/accountApi";
import {normalizePage} from "@/lib/page";
import {toApiError} from "@/lib/apiError";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

type QueryValue = string | number | boolean | null | undefined;

function qs(params: Record<string, QueryValue>) {
    const u = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") return;
        u.set(k, String(v));
    });
    return u.toString();
}

/** Token'lı GET; hata olursa ApiError fırlatır. */
async function getJson<T>(url: string, token: string): Promise<T> {
    const res = await fetch(url, {headers: {Authorization: `Bearer ${token}`}, cache: "no-store"});
    if (!res.ok) throw await toApiError(res);
    return res.json();
}

/** Token'lı DELETE/POST (gövdesiz) yardımcıcısı. */
async function mutate(method: "DELETE" | "POST", url: string, token: string): Promise<void> {
    const res = await fetch(url, {method, headers: {Authorization: `Bearer ${token}`}, cache: "no-store"});
    if (!res.ok) throw await toApiError(res);
}

// ---------------- YORUMLAR ----------------
export async function adminListRatings(token: string, params: {
    providerId?: string | number;
    q?: string;
    status?: "ACTIVE" | "DELETED" | "ALL";
    from?: string; to?: string;
    page?: number; size?: number;
}): Promise<Page<AdminRatingItem>> {
    const p0 = Math.max(0, (params.page ?? 1) - 1);
    const query = qs({...params, page: p0});
    return normalizePage(await getJson<SpringPage<AdminRatingItem>>(`${BASE}/admin/ratings?${query}`, token));
}

export function adminDeleteRating(token: string, ratingId: number, reason?: string) {
    const q = qs({reason});
    return mutate("DELETE", `${BASE}/admin/ratings/${ratingId}${q ? "?" + q : ""}`, token);
}

export function adminRestoreRating(token: string, ratingId: number, reason?: string) {
    const q = qs({reason});
    return mutate("POST", `${BASE}/admin/ratings/${ratingId}/restore${q ? "?" + q : ""}`, token);
}

export async function adminListLogs(token: string, ratingId: number, page = 0, size = 20): Promise<Page<ModerationLogItem>> {
    const q = qs({entity: "RATING", page, size});
    // Backend: ModerationLogController -> @RequestMapping("/api/admin/logs") + @GetMapping("/{id}/logs")
    // yani tam yol /api/admin/logs/{id}/logs. (Eskiden sondaki /logs eksikti -> panel 404 alıyordu.)
    return normalizePage(await getJson<SpringPage<ModerationLogItem>>(`${BASE}/admin/logs/${ratingId}/logs?${q}`, token));
}

// ---------------- DÜKKANLAR ----------------
// 002: liste artık YÖNETİCİ ucundan (GET /api/admin/providers, ROLE_ADMIN). Genel /api/providers
// sentetik (demo) dükkanları gizler; admin onları `synthetic: true` etiketiyle görür ve
// `includeSynthetic=false` ile gizleyebilir. Sıralama alanı backend'de beyaz listeli (name/createdAt/id/ratingCount).
export async function adminListProviders(token: string, params: {
    q?: string; district?: string; includeSynthetic?: boolean; page?: number; size?: number;
    /** 003: true = yalnız elle düzenlenmiş, false = yalnız düzenlenmemiş; undefined = hepsi. */
    manuallyEdited?: boolean;
}): Promise<Page<AdminProviderItem>> {
    const p0 = Math.max(0, (params.page ?? 1) - 1);
    const query = qs({
        q: params.q, district: params.district, page: p0, size: params.size ?? 20,
        includeSynthetic: params.includeSynthetic === false ? "false" : undefined,
        manuallyEdited: params.manuallyEdited,
    });
    return normalizePage(await getJson<SpringPage<AdminProviderItem>>(`${BASE}/admin/providers?${query}&sort=name,asc`, token));
}

export function adminDeleteProvider(token: string, providerId: number, reason?: string) {
    const q = qs({reason});
    return mutate("DELETE", `${BASE}/admin/providers/${providerId}${q ? "?" + q : ""}`, token);
}

// ---------------- KULLANICILAR ----------------
export async function adminListUsers(token: string, params: {
    q?: string; page?: number; size?: number;
}): Promise<Page<AdminUserItem>> {
    const p0 = Math.max(0, (params.page ?? 1) - 1);
    const query = qs({q: params.q, page: p0, size: params.size ?? 20});
    return normalizePage(await getJson<SpringPage<AdminUserItem>>(`${BASE}/admin/users?${query}`, token));
}

export function adminDeleteUser(token: string, userId: number, reason?: string) {
    const q = qs({reason});
    return mutate("DELETE", `${BASE}/admin/users/${userId}${q ? "?" + q : ""}`, token);
}

// ---------------- 003: DÜKKAN DÜZENLEME + DEĞİŞİKLİK KAYITLARI ----------------
// Sahip uçlarıyla AYNI servis; yönetici yolu e-postaları görür ve `owner` alanını alır.

export function adminGetEditView(token: string, id: number): Promise<ProviderEditView> {
    return authedJson("GET", `${BASE}/admin/providers/${id}`, token);
}

export function adminUpdateProvider(token: string, id: number, req: ProviderEditRequest): Promise<ProviderEditView> {
    return authedJson("PUT", `${BASE}/admin/providers/${id}`, token, req);
}

export async function adminHistory(token: string, id: number, page = 1, size = 20): Promise<Page<ChangeSet>> {
    return normalizePage(await authedJson<SpringPage<ChangeSet>>(
        "GET", `${BASE}/admin/providers/${id}/changes?${pageQuery(page, size)}`, token));
}

/** Dikkat kuyruğu: `open` en eski önce, `resolved` en yeni çözülen önce; ilçe + ad öneki (≥2). */
export async function attentionQueue(token: string, params: {
    attention: "open" | "resolved"; district?: string; q?: string; page?: number; size?: number;
}): Promise<Page<ChangeSet>> {
    const query = pageQuery(params.page, params.size ?? 20,
        {attention: params.attention, district: params.district, q: params.q});
    return normalizePage(await authedJson<SpringPage<ChangeSet>>("GET", `${BASE}/admin/change-sets?${query}`, token));
}

/** Geri al -> 201 + yeni REVERT kaydı; alanlar sonradan değiştiyse 409 (mesaj alan adlarını içerir). */
export function revertChangeSet(token: string, id: number): Promise<ChangeSet> {
    return authedJson("POST", `${BASE}/admin/change-sets/${id}/revert`, token);
}

/** Dikkat işaretini "incelendi" yap -> 204. */
export function acknowledgeChangeSet(token: string, id: number): Promise<void> {
    return authedJson("POST", `${BASE}/admin/change-sets/${id}/acknowledge`, token);
}

/** Panel sekme rozetleri (önbelleklenmez). */
export function queueCounts(token: string): Promise<QueueCounts> {
    return authedJson("GET", `${BASE}/admin/queues/counts`, token);
}
