"use client";

/*
 * useAuth — oturum durumunu React'e REAKTİF olarak bağlayan custom hook.
 *
 * useSyncExternalStore nedir? (React 18+)
 *  React DIŞINDA yaşayan bir veri kaynağına (bizde: localStorage'daki token)
 *  güvenle abone olmanın resmi yolu. Üç parametre alır:
 *    1) subscribe(cb)  : kaynak değişince cb çağrılsın diye kayıt olur (auth.ts'teki listeners).
 *    2) getSnapshot()  : şu anki değeri döner (client).
 *    3) getServerSnapshot(): SSR sırasındaki değer — server'da localStorage yok, null döneriz.
 *  Böylece hydration uyumsuzluğu olmaz: server HTML "çıkış yapılmış" halde gelir,
 *  client mount olunca gerçek duruma geçer.
 *
 * Snapshot cache'i neden var?
 *  getSnapshot her render'da çağrılır; her seferinde YENİ obje dönersek React
 *  "değer değişti" sanıp sonsuz render döngüsüne girer. Bu yüzden aynı kullanıcı
 *  için AYNI obje referansını döndürüyoruz (referans eşitliği korunur).
 */

import {useSyncExternalStore} from "react";
import {getUser, subscribe, type AuthUser} from "@/lib/auth";

let cached: AuthUser | null = null;
let cachedKey = "";

function snapshot(): AuthUser | null {
    const u = getUser();
    const key = u ? `${u.email}:${u.exp}` : "";
    if (key !== cachedKey) { // içerik gerçekten değiştiyse yeni referans üret
        cached = u;
        cachedKey = key;
    }
    return cached;
}

/** Reaktif auth durumu; login/logout olduğunda bileşen otomatik yeniden render olur. */
export function useAuth(): AuthUser | null {
    return useSyncExternalStore(subscribe, snapshot, () => null);
}
