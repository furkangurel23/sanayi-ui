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
 * T041: yetkisiz ekranın h1'i EmptyState başlığının kendisi (titleAs="h1").
 *
 * 003 (T101): + "Dikkat" (ve sonraki dilimlerde "Öneriler", "Talepler") sekmeleri. Etkin sekme
 * artık `pathname.startsWith(href)` — alt sayfalar (/admin/providers/12) da sekmeyi etkin
 * gösterir. Kuyruk sekmelerinde SAYI ROZETİ (`GET /api/admin/queues/counts`): görünür sayı +
 * bağlantının erişilebilir adında sayı ("Dikkat, 3 bekleyen"). Bir karar verilince içerik
 * bileşeni `notifyQueueCountsChanged()` yayınlar; kabuk dinler ve sayıları yeniden çeker.
 */

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useAuth} from "@/lib/useAuth";
import {type ReactNode, useEffect} from "react";
import {useAuthedData} from "@/lib/useAuthedData";
import {queueCounts} from "@/lib/adminApi";
import {QUEUE_COUNTS_EVENT} from "@/lib/queueEvents";
import type {QueueCounts} from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import {Shield} from "@/components/icons";

type Tab = { href: string; label: string; count?: (c: QueueCounts) => number };

const TABS: Tab[] = [
    {href: "/admin/ratings", label: "Yorumlar"},
    {href: "/admin/providers", label: "Dükkanlar"},
    {href: "/admin/users", label: "Kullanıcılar"},
    {href: "/admin/suggestions", label: "Öneriler", count: c => c.pendingSuggestions},
    {href: "/admin/attention", label: "Dikkat", count: c => c.openAttention},
];

export default function AdminShell({children}: { children: ReactNode }) {
    const pathname = usePathname();
    const user = useAuth();
    const isAdmin = Boolean(user?.roles.includes("ADMIN"));
    const counts = useAuthedData(isAdmin ? "admin:queue-counts" : null, queueCounts);
    const reloadCounts = counts.reload;

    // Karar sonrası rozetleri tazele (olay geri çağrısında setState — effect gövdesinde değil).
    useEffect(() => {
        window.addEventListener(QUEUE_COUNTS_EVENT, reloadCounts);
        return () => window.removeEventListener(QUEUE_COUNTS_EVENT, reloadCounts);
    }, [reloadCounts]);

    if (!isAdmin) {
        return (
            <main className="container page">
                <EmptyState
                    icon={<Shield/>}
                    titleAs="h1"
                    title="Bu sayfa yöneticilere özel"
                    description="Devam etmek için admin hesabıyla giriş yap."
                    action={<Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn btn-primary">Giriş yap</Link>}
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
                {TABS.map(t => {
                    const active = pathname.startsWith(t.href);
                    const n = t.count && counts.data ? t.count(counts.data) : 0;
                    return (
                        <Link key={t.href} href={t.href} data-active={active}
                              aria-current={active ? "page" : undefined}
                              aria-label={n > 0 ? `${t.label}, ${n} bekleyen` : undefined}>
                            {t.label}
                            {n > 0 && <span className="tab-badge" aria-hidden>{n}</span>}
                        </Link>
                    );
                })}
            </nav>

            {children}
        </main>
    );
}
