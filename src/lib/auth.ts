"use client";

import {publicApiBase} from "@/lib/apiBase";

/*
 * JWT tabanlı hafif auth durumu (state) yönetimi.
 *
 * BÜYÜK RESİM:
 *  - Backend login/verify sonrası bir JWT (JSON Web Token) verir.
 *  - JWT üç parçadır: header.payload.signature (nokta ile ayrılmış, base64url kodlu).
 *    payload içinde `sub` (e-posta), `roles` ve `exp` (son geçerlilik, epoch saniye) taşırız.
 *  - Token'ı localStorage'da saklarız; her korumalı isteğe
 *    `Authorization: Bearer <token>` başlığı ile ekleriz.
 *
 * GÜVENLİK NOTU (öğrenme):
 *  - localStorage'a XSS ile erişilebilir; en güvenlisi HttpOnly cookie'dir.
 *    Bu projede basitlik için localStorage seçildi; React'in otomatik
 *    escape'i + dikkatli innerHTML kullanmama kuralı XSS riskini azaltır.
 *
 * OBSERVER DESENİ:
 *  - `listeners` kümesi: token değişince kayıtlı tüm callback'ler çağrılır.
 *  - useAuth hook'u (useSyncExternalStore) bu subscribe/snapshot ikilisine bağlanır;
 *    böylece login/logout olduğunda Header gibi bileşenler otomatik yeniden render olur.
 */

export type AuthUser = {
    email: string;
    roles: string[];
    /** Son geçerlilik anı (epoch SANİYE — JS Date.now() milisaniyedir, çarpım gerekir!) */
    exp: number;
};

const TOKEN_KEY = "sanayiToken";
const REFRESH_KEY = "sanayiRefreshToken";
// Set: aynı fonksiyonun iki kez eklenmesini otomatik engeller.
const listeners = new Set<() => void>();

/**
 * JWT payload'ını çözer (İMZA DOĞRULAMAZ! — imzayı yalnızca backend doğrular;
 * client'taki decode sadece UI amaçlıdır: e-posta/rol/exp okumak için).
 *
 * Syntax notları:
 *  - token.split(".")[1] -> payload parçası.
 *  - base64url, standart base64'ten - ve _ karakterleriyle ayrılır;
 *    atob'a vermeden önce replace ile geri çeviriyoruz.
 *  - try/catch: bozuk token'da uygulama patlamasın, null dönsün.
 */
function decode(token: string): AuthUser | null {
    try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        if (typeof payload.sub !== "string") return null;
        return {
            email: payload.sub,
            roles: Array.isArray(payload.roles) ? payload.roles : [],
            exp: typeof payload.exp === "number" ? payload.exp : 0,
        };
    } catch {
        return null;
    }
}

/**
 * Geçerli (süresi dolmamış) token'ı döner; yoksa/bozuksa null.
 * SSR guard: `typeof window === "undefined"` — bu modül Server Component'a
 * yanlışlıkla import edilirse localStorage yoktur, sessizce null döneriz.
 */
export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) return null;
    const u = decode(t);
    // exp saniye cinsinden -> *1000 ile milisaniyeye çevirip şimdiyle kıyasla.
    if (!u || u.exp * 1000 < Date.now()) {
        localStorage.removeItem(TOKEN_KEY); // süresi dolmuş token'ı temizle
        return null;
    }
    return t;
}

/** Token'dan çözülmüş kullanıcı bilgisi (yoksa null). */
export function getUser(): AuthUser | null {
    const t = getToken();
    return t ? decode(t) : null;
}

/** Access token'ı imzasız decode edip son geçerlilik anını (ms) döner; okunamzsa 0. */
function accessExpiryMs(token: string): number {
    const u = decode(token);
    return u ? u.exp * 1000 : 0;
}

/** Login/verify/refresh sonrası çağrılır; access (+varsa refresh) saklar, dinleyicilere haber verir. */
export function setToken(token: string, refreshToken?: string | null) {
    localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    listeners.forEach(fn => fn());
}

export function getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_KEY);
}

/**
 * OTOMATİK YENİLEME: access token yoksa/1 dk içinde dolacaksa, refresh token ile
 * yenisini alır. Access token 15 dk ömürlü olduğu için korumalı her istekten önce
 * çağrılır (authApi/adminApi/chat). Aynı anda birden fazla istek yenilemeyi tetiklerse
 * TEK promise paylaşılır (refreshInFlight) — çift yenileme/rotation yarışı önlenir.
 */
let refreshInFlight: Promise<string | null> | null = null;

export async function ensureFreshToken(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    const access = localStorage.getItem(TOKEN_KEY);
    // Access hâlâ >1 dk geçerliyse aynen kullan.
    if (access && accessExpiryMs(access) - Date.now() > 60_000) return access;

    const refresh = getRefreshToken();
    if (!refresh) {
        // Refresh de yoksa oturum bitti — temizle.
        clearToken();
        return null;
    }
    // Zaten bir yenileme sürüyorsa ona bağlan (tek uçuş).
    if (!refreshInFlight) {
        const base = publicApiBase(); // 006: tarayıcı → genel adres
        refreshInFlight = fetch(`${base}/auth/refresh`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            cache: "no-store",
            body: JSON.stringify({refreshToken: refresh}),
        }).then(async res => {
            if (!res.ok) {
                clearToken(); // refresh de geçersiz -> tam logout
                return null;
            }
            const data = await res.json();
            setToken(data.token, data.refreshToken); // rotation: yeni çifti sakla
            return data.token as string;
        }).catch(() => null).finally(() => {
            refreshInFlight = null;
        });
    }
    return refreshInFlight;
}

/** Logout: access + refresh token'ı sil ve dinleyicilere haber ver. */
export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    listeners.forEach(fn => fn());
}

/**
 * useSyncExternalStore'un beklediği subscribe imzası:
 * dinleyici ekler, GERİ ALMA fonksiyonu döner (cleanup — React unmount'ta çağırır).
 */
export function subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

/**
 * Korumalı istekler için header: önce ensureFreshToken ile access token'ı
 * (gerekirse refresh ederek) tazeler, sonra Bearer olarak döner. Access token 15 dk
 * ömürlü olduğundan uzun oturumlarda istek ANINDA yenilenmiş token ile gider.
 * Spread ile kullanılır: headers: { "Content-Type": "...", ...(await authHeaderFresh()) }
 * Token yoksa boş obje döner -> spread hiçbir şey eklemez (koşulsuz yazılabilir).
 * (Eskiden tazelemeyen senkron bir authHeader() kardeşi vardı; hiç kullanılmadığı için silindi.)
 */
export async function authHeaderFresh(): Promise<Record<string, string>> {
    const t = await ensureFreshToken();
    return t ? {Authorization: `Bearer ${t}`} : {};
}
