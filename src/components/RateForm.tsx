"use client";

/*
* Kullanıcı detay sayfasında yorum puan girebilecek. reCAPTCHA varsa token alacağız, yoksa boş geçeceğiz.
* Anonim kimlik için küçük bir localStorage değeri tutacağız.
* */

import React, {useEffect, useMemo, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {postRating} from "@/lib/api";
import ReCAPTCHA from "react-google-recaptcha";

type Props = {
    providerId: number;
}

export default function RateForm({providerId}: Props) {
    const router = useRouter();
    const [score, setScore] = useState<number>(0);
    const [comment, setComment] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [okMsg, setOkMsg] = useState<string | null>(null);

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
    const showCaptcha = Boolean(siteKey);

    const captchaRef = useRef<ReCAPTCHA | null>(null);

    //Anononim id'yi bir kez üret, localStorage'ta sakla.
    const [anonId, setAnonId] = useState<string | null>(null);
    useEffect(() => {
        try {
            const k = "sanayiAnonId";
            const existing = localStorage.getItem(k);
            if (existing) setAnonId(existing);
            else {
                const gen = (globalThis.crypto?.randomUUID?.() ?? `anon-${Date.now()}-${Math.random()}`);
                localStorage.setItem(k, gen);
                setAnonId(gen);
            }
        } catch {
            setAnonId(null);
        }
    }, []);

    const [captchaToken, setCaptchaToken] = useState<string | null>(null);

    const disabled = useMemo(() => {
        if (loading) return true;
        if (Number.isNaN(score) || score < -5 || score > 5) return true;
        return comment.length > 500;
    }, [loading, score, comment.length]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setOkMsg(null);

        if (disabled) return;
        setLoading(true);

        try {
            await postRating({
                providerId,
                score,
                comment: comment || undefined,
                anonymousId: anonId,
                recaptchaToken: showCaptcha ? captchaToken || undefined : undefined,
            });

            setOkMsg("Teşekkürler, oyunuz kaydedildi.");
            setComment("");
            setScore(0);
            setCaptchaToken(null);
            captchaRef.current?.reset?.();
            //SSR sayfayi tazele: yeni yorumu gor
            router.refresh();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            // Backend’in 409/429 friendly mesajları varsa kullanıcıya göster
            if (msg.includes("Bu sağlayıcıyı zaten oyladınız")) {
                setError("Bu sağlayıcıyı zaten oylamışsınız.");
            } else if (msg.includes("Too many requests") || msg.includes("RATE_LIMIT")) {
                setError("Çok sık denediniz. Lütfen 1 dakika sonra tekrar deneyin.");
            } else if (msg.includes("recaptcha") || msg.includes("reCAPTCHA")) {
                setError("reCAPTCHA doğrulaması başarısız.");
            } else {
                setError("Kaydedilemedi. Biraz sonra tekrar deneyin.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 p-3 space-y-3">
            <div className="text-lg font-semibold">Puan ver</div>

            <div className="flex items-center gap-2">
                <label className="text-sm w-28">Puan (-5..5)</label>
                <input
                    type="number"
                    step={1}
                    min={-5}
                    max={5}
                    value={score}
                    onChange={e => setScore(Math.max(-5, Math.min(5, Number(e.target.value) || 0)))}
                    className="w-24 rounded-lg border border-white/20 bg-transparent px-2 py-1 text-sm"
                />
            </div>

            <div>
        <textarea
            placeholder="Yorum (opsiyonel, en fazla 500 karakter)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm"
        />
                <div className="text-[11px] opacity-60 mt-1">{comment.length}/500</div>
            </div>

            {showCaptcha ? (
                <div>
                    <ReCAPTCHA
                        ref={captchaRef}
                        sitekey={siteKey}
                        onChange={val => setCaptchaToken(val)}
                        theme="dark"
                    />
                    <div className="text-[11px] opacity-60 mt-1">Anonim oylar için doğrulama gerekebilir.</div>
                </div>
            ) : (
                <div className="text-[11px] opacity-60">
                    reCAPTCHA yapılandırılmadı. Prod’da <code>NEXT_PUBLIC_RECAPTCHA_SITE_KEY</code> ver.
                </div>
            )}

            {error && <div className="text-sm text-rose-400">{error}</div>}
            {okMsg && <div className="text-sm text-emerald-400">{okMsg}</div>}

            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={disabled}
                    className="rounded-lg border border-white/30 px-3 py-2 text-sm disabled:opacity-50"
                >
                    {loading ? "Gönderiliyor..." : "Gönder"}
                </button>
                <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                        setScore(0);
                        setComment("");
                        setError(null);
                        setOkMsg(null);
                    }}
                    className="rounded-lg border border-white/10 px-3 py-2 text-sm disabled:opacity-50"
                >
                    Temizle
                </button>
            </div>
        </form>
    );

}
