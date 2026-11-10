/*
 * GİRİŞ SAYFASI — Server Component (yalnızca kabuk).
 *
 * Neden ayrı dosya? `metadata` (sekme başlığı: "Giriş | Sanayi") yalnızca SERVER
 * Component'ten export edilebilir; formun kendisi state/olay kullandığı için client.
 * Kalıp verify-email / reset-password ile aynı: server page -> client form bileşeni.
 *
 * 003 — giriş dönüşü (`/login?next=/providers/suggest`): URL'i SUNUCU okur (anayasa II),
 * `safeNext` ile yalnız site içi göreli yol kabul edilir (açık yönlendirme engeli —
 * ayrıntı params.ts), forma prop olarak iner. Geçersizse `undefined` -> ana sayfa.
 */
import type {Metadata} from "next";
import LoginForm from "./LoginForm";
import {safeNext} from "@/lib/params";

export const metadata: Metadata = {title: "Giriş"};

export default async function LoginPage({searchParams}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const sp = await searchParams;
    return <LoginForm next={safeNext(sp.next)}/>;
}
