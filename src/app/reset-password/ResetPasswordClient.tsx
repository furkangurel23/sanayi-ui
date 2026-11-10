"use client";

/*
 * YENİ ŞİFRE FORMU — client tarafı. Token server sayfadan prop olarak gelir.
 * Token 1 saat geçerli ve tek kullanımlıktır; alan adları backend DTO'suyla birebir
 * (newPassword / newPasswordAgain). Hata mesajları ApiError üzerinden gelir.
 */

import {useState} from "react";
import Link from "next/link";
import {resetPasswordByToken} from "@/lib/authApi";
import {errorMessage} from "@/lib/apiError";

export default function ResetPasswordClient({token}: { token: string }) {
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (password !== password2) {
            setError("Şifreler eşleşmiyor.");
            return;
        }
        setLoading(true);
        try {
            const res = await resetPasswordByToken(token, password, password2);
            setDone(res.message);
        } catch (err: unknown) {
            setError(errorMessage(err, "Sıfırlama başarısız."));
        } finally {
            setLoading(false);
        }
    }

    if (!token) {
        return (
            <main className="container auth-wrap">
                <div className="card auth-card" style={{textAlign: "center"}}>
                    <h1>Geçersiz bağlantı</h1>
                    <p className="card-sub">Sıfırlama kodu bulunamadı. E-postandaki bağlantıyı kullan.</p>
                    <Link href="/forgot-password" className="btn btn-outline">Yeni bağlantı iste</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="container auth-wrap">
            <form onSubmit={onSubmit} className="card auth-card">
                <div className="stack-sm">
                    <h1>Yeni şifre belirle</h1>
                    <p className="card-sub">Hesabın için yeni bir şifre seç.</p>
                </div>

                <label className="field">
                    <span className="field-label">Yeni şifre</span>
                    <input className="input" type="password" required minLength={8} autoComplete="new-password"
                           value={password} onChange={e => setPassword(e.target.value)}/>
                </label>

                <label className="field">
                    <span className="field-label">Yeni şifre (tekrar)</span>
                    <input className="input" type="password" required minLength={8} autoComplete="new-password"
                           value={password2} onChange={e => setPassword2(e.target.value)}/>
                </label>

                {error && <div className="alert alert-error">{error}</div>}
                {done && (
                    <div className="alert alert-success stack-sm">
                        <span>{done}</span>
                        <Link href="/login" className="btn btn-primary btn-sm">Giriş yap</Link>
                    </div>
                )}

                <button type="submit" className="btn btn-primary btn-lg" disabled={loading || Boolean(done)}>
                    {loading ? "Kaydediliyor…" : "Şifreyi sıfırla"}
                </button>
            </form>
        </main>
    );
}
