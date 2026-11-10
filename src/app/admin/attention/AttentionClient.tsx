"use client";

/*
 * DİKKAT KUYRUĞU (003 / T100) — sahip düzenlemelerinden "dikkat" işareti alanlar (ad belirgin
 * değişti / konum 200 m'den fazla taşındı). Açık olanlar EN ESKİ önce (adil sıra).
 *
 * Filtreler URL'e TIKLAMA ANINDA yazılır (`new URLSearchParams(window.location.search)`
 * kopyası; useSearchParams yok). Sayfa değişimi ortak `Pagination mode="url"`.
 * Her kayıtta önce/sonra tablosu, "İncelendi" (204) ve "Geri al" (201; 409'da backend'in
 * çakışan alan mesajı). İşlemden sonra liste ve sekme rozetleri yenilenir.
 */
import {useRouter} from "next/navigation";
import {useState} from "react";
import type {IdName} from "@/lib/types";
import {useAuthedData} from "@/lib/useAuthedData";
import {acknowledgeChangeSet, attentionQueue, revertChangeSet} from "@/lib/adminApi";
import {ensureFreshToken} from "@/lib/auth";
import {ApiError, errorMessage} from "@/lib/apiError";
import {DISTRICT_NAMES} from "@/lib/districts";
import {notifyQueueCountsChanged} from "@/lib/queueEvents";
import {revalidateProviderViews} from "@/app/actions/revalidateProvider";
import ChangeHistory from "@/components/ChangeHistory";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import {Flag} from "@/components/icons";

type Props = {
    attention: "open" | "resolved";
    district?: string;
    q?: string;
    page: number;
    categories: IdName[];
    brands: IdName[];
};

async function token(): Promise<string> {
    const t = await ensureFreshToken();
    if (!t) throw new ApiError(401, "error.auth.unauthorized", "Oturumunuzun süresi doldu. Yeniden giriş yapın.");
    return t;
}

export default function AttentionClient({attention, district, q, page, categories, brands}: Props) {
    const router = useRouter();
    const [qText, setQText] = useState(q ?? "");
    const queue = useAuthedData(`attention:${attention}:${district ?? ""}:${q ?? ""}:${page}`,
        t => attentionQueue(t, {attention, district, q, page, size: 20}));

    /** Tıklama anında URL'i güncelle; filtre değişince sayfa 1'e döner. */
    function apply(patch: Record<string, string | undefined>) {
        const params = new URLSearchParams(window.location.search);
        Object.entries(patch).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
        params.delete("page");
        router.push(`?${params.toString()}`);
    }

    const after = () => {
        queue.reload();
        notifyQueueCountsChanged();
    };

    return (
        <div className="stack">
            <div className="card admin-search" role="search">
                <div className="seg" role="group" aria-label="Kayıt durumu">
                    <button type="button" data-active={attention === "open"} aria-pressed={attention === "open"}
                            onClick={() => apply({attention: undefined})}>Açık</button>
                    <button type="button" data-active={attention === "resolved"} aria-pressed={attention === "resolved"}
                            onClick={() => apply({attention: "resolved"})}>Çözülen</button>
                </div>
                <select className="select select-compact" aria-label="İlçe" value={district ?? ""}
                        onChange={e => apply({district: e.target.value || undefined})}>
                    <option value="">Tüm ilçeler</option>
                    {DISTRICT_NAMES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <input className="input" type="search" placeholder="Dükkan adı (en az 2 harf)" aria-label="Dükkan adı ara"
                       value={qText} onChange={e => setQText(e.target.value)}
                       onKeyDown={e => e.key === "Enter" && apply({q: qText.trim().length >= 2 ? qText.trim() : undefined})}/>
                <button type="button" className="btn btn-primary"
                        onClick={() => apply({q: qText.trim().length >= 2 ? qText.trim() : undefined})}>Ara</button>
                {(district || q) && (
                    <button type="button" className="btn btn-ghost" onClick={() => {
                        setQText("");
                        apply({district: undefined, q: undefined});
                    }}>Temizle</button>
                )}
            </div>

            {queue.error ? <div className="alert alert-error" role="alert">{errorMessage(queue.error, "Kuyruk alınamadı.")}</div> : null}
            {queue.loading && !queue.data && <p className="muted" role="status">Yükleniyor…</p>}
            {queue.data && queue.data.content.length === 0 && (
                <EmptyState icon={<Flag/>}
                            title={attention === "open" ? "İncelenecek değişiklik yok" : "Çözülmüş kayıt yok"}
                            description="Sahip düzenlemelerinden dikkat gerektirenler burada listelenir."/>
            )}
            {queue.data && queue.data.content.length > 0 && (
                <>
                    <p className="caption muted" role="status">{queue.data.totalElements} kayıt</p>
                    <ChangeHistory items={queue.data.content} categories={categories} brands={brands} showProvider
                                   onAcknowledge={async id => {
                                       await acknowledgeChangeSet(await token(), id);
                                       after();
                                   }}
                                   onRevert={async id => {
                                       const t = await token();
                                       const created = await revertChangeSet(t, id);
                                       after();
                                       void revalidateProviderViews(created.providerId, t);
                                   }}/>
                    <Pagination mode="url" page={page} totalPages={queue.data.totalPages}/>
                </>
            )}
        </div>
    );
}
