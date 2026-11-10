"use client";

/*
 * GİRİŞ SAYFASI — Client Component (form state + localStorage erişimi).
 *
 * Akış: POST /api/auth/login -> {token} -> setToken(localStorage + dinleyicilere haber)
 * -> router.push("/") + router.refresh() (server bileşenleri yeni oturumla tazelenir).
 *
 * Hata gösterimi: ApiError.message backend'in messages.properties'inden gelen
 * hazır Türkçe metindir; UI olduğu gibi gösterir. 401'de ayrıca "doğrulama mailini
 * tekrar gönder" kısayolu sunulur (hesap doğrulanmamış olabilir).
 */

import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {login, resendVerification} from "@/lib/authApi";
import {setToken} from "@/lib/auth";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [showResend, setShowResend] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setInfo(null);
        setLoading(true);
        try {
            const res = await login(email.trim(), password);
            setToken(res.token, res.refreshToken);
            router.push("/");
            router.refresh();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Giriş başarısız.";
            setError(msg);
            // Hesap doğrulanmamışsa yeniden gönderme seçeneği sun
            setShowResend(true);
        } finally {
            setLoading(false);
        }
    }

    async function onResend() {
        setError(null);
        try {
            const res = await resendVerification(email.trim());
            setInfo(res.message);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Gönderilemedi.");
        }
    }

    return (
        <main className="container auth-wrap">
            <form onSubmit={onSubmit} className="card auth-card">
                <div className="stack-sm">
                    <h1>Tekrar hoş geldin</h1>
                    <p className="card-sub">Hesabına giriş yap, yorumla ve sohbete katıl.</p>
                </div>

                <label className="field">
                    <span className="field-label">E-posta</span>
                    <input className="input" type="email" required autoComplete="email"
                           value={email} onChange={e => setEmail(e.target.value)}/>
                </label>

                <label className="field">
                    <span className="field-label">Şifre</span>
                    <input className="input" type="password" required autoComplete="current-password"
                           value={password} onChange={e => setPassword(e.target.value)}/>
                </label>

                {error && (
                    <div className="alert alert-error stack-sm">
                        <span>{error}</span>
                        {showResend && email && (
                            <button type="button" className="btn btn-outline btn-sm" onClick={onResend}>
                                Doğrulama e-postasını tekrar gönder
                            </button>
                        )}
                    </div>
                )}
                {info && <div className="alert alert-success">{info}</div>}

                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                    {loading ? "Giriş yapılıyor…" : "Giriş yap"}
                </button>

                <div className="row-between text-sm">
                    <Link href="/forgot-password" className="muted">Şifremi unuttum</Link>
                    <Link href="/register" className="muted">Hesabın yok mu? <b>Üye ol</b></Link>
                </div>
            </form>
        </main>
    );
}
