"use client";

/*
 * DÜKKANLARIM (003 / T098) — `GET /api/owner/providers`: aktif sahipliklerim (sahip değilsem
 * boş liste). Her satırda dükkan sayfası + "Düzenle". Sahiplik "Bu dükkan benim" talebinin
 * yönetici onayıyla oluşur; boş durumda bu yol anlatılır.
 */
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import EmptyState from "@/components/EmptyState";
import ScoreBadge from "@/components/ScoreBadge";
import {useAuthedData} from "@/lib/useAuthedData";
import {ownerProviders} from "@/lib/accountApi";
import {errorMessage} from "@/lib/apiError";
import {Shield} from "@/components/icons";
import {formatDateTime} from "@/components/ChangeHistory";

function List() {
    const {data, error, loading} = useAuthedData("owner:providers", ownerProviders);
    if (error) return <div className="alert alert-error" role="alert">{errorMessage(error, "Liste alınamadı.")}</div>;
    if (loading && !data) return <p className="muted" role="status">Yükleniyor…</p>;
    if (!data || data.length === 0) {
        return (
            <EmptyState icon={<Shield/>} title="Sahibi olduğunuz dükkan yok"
                        description="Dükkanınızın sayfasındaki &ldquo;Bu dükkan benim&rdquo; bağlantısıyla sahiplik talebi gönderin; yönetici onaylayınca burada görünür."/>
        );
    }
    return (
        <ul className="stack">
            {data.map(p => (
                <li key={p.providerId} className="card owned-item">
                    <div className="owned-item-body">
                        <Link href={`/providers/${p.providerId}`} className="card-title link-accent">{p.name}</Link>
                        <span className="caption muted">
                            {p.district ?? "İlçe yok"} &middot; {formatDateTime(p.since)} tarihinden beri sahibisiniz
                        </span>
                    </div>
                    <ScoreBadge score={p.avgScore} count={p.ratingCount}/>
                    <Link href={`/account/providers/${p.providerId}/edit`} className="btn btn-outline btn-sm">
                        Düzenle<span className="sr-only">: {p.name}</span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}

export default function OwnedProvidersClient() {
    return (
        <AccountShell title="Dükkanlarım" subtitle="Sahibi olduğunuz dükkanların bilgilerini ve çalışma saatlerini güncelleyin.">
            {() => <List/>}
        </AccountShell>
    );
}
