"use client";

/*
 * SOHBET katmanı: REST (geçmiş + gönderme + upload) ve STOMP/WebSocket (canlı akış).
 *
 * MİMARİ (öğrenme notu):
 *  - GÖNDERME REST ile yapılır (POST): JWT'yi HTTP header'ında taşımak kolaydır,
 *    hata yönetimi standart ErrorResponse üzerinden yürür.
 *  - DİNLEME WebSocket/STOMP ile yapılır: backend mesajı kaydettikten sonra
 *    "/topic/brands.{id}" topic'ine yayınlar; odaya abone HERKES anında görür.
 *    Bu "REST-write + WS-read" deseni, tam çift yönlü WS'ten daha basit ve sağlamdır.
 *
 *  STOMP nedir? WebSocket üstünde çalışan basit bir mesajlaşma protokolü
 *  (CONNECT/SUBSCRIBE/SEND/MESSAGE çerçeveleri). @stomp/stompjs bunu yönetir.
 */

import {publicApiBase} from "@/lib/apiBase";
import {Client} from "@stomp/stompjs";
import {authHeaderFresh, ensureFreshToken, getToken} from "@/lib/auth";
import {toApiError} from "@/lib/apiError";
import type {ChatMessage, Page, SpringPage} from "@/lib/types";
import {normalizePage} from "@/lib/page";

// 006: yalnız tarayıcıda çalışır → GENEL adres (lib/apiBase.ts).
const BASE = publicApiBase();
// WS adresi: http(s) -> ws(s) çevirisi + /api yerine /ws.
// Örn: http://localhost:8080/api -> ws://localhost:8080/ws
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? BASE.replace(/^http/, "ws").replace(/\/api$/, "/ws");

/** GET /api/user/me yanıtının tipi (backend CurrentUserDto). */
export type CurrentUser = {
    id: number;
    email: string;
    displayName?: string | null;
    role: string;
    emailVerified: boolean;
};

/** Oturumdaki kullanıcının kimliği; "bu mesaj benim mi?" kararında userId kullanılır. */
export async function getMe(): Promise<CurrentUser | null> {
    const res = await fetch(`${BASE}/user/me`, {headers: await authHeaderFresh(), cache: "no-store"});
    if (!res.ok) return null; // login değilse sessizce null — çağıran taraf yönlendirir
    return res.json();
}

/** Oda geçmişi: backend en YENİDEN eskiye sayfalar (sort=createdAt,desc). */
export async function getChatHistory(brandId: number, page = 0, size = 50): Promise<Page<ChatMessage>> {
    const res = await fetch(
        `${BASE}/chat/brands/${brandId}/messages?page=${page}&size=${size}&sort=createdAt,desc`,
        {headers: await authHeaderFresh(), cache: "no-store"},
    );
    if (!res.ok) throw await toApiError(res);
    return normalizePage(await res.json() as SpringPage<ChatMessage>);
}

/** Mesaj gönder (metin ve/veya ek). Backend 201 + kaydedilen mesajı döner ve topic'e yayınlar. */
export async function sendChatMessage(brandId: number, body: {
    content?: string;
    attachmentUrl?: string;
    attachmentType?: "IMAGE" | "VIDEO";
}): Promise<ChatMessage> {
    const res = await fetch(`${BASE}/chat/brands/${brandId}/messages`, {
        method: "POST",
        // Spread (...): taze token'ı Authorization olarak ekler (access 15 dk ömürlü).
        headers: {"Content-Type": "application/json", ...(await authHeaderFresh())},
        cache: "no-store",
        body: JSON.stringify(body),
    });
    if (!res.ok) throw await toApiError(res);
    return res.json();
}

/**
 * Fotoğraf/video yükleme.
 * FormData: multipart/form-data gövdesi kurar. DİKKAT: Content-Type header'ını
 * ELLE YAZMAYIZ — tarayıcı boundary parametresiyle birlikte kendisi ekler.
 */
export async function uploadChatAttachment(file: File): Promise<{ url: string; attachmentType: "IMAGE" | "VIDEO" }> {
    const form = new FormData();
    form.append("file", file); // backend @RequestParam("file") ile eşleşir
    const res = await fetch(`${BASE}/chat/uploads`, {
        method: "POST",
        headers: await authHeaderFresh(),
        body: form,
    });
    if (!res.ok) throw await toApiError(res);
    return res.json();
}

/** Göreli /uploads/... yolunu backend origin'i ile mutlak URL'e çevirir. */
export function attachmentSrc(url: string): string {
    if (url.startsWith("http")) return url;
    return BASE.replace(/\/api$/, "") + url;
}

/**
 * Markanın odasına STOMP ile bağlanır; gelen her mesajda onMessage çağrılır.
 *
 * Dönen değer bir "cleanup" fonksiyonudur (bağlantıyı kapatır) — React useEffect'in
 * return değeri olarak birebir kullanılır:
 *
 *   useEffect(() => {
 *     const disconnect = connectToRoom(id, addMessage);
 *     return disconnect;          // unmount'ta otomatik kapanır
 *   }, [id]);
 */
export function connectToRoom(brandId: number, onMessage: (m: ChatMessage) => void): () => void {
    if (!getToken()) return () => undefined; // login değilse hiç bağlanma (no-op cleanup dön)

    const client = new Client({
        brokerURL: WS_URL,
        // beforeConnect: HER (yeniden) bağlanmadan ÖNCE token'ı tazele -> uzun açık kalan
        // sohbette access token (15 dk) süresi dolsa bile WS CONNECT geçerli token'la gider.
        // Async destekli: stompjs bu promise'i bekler.
        beforeConnect: async () => {
            const fresh = await ensureFreshToken();
            client.connectHeaders = fresh ? {Authorization: `Bearer ${fresh}`} : {};
        },
        reconnectDelay: 4000, // kopunca 4 sn'de bir otomatik yeniden bağlan
        onConnect: () => {
            client.subscribe(`/topic/brands.${brandId}`, frame => {
                try {
                    onMessage(JSON.parse(frame.body) as ChatMessage);
                } catch { /* bozuk frame'i yok say — tek mesaj için tüm oda kırılmasın */ }
            });
        },
    });
    client.activate();
    return () => {
        // void: deactivate Promise döner ama beklememize gerek yok (fire-and-forget).
        void client.deactivate();
    };
}
