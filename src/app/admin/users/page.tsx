"use client";

/*
 * ADMIN · KULLANICILAR — listele, ara (e-posta/ad), sil.
 *
 * GET /api/admin/users?q=... (yeni backend ucu; passwordHash asla dönmez).
 * DELETE /api/admin/users/{id} — kullanıcının yorumları+sohbet mesajları cascade gider,
 * moderation_logs'a iz yazılır. Admin KENDİNİ silemez (backend 400 döner;
 * UI'da da kendi satırında sil butonu göstermiyoruz).
 */

import {useCallback, useEffect, useState} from "react";
import {adminDeleteUser, adminListUsers} from "@/lib/adminApi";
import {ensureFreshToken} from "@/lib/auth";
import {errorMessage} from "@/lib/apiError";
import {useAuth} from "@/lib/useAuth";
import type {AdminUserItem, Page} from "@/lib/types";
import ConfirmButton from "@/components/ConfirmButton";
import AdminShell from "@/app/admin/AdminShell";

function fmt(iso?: string | null) {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleDateString("tr-TR", {day: "numeric", month: "short", year: "numeric"});
    } catch {
        return "—";
    }
}

function UsersAdmin() {
    const me = useAuth();
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [data, setData] = useState<Page<AdminUserItem> | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const load = useCallback(async (nextPage = page, query = q) => {
        const token = await ensureFreshToken();
        if (!token) return;
        setLoading(true);
        setErr(null);
        try {
            setData(await adminListUsers(token, {q: query || undefined, page: nextPage, size: 20}));
            setPage(nextPage);
        } catch (e: unknown) {
            setErr(errorMessage(e, "Liste alınamadı."));
        } finally {
            setLoading(false);
        }
    }, [page, q]);

    useEffect(() => {
        load(1, "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function remove(id: number, reason?: string) {
        try {
            await adminDeleteUser((await ensureFreshToken())!, id, reason);
            setData(d => d ? {...d, content: d.content.filter(u => u.id !== id), totalElements: d.totalElements - 1} : d);
        } catch (e: unknown) {
            setErr(errorMessage(e, "Silinemedi."));
        }
    }

    const total = data?.totalPages ?? 1;

    return (
        <>
            <div className="card row" style={{padding: "0.9rem 1rem", gap: "0.5rem"}}>
                <input className="input" placeholder="E-posta / görünen ad ara…" value={q}
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
                        <th>Kullanıcı</th>
                        <th>Rol</th>
                        <th>Durum</th>
                        <th>Kayıt</th>
                        <th>Son giriş</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {!data?.content.length && !loading && (
                        <tr>
                            <td colSpan={6} className="muted">Kayıt yok.</td>
                        </tr>
                    )}
                    {data?.content.map(u => {
                        const isSelf = me?.email === u.email;
                        return (
                            <tr key={u.id}>
                                <td>
                                    <div style={{fontWeight: 550}}>{u.displayName || "—"}</div>
                                    <div className="text-xs faint">{u.email}</div>
                                </td>
                                <td>
                                    <span className="chip"
                                          style={{color: u.role === "ADMIN" ? "var(--accent)" : "var(--fg-muted)"}}>
                                        {u.role}
                                    </span>
                                </td>
                                <td>
                                    <span className="chip" style={{
                                        color: u.emailVerified ? "var(--pos)" : "var(--neg)",
                                    }}>
                                        {u.emailVerified ? "Doğrulanmış" : "Bekliyor"}
                                    </span>
                                </td>
                                <td className="text-xs muted">{fmt(u.createdAt)}</td>
                                <td className="text-xs muted">{fmt(u.lastLoginAt)}</td>
                                <td style={{textAlign: "right"}}>
                                    {isSelf ? (
                                        <span className="text-xs faint">(sen)</span>
                                    ) : (
                                        <ConfirmButton label="Sil" askReason
                                                       onConfirm={(reason) => remove(u.id, reason)}/>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
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

export default function AdminUsersPage() {
    return <AdminShell><UsersAdmin/></AdminShell>;
}
