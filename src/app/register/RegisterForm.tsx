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
 */

import {useState} from "react";
import Link from "next/link";
import {register} from "@/lib/authApi";

export default function RegisterForm() {
    const [email, setEmail] = useState("");
    const [displayName, setDisplayName] = useState("");
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
        if (password.length < 8) {
            setError("Şifre en az 8 karakter olmalı.");
            return;
        }
        setLoading(true);
        try {
            const res = await register(email.trim(), password, displayName.trim() || undefined);
            setDone(res.message || "Kayıt başarılı! E-postandaki doğrulama bağlantısına tıkla.");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Kayıt başarısız.");
        } finally {
            setLoading(false);
        }
    }

    if (done) {
        return (
            <main className="container auth-wrap">
                <div className="card auth-card" style={{textAlign: "center"}}>
                    <div style={{fontSize: "2.5rem"}} aria-hidden>📬</div>
                    <h1>E-postanı kontrol et</h1>
                    <p className="card-sub">{done}</p>
                    <p className="text-xs faint">
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
                           value={email} onChange={e => setEmail(e.target.value)}/>
                </label>

                <label className="field">
                    <span className="field-label">Görünen ad (opsiyonel)</span>
                    <input className="input" maxLength={100} autoComplete="nickname"
                           placeholder="Yorumlarda görünecek isim"
                           value={displayName} onChange={e => setDisplayName(e.target.value)}/>
                </label>

                <label className="field">
                    <span className="field-label">Şifre</span>
                    <input className="input" type="password" required minLength={8} autoComplete="new-password"
                           value={password} onChange={e => setPassword(e.target.value)}/>
                    <span className="field-hint">En az 8 karakter; harf ve rakam karışımı önerilir.</span>
                </label>

                <label className="field">
                    <span className="field-label">Şifre (tekrar)</span>
                    <input className="input" type="password" required minLength={8} autoComplete="new-password"
                           value={password2} onChange={e => setPassword2(e.target.value)}/>
                </label>

                {error && <div className="alert alert-error">{error}</div>}

                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                    {loading ? "Kaydediliyor…" : "Üye ol"}
                </button>

                <p className="text-sm muted" style={{textAlign: "center"}}>
                    Zaten hesabın var mı? <Link href="/login"><b>Giriş yap</b></Link>
                </p>
            </form>
        </main>
    );
}
