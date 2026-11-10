"use client";

/*
 * ŞİFREMİ UNUTTUM — e-posta alır, sıfırlama linki göndertir.
 * Backend güvenlik gereği hesabın var olup olmadığını SÖYLEMEZ (user enumeration
 * saldırısını önlemek için hep aynı mesaj döner); UI de bu mesajı olduğu gibi gösterir.
 *
 * Not: Bu dosya eskiden doğrudan page.tsx'ti. Client Component'ler `metadata`
 * export EDEMEZ; sekme başlığı için page.tsx artık küçük bir Server Component
 * (metadata + <ForgotPasswordForm/>), form mantığı burada ("use client").
 *
 * 002 görünüm: e-posta alan hatası alanın altında; "Girişe dön" metin oku yerine
 * ChevronLeft ikonu (FR-006); başarı/hata .alert (role ile duyurulur).
 */

import {useState} from "react";
import Link from "next/link";
import {forgotPassword} from "@/lib/authApi";
import {fieldErrorMap} from "@/lib/apiError";
import {ChevronLeft} from "@/components/icons";

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fe, setFe] = useState<Record<string, string>>({});
    const [done, setDone] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setFe({});
        setLoading(true);
        try {
            const res = await forgotPassword(email.trim());
            setDone(res.message);
        } catch (err: unknown) {
            setFe(fieldErrorMap(err));
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
                           aria-invalid={fe.email ? true : undefined}
                           aria-describedby={fe.email ? "fp-email-err" : undefined}
                           value={email} onChange={e => setEmail(e.target.value)}/>
                    {fe.email && <span id="fp-email-err" className="field-error">{fe.email}</span>}
                </label>

                {error && <div className="alert alert-error" role="alert">{error}</div>}
                {done && <div className="alert alert-success" role="status">{done}</div>}

                <button type="submit" className="btn btn-primary btn-lg" disabled={loading || Boolean(done)}>
                    {loading ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
                </button>

                <div className="auth-links auth-foot">
                    <Link href="/login"><ChevronLeft size="sm"/> Girişe dön</Link>
                </div>
            </form>
        </main>
    );
}
