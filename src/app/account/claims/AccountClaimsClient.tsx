"use client";

/*
 * TALEPLERİM — liste (003 / T115).
 *
 * Durum süzgeci Önerilerim ile aynı yöntemle SUNUCUDA: `GET /api/claims/mine?status=&page=&size=`
 * (süzme + sayfalama backend'de; "ALL" gönderilmez).
 * Satır: dükkan, tür ("İtiraz" rozeti), durum ("Süresi doldu" dahil), tarih, gerekçe, belge
 * ADLARI — indirme bağlantısı YOK (belgeler yalnız yöneticiye açık; silinen "silindi").
 * İncelemedeyken "Geri çek" (belgeler hemen silinir).
 */
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useState} from "react";
import AccountShell from "@/components/AccountShell";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/components/Pagination";
import ConfirmButton from "@/components/ConfirmButton";
import StatusChip from "@/components/StatusChip";
import {formatDateTime} from "@/components/ChangeHistory";
import {useAuthedData} from "@/lib/useAuthedData";
import {myClaims, withdrawClaim} from "@/lib/accountApi";
import {ensureFreshToken} from "@/lib/auth";
import {ApiError, errorMessage} from "@/lib/apiError";
import type {ClaimStatus} from "@/lib/types";
import {File as FileIcon, Shield} from "@/components/icons";

const PAGE_SIZE = 20;
/** Süzgeç değeri: bir talep durumu ya da "ALL" (hepsi; backend'e gönderilmez). */
type Filter = ClaimStatus | "ALL";
const FILTERS: Array<{ value: Filter; label: string }> = [
    {value: "ALL", label: "Tümü"},
    {value: "PENDING", label: "İncelemede"},
    {value: "APPROVED", label: "Onaylandı"},
    {value: "REJECTED", label: "Reddedildi"},
    {value: "WITHDRAWN", label: "Geri çekildi"},
    {value: "EXPIRED", label: "Süresi doldu"},
];

/** Taze belirteç; yoksa açık 401 (eskiden `!` ile "Bearer null" gidebiliyordu). */
async function token(): Promise<string> {
    const t = await ensureFreshToken();
    if (!t) throw new ApiError(401, "error.auth.unauthorized", "Oturumunuzun süresi doldu. Yeniden giriş yapın.");
    return t;
}

function List({status, page}: { status: Filter; page: number }) {
    const router = useRouter();
    const [actionError, setActionError] = useState<string | null>(null);
    const filtered = status !== "ALL";
    const data = useAuthedData(`my-claims:${status}:${page}`, t => myClaims(t, page, PAGE_SIZE, status));

    function setFilter(value: Filter) {
        const params = new URLSearchParams(window.location.search);
        if (value === "ALL") params.delete("status"); else params.set("status", value);
        params.delete("page");
        router.push(`?${params.toString()}`);
    }

    async function withdraw(id: number) {
        setActionError(null);
        try {
            const updated = await withdrawClaim(await token(), id);
            data.mutate(p => ({...p, content: p.content.map(c => (c.id === id ? updated : c))}));
        } catch (e) {
            setActionError(errorMessage(e, "Geri çekilemedi."));
        }
    }

    return (
        <div className="stack">
            <div className="chip-cluster" role="group" aria-label="Duruma göre süz">
                {FILTERS.map(f => (
                    <button key={f.value} type="button" className="chip" aria-pressed={status === f.value}
                            onClick={() => setFilter(f.value)}>{f.label}</button>
                ))}
            </div>

            {actionError && <div className="alert alert-error" role="alert">{actionError}</div>}
            {data.error ? <div className="alert alert-error" role="alert">{errorMessage(data.error, "Liste alınamadı.")}</div> : null}
            {data.loading && !data.data && <p className="muted" role="status">Yükleniyor…</p>}
            {data.data && data.data.content.length === 0 && (
                <EmptyState icon={<Shield/>} title={filtered ? "Bu durumda talep yok" : "Henüz sahiplenme talebiniz yok"}
                            description="Dükkanınızın sayfasındaki &ldquo;Bu dükkan benim&rdquo; bağlantısıyla talep gönderebilirsiniz."
                            action={<Link href="/providers" className="btn btn-outline">Dükkanları keşfet</Link>}/>
            )}
            {data.data && data.data.content.length > 0 && (
                <ul className="stack">
                    {data.data.content.map(c => (
                        <li key={c.id} className="card request-item">
                            <div className="request-head">
                                <div className="stack-sm request-body">
                                    <Link href={`/providers/${c.provider.id}`} className="card-title link-accent">{c.provider.name}</Link>
                                    <span className="caption muted">
                                        Talep #{c.id} &middot; <time dateTime={c.createdAt}>{formatDateTime(c.createdAt)}</time>
                                        {c.decidedAt ? <> &middot; karar: <time dateTime={c.decidedAt}>{formatDateTime(c.decidedAt)}</time></> : null}
                                    </span>
                                </div>
                                <div className="cluster">
                                    {c.kind === "DISPUTE" && <span className="chip chip-accent">İtiraz</span>}
                                    <StatusChip status={c.status}/>
                                </div>
                            </div>
                            {c.decisionReason && <p className="callout"><b>Gerekçe:</b> {c.decisionReason}</p>}
                            {c.documents.length > 0 && (
                                <ul className="file-list" aria-label={`Talep #${c.id} belgeleri`}>
                                    {c.documents.map(d => (
                                        <li key={d.id} className="file-item">
                                            <FileIcon size="sm"/>
                                            <span className="file-name">{d.originalName ?? `Belge ${d.id}`}</span>
                                            {d.deleted && <span className="caption muted">(silindi)</span>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {c.status === "PENDING" && (
                                <div className="row-actions request-actions">
                                    <ConfirmButton label="Geri çek" confirmLabel="Talep geri çekilsin mi? Belgeler silinir."
                                                   className="btn btn-outline btn-sm"
                                                   srLabel={`talep #${c.id}, ${c.provider.name}`}
                                                   onConfirm={() => withdraw(c.id)}/>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            {data.data && <Pagination mode="url" page={page} totalPages={data.data.totalPages}/>}
        </div>
    );
}

export default function AccountClaimsClient({status, page}: { status: Filter; page: number }) {
    return (
        <AccountShell title="Taleplerim" requireVerified={false}
                      subtitle="Sahiplenme taleplerinizin durumu. Belgeleri yalnız yöneticiler görür.">
            {() => <List status={status} page={page}/>}
        </AccountShell>
    );
}
