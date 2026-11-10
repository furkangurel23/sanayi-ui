"use client";

/*
 * useAuthedData — belirteç gerektiren veriyi TARAYICIDAN çeken küçük hook (003).
 *
 * Neden? Hesap ve yönetici ekranlarının verisi kişiye özeldir (JWT localStorage'da, sunucu
 * görmez) -> Server Component çekemez; client bileşen `useEffect` ile çeker. Her ekranda aynı
 * "yükleniyor / hata / veri / yeniden yükle" kalıbını tekrar yazmamak için tek hook.
 *
 * Öğrenme notları:
 *  - `key`: isteği tanımlayan metin (ör. `history:12:p2`). key değişince effect yeniden çalışır
 *    ve YENİ veri çekilir — bağımlılık dizisi yalnız key'dir (fonksiyon kimliği değil).
 *  - "Yükleniyor" ayrı bir state DEĞİL, türetilir: son gelen sonucun anahtarı şu anki anahtara
 *    eşit değilse istek sürüyordur. Böylece effect gövdesinde senkron `setState` çağrılmaz
 *    (React'in "set-state-in-effect" kuralı: effect içinde doğrudan setState zincirleme render
 *    üretir). setState yalnız Promise geri çağrısında (`.then`) — dış sistemden gelen yanıtla.
 *  - Yarış koruması: effect temizliği `alive = false` yapar; anahtar değiştikten sonra gelen
 *    ESKİ yanıt yok sayılır (sırasız yanıt yeni sonucu ezemez).
 *  - "latest ref" kalıbı: `fetcher` her render'da yeni fonksiyon olabilir; en güncelini ref'te
 *    tutarız ki effect'i her render'da yeniden kurmayalım.
 *  - `reload()`: aynı anahtarla yeniden çek (sayaç anahtara eklenir). `mutate(fn)`: iyimser
 *    yerel güncelleme (ör. satırı listeden çıkar) — sunucuya tekrar sormadan.
 *  - Belirteç yoksa 401 ApiError üretilir; ekran bunu "giriş yap" durumuna çevirir.
 */

import {useCallback, useEffect, useRef, useState} from "react";
import {ensureFreshToken} from "@/lib/auth";
import {ApiError} from "@/lib/apiError";

type Result<T> = { key: string; data?: T; error?: unknown };

export function useAuthedData<T>(key: string | null, fetcher: (token: string) => Promise<T>) {
    const [result, setResult] = useState<Result<T> | null>(null);
    const [nonce, setNonce] = useState(0);
    const fetcherRef = useRef(fetcher);
    const fullKey = key === null ? null : `${key}#${nonce}`;

    useEffect(() => {
        fetcherRef.current = fetcher;
    });

    useEffect(() => {
        if (fullKey === null) return; // key null = henüz çekme (ör. oturum bekleniyor)
        let alive = true;
        ensureFreshToken()
            .then(token => {
                if (!token) throw new ApiError(401, "error.auth.unauthorized", "Bu işlem için giriş yapmalısınız.");
                return fetcherRef.current(token);
            })
            .then(
                data => alive && setResult({key: fullKey, data}),
                error => alive && setResult(r => ({key: fullKey, error, data: r?.data})),
            );
        return () => {
            alive = false;
        };
    }, [fullKey]);

    const reload = useCallback(() => setNonce(n => n + 1), []);
    const mutate = useCallback((fn: (prev: T) => T) => {
        setResult(r => (r && r.data !== undefined ? {...r, data: fn(r.data)} : r));
    }, []);

    const fresh = result !== null && result.key === fullKey;
    return {
        /** Son başarılı veri (yeni istek sürerken eski veri ekranda kalır — boş ekran zıplaması olmaz). */
        data: result?.data,
        /** Yalnız GÜNCEL isteğin hatası. */
        error: fresh ? result?.error : undefined,
        loading: fullKey !== null && !fresh,
        reload,
        mutate,
    };
}
