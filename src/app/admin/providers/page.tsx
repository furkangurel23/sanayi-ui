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
 */

import {useCallback, useEffect, useState} from "react";
import {adminDeleteProvider, adminListProviders} from "@/lib/adminApi";
import {ensureFreshToken} from "@/lib/auth";
import {errorMessage} from "@/lib/apiError";
import type {Page, ProviderListItem} from "@/lib/types";
import ConfirmButton from "@/components/ConfirmButton";
import AdminShell from "@/app/admin/AdminShell";

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
            <div className="card row" style={{padding: "0.9rem 1rem", gap: "0.5rem"}}>
                <input className="input" placeholder="Dükkan adı / adres ara…" value={q}
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

            {err && <div className="alert alert-error">{err}</div>}

            <div className="table-wrap">
                <table className="data">
                    <thead>
                    <tr>
                        <th>Dükkan</th>
                        <th>Konum</th>
                        <th>Puan</th>
                        <th>Oy</th>
                        <th></th>
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
                                <a href={`/providers/${p.id}`} target="_blank" rel="noreferrer noopener"
                                   style={{color: "var(--accent-text)", fontWeight: 550}}>{p.name}</a>
                                <div className="text-xs faint">#{p.id}</div>
                            </td>
                            <td className="text-sm muted">{[p.district, p.city].filter(Boolean).join(", ")}</td>
                            <td style={{fontWeight: 650}}>
                                {typeof p.avgScore === "number" ? p.avgScore.toFixed(1) : "—"}
                            </td>
                            <td className="text-sm muted">{p.ratingCount ?? 0}</td>
                            <td style={{textAlign: "right"}}>
                                <ConfirmButton label="Sil" askReason
                                               onConfirm={(reason) => remove(p.id, reason)}/>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {total > 1 && (
                <nav className="row" style={{justifyContent: "center"}} aria-label="Sayfalama">
                    <button className="btn btn-outline btn-sm" onClick={() => load(Math.max(1, page - 1), q)}
                            disabled={page <= 1}>← Önceki
                    </button>
                    <span className="text-sm muted">Sayfa {page} / {total}</span>
                    <button className="btn btn-outline btn-sm" onClick={() => load(Math.min(total, page + 1), q)}
                            disabled={page >= total}>Sonraki →
                    </button>
                </nav>
            )}
        </>
    );
}

export default function AdminProvidersPage() {
    return <AdminShell><ProvidersAdmin/></AdminShell>;
}
