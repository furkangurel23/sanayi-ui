/*
*
* Neden farklı bir ts dosyası?
*
* Kısa cevap: admin ekranı client-side çalışıyor ve Bearer token'ı localStorage'dan okuyor. src/lib/api.ts ise Server Component/SSR odaklı yazıldı(revalidate, cache davranışları vs.
* Bu iki dünya aynı dosyada karışınca ya güvenlikten taviz veriyorsun ya da Next'in cache/SSR semantiğini bozuyorsun. O yüzden admin çağrılarını token'lı, no-store, tamament client güvenli
* bir yere koyuyoruz.
*
* Bir tık daha açarsak.
* api.ts içindeki çağrılar SSR/ISR uyumlu: next: { revalidate } kullanıyor, cookie/headers otomatik taşıma beklentisi var.
*
* Admin moderasyon sayfası ClientComponent: localStorage'dan token alıyorsun, Authorization: Bearer ekliyorsun. Bunu api.ts'ye taşırsan:
*   Dosyayı use client yapman gerekir, bu da tüm ssr odaklı fonksiyonları client bundle'a taşır. hoş değil.
* Ya da use client koymazsan, localStorage erişemezsin ve Authorization'e set edemezsin.
*
* Kısaca: SSR/public API çağrılarını api.ts'e client-only ve token'li admin çağrılarını ayrı bir modülde tutmak en temiz yaklaşım.
*
* */

"use client";

import type {AdminRatingItem, ModerationLogItem, Page, SpringPage} from "@/lib/types";
import {normalizePage} from "@/lib/page";

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

async function getJson<T>(url: string, token: string): Promise<T> {
    const res = await fetch(url, {
        headers: {Authorization: `Bearer ${token}`},
        cache: "no-store",
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function adminListRatings(token: string, params: {
    providerId?: string | number;
    q?: string;
    status?: "ACTIVE" | "DELETED" | "ALL";
    from?: string; to?: string;
    page?: number; size?: number;
}): Promise<Page<AdminRatingItem>> {
    const p0 = Math.max(0, (params.page ?? 1) - 1);
    const query = qs({...params, page: p0});
    const page = await getJson<SpringPage<AdminRatingItem>>(`${BASE}/admin/ratings?${query}`, token);
    return normalizePage(page);
}

export async function adminDeleteRating(token: string, ratingId: number, reason?: string) {
    const q = qs({reason});
    const url = `${BASE}/admin/ratings/${ratingId}${q ? "?" + q : ""}`;
    const res = await fetch(url, {method: "DELETE", headers: {Authorization: `Bearer ${token}`}, cache: "no-store"});
    if (!res.ok) throw new Error(await res.text());
}

export async function adminRestoreRating(token: string, ratingId: number, reason?: string) {
    const q = qs({reason});
    const url = `${BASE}/admin/ratings/${ratingId}/restore${q ? "?" + q : ""}`;
    const res = await fetch(url, {method: "POST", headers: {Authorization: `Bearer ${token}`}, cache: "no-store"});
    if (!res.ok) throw new Error(await res.text());
}

export async function adminListLogs(token: string, ratingId: number, page = 0, size = 20): Promise<Page<ModerationLogItem>> {
    const q = qs({entity: "RATING", page, size});
    const logs = await getJson<SpringPage<ModerationLogItem>>(`${BASE}/admin/logs/${ratingId}?${q}`, token);
    return normalizePage(logs);
}





