"use client";

/*
 * SİTE BAŞLIĞI (yapışkan, CAM üst bar) — Client Component.
 *
 * Neden client? usePathname/useRouter hook'ları ve mobil menü state'i tarayıcı ister.
 *
 * Öğrenme notları:
 *  - usePathname(): aktif URL path'i; nav linkinde data-active ile "hangi sayfadayım"
 *    vurgusu yapılır. Seçili durum YALNIZCA renkle gösterilmez (D10): kalınlık + alt çizgi
 *    göstergesi (CSS: .nav-link[data-active="true"]::after). Ayrıca aria-current="page"
 *    ekran okuyucuya "geçerli sayfa" der.
 *  - useAuth(): login/logout anında Header'ı otomatik günceller (useSyncExternalStore).
 *  - router.refresh(): logout sonrası Server Component'ları tazeler; kullanıcının
 *    yetkisiyle çekilmiş veriler ekranda kalmasın.
 *  - Cam görünüm (D11) tamamen CSS'te: .site-header yarı saydam --surface-glass +
 *    backdrop-filter; desteklenmezse / şeffaflık azaltma açıksa opak --surface-1.
 *  - Mobil menü: CSS'te .main-nav 1023px ve altında gizlenir (003: eskiden 720); data-open="true" olunca üst barın
 *    altında --surface-2 panel olarak açılır (JS sadece state tutar, görünümü CSS yönetir).
 *    Escape menüyü kapatır ve odağı menü düğmesine geri verir (FR-013, klavye erişimi).
 *  - İkonlar ortak setten (Menu/Close) — elle çizilmiş satır içi SVG yerine (FR-006).
 *  - 003: oturum açıkken "Hesabım" (/account — dükkanlarım, önerilerim, taleplerim).
 *  - 003: "Dükkan öner" herkese görünür; oturum yoksa doğrudan giriş sayfasına `next` ile gider
 *    (`/login?next=/providers/suggest` — giriş sonrası forma dönülür).
 */

import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {useEffect, useRef, useState} from "react";
import {useAuth} from "@/lib/useAuth";
import {clearToken, getRefreshToken} from "@/lib/auth";
import {logoutServer} from "@/lib/authApi";
import ThemeToggle from "@/components/ThemeToggle";
import {Close, Menu} from "@/components/icons";

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
    const burgerRef = useRef<HTMLButtonElement>(null);

    // Menü açıkken Escape -> kapat + odağı menü düğmesine iade et.
    // Dinleyici yalnızca menü AÇIKKEN kurulur; kapanınca temizlik fonksiyonu kaldırır.
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpen(false);
                burgerRef.current?.focus();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open]);

    const logout = async () => {
        // Önce backend'de refresh token'ı İPTAL ettir (o oturum gerçekten ölsün),
        // sonra local token'ları temizle. Sıra önemli: clearToken refresh'i de siler.
        const rt = getRefreshToken();
        if (rt) await logoutServer(rt);
        clearToken();
        router.push("/");
        router.refresh();
    };

    const isAdmin = pathname.startsWith("/admin");
    const isAccount = pathname.startsWith("/account");
    const isSuggest = pathname === "/providers/suggest";

    return (
        <header className="site-header">
            <div className="container">
                <Link href="/" className="logo" onClick={() => setOpen(false)}>
                    <span className="logo-mark" aria-hidden>S</span>
                    Sanayi
                </Link>

                <nav id="main-nav" className="main-nav" data-open={open} aria-label="Ana menü">
                    {NAV.map(item => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="nav-link"
                                data-active={active}
                                aria-current={active ? "page" : undefined}
                                onClick={() => setOpen(false)}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                    <Link href={user ? "/providers/suggest" : "/login?next=/providers/suggest"} className="nav-link"
                          data-active={isSuggest} aria-current={isSuggest ? "page" : undefined}
                          onClick={() => setOpen(false)}>
                        Dükkan öner
                    </Link>
                    {user && (
                        <Link href="/account" className="nav-link" data-active={isAccount}
                              aria-current={isAccount ? "page" : undefined}
                              onClick={() => setOpen(false)}>
                            Hesabım
                        </Link>
                    )}
                    {user?.roles.includes("ADMIN") && (
                        <Link href="/admin/ratings" className="nav-link" data-active={isAdmin}
                              aria-current={isAdmin ? "page" : undefined}
                              onClick={() => setOpen(false)}>
                            Admin
                        </Link>
                    )}
                </nav>

                <div className="header-actions">
                    <ThemeToggle/>
                    {user ? (
                        <>
                            {/* İç span .truncate: chip inline-flex olduğu için "…" (ellipsis) ancak
                                içteki blok öğede çalışır; dış çip daralabilir (globals.css). */}
                            <span className="chip chip-accent user-chip" title={user.email}>
                                <span className="truncate">{user.email.split("@")[0]}</span>
                            </span>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>Çıkış</button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="btn btn-ghost btn-sm">Giriş</Link>
                            <Link href="/register" className="btn btn-primary btn-sm">Üye ol</Link>
                        </>
                    )}
                    <button
                        ref={burgerRef}
                        type="button"
                        className="btn btn-ghost btn-icon nav-burger"
                        aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
                        aria-expanded={open}
                        aria-controls="main-nav"
                        onClick={() => setOpen(v => !v)}
                    >
                        {open ? <Close/> : <Menu/>}
                    </button>
                </div>
            </div>
        </header>
    );
}
