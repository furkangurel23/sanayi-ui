"use client";

/*
 * ADMIN · TALEP KUYRUĞU — client (003 / T116). Öneri kuyruğuyla aynı kalıp: filtreler ve seçili
 * talep (`id`) URL'de, yazım tıklama anında; `Pagination mode="url"`; en eski önce.
 * Satırda "İtiraz" rozeti (aynı dükkanın sahibi ya da bekleyen başka talebi varken gelen talep).
 */
import {useRouter} from "next/navigation";
import {useState} from "react";
import {useAuthedData} from "@/lib/useAuthedData";
import {adminClaims} from "@/lib/adminApi";
import {errorMessage} from "@/lib/apiError";
import {DISTRICT_NAMES} from "@/lib/districts";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import StatusChip from "@/components/StatusChip";
import {formatDateTime} from "@/components/ChangeHistory";
import {Shield} from "@/components/icons";
import ClaimReview from "./ClaimReview";

type Props = { status: string; kind?: string; district?: string; q?: string; page: number; selected?: number };

const STATUS_FILTERS = [
    {value: "PENDING", label: "Bekleyen"},
    {value: "APPROVED", label: "Onaylanan"},
    {value: "REJECTED", label: "Reddedilen"},
    {value: "WITHDRAWN", label: "Geri çekilen"},
    {value: "EXPIRED", label: "Süresi dolan"},
    {value: "ALL", label: "Tümü"},
];
const KIND_FILTERS = [
    {value: undefined, label: "Tüm türler"},
    {value: "NORMAL", label: "Normal"},
    {value: "DISPUTE", label: "İtiraz"},
];

export default function AdminClaimsClient({status, kind, district, q, page, selected}: Props) {
    const router = useRouter();
    const [qText, setQText] = useState(q ?? "");
    const list = useAuthedData(`admin-claims:${status}:${kind ?? ""}:${district ?? ""}:${q ?? ""}:${page}`,
        t => adminClaims(t, {status, kind, district, q, page, size: 20}));

    function apply(patch: Record<string, string | undefined>, resetPage = true) {
        const params = new URLSearchParams(window.location.search);
        Object.entries(patch).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
        if (resetPage) params.delete("page");
        router.push(`?${params.toString()}`, {scroll: !patch.id});
    }

    const applyQ = () => apply({q: qText.trim().length >= 2 ? qText.trim() : undefined, id: undefined});

    return (
        <div className="stack">
            <div className="card admin-toolbar" role="search">
                <div className="chip-cluster" role="group" aria-label="Talep durumu">
                    {STATUS_FILTERS.map(f => (
                        <button key={f.value} type="button" className="chip" aria-pressed={status === f.value}
                                onClick={() => apply({status: f.value === "PENDING" ? undefined : f.value, id: undefined})}>
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="chip-cluster" role="group" aria-label="Talep türü">
                    {KIND_FILTERS.map(f => (
                        <button key={f.label} type="button" className="chip" aria-pressed={kind === f.value}
                                onClick={() => apply({kind: f.value, id: undefined})}>
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="admin-search admin-search-flat">
                    <select className="select select-compact" aria-label="İlçe" value={district ?? ""}
                            onChange={e => apply({district: e.target.value || undefined, id: undefined})}>
                        <option value="">Tüm ilçeler</option>
                        {DISTRICT_NAMES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input className="input" type="search" placeholder="Dükkan adı (en az 2 harf)" aria-label="Dükkan adı ara"
                           value={qText} onChange={e => setQText(e.target.value)}
                           onKeyDown={e => e.key === "Enter" && applyQ()}/>
                    <button type="button" className="btn btn-primary" onClick={applyQ}>Ara</button>
                    {(district || q) && (
                        <button type="button" className="btn btn-ghost" onClick={() => {
                            setQText("");
                            apply({district: undefined, q: undefined, id: undefined});
                        }}>Temizle</button>
                    )}
                </div>
            </div>

            {selected !== undefined && (
                <ClaimReview id={selected} onClose={() => apply({id: undefined}, false)} onDecided={() => list.reload()}/>
            )}

            {list.error ? <div className="alert alert-error" role="alert">{errorMessage(list.error, "Kuyruk alınamadı.")}</div> : null}
            {list.loading && !list.data && <p className="muted" role="status">Yükleniyor…</p>}
            {list.data && list.data.content.length === 0 && (
                <EmptyState icon={<Shield/>} title={status === "PENDING" ? "Bekleyen talep yok" : "Kayıt yok"}
                            description="Üyelerin &ldquo;Bu dükkan benim&rdquo; talepleri burada listelenir."/>
            )}
            {list.data && list.data.content.length > 0 && (
                <>
                    <p className="caption muted" role="status">{list.data.totalElements} talep (en eski önce)</p>
                    <ul className="stack">
                        {list.data.content.map(c => (
                            <li key={c.id} className="card request-item" data-selected={c.id === selected}>
                                <div className="request-head">
                                    <div className="stack-sm request-body">
                                        <span className="card-title">{c.provider.name}</span>
                                        <span className="caption muted">
                                            Talep #{c.id} &middot; {c.providerDistrict ?? "İlçe yok"} &middot; {c.claimant.email} &middot;{" "}
                                            <time dateTime={c.createdAt}>{formatDateTime(c.createdAt)}</time>
                                        </span>
                                    </div>
                                    <div className="cluster">
                                        {c.kind === "DISPUTE" && <span className="chip chip-neg">İtiraz</span>}
                                        <StatusChip status={c.status}/>
                                    </div>
                                </div>
                                <div className="row-actions request-actions">
                                    <button type="button" className="btn btn-outline btn-sm"
                                            aria-current={c.id === selected ? "true" : undefined}
                                            onClick={() => apply({id: String(c.id)}, false)}>
                                        İncele<span className="sr-only">: talep #{c.id}, {c.provider.name}</span>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <Pagination mode="url" page={page} totalPages={list.data.totalPages}/>
                </>
            )}
        </div>
    );
}
