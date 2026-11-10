"use client";

/*
 * SİTE BAŞLIĞI (sticky header) — Client Component.
 *
 * Neden client? usePathname/useRouter hook'ları ve mobil menü state'i tarayıcı ister.
 *
 * Öğrenme notları:
 *  - usePathname(): aktif URL path'i; nav linkinde data-active ile "hangi sayfadayım"
 *    vurgusu yapılır (CSS: .nav-link[data-active="true"]).
 *  - useAuth(): login/logout anında Header'ı otomatik günceller (useSyncExternalStore).
 *  - router.refresh(): logout sonrası Server Component'ları tazeler; kullanıcının
 *    yetkisiyle çekilmiş veriler ekranda kalmasın.
 *  - Mobil menü: CSS'te .main-nav 720px altında gizlenir; data-open="true" olunca
 *    fixed panel olarak açılır (JS sadece state tutar, görünümü CSS yönetir).
 */

import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {useState} from "react";
import {useAuth} from "@/lib/useAuth";
import {clearToken, getRefreshToken} from "@/lib/auth";
import {logoutServer} from "@/lib/authApi";
import ThemeToggle from "@/components/ThemeToggle";

const NAV = [
    {href: "/providers", label: "Ustalar"},
    {href: "/brands", label: "Markalar"},
    {href: "/chat", label: "Sohbet"},
    {href: "/providers/near", label: "Yakınımdakiler"},
];

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const user = useAuth();
    const [open, setOpen] = useState(false);

    const logout = async () => {
        // Önce backend'de refresh token'ı İPTAL ettir (o oturum gerçekten ölsün),
        // sonra local token'ları temizle. Sıra önemli: clearToken refresh'i de siler.
        const rt = getRefreshToken();
        if (rt) await logoutServer(rt);
        clearToken();
        router.push("/");
        router.refresh();
    };

    return (
        <header className="site-header">
            <div className="container">
                <Link href="/" className="logo" onClick={() => setOpen(false)}>
                    <span className="logo-mark">S</span>
                    Sanayi
                </Link>

                <nav className="main-nav" data-open={open} aria-label="Ana menü">
                    {NAV.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="nav-link"
                            data-active={pathname === item.href}
                            onClick={() => setOpen(false)}
                        >
                            {item.label}
                        </Link>
                    ))}
                    {user?.roles.includes("ADMIN") && (
                        <Link href="/admin/ratings" className="nav-link" data-active={pathname.startsWith("/admin")}
                              onClick={() => setOpen(false)}>
                            Admin
                        </Link>
                    )}
                </nav>

                <div className="header-actions">
                    <ThemeToggle/>
                    {user ? (
                        <>
                            <span className="chip chip-accent truncate" style={{maxWidth: "10rem"}}
                                  title={user.email}>
                                {user.email.split("@")[0]}
                            </span>
                            <button className="btn btn-ghost btn-sm" onClick={logout}>Çıkış</button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="btn btn-ghost btn-sm">Giriş</Link>
                            <Link href="/register" className="btn btn-primary btn-sm">Üye ol</Link>
                        </>
                    )}
                    <button
                        type="button"
                        className="btn btn-ghost btn-icon nav-burger"
                        aria-label="Menüyü aç/kapat"
                        aria-expanded={open}
                        onClick={() => setOpen(v => !v)}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2" strokeLinecap="round" aria-hidden>
                            {open ? <path d="M6 6l12 12M18 6L6 18"/> : <path d="M4 7h16M4 12h16M4 17h16"/>}
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
}
