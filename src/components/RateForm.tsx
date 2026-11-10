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
 * reCAPTCHA (performans):
 *  - Kutu RecaptchaField içinde ve `next/dynamic(..., {ssr:false})` ile yükleniyor:
 *    üyeye ve site key yoksa HİÇ indirilmez.
 *  - `mounted` bayrağı neden var? useAuth'un SUNUCU anlık görüntüsü null'dır
 *    (sunucu localStorage'ı bilemez). Hidrasyon render'ında herkes "anonim" görünür;
 *    bayrak olmasaydı dinamik import üye kullanıcıda da o ilk render'da tetiklenirdi.
 *    `useSyncExternalStore(noop, () => true, () => false)`: sunucuda ve hidrasyonda
 *    false, hidrasyon bittikten sonra true döner — useEffect + setState'siz
 *    (o kalıp hem ekstra render yapar hem lint uyarısı üretir).
 *
 * Puan seçici — WAI-ARIA "Radio Group" klavye kalıbı (002 / D6, FR-017 a11y istisnası):
 *  - TEK sekme durağı ("roving tabindex"): yalnızca seçili değer (hiç seçim yoksa ilki,
 *    −5) tabIndex=0 taşır; diğerleri -1. Tab grubun içine bir kez girer, bir kez çıkar.
 *  - ←/↑ önceki, →/↓ sonraki değer (uçlarda başa/sona sarar); Home −5, End +5.
 *    Ok tuşu odağı TAŞIR ve değeri SEÇER (radyo grubunda seçim odağı izler).
 *  - Seçili değer yalnız renkle değil (D10): kalın sayı + köşede Check ikonu + kenar.
 *  - pickRefs: düğmelerin DOM referansları dizisi; klavyeyle seçilen düğmeye
 *    .focus() çağırmak için (React'te DOM'a imperatif erişim = ref).
 *
 * Hata standardı:
 *  - postRating başarısız olursa ApiError fırlatır; err.code'a göre dallanır,
 *    err.message backend'den gelen hazır Türkçe metindir (messages.properties).
 */

import React, {useEffect, useMemo, useRef, useState, useSyncExternalStore} from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {useRouter} from "next/navigation";
import {postRating} from "@/lib/api";
import {useAuth} from "@/lib/useAuth";
import {ensureFreshToken} from "@/lib/auth";
import {ApiError, errorMessage} from "@/lib/apiError";
import {Check} from "@/components/icons";
import {formatScore} from "@/components/ScoreBadge";

// Dinamik (ayrı chunk) ve yalnız istemcide; bkz. dosya başı "reCAPTCHA (performans)".
const RecaptchaField = dynamic(() => import("@/components/RecaptchaField"), {ssr: false});

// useSyncExternalStore için "hiçbir şeye abone olma" fonksiyonu: değer hiç değişmez,
// yalnızca sunucu (false) / istemci (true) farkını okuyoruz.
const noopSubscribe = () => () => {};

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
    // Puan düğmelerinin DOM referansları (klavyeyle odak taşımak için)
    const pickRefs = useRef<Array<HTMLButtonElement | null>>([]);

    /** Ok/Home/End tuşları: yeni değeri seç ve odağı ona taşı (radio group kalıbı). */
    const onPickerKey = (e: React.KeyboardEvent, index: number) => {
        let next: number | null = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (index + 1) % SCORES.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (index - 1 + SCORES.length) % SCORES.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = SCORES.length - 1;
        if (next === null) return;
        e.preventDefault(); // sayfa kaydırmasını engelle
        setScore(SCORES[next]);
        pickRefs.current[next]?.focus();
    };

    // reCAPTCHA yalnızca anonim kullanıcıya gösterilir (üye için gereksiz sürtünme).
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
    // Hidrasyon bitti mi? (sunucu/hidrasyon: false, sonrası: true)
    const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
    const showCaptcha = Boolean(siteKey) && mounted && !user;
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    // Gönderim sonrası artırılır -> RecaptchaField key ile yeniden kurulur (= reset).
    const [captchaResetKey, setCaptchaResetKey] = useState(0);

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
            setCaptchaResetKey(k => k + 1); // kutuyu sıfırla (eski token tek kullanımlık)
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
                <h2 className="headline">Değerlendir</h2>
                {!user && (
                    <span className="caption muted">
                        Anonim tek oy hakkı · <Link href="/login" className="btn btn-ghost btn-sm">Giriş yap</Link>
                    </span>
                )}
            </div>

            {/* role="radiogroup" + aria-checked: ekran okuyucular için "tek seçimli grup" semantiği.
                aria-labelledby: grubun adı görünen etiketten gelir (tek kaynak). */}
            <div className="field">
                <span id="score-label" className="field-label">Puanın (-5 çok kötü · +5 mükemmel)</span>
                <div className="score-picker" role="radiogroup" aria-labelledby="score-label">
                    {SCORES.map((s, i) => {
                        const checked = score === s;
                        // Roving tabindex: seçili olan (hiç seçim yoksa ilki) sekme durağıdır.
                        const tabStop = score === null ? i === 0 : checked;
                        const f = formatScore(s, 0);
                        const word = s > 0 ? "artı " : s < 0 ? "eksi " : "";
                        return (
                            <button
                                key={s}
                                ref={el => {
                                    pickRefs.current[i] = el;
                                }}
                                type="button" // önemli: default "submit"tir, formu göndermesin!
                                role="radio"
                                aria-checked={checked}
                                aria-label={`${word}${f.value}`}
                                tabIndex={tabStop ? 0 : -1}
                                className="score-pick"
                                // data-tone: CSS'te seçili tonun rengi ([aria-checked="true"][data-tone])
                                data-tone={s === 0 ? "zero" : s > 0 ? "pos" : "neg"}
                                onClick={() => setScore(s)}
                                onKeyDown={e => onPickerKey(e, i)}
                            >
                                {f.sign}{f.value}
                                {checked && <span className="score-pick-check"><Check size="sm"/></span>}
                            </button>
                        );
                    })}
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
                    <RecaptchaField
                        siteKey={siteKey}
                        onToken={setCaptchaToken}
                        resetKey={captchaResetKey}
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
