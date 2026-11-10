"use client";

/*
 * ADMIN · YORUMLAR — moderasyon (sil / geri al / log görüntüle).
 *
 * URL-state DEĞİL local state: admin tam SPA (paylaşılabilir link gereksiz),
 * useSearchParams kaldırıldı -> Suspense derdi de yok. Yetki + başlık AdminShell'de.
 */

import {adminDeleteRating, adminListLogs, adminListRatings, adminRestoreRating} from "@/lib/adminApi";
import {useEffect, useState} from "react";
import type {AdminRatingItem, ModerationLogItem, Page} from "@/lib/types";
import {ensureFreshToken} from "@/lib/auth";
import {errorMessage} from "@/lib/apiError";
import ConfirmButton from "@/components/ConfirmButton";
import AdminShell from "@/app/admin/AdminShell";

function formatDate(iso: string) {
    try {
        return new Date(iso).toLocaleString("tr-TR");
    } catch {
        return iso;
    }
}

function RatingsAdmin() {
    const [providerId, setProviderId] = useState("");
    const [q, setQ] = useState("");
    const [status, setStatus] = useState<"ACTIVE" | "DELETED" | "ALL">("ACTIVE");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [page, setPage] = useState<number>(1);
    const size = 20;

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [data, setData] = useState<Page<AdminRatingItem> | null>(null);

    const [logForId, setLogForId] = useState<number | null>(null);
    const [logs, setLogs] = useState<Page<ModerationLogItem> | null>(null);
    const [logsLoading, setLogsLoading] = useState(false);

    async function fetchList(nextPage = page) {
        const token = await ensureFreshToken();
        if (!token) return;
        setLoading(true);
        setErr(null);
        try {
            const res = await adminListRatings(token, {
                providerId: providerId || undefined,
                q: q || undefined,
                status,
                from: from || undefined,
                to: to || undefined,
                page: nextPage,
                size,
            });
            setData(res);
            setPage(nextPage);
        } catch (error: unknown) {
            setErr(errorMessage(error, "Liste alınamadı."));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchList(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function applyFilters() {
        fetchList(1);
    }

    function goPage(p: number) {
        fetchList(p);
    }

    async function doDelete(id: number, reason?: string) {
        try {
            await adminDeleteRating((await ensureFreshToken())!, id, reason);
            setData(d => d ? {
                ...d,
                content: d.content.map(it => it.id === id ? {...it, deletedAt: new Date().toISOString()} : it),
            } : d);
        } catch (error: unknown) {
            setErr(errorMessage(error, "Silme başarısız."));
        }
    }

    async function doRestore(id: number) {
        try {
            await adminRestoreRating((await ensureFreshToken())!, id);
            setData(d => d ? {
                ...d,
                content: d.content.map(it => it.id === id ? {...it, deletedAt: null} : it),
            } : d);
        } catch (error: unknown) {
            setErr(errorMessage(error, "Geri alma başarısız."));
        }
    }

    async function openLogs(ratingId: number) {
        setLogForId(ratingId);
        setLogs(null);
        setLogsLoading(true);
        try {
            setLogs(await adminListLogs((await ensureFreshToken())!, ratingId, 0, 20));
        } catch (error: unknown) {
            setErr(errorMessage(error, "Loglar alınamadı."));
        } finally {
            setLogsLoading(false);
        }
    }

    return (
        <>
            <div className="row-between">
                <span className="text-sm muted">Yorum moderasyonu</span>
                <button onClick={() => fetchList(page)} className="btn btn-outline btn-sm" disabled={loading}>
                    {loading ? "Yükleniyor…" : "Yenile"}
                </button>
            </div>

            {/* Filtreler */}
            <div className="card stack" style={{padding: "1rem 1.25rem"}}>
                <div className="grid-3" style={{gap: "0.75rem"}}>
                    <div className="row" style={{gap: "0.5rem"}}>
                        <input className="input" value={providerId} onChange={e => setProviderId(e.target.value)}
                               placeholder="Provider ID"/>
                        <select className="select" style={{width: "9rem"}} value={status}
                                onChange={e => setStatus(e.target.value as "ACTIVE" | "DELETED" | "ALL")}>
                            <option value="ACTIVE">Aktif</option>
                            <option value="DELETED">Silinmiş</option>
                            <option value="ALL">Tümü</option>
                        </select>
                    </div>
                    <input className="input" value={q} onChange={e => setQ(e.target.value)}
                           placeholder="Yorum içinde ara"/>
                    <div className="row" style={{gap: "0.5rem"}}>
                        <input className="input" type="datetime-local" value={from}
                               onChange={e => setFrom(e.target.value)}/>
                        <input className="input" type="datetime-local" value={to}
                               onChange={e => setTo(e.target.value)}/>
                    </div>
                </div>
                <div className="row">
                    <button onClick={applyFilters} className="btn btn-primary" disabled={loading}>Uygula</button>
                    <button
                        className="btn btn-ghost"
                        onClick={() => {
                            setProviderId("");
                            setQ("");
                            setFrom("");
                            setTo("");
                            setStatus("ACTIVE");
                            fetchList(1);
                        }}
                    >
                        Temizle
                    </button>
                </div>
            </div>

            {err && <div className="alert alert-error">{err}</div>}

            {/* Liste */}
            <div className="table-wrap">
                <table className="data">
                    <thead>
                    <tr>
                        <th>Usta</th>
                        <th>Skor</th>
                        <th>Yorum</th>
                        <th>Kullanıcı</th>
                        <th>IP</th>
                        <th>Tarih</th>
                        <th>Durum</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {!data?.content?.length && !loading && (
                        <tr>
                            <td colSpan={8} className="muted">Kayıt yok.</td>
                        </tr>
                    )}
                    {data?.content.map(it => {
                        const who = it.anonymousId ? `Anon (${it.anonymousId.slice(0, 12)}…)` : it.userDisplayName || "User";
                        return (
                            <tr key={it.id}>
                                <td>
                                    <a href={`/providers/${it.providerId}`} target="_blank"
                                       rel="noreferrer noopener"
                                       style={{color: "var(--accent-text)", fontWeight: 550}}>
                                        {it.providerName}
                                    </a>
                                    <div className="text-xs faint">#{it.id}</div>
                                </td>
                                <td style={{fontWeight: 700}}>{it.score > 0 ? `+${it.score}` : it.score}</td>
                                <td style={{maxWidth: 340}}>{it.comment || <span className="faint">—</span>}</td>
                                <td>{who}</td>
                                <td className="text-xs muted">{it.ip || "—"}</td>
                                <td className="text-xs muted">{formatDate(it.createdAt)}</td>
                                <td>
                                    <span className="chip"
                                          style={{color: it.deletedAt ? "var(--neg)" : "var(--pos)"}}>
                                        {it.deletedAt ? "Silinmiş" : "Aktif"}
                                    </span>
                                </td>
                                <td style={{whiteSpace: "nowrap", textAlign: "right"}}>
                                    <span className="row" style={{gap: "0.35rem", justifyContent: "flex-end"}}>
                                        <button onClick={() => openLogs(it.id)}
                                                className="btn btn-outline btn-sm">Log</button>
                                        {!it.deletedAt ? (
                                            <ConfirmButton label="Sil" askReason
                                                           onConfirm={(reason) => doDelete(it.id, reason)}/>
                                        ) : (
                                            <button onClick={() => doRestore(it.id)}
                                                    className="btn btn-outline btn-sm">Geri al</button>
                                        )}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {/* Sayfalama */}
            <nav className="row" style={{justifyContent: "center"}} aria-label="Sayfalama">
                <button className="btn btn-outline btn-sm" onClick={() => goPage(Math.max(1, page - 1))}
                        disabled={page <= 1}>← Önceki
                </button>
                <span className="text-sm muted">Sayfa {page} / {data?.totalPages ? Math.max(1, data.totalPages) : 1}</span>
                <button className="btn btn-outline btn-sm"
                        onClick={() => goPage(Math.min(data?.totalPages || 1, page + 1))}
                        disabled={page >= (data?.totalPages || 1)}>Sonraki →
                </button>
            </nav>

            {/* Log paneli */}
            {logForId !== null && (
                <div role="dialog" aria-modal="true"
                     style={{
                         position: "fixed", inset: 0, background: "oklch(0 0 0 / 0.45)",
                         backdropFilter: "blur(4px)", display: "flex", zIndex: 200,
                     }}
                     onClick={() => setLogForId(null)}>
                    <div className="card stack"
                         style={{
                             marginLeft: "auto", height: "100%", width: "100%", maxWidth: "34rem",
                             borderRadius: 0, overflow: "auto",
                         }}
                         onClick={e => e.stopPropagation()}>
                        <div className="row-between">
                            <h2 className="section-title">Loglar · #{logForId}</h2>
                            <button onClick={() => setLogForId(null)} className="btn btn-ghost btn-sm">Kapat</button>
                        </div>

                        {logsLoading && <div className="muted text-sm">Yükleniyor…</div>}
                        {!logsLoading && !logs?.content?.length && (
                            <div className="muted text-sm">Log bulunamadı.</div>
                        )}

                        <ul className="stack-sm">
                            {logs?.content.map(l => (
                                <li key={l.id} className="card" style={{padding: "0.7rem 0.9rem"}}>
                                    <div className="row-between">
                                        <b className="text-sm">{l.action}</b>
                                        <span className="text-xs faint">{formatDate(l.createdAt)}</span>
                                    </div>
                                    <div className="text-xs muted" style={{marginTop: "0.25rem"}}>
                                        actor: {l.actorEmail || (l.actorUserId ? `#${l.actorUserId}` : "?")}
                                        {l.ipAddress ? ` · ip: ${l.ipAddress}` : ""}
                                    </div>
                                    {l.reason && <div className="text-xs" style={{marginTop: "0.25rem"}}>sebep: {l.reason}</div>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </>
    );
}

export default function AdminRatingsPage() {
    return <AdminShell><RatingsAdmin/></AdminShell>;
}
