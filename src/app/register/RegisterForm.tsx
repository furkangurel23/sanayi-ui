"use client";

/*
 * KAYIT FORMU (Client Component).
 *
 * Çift savunma hattı (öğrenme notu):
 *  1) Client-side ön kontrol (şifre eşleşmesi, uzunluk): kullanıcıya ANINDA geri
 *     bildirim, gereksiz istek yok.
 *  2) Backend @Valid + PasswordUtils: GERÇEK güvenlik sınırı — client kontrolü
 *     atlatılabilir (curl ile istek atan birini sadece backend durdurur).
 *
 * Başarıda form yerine "e-postanı kontrol et" ekranı basılır (koşullu render):
 * kayıt e-posta doğrulaması olmadan tamamlanmış SAYILMAZ (spam hesap engeli).
 *
 * Not: Bu dosya eskiden doğrudan page.tsx'ti. Client Component'ler `metadata`
 * export EDEMEZ; sekme başlığı için page.tsx artık küçük bir Server Component
 * (metadata + <RegisterForm/>), form mantığı burada ("use client").
 *
 * 002 görünüm: alan hataları ALANIN ALTINDA — hem client ön kontrolü (şifre kısa ->
 * "Şifre" alanı, eşleşmiyor -> "Şifre (tekrar)" alanı) hem backend fieldErrors (email,
 * displayName, password). Genel hata (ör. "e-posta zaten kayıtlı") formun altında .alert.
 * "E-postanı kontrol et" ekranı emoji yerine Mail ikonlu durum karosu (FR-006).
 */

import {useState} from "react";
import Link from "next/link";
import {register} from "@/lib/authApi";
import {fieldErrorMap} from "@/lib/apiError";
import {Mail} from "@/components/icons";

export default function RegisterForm() {
    const [email, setEmail] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fe, setFe] = useState<Record<string, string>>({}); // alan hataları (alan adı -> mesaj)
    const [done, setDone] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setFe({});
        // Ön kontroller artık ilgili alanın altına yazılır (aynı metinler)
        if (password.length < 8) {
            setFe({password: "Şifre en az 8 karakter olmalı."});
            return;
        }
        if (password !== password2) {
            setFe({password2: "Şifreler eşleşmiyor."});
            return;
        }
        setLoading(true);
        try {
            const res = await register(email.trim(), password, displayName.trim() || undefined);
            setDone(res.message || "Kayıt başarılı! E-postandaki doğrulama bağlantısına tıkla.");
        } catch (err: unknown) {
            const map = fieldErrorMap(err);
            setFe(map);
            // Alan hatası varsa genel kutuda tekrar etmeyiz; yoksa backend'in mesajı
            if (Object.keys(map).length === 0) setError(err instanceof Error ? err.message : "Kayıt başarısız.");
        } finally {
            setLoading(false);
        }
    }

    if (done) {
        return (
            <main className="container auth-wrap">
                <div className="card auth-card auth-card-center" role="status">
                    <span className="status-icon"><Mail size="lg"/></span>
                    <h1>E-postanı kontrol et</h1>
                    <p className="card-sub">{done}</p>
                    <p className="caption faint">
                        Doğrulama bağlantısı 24 saat geçerlidir. Spam klasörünü kontrol etmeyi unutma.
                    </p>
                    <Link href="/login" className="btn btn-outline">Girişe dön</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="container auth-wrap">
            <form onSubmit={onSubmit} className="card auth-card">
                <div className="stack-sm">
                    <h1>Aramıza katıl</h1>
                    <p className="card-sub">
                        Üye olunca sınırsız yorum yapabilir ve marka sohbet odalarına katılabilirsin.
                        Spam&apos;i önlemek için e-posta doğrulaması zorunludur.
                    </p>
                </div>

                <label className="field">
                    <span className="field-label">E-posta</span>
                    <input className="input" type="email" required autoComplete="email"
                           aria-invalid={fe.email ? true : undefined}
                           aria-describedby={fe.email ? "reg-email-err" : undefined}
                           value={email} onChange={e => setEmail(e.target.value)}/>
                    {fe.email && <span id="reg-email-err" className="field-error">{fe.email}</span>}
                </label>

                <label className="field">
                    <span className="field-label">Görünen ad (opsiyonel)</span>
                    <input className="input" maxLength={100} autoComplete="nickname"
                           placeholder="Yorumlarda görünecek isim"
                           aria-invalid={fe.displayName ? true : undefined}
                           aria-describedby={fe.displayName ? "reg-name-err" : undefined}
                           value={displayName} onChange={e => setDisplayName(e.target.value)}/>
                    {fe.displayName && <span id="reg-name-err" className="field-error">{fe.displayName}</span>}
                </label>

                <label className="field">
                    <span className="field-label">Şifre</span>
                    <input className="input" type="password" required minLength={8} autoComplete="new-password"
                           aria-invalid={fe.password ? true : undefined}
                           aria-describedby={fe.password ? "reg-pw-hint reg-pw-err" : "reg-pw-hint"}
                           value={password} onChange={e => setPassword(e.target.value)}/>
                    <span id="reg-pw-hint" className="field-hint">En az 8 karakter; harf ve rakam karışımı önerilir.</span>
                    {fe.password && <span id="reg-pw-err" className="field-error">{fe.password}</span>}
                </label>

                <label className="field">
                    <span className="field-label">Şifre (tekrar)</span>
                    <input className="input" type="password" required minLength={8} autoComplete="new-password"
                           aria-invalid={fe.password2 ? true : undefined}
                           aria-describedby={fe.password2 ? "reg-pw2-err" : undefined}
                           value={password2} onChange={e => setPassword2(e.target.value)}/>
                    {fe.password2 && <span id="reg-pw2-err" className="field-error">{fe.password2}</span>}
                </label>

                {error && <div className="alert alert-error" role="alert">{error}</div>}

                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                    {loading ? "Kaydediliyor…" : "Üye ol"}
                </button>

                <div className="auth-links auth-foot">
                    <Link href="/login">Zaten hesabın var mı? <b>Giriş yap</b></Link>
                </div>
            </form>
        </main>
    );
}
