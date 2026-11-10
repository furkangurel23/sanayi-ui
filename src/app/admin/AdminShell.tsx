"use client";

/*
 * ADMIN KABUĞU — ortak yetki kontrolü + sekme çubuğu.
 *
 * Neden ayrı bir kabuk? Üç admin sekmesi de (Yorumlar/Dükkanlar/Kullanıcılar)
 * aynı iki şeye ihtiyaç duyar: (1) "ADMIN mi?" kontrolü, (2) sekme navigasyonu.
 * Bunu tek yerde toplamak DRY'dır; her sekme sadece kendi tablosuna odaklanır.
 *
 * useAuth: login/logout'ta otomatik render (useSyncExternalStore). Admin değilse
 * içerik hiç render edilmez -> yetkisiz kullanıcı tabloları görmez (backend zaten
 * 403 döner ama UI'da da göstermemek daha temiz).
 */

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useAuth} from "@/lib/useAuth";
import type {ReactNode} from "react";

const TABS = [
    {href: "/admin/ratings", label: "Yorumlar"},
    {href: "/admin/providers", label: "Dükkanlar"},
    {href: "/admin/users", label: "Kullanıcılar"},
];

export default function AdminShell({children}: { children: ReactNode }) {
    const pathname = usePathname();
    const user = useAuth();

    if (!user?.roles.includes("ADMIN")) {
        return (
            <main className="container page">
                <div className="empty-state">
                    <div style={{fontSize: "2rem"}} aria-hidden>🛡️</div>
                    <b>Bu sayfa yöneticilere özel</b>
                    <span>Devam etmek için admin hesabıyla giriş yap.</span>
                    <Link href="/login" className="btn btn-primary">Giriş yap</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="container page">
            <div className="stack-sm">
                <span className="eyebrow">Yönetim</span>
                <h1 className="section-title" style={{fontSize: "var(--type-title)"}}>Admin paneli</h1>
            </div>

            {/* Sekme çubuğu: aktif sekme .seg[data-active] ile vurgulanır (tasarım sistemi) */}
            <nav className="seg" aria-label="Admin bölümleri" style={{width: "fit-content"}}>
                {TABS.map(t => (
                    <Link key={t.href} href={t.href} data-active={pathname === t.href}
                          style={{textDecoration: "none"}}>
                        {t.label}
                    </Link>
                ))}
            </nav>

            {children}
        </main>
    );
}
