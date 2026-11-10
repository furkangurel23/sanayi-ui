"use client";

/*
 * E-POSTA DOĞRULAMA — client tarafı. Token, server sayfadan PROP olarak gelir.
 *
 * Önemli kalıplar:
 *  - useRef(started): React StrictMode geliştirmede effect'leri İKİ KEZ çalıştırır;
 *    token TEK KULLANIMLIK olduğu için ikinci çağrıyı ref bayrağıyla engelleriz.
 *  - Başarıda backend JWT döner -> setToken ile otomatik giriş -> anasayfaya yönlendir.
 *  - Hata mesajı ApiError.message'tan gelir (backend'in hazır Türkçe metni).
 */

import {useEffect, useRef, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {verifyEmail} from "@/lib/authApi";
import {setToken} from "@/lib/auth";
import {errorMessage} from "@/lib/apiError";

export default function VerifyEmailClient({token}: { token: string }) {
    const router = useRouter();
    const [state, setState] = useState<"pending" | "ok" | "error">("pending");
    const [message, setMessage] = useState("Doğrulanıyor…");
    const started = useRef(false);

    useEffect(() => {
        if (!token) {
            setState("error");
            setMessage("Doğrulama kodu bulunamadı. E-postandaki bağlantıyı kullan.");
            return;
        }
        if (started.current) return; // StrictMode çift çağrısını engelle (token tek kullanımlık)
        started.current = true;

        verifyEmail(token)
            .then(res => {
                setToken(res.token, res.refreshToken); // doğrulama sonrası otomatik giriş
                setState("ok");
                setMessage("E-postan doğrulandı, giriş yapıldı. Yönlendiriliyorsun…");
                setTimeout(() => {
                    router.push("/");
                    router.refresh();
                }, 1500);
            })
            .catch((err: unknown) => {
                setState("error");
                setMessage(errorMessage(err, "Doğrulama başarısız."));
            });
    }, [token, router]);

    return (
        <main className="container auth-wrap">
            <div className="card auth-card" style={{textAlign: "center"}}>
                <div style={{fontSize: "2.5rem"}} aria-hidden>
                    {state === "pending" ? "⏳" : state === "ok" ? "✅" : "⚠️"}
                </div>
                <h1>E-posta doğrulama</h1>
                <p className="card-sub">{message}</p>
                {state === "error" && (
                    <div className="row" style={{justifyContent: "center"}}>
                        <Link href="/login" className="btn btn-outline">Girişe dön</Link>
                        <Link href="/register" className="btn btn-ghost">Yeniden kayıt ol</Link>
                    </div>
                )}
            </div>
        </main>
    );
}
