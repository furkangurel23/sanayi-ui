"use client";

/*
 * ŞİFREMİ UNUTTUM — e-posta alır, sıfırlama linki göndertir.
 * Backend güvenlik gereği hesabın var olup olmadığını SÖYLEMEZ (user enumeration
 * saldırısını önlemek için hep aynı mesaj döner); UI de bu mesajı olduğu gibi gösterir.
 */

import {useState} from "react";
import Link from "next/link";
import {forgotPassword} from "@/lib/authApi";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await forgotPassword(email.trim());
            setDone(res.message);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "İstek başarısız.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="container auth-wrap">
            <form onSubmit={onSubmit} className="card auth-card">
                <div className="stack-sm">
                    <h1>Şifreni mi unuttun?</h1>
                    <p className="card-sub">E-posta adresini gir; sıfırlama bağlantısı gönderelim (1 saat geçerli).</p>
                </div>

                <label className="field">
                    <span className="field-label">E-posta</span>
                    <input className="input" type="email" required autoComplete="email"
                           value={email} onChange={e => setEmail(e.target.value)}/>
                </label>

                {error && <div className="alert alert-error">{error}</div>}
                {done && <div className="alert alert-success">{done}</div>}

                <button type="submit" className="btn btn-primary btn-lg" disabled={loading || Boolean(done)}>
                    {loading ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
                </button>

                <p className="text-sm muted" style={{textAlign: "center"}}>
                    <Link href="/login">← Girişe dön</Link>
                </p>
            </form>
        </main>
    );
}
