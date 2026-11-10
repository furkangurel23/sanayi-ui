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
 *
 * 002: başlık ortak PageHeader; yetkisiz ekran EmptyState + Shield ikonu (emoji yok);
 * sekmeler .seg — aktif sekme D10 kuralıyla (zemin + kenar + kalınlık) ve
 * aria-current="page" ile (ekran okuyucu "geçerli sayfa" der). Satır içi stil yok.
 */

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useAuth} from "@/lib/useAuth";
import type {ReactNode} from "react";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import {Shield} from "@/components/icons";

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
                <EmptyState
                    icon={<Shield/>}
                    title="Bu sayfa yöneticilere özel"
                    description="Devam etmek için admin hesabıyla giriş yap."
                    action={<Link href="/login" className="btn btn-primary">Giriş yap</Link>}
                />
            </main>
        );
    }

    return (
        <main className="container page">
            <PageHeader eyebrow="Yönetim" title="Admin paneli"/>

            {/* Sekme çubuğu: aktif sekme .seg[data-active] ile vurgulanır (D10: zemin + kenar
                + kalınlık); dar ekranda sığmazsa kendi içinde yatay kayar (.admin-tabs). */}
            <nav className="seg admin-tabs" aria-label="Admin bölümleri">
                {TABS.map(t => (
                    <Link key={t.href} href={t.href} data-active={pathname === t.href}
                          aria-current={pathname === t.href ? "page" : undefined}>
                        {t.label}
                    </Link>
                ))}
            </nav>

            {children}
        </main>
    );
}
