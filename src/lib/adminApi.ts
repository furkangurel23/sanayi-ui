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

import type {AdminRatingItem, AdminUserItem, ModerationLogItem, Page, ProviderListItem, SpringPage} from "@/lib/types";
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
// Not: Listeleme için genel /api/providers ucunu kullanıyoruz (admin token gerekmez,
// public zaten), silme ise admin token ister.
export async function adminListProviders(token: string, params: {
    q?: string; city?: string; district?: string; page?: number; size?: number;
}): Promise<Page<ProviderListItem>> {
    const p0 = Math.max(0, (params.page ?? 1) - 1);
    const query = qs({q: params.q, city: params.city, district: params.district, page: p0, size: params.size ?? 20});
    // sort=name,asc -> admin listesi alfabetik okunsun
    return normalizePage(await getJson<SpringPage<ProviderListItem>>(`${BASE}/providers?${query}&sort=name,asc`, token));
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
