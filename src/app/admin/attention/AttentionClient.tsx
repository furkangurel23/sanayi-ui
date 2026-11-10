"use client";

/*
 * DİKKAT KUYRUĞU (003 / T100) — sahip düzenlemelerinden "dikkat" işareti alanlar (ad belirgin
 * değişti / konum 200 m'den fazla taşındı). Açık olanlar EN ESKİ önce (adil sıra).
 *
 * Filtreler URL'e TIKLAMA ANINDA yazılır (`new URLSearchParams(window.location.search)`
 * kopyası; useSearchParams yok). Sayfa değişimi ortak `Pagination mode="url"`.
 * Her kayıtta önce/sonra tablosu, "İncelendi" (204) ve "Geri al" (201; 409'da backend'in
 * çakışan alan mesajı). İşlemden sonra liste ve sekme rozetleri yenilenir.
 *
 * Odak ve duyuru: "Açık" görünümde işlem gören kayıt listeden ÇIKAR (yeniden yüklemede gelmez);
 * kaydın içindeki başarı mesajı ve odaklı düğme de onunla birlikte kaybolur (odak gövdeye düşer).
 * Bu yüzden mesaj LİSTE düzeyinde (`role="status"`) gösterilir ve odak liste başlığına
 * (tabIndex=-1) taşınır. "Çözülen" görünümde kayıt yerinde kalır -> mesaj kaydın içinde.
 */
import {useRouter} from "next/navigation";
import {useRef, useState} from "react";
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

    const [notice, setNotice] = useState<string | null>(null);
    const listHeading = useRef<HTMLHeadingElement>(null);
    // Kayıt listeden çıkacak mı? (yalnız "Açık" görünümde — çözülen kayıt orada kalır)
    const leavesList = attention === "open";

    const after = (message: string) => {
        queue.reload();
        notifyQueueCountsChanged();
        if (leavesList) {
            setNotice(message);
            // Başlık her durumda DOM'da (liste boşalsa da) -> odak güvenle oraya taşınır
            listHeading.current?.focus();
        }
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
            {queue.data && (
                <h2 ref={listHeading} tabIndex={-1} className="callout list-heading">
                    {attention === "open" ? "Açık kayıtlar" : "Çözülen kayıtlar"}
                </h2>
            )}
            {notice && <div className="alert alert-success" role="status">{notice}</div>}
            {queue.data && queue.data.content.length === 0 && (
                <EmptyState icon={<Flag/>}
                            title={attention === "open" ? "İncelenecek değişiklik yok" : "Çözülmüş kayıt yok"}
                            description="Sahip düzenlemelerinden dikkat gerektirenler burada listelenir."/>
            )}
            {queue.data && queue.data.content.length > 0 && (
                <>
                    <p className="caption muted" role="status">{queue.data.totalElements} kayıt</p>
                    <ChangeHistory items={queue.data.content} categories={categories} brands={brands} showProvider
                                   itemNotices={!leavesList}
                                   onAcknowledge={async id => {
                                       await acknowledgeChangeSet(await token(), id);
                                       after(`Kayıt #${id} incelendi olarak işaretlendi.`);
                                   }}
                                   onRevert={async id => {
                                       const t = await token();
                                       const created = await revertChangeSet(t, id);
                                       after(`Kayıt #${id} geri alındı.`);
                                       void revalidateProviderViews(created.providerId, t);
                                   }}/>
                    <Pagination mode="url" page={page} totalPages={queue.data.totalPages}/>
                </>
            )}
        </div>
    );
}
