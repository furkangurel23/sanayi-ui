"use client";

/*
 * MARKA SOHBET ODASI — projenin en "canlı" client component'ı.
 *
 * Veri akışı (REST-write + WebSocket-read deseni):
 *   1) Mount olunca: GET history (REST) -> geçmiş mesajlar state'e.
 *   2) Aynı anda: STOMP ile /topic/brands.{id} topic'ine abone ol.
 *   3) Mesaj GÖNDERME: POST (REST). Backend kaydeder + topic'e yayınlar.
 *   4) Topic'ten gelen her mesaj (bizimki dahil) pushMessage ile listeye eklenir;
 *      id bazlı tekilleştirme çift eklemeyi önler.
 *
 * Öğrenilen React kalıpları:
 *  - useEffect cleanup: return edilen fonksiyon unmount'ta çalışır (WS bağlantısını kapatır).
 *  - useCallback: fonksiyon referansını sabitler; effect dependency'si olarak
 *    kullanıldığında gereksiz yeniden bağlanmayı önler.
 *  - useRef ile DOM erişimi: scroll konumu ve gizli file input'u tetiklemek için.
 *  - "cancelled" bayrağı: async işlem bitmeden bileşen unmount olursa
 *    setState çağrılmasın (memory leak / uyarı önlenir).
 */

import React, {useCallback, useEffect, useRef, useState} from "react";
import Link from "next/link";
import {useAuth} from "@/lib/useAuth";
import {errorMessage} from "@/lib/apiError";
import type {ChatMessage} from "@/lib/types";
import {
    attachmentSrc,
    connectToRoom,
    getChatHistory,
    getMe,
    sendChatMessage,
    uploadChatAttachment,
} from "@/lib/chat";

/**
 * Metindeki URL'leri tıklanabilir <a>'ya çevirir.
 *
 * Nasıl çalışır? split'e YAKALAMA GRUPLU regex verirsek (parantezli),
 * eşleşen parçalar da diziye dahil edilir:
 *   "bak https://x.com iyi" -> ["bak ", "https://x.com", " iyi"]
 * Sonra her parça URL mi diye test edilip <a> veya düz metin olarak basılır.
 *
 * Güvenlik: rel="noopener noreferrer nofollow"
 *  - noopener : açılan sayfa window.opener ile bizi yönlendiremesin (reverse-tabnabbing).
 *  - noreferrer: hedef site nereden geldiğimizi görmesin.
 *  - nofollow : arama motorları bu linki "bizim onayımız" saymasın (spam koruması).
 */
function Linkify({text}: { text: string }) {
    const parts = text.split(/(https?:\/\/[^\s<>"']+)/g);
    return (
        <>
            {parts.map((part, i) =>
                /^https?:\/\//.test(part)
                    ? <a key={i} href={part} target="_blank" rel="noopener noreferrer nofollow">{part}</a>
                    : <React.Fragment key={i}>{part}</React.Fragment>
            )}
        </>
    );
}

/** ISO tarih -> "14:32" (saat:dakika, TR yereli). */
function timeOf(iso: string) {
    try {
        return new Date(iso).toLocaleTimeString("tr-TR", {hour: "2-digit", minute: "2-digit"});
    } catch {
        return "";
    }
}

/** ISO tarih -> "8 Temmuz" (gün ayracı etiketi için). */
function dayOf(iso: string) {
    try {
        return new Date(iso).toLocaleDateString("tr-TR", {day: "numeric", month: "long"});
    } catch {
        return "";
    }
}

export default function ChatRoom({brandId, brandName}: { brandId: number; brandName: string }) {
    const user = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    // Kendi userId'miz: "bu mesaj benim mi?" kararı displayName gibi kırılgan bir
    // alanla değil, id ile verilir (GET /api/user/me).
    const [myId, setMyId] = useState<number | null>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // requestAnimationFrame: DOM güncellemesi boyandıktan SONRA scroll et
    // (yoksa yeni mesaj henüz yerleşmeden ölçüm yapılır, en alta inmez).
    const scrollDown = useCallback(() => {
        requestAnimationFrame(() => {
            bodyRef.current?.scrollTo({top: bodyRef.current.scrollHeight});
        });
    }, []);

    // Fonksiyonel setState: setMessages(prev => ...) — önceki değere göre güncelle.
    // WS mesajı ile REST yanıtı aynı mesajı iki kez getirebilir; id kontrolü tekilleştirir.
    const pushMessage = useCallback((m: ChatMessage) => {
        setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
        scrollDown();
    }, [scrollDown]);

    // Geçmiş + canlı bağlantı. Dependency dizisi: brandId veya user değişirse
    // effect ÖNCE cleanup çalıştırır (eski odadan kop), sonra yeniden kurulur.
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return; // login yoksa ne REST ne WS — aşağıda login daveti gösterilir
        }
        let cancelled = false;

        getMe().then(me => {
            if (!cancelled && me) setMyId(me.id);
        });

        getChatHistory(brandId)
            .then(page => {
                if (cancelled) return;
                // API en yeniden eskiye verir; ekranda eskiden yeniye akmalı -> reverse.
                // [...page.content]: reverse diziyi YERİNDE değiştirdiği için önce kopyala.
                setMessages([...page.content].reverse());
                setLoading(false);
                scrollDown();
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                setError(errorMessage(err, "Sohbet yüklenemedi."));
                setLoading(false);
            });

        const disconnect = connectToRoom(brandId, pushMessage);
        return () => {
            cancelled = true;
            disconnect(); // unmount/oda değişimi: WS bağlantısını kapat
        };
    }, [brandId, user, pushMessage, scrollDown]);

    async function send() {
        const content = text.trim();
        if (!content || sending) return;
        setSending(true);
        setError(null);
        try {
            const m = await sendChatMessage(brandId, {content});
            pushMessage(m); // WS yayınını beklemeden anında göster (optimistic-benzeri)
            setText("");
        } catch (err: unknown) {
            setError(errorMessage(err, "Mesaj gönderilemedi."));
        } finally {
            setSending(false);
        }
    }

    async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = ""; // aynı dosya ikinci kez seçilirse de onChange tetiklensin diye sıfırla
        if (!file || uploading) return;
        setUploading(true);
        setError(null);
        try {
            // İki adım: 1) dosyayı yükle (URL döner)  2) mesajı o URL ile gönder.
            const up = await uploadChatAttachment(file);
            const m = await sendChatMessage(brandId, {
                content: text.trim() || undefined,
                attachmentUrl: up.url,
                attachmentType: up.attachmentType,
            });
            pushMessage(m);
            setText("");
        } catch (err: unknown) {
            setError(errorMessage(err, "Dosya gönderilemedi."));
        } finally {
            setUploading(false);
        }
    }

    // Erken dönüş (early return): login yoksa odayı hiç kurma, davet ekranı göster.
    if (!user) {
        return (
            <div className="empty-state" style={{marginTop: "1rem"}}>
                <div style={{fontSize: "2rem"}} aria-hidden>🔒</div>
                <b>{brandName} odası üyelere özel</b>
                <span>Sohbete katılmak için giriş yapman gerekiyor.</span>
                <div className="row">
                    <Link href="/login" className="btn btn-primary">Giriş yap</Link>
                    <Link href="/register" className="btn btn-outline">Üye ol</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-shell">
            <div className="chat-head">
                <span className="room-avatar" style={{width: 38, height: 38}}>{brandName.charAt(0)}</span>
                <div>
                    <div style={{fontWeight: 700}}>{brandName} odası</div>
                    <div className="text-xs faint">Link, fotoğraf ve video paylaşabilirsin</div>
                </div>
                <Link href="/chat" className="btn btn-ghost btn-sm" style={{marginLeft: "auto"}}>← Odalar</Link>
            </div>

            <div className="chat-body" ref={bodyRef}>
                {loading && (
                    // Skeleton: içerik gelmeden yaklaşık yerleşimi göster (layout shift önlenir).
                    <>
                        <div className="skeleton" style={{height: 56, width: "55%"}}/>
                        <div className="skeleton" style={{height: 56, width: "45%", alignSelf: "flex-end"}}/>
                        <div className="skeleton" style={{height: 56, width: "60%"}}/>
                    </>
                )}
                {!loading && messages.length === 0 && (
                    <div className="empty-state" style={{border: 0}}>
                        İlk mesajı sen yaz — {brandName} kullananlara bir soru sor!
                    </div>
                )}
                {messages.map((m, i) => {
                    const own = myId !== null && m.userId === myId;
                    // Gün ayracı: önceki mesajla farklı güne geçildiyse araya etiket bas.
                    const newDay = i === 0 || dayOf(messages[i - 1].createdAt) !== dayOf(m.createdAt);
                    return (
                        // Fragment (<>...</>): tek parent zorunluluğunu DOM'a fazladan div
                        // eklemeden çözer; listede key gerektiği için uzun yazımı kullanıyoruz.
                        <React.Fragment key={m.id}>
                            {newDay && <span className="chat-day-divider">{dayOf(m.createdAt)}</span>}
                            <div className={`chat-msg${own ? " own" : ""}`}>
                                <span className="chat-avatar" aria-hidden>
                                    {m.displayName.charAt(0).toUpperCase()}
                                </span>
                                <div className="chat-bubble">
                                    <div className="chat-meta">
                                        <span className="chat-author">{m.displayName}</span>
                                        <span className="chat-time">{timeOf(m.createdAt)}</span>
                                    </div>
                                    {m.attachmentUrl && (
                                        <div className="chat-attachment">
                                            {m.attachmentType === "VIDEO" ? (
                                                // preload="metadata": sadece süre/boyut bilgisi indirilir,
                                                // video kullanıcı oynatana kadar İNDİRİLMEZ (bant genişliği).
                                                <video src={attachmentSrc(m.attachmentUrl)} controls preload="metadata"/>
                                            ) : (
                                                // next/image yerine <img>: kullanıcı yüklemelerinin boyutu
                                                // önceden bilinmiyor; loading="lazy" ile görünene kadar indirilmez.
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={attachmentSrc(m.attachmentUrl)} alt="Paylaşılan görsel"
                                                     loading="lazy"/>
                                            )}
                                        </div>
                                    )}
                                    {m.content && <span><Linkify text={m.content}/></span>}
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>

            {error && <div className="alert alert-error" style={{margin: "0 1rem 0.5rem", borderRadius: "var(--radius-sm)"}}>{error}</div>}

            <div className="chat-composer">
                {/* Gizli input + ref tetikleme: tarayıcının çirkin dosya butonu yerine
                    kendi ikon butonumuz. accept ile seçici, backend whitelist'iyle uyumlu. */}
                <input ref={fileRef} type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                       onChange={onPickFile}/>
                <button type="button" className="btn btn-ghost btn-icon" title="Fotoğraf / video ekle"
                        aria-label="Fotoğraf veya video ekle" disabled={uploading}
                        onClick={() => fileRef.current?.click()}>
                    {uploading ? (
                        <span className="text-xs">…</span>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                        </svg>
                    )}
                </button>
                <textarea
                    value={text}
                    placeholder={`${brandName} odasına yaz…`}
                    maxLength={2000}
                    rows={1}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => {
                        // Enter = gönder, Shift+Enter = satır atla (yaygın sohbet UX'i).
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void send();
                        }
                    }}
                />
                <button type="button" className="btn btn-primary" onClick={() => void send()}
                        disabled={sending || !text.trim()}>
                    Gönder
                </button>
            </div>
        </div>
    );
}
