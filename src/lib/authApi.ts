"use client";

/*
 * AUTH API katmanı — login/register/verify/forgot/reset uçları.
 *
 * Neden ayrı dosya?
 *  - api.ts server-side veri çekme içindir (Server Component'lardan çağrılır).
 *  - Auth uçları ise tarayıcıdan (Client Component) çağrılır; token localStorage'a
 *    yazılır — localStorage yalnızca tarayıcıda vardır. "use client" direktifi
 *    bu modülün client bundle'ına gireceğini işaretler.
 *
 * Hata standardı:
 *  - Başarısız yanıt (res.ok === false) ApiError'a çevrilip FIRLATILIR.
 *  - Çağıran taraf try/catch ile yakalar; err.message kullanıcıya gösterilir,
 *    err.code ile davranış dallandırılır (bkz. lib/apiError.ts).
 */

import {publicApiBase} from "@/lib/apiBase";
import {ApiError, toApiError} from "@/lib/apiError";
import {ensureFreshToken} from "@/lib/auth";
import type {CurrentUser} from "@/lib/types";

// ?? = nullish coalescing: sol taraf null/undefined ise sağdaki default kullanılır.
// 006: yalnız tarayıcıda çalışır → GENEL adres (lib/apiBase.ts).
const BASE = publicApiBase();

// Backend DTO'larının TS karşılıkları (Kotlin data class -> TS type):
export type LoginResponse = { token: string; refreshToken?: string | null };
export type RegisterResponse = {
    id: number;
    email: string;
    displayName?: string | null;
    emailVerified: boolean;
    message: string;
};
export type MessageResponse = { message: string };

/**
 * Ortak POST yardımcı fonksiyonu (DRY: her uçta aynı fetch şablonunu tekrarlamamak için).
 *
 * Generics notu: `post<T>` çağrıldığı yerde T belirtilir (ör. post<LoginResponse>(...));
 * dönüş Promise<T> olur — çağıran taraf tam tipli veri alır.
 */
async function post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        cache: "no-store", // auth yanıtları asla cache'lenmemeli
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        // Backend'in standart ErrorResponse gövdesini ApiError'a çevir ve fırlat.
        throw await toApiError(res);
    }
    return res.json() as Promise<T>;
}

export const login = (email: string, password: string) =>
    post<LoginResponse>("/auth/login", {email, password});

export const register = (email: string, password: string, displayName?: string) =>
    post<RegisterResponse>("/auth/register", {email, password, displayName: displayName || null});

export const verifyEmail = (token: string) =>
    post<LoginResponse>("/auth/verify-email", {token});

export const resendVerification = (email: string) =>
    post<MessageResponse>("/auth/resend-verification", {email});

export const forgotPassword = (email: string) =>
    post<MessageResponse>("/auth/forgot-password", {email});

// Alan adları backend'in ResetPasswordByTokenRequest DTO'su ile birebir aynı olmalı.
export const resetPasswordByToken = (token: string, newPassword: string, newPasswordAgain: string) =>
    post<MessageResponse>("/auth/reset-password-token", {token, newPassword, newPasswordAgain});

/** Logout: refresh token'ı backend'de iptal ettir (o oturum anında ölür). Hata olsa da sessiz geç. */
export async function logoutServer(refreshToken: string): Promise<void> {
    try {
        await fetch(`${BASE}/auth/logout`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            cache: "no-store",
            body: JSON.stringify({refreshToken}),
        });
    } catch { /* ağ hatası olsa bile client tarafında token'ı temizleyeceğiz */ }
}

/**
 * 003: oturumdaki kullanıcı (GET /api/user/me) — rol ve `emailVerified`.
 *
 * Neden ayrı istek? JWT payload'ı yalnız e-posta + rol + exp taşır; "e-postası doğrulanmış mı?"
 * bilgisi belirteçte YOK (doğrulama sonradan değişebilir). Hesap sayfaları (AccountShell) bu
 * bilgiyle "önce e-postanı doğrula" ekranını gösterir. Belirteç yoksa istek atılmadan 401
 * ApiError fırlatılır (çağıran giriş sayfasına yönlendirir).
 */
export async function getMe(): Promise<CurrentUser> {
    const token = await ensureFreshToken();
    if (!token) throw new ApiError(401, "error.auth.unauthorized", "Bu işlem için giriş yapmalısınız.");
    const res = await fetch(`${BASE}/user/me`, {
        headers: {Authorization: `Bearer ${token}`},
        cache: "no-store",
    });
    if (!res.ok) throw await toApiError(res);
    return res.json() as Promise<CurrentUser>;
}
