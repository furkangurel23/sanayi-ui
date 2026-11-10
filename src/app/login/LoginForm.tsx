"use client";

/*
 * GİRİŞ FORMU — Client Component (form state + localStorage erişimi).
 *
 * Akış: POST /api/auth/login -> {token} -> setToken(localStorage + dinleyicilere haber)
 * -> router.push("/") + router.refresh() (server bileşenleri yeni oturumla tazelenir).
 *
 * Hata gösterimi: ApiError.message backend'in messages.properties'inden gelen
 * hazır Türkçe metindir; UI olduğu gibi gösterir. 401'de ayrıca "doğrulama mailini
 * tekrar gönder" kısayolu sunulur (hesap doğrulanmamış olabilir).
 *
 * Not: Bu dosya eskiden doğrudan page.tsx'ti. Client Component'ler `metadata`
 * export EDEMEZ; sekme başlığı için page.tsx artık küçük bir Server Component
 * (metadata + <LoginForm/>), form mantığı burada ("use client").
 *
 * 002 görünüm: ortalanmış tek odaklı .auth-card; backend alan hataları (fieldErrors)
 * ilgili ALANIN ALTINDA (aria-invalid + aria-describedby ile alana bağlı — ekran okuyucu
 * alana gelince hatayı da okur); genel hata/bilgi .alert ile formun altında.
 * Gönderilirken buton devre dışı + "Giriş yapılıyor…" (çift gönderim olmaz).
 */

import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {login, resendVerification} from "@/lib/authApi";
import {setToken} from "@/lib/auth";
import {fieldErrorMap} from "@/lib/apiError";
import {ChevronRight} from "@/components/icons";

export default function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fe, setFe] = useState<Record<string, string>>({}); // alan hataları
    const [info, setInfo] = useState<string | null>(null);
    const [showResend, setShowResend] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setFe({});
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
            setFe(fieldErrorMap(err));
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
                           aria-invalid={fe.email ? true : undefined}
                           aria-describedby={fe.email ? "login-email-err" : undefined}
                           value={email} onChange={e => setEmail(e.target.value)}/>
                    {fe.email && <span id="login-email-err" className="field-error">{fe.email}</span>}
                </label>

                <label className="field">
                    <span className="field-label">Şifre</span>
                    <input className="input" type="password" required autoComplete="current-password"
                           aria-invalid={fe.password ? true : undefined}
                           aria-describedby={fe.password ? "login-password-err" : undefined}
                           value={password} onChange={e => setPassword(e.target.value)}/>
                    {fe.password && <span id="login-password-err" className="field-error">{fe.password}</span>}
                </label>

                {error && (
                    <div className="alert alert-error stack-sm" role="alert">
                        <span>{error}</span>
                        {showResend && email && (
                            <button type="button" className="btn btn-outline btn-sm" onClick={onResend}>
                                Doğrulama e-postasını tekrar gönder
                            </button>
                        )}
                    </div>
                )}
                {info && <div className="alert alert-success" role="status">{info}</div>}

                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                    {loading ? "Giriş yapılıyor…" : "Giriş yap"}
                </button>

                <div className="auth-links">
                    <Link href="/forgot-password">Şifremi unuttum</Link>
                    <Link href="/register">Hesabın yok mu? <b>Üye ol</b> <ChevronRight size="sm"/></Link>
                </div>
            </form>
        </main>
    );
}
