"use client";

/*
 * ADMIN · KULLANICILAR — listele, ara (e-posta/ad), sil.
 *
 * GET /api/admin/users?q=... (yeni backend ucu; passwordHash asla dönmez).
 * DELETE /api/admin/users/{id} — kullanıcının yorumları+sohbet mesajları cascade gider,
 * moderation_logs'a iz yazılır. Admin KENDİNİ silemez (backend 400 döner;
 * UI'da da kendi satırında sil butonu göstermiyoruz).
 *
 * 002: satır içi stiller sınıflara; rol/durum chip'leri ton + METİN (ADMIN chip'i
 * .chip-accent, doğrulanmış .chip-pos, bekliyor .chip-neg); sayfalama ortak
 * <Pagination mode="callback">.
 */

import {useCallback, useEffect, useState} from "react";
import {adminDeleteUser, adminListUsers} from "@/lib/adminApi";
import {ensureFreshToken} from "@/lib/auth";
import {errorMessage} from "@/lib/apiError";
import {useAuth} from "@/lib/useAuth";
import type {AdminUserItem, Page} from "@/lib/types";
import ConfirmButton from "@/components/ConfirmButton";
import AdminShell from "@/app/admin/AdminShell";
import Pagination from "@/components/Pagination";

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
            <div className="card admin-search" role="search">
                <input className="input" placeholder="E-posta / görünen ad ara…" aria-label="E-posta / görünen ad ara" value={q}
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
            <div className="table-wrap" tabIndex={0} role="region" aria-label="Kullanıcılar tablosu">
                <table className="data">
                    <thead>
                    <tr>
                        <th>Kullanıcı</th>
                        <th>Rol</th>
                        <th>Durum</th>
                        <th>Kayıt</th>
                        <th>Son giriş</th>
                        <th><span className="sr-only">İşlemler</span></th>
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
                                    <div className="cell-strong">{u.displayName || "—"}</div>
                                    <div className="caption faint">{u.email}</div>
                                </td>
                                <td>
                                    <span className={`chip ${u.role === "ADMIN" ? "chip-accent" : ""}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td>
                                    <span className={`chip ${u.emailVerified ? "chip-pos" : "chip-neg"}`}>
                                        {u.emailVerified ? "Doğrulanmış" : "Bekliyor"}
                                    </span>
                                </td>
                                <td className="caption muted">{fmt(u.createdAt)}</td>
                                <td className="caption muted">{fmt(u.lastLoginAt)}</td>
                                <td className="cell-actions">
                                    {isSelf ? (
                                        <span className="caption faint">(sen)</span>
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

            {/* Ortak sayfalama, callback modu: yerel state, URL'e ?page yazılmaz */}
            <Pagination mode="callback" page={page} totalPages={total} onPage={n => load(n, q)}/>
        </>
    );
}

export default function AdminUsersPage() {
    return <AdminShell><UsersAdmin/></AdminShell>;
}
