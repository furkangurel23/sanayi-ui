"use client";

/*
 * ADMIN · YORUMLAR — moderasyon (sil / geri al / log görüntüle).
 *
 * URL-state DEĞİL local state: admin tam SPA (paylaşılabilir link gereksiz),
 * useSearchParams kaldırıldı -> Suspense derdi de yok. Yetki + başlık AdminShell'de.
 *
 * 002: 17 satır içi stil sınıflara taşındı (.admin-toolbar/.admin-filters, .cell-*,
 * .chip-pos/-neg, .row-actions); sayfalama ortak <Pagination mode="callback"> (yerel state,
 * URL'e ?page YAZILMAZ — admin URL'leri değişmez); log paneli elle yazılmış perde yerine
 * ortak <Dialog> (Escape kapatır, odak içeride döner, kapanınca "Log" butonuna geri gelir —
 * FR-010). Tablo .table-wrap içinde: dar ekranda yatay kaydırma TABLO KABINDA kalır.
 */

import {adminDeleteRating, adminListLogs, adminListRatings, adminRestoreRating} from "@/lib/adminApi";
import {useEffect, useState} from "react";
import type {AdminRatingItem, ModerationLogItem, Page} from "@/lib/types";
import {ensureFreshToken} from "@/lib/auth";
import {errorMessage} from "@/lib/apiError";
import ConfirmButton from "@/components/ConfirmButton";
import AdminShell from "@/app/admin/AdminShell";
import Pagination from "@/components/Pagination";
import Dialog from "@/components/Dialog";
import {Close} from "@/components/icons";

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
            <div className="card admin-toolbar">
                <div className="admin-filters">
                    <div className="toolbar-inputs">
                        <input className="input" value={providerId} onChange={e => setProviderId(e.target.value)}
                               placeholder="Provider ID" aria-label="Provider ID"/>
                        <select className="select" value={status} aria-label="Durum"
                                onChange={e => setStatus(e.target.value as "ACTIVE" | "DELETED" | "ALL")}>
                            <option value="ACTIVE">Aktif</option>
                            <option value="DELETED">Silinmiş</option>
                            <option value="ALL">Tümü</option>
                        </select>
                    </div>
                    <input className="input" value={q} onChange={e => setQ(e.target.value)}
                           placeholder="Yorum içinde ara" aria-label="Yorum içinde ara"/>
                    <div className="toolbar-inputs">
                        <input className="input" type="datetime-local" value={from} aria-label="Başlangıç tarihi"
                               onChange={e => setFrom(e.target.value)}/>
                        <input className="input" type="datetime-local" value={to} aria-label="Bitiş tarihi"
                               onChange={e => setTo(e.target.value)}/>
                    </div>
                </div>
                <div className="cluster">
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

            {err && <div className="alert alert-error" role="alert">{err}</div>}

            {/* Liste */}
            {/* Kaydırılabilir kap klavyeyle de kaydırılabilsin: odaklanabilir bölge + ad */}
            <div className="table-wrap" tabIndex={0} role="region" aria-label="Yorumlar tablosu">
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
                        <th><span className="sr-only">İşlemler</span></th>
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
                                       rel="noreferrer noopener">
                                        {it.providerName}
                                    </a>
                                    <div className="caption faint">#{it.id}</div>
                                </td>
                                {/* Gerçek eksi işareti (U+2212) — ScoreBadge ile aynı yazım */}
                                <td className="cell-strong">{it.score > 0 ? `+${it.score}` : it.score < 0 ? `\u2212${-it.score}` : "0"}</td>
                                <td className="cell-comment">{it.comment || <span className="faint">—</span>}</td>
                                <td>{who}</td>
                                <td className="text-xs muted">{it.ip || "—"}</td>
                                <td className="text-xs muted">{formatDate(it.createdAt)}</td>
                                <td>
                                    <span className={`chip ${it.deletedAt ? "chip-neg" : "chip-pos"}`}>
                                        {it.deletedAt ? "Silinmiş" : "Aktif"}
                                    </span>
                                </td>
                                <td className="cell-actions">
                                    <span className="row-actions">
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

            {/* Sayfalama: ortak görsel bileşen, callback modu (yerel state, URL değişmez) */}
            <Pagination mode="callback" page={page} totalPages={data?.totalPages || 1} onPage={goPage}/>

            {/* Log paneli: ortak Dialog (FR-010) — başlık id'si aria-labelledby ile bağlı */}
            <Dialog open={logForId !== null} onClose={() => setLogForId(null)} labelledBy="log-title">
                <div className="dialog-head">
                    <h2 id="log-title" className="section-title">Loglar · #{logForId}</h2>
                    <button type="button" onClick={() => setLogForId(null)} className="btn btn-ghost btn-icon"
                            aria-label="Kapat">
                        <Close/>
                    </button>
                </div>

                {logsLoading && <div className="muted callout" role="status">Yükleniyor…</div>}
                {!logsLoading && !logs?.content?.length && (
                    <div className="muted callout">Log bulunamadı.</div>
                )}

                <ul className="log-list">
                    {logs?.content.map(l => (
                        <li key={l.id} className="card log-item">
                            <div className="row-between">
                                <b className="callout">{l.action}</b>
                                <span className="caption faint">{formatDate(l.createdAt)}</span>
                            </div>
                            <div className="log-meta">
                                actor: {l.actorEmail || (l.actorUserId ? `#${l.actorUserId}` : "?")}
                                {l.ipAddress ? ` · ip: ${l.ipAddress}` : ""}
                            </div>
                            {l.reason && <div className="caption">sebep: {l.reason}</div>}
                        </li>
                    ))}
                </ul>
            </Dialog>
        </>
    );
}

export default function AdminRatingsPage() {
    return <AdminShell><RatingsAdmin/></AdminShell>;
}
