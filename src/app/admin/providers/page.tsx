"use client";

/*
 * ADMIN · DÜKKANLAR — listele, ara, sil.
 *
 * Listeleme public /api/providers ucundan (admin token gerekmez); silme ise
 * /api/admin/providers/{id} (ROLE_ADMIN). Silinen dükkanın yorumları cascade gider,
 * moderation_logs'a iz yazılır (backend).
 *
 * Arama URL'de DEĞİL local state'te: admin ekranı tam SPA, paylaşılabilir link
 * gereği yok; her tuşta URL'i kirletmemek için "Ara" tetikli.
 *
 * 002: satır içi stiller sınıflara (.admin-search, .cell-*); sayfalama ortak
 * <Pagination mode="callback">. Dükkan bağlantısı ham <a> yerine next/link <Link>
 * (yeni sekmede açılır — target="_blank" korunur; Link'in prefetch'i de gelir).
 */
import Link from "next/link";

import {useCallback, useEffect, useState} from "react";
import {adminDeleteProvider, adminListProviders} from "@/lib/adminApi";
import {ensureFreshToken} from "@/lib/auth";
import {errorMessage} from "@/lib/apiError";
import type {Page, ProviderListItem} from "@/lib/types";
import ConfirmButton from "@/components/ConfirmButton";
import AdminShell from "@/app/admin/AdminShell";
import Pagination from "@/components/Pagination";

function ProvidersAdmin() {
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [data, setData] = useState<Page<ProviderListItem> | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const load = useCallback(async (nextPage = page, query = q) => {
        const token = await ensureFreshToken();
        if (!token) return;
        setLoading(true);
        setErr(null);
        try {
            setData(await adminListProviders(token, {q: query || undefined, page: nextPage, size: 20}));
            setPage(nextPage);
        } catch (e: unknown) {
            setErr(errorMessage(e, "Liste alınamadı."));
        } finally {
            setLoading(false);
        }
    }, [page, q]);

    // İlk yükleme
    useEffect(() => {
        load(1, "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function remove(id: number, reason?: string) {
        try {
            await adminDeleteProvider((await ensureFreshToken())!, id, reason);
            // Optimistik: satırı listeden çıkar (yeniden fetch'e gerek yok)
            setData(d => d ? {...d, content: d.content.filter(p => p.id !== id), totalElements: d.totalElements - 1} : d);
        } catch (e: unknown) {
            setErr(errorMessage(e, "Silinemedi."));
        }
    }

    const total = data?.totalPages ?? 1;

    return (
        <>
            <div className="card admin-search" role="search">
                <input className="input" placeholder="Dükkan adı / adres ara…" aria-label="Dükkan adı / adres ara" value={q}
                       onChange={e => setQ(e.target.value)}
                       onKeyDown={e => e.key === "Enter" && load(1, q)}/>
                <button className="btn btn-primary" onClick={() => load(1, q)} disabled={loading}>
                    {loading ? "…" : "Ara"}
                </button>
                {q && <button className="btn btn-ghost" onClick={() => {
                    setQ("");
                    load(1, "");
                }}>Temizle</button>}
            </div>

            {err && <div className="alert alert-error" role="alert">{err}</div>}

            {/* Kaydırılabilir kap klavyeyle de kaydırılabilsin: odaklanabilir bölge + ad */}
            <div className="table-wrap" tabIndex={0} role="region" aria-label="Dükkanlar tablosu">
                <table className="data">
                    <thead>
                    <tr>
                        <th>Dükkan</th>
                        <th>Konum</th>
                        <th>Puan</th>
                        <th>Oy</th>
                        <th><span className="sr-only">İşlemler</span></th>
                    </tr>
                    </thead>
                    <tbody>
                    {!data?.content.length && !loading && (
                        <tr>
                            <td colSpan={5} className="muted">Kayıt yok.</td>
                        </tr>
                    )}
                    {data?.content.map(p => (
                        <tr key={p.id}>
                            <td>
                                <Link href={`/providers/${p.id}`} target="_blank" rel="noreferrer noopener">
                                    {p.name}
                                </Link>
                                <div className="caption faint">#{p.id}</div>
                            </td>
                            <td className="callout muted">{[p.district, p.city].filter(Boolean).join(", ")}</td>
                            <td className="cell-strong">
                                {typeof p.avgScore === "number" ? p.avgScore.toFixed(1) : "—"}
                            </td>
                            <td className="callout muted">{p.ratingCount ?? 0}</td>
                            <td className="cell-actions">
                                <ConfirmButton label="Sil" askReason
                                               onConfirm={(reason) => remove(p.id, reason)}/>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Ortak sayfalama, callback modu: yerel state, URL'e ?page yazılmaz */}
            <Pagination mode="callback" page={page} totalPages={total} onPage={n => load(n, q)}/>
        </>
    );
}

export default function AdminProvidersPage() {
    return <AdminShell><ProvidersAdmin/></AdminShell>;
}
