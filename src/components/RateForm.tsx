"use client";

/*
 * PUAN/YORUM FORMU — Client Component.
 *
 * Neden "use client"?
 *  - useState/useEffect/useRef hook'ları ve onClick/onSubmit olayları yalnızca
 *    tarayıcıda çalışır. App Router'da dosyalar varsayılan Server Component'tir;
 *    ilk satırdaki "use client" bu dosyayı client bundle'ına alır.
 *
 * İş kuralları:
 *  - Üye (JWT var): sınırsız yorum; reCAPTCHA gerekmez; her gönderim yeni kayıt.
 *  - Anonim: localStorage'daki kalıcı anonymousId ile usta başına TEK oy
 *    (ikinci gönderim mevcut oyu günceller); prod'da reCAPTCHA zorunlu.
 *
 * Hata standardı:
 *  - postRating başarısız olursa ApiError fırlatır; err.code'a göre dallanır,
 *    err.message backend'den gelen hazır Türkçe metindir (messages.properties).
 */

import React, {useEffect, useMemo, useRef, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {postRating} from "@/lib/api";
import {useAuth} from "@/lib/useAuth";
import {ensureFreshToken} from "@/lib/auth";
import {ApiError, errorMessage} from "@/lib/apiError";
import ReCAPTCHA from "react-google-recaptcha";

// -5..+5 puan dizisi. Array.from yerine sabit liste: okunaklı ve tip güvenli.
const SCORES = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];

export default function RateForm({providerId}: { providerId: number }) {
    const router = useRouter();
    // useAuth: login/logout olduğunda bu bileşen otomatik yeniden render olur.
    const user = useAuth();

    // useState<number | null>: "hiç seçilmedi" durumunu 0'dan ayırmak için null kullanıyoruz
    // (0 geçerli bir puan!). TypeScript union tipi tam bunu ifade eder.
    const [score, setScore] = useState<number | null>(null);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [okMsg, setOkMsg] = useState<string | null>(null);

    // reCAPTCHA yalnızca anonim kullanıcıya gösterilir (üye için gereksiz sürtünme).
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
    const showCaptcha = Boolean(siteKey) && !user;
    // useRef: render'lar arasında YAŞAYAN ama değişince render TETİKLEMEYEN kutu.
    // Burada reCAPTCHA bileşeninin imperatif API'sine (reset) erişmek için kullanılır.
    const captchaRef = useRef<ReCAPTCHA | null>(null);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);

    // Anonim kimlik: ilk ziyarette üret, localStorage'da kalıcı sakla.
    // Backend bu id ile "usta başına tek anonim oy" kuralını uygular.
    const [anonId, setAnonId] = useState<string | null>(null);
    useEffect(() => {
        // useEffect(cb, []) -> yalnızca ilk mount'ta çalışır (dependency dizisi boş).
        // localStorage'a SSR'da erişilemez; effect ise sadece tarayıcıda koşar — güvenli yer burası.
        try {
            const k = "sanayiAnonId";
            const existing = localStorage.getItem(k);
            if (existing) setAnonId(existing);
            else {
                // crypto.randomUUID modern tarayıcılarda var; ?. ve ?? ile eski tarayıcıya düşüş yolu bırakıyoruz.
                const gen = (globalThis.crypto?.randomUUID?.() ?? `anon-${Date.now()}-${Math.random()}`);
                localStorage.setItem(k, gen);
                setAnonId(gen);
            }
        } catch {
            setAnonId(null); // localStorage kapalıysa (gizli sekme vb.) anonim oy yine denenebilir
        }
    }, []);

    // useMemo: bağımlılıklar değişmedikçe hesaplamayı tekrarlama (gereksiz iş önlenir).
    const disabled = useMemo(() => {
        if (loading || score === null) return true;
        return comment.length > 500;
    }, [loading, score, comment.length]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault(); // formun klasik sayfa yenilemesini engelle (SPA davranışı)
        setError(null);
        setOkMsg(null);
        if (disabled || score === null) return;
        setLoading(true);

        try {
            await postRating({
                providerId,
                score,
                comment: comment || undefined,
                anonymousId: user ? null : anonId, // üye isek anonim kimlik GÖNDERİLMEZ
                recaptchaToken: showCaptcha ? captchaToken || undefined : undefined,
                token: await ensureFreshToken(), // JWT varsa (tazelenmiş) Authorization header'ına gider
            });

            setOkMsg("Teşekkürler, değerlendirmen kaydedildi.");
            setComment("");
            setScore(null);
            setCaptchaToken(null);
            captchaRef.current?.reset?.();
            // router.refresh(): Server Component'ları yeniden çalıştırır ->
            // yeni yorum listede/histogramda hemen görünür (tam sayfa yenileme YOK).
            router.refresh();
        } catch (err: unknown) {
            // instanceof ApiError: backend'in code alanına göre ÖZEL davranış;
            // diğer her durumda backend'in hazır Türkçe mesajı gösterilir.
            if (err instanceof ApiError) {
                switch (err.code) {
                    case "error.rating.duplicate-anon":
                    case "error.rating.duplicate-user":
                        setError(`${err.message} Yeni yorumlar için üye olabilirsin.`);
                        break;
                    case "error.recaptcha.missing":
                    case "error.recaptcha.failed":
                        setError("reCAPTCHA doğrulaması gerekli. Kutucuğu işaretleyip tekrar dene.");
                        break;
                    default:
                        // fieldErrors varsa (400 validation) satır satır ekle.
                        setError([err.message, ...err.fieldErrorLines()].join(" · "));
                }
            } else {
                setError(errorMessage(err, "Kaydedilemedi. Biraz sonra tekrar deneyin."));
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="card stack">
            <div className="row-between">
                <h2 className="section-title">Değerlendir</h2>
                {!user && (
                    <span className="text-xs faint">
                        Anonim tek oy hakkı · <Link href="/login" className="btn btn-ghost btn-sm"
                                                     style={{display: "inline-flex"}}>Giriş yap</Link>
                    </span>
                )}
            </div>

            {/* role="radiogroup" + aria-checked: ekran okuyucular için "tek seçimli grup" semantiği */}
            <div className="field">
                <span className="field-label">Puanın (-5 çok kötü · +5 mükemmel)</span>
                <div className="score-picker" role="radiogroup" aria-label="Puan seç">
                    {SCORES.map(s => (
                        <button
                            key={s}
                            type="button" // önemli: default "submit"tir, formu göndermesin!
                            role="radio"
                            aria-checked={score === s}
                            className="score-pick"
                            // data-* attribute'ları: CSS'te [data-selected="true"] ile stillenir
                            data-selected={score === s}
                            data-tone={s === 0 ? "zero" : s > 0 ? "pos" : "neg"}
                            onClick={() => setScore(s)}
                        >
                            {s > 0 ? `+${s}` : s}
                        </button>
                    ))}
                </div>
            </div>

            <div className="field">
                <span className="field-label">Yorum (opsiyonel)</span>
                {/* Controlled component: value=state, onChange=state güncelle.
                    React'te form elemanının "tek doğruluk kaynağı" state olur. */}
                <textarea
                    className="textarea"
                    placeholder="Deneyimini anlat: işçilik, fiyat, süre..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    maxLength={500}
                    rows={3}
                />
                <span className="field-hint">{comment.length}/500</span>
            </div>

            {showCaptcha && (
                <div className="field">
                    <ReCAPTCHA
                        ref={captchaRef}
                        sitekey={siteKey}
                        onChange={val => setCaptchaToken(val)}
                    />
                    <span className="field-hint">Anonim oylar için doğrulama gerekir.</span>
                </div>
            )}

            {/* Koşullu render: error null ise hiç DOM üretilmez ({x && <jsx>} kalıbı) */}
            {error && <div className="alert alert-error">{error}</div>}
            {okMsg && <div className="alert alert-success">{okMsg}</div>}

            <div className="row">
                <button type="submit" disabled={disabled} className="btn btn-primary">
                    {loading ? "Gönderiliyor…" : "Gönder"}
                </button>
                <button
                    type="button"
                    disabled={loading}
                    className="btn btn-ghost"
                    onClick={() => {
                        setScore(null);
                        setComment("");
                        setError(null);
                        setOkMsg(null);
                    }}
                >
                    Temizle
                </button>
            </div>
        </form>
    );
}
