"use client";

/*
 * ADMIN · ÖNERİ KUYRUĞU — client (003 / T108).
 *
 * - Kuyruk EN ESKİ önce (backend sırası — adil bekleme). Satırda "Olası tekrar" rozeti
 *   (gönderim anındaki tekrar adayı sayısı > 0).
 * - Filtreler ve seçili öneri (`id`) URL'de; yazım TIKLAMA ANINDA `new URLSearchParams(
 *   window.location.search)` kopyasıyla. Sayfalama `Pagination mode="url"`.
 * - Ayrıntı paneli (SuggestionReview): bilgiler, salt okunur harita ("Önerilen konum" +
 *   tekrar işaretçileri) ve tekrarların MESAFELİ METİN listesi (harita tek bilgi kaynağı değil).
 */
import {useRouter} from "next/navigation";
import {useEffect, useRef, useState} from "react";
import type {IdName} from "@/lib/types";
import {useAuthedData} from "@/lib/useAuthedData";
import {adminSuggestions} from "@/lib/adminApi";
import {errorMessage} from "@/lib/apiError";
import {DISTRICT_NAMES} from "@/lib/districts";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import StatusChip from "@/components/StatusChip";
import {formatDateTime} from "@/components/ChangeHistory";
import {Flag, Pin} from "@/components/icons";
import SuggestionReview from "./SuggestionReview";

type Props = {
    status: string;
    district?: string;
    q?: string;
    page: number;
    selected?: number;
    categories: IdName[];
    brands: IdName[];
};

const STATUS_FILTERS = [
    {value: "PENDING", label: "Bekleyen"},
    {value: "APPROVED", label: "Onaylanan"},
    {value: "REJECTED", label: "Reddedilen"},
    {value: "WITHDRAWN", label: "Geri çekilen"},
    {value: "ALL", label: "Tümü"},
];

export default function AdminSuggestionsClient({status, district, q, page, selected, categories, brands}: Props) {
    const router = useRouter();
    const [qText, setQText] = useState(q ?? "");
    const list = useAuthedData(`admin-suggestions:${status}:${district ?? ""}:${q ?? ""}:${page}`,
        t => adminSuggestions(t, {status, district, q, page, size: 20}));

    /** URL'i tıklama anında güncelle; `resetPage` filtre değişiminde sayfayı 1'e döndürür. */
    function apply(patch: Record<string, string | undefined>, resetPage = true, scroll = true) {
        const params = new URLSearchParams(window.location.search);
        Object.entries(patch).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
        if (resetPage) params.delete("page");
        router.push(`?${params.toString()}`, {scroll});
    }

    /*
     * Ayrıntı aç/kapat — yalnız URL'deki `id` değişir; sayfa kaydırılmaz (`scroll: false`).
     * page.tsx `key`'inde `id` OLMADIĞI için bu bileşen yeniden kurulmaz: liste verisi, yükseklik
     * ve odak korunur (eskiden her "İncele" tüm kuyruğu sıfırlayıp yeniden çekiyordu). Panel
     * açılınca odağı kendi başlığına taşır (useRevealOnReady); kapanınca odak, paneli açan
     * "İncele" düğmesine döner. Dönüş, URL güncellenip panel DOM'dan kalktıktan SONRA effect'te
     * yapılır — panel kalkınca liste yukarı kayar; `focus()` düğmeyi o anki yerinde görünür yapar.
     * Geri/ileri ile kapanışta (returnFocusTo boş) odağa dokunulmaz.
     */
    const returnFocusTo = useRef<number | null>(null);
    useEffect(() => {
        if (selected !== undefined || returnFocusTo.current === null) return;
        document.querySelector<HTMLElement>(`[data-review-trigger="${returnFocusTo.current}"]`)?.focus();
        returnFocusTo.current = null;
    }, [selected]);

    function openReview(id: number) {
        apply({id: String(id)}, false, false);
    }

    function closeReview() {
        returnFocusTo.current = selected ?? null;
        apply({id: undefined}, false, false);
    }

    const applyQ = () => apply({q: qText.trim().length >= 2 ? qText.trim() : undefined, id: undefined});

    return (
        <div className="stack">
            <div className="card admin-toolbar" role="search">
                <div className="chip-cluster" role="group" aria-label="Öneri durumu">
                    {STATUS_FILTERS.map(f => (
                        <button key={f.value} type="button" className="chip" aria-pressed={status === f.value}
                                onClick={() => apply({status: f.value === "PENDING" ? undefined : f.value, id: undefined})}>
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="admin-search admin-search-flat">
                    <select className="select select-compact" aria-label="İlçe" value={district ?? ""}
                            onChange={e => apply({district: e.target.value || undefined, id: undefined})}>
                        <option value="">Tüm ilçeler</option>
                        {DISTRICT_NAMES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input className="input" type="search" placeholder="Dükkan adı (en az 2 harf)" aria-label="Dükkan adı ara"
                           value={qText} onChange={e => setQText(e.target.value)}
                           onKeyDown={e => e.key === "Enter" && applyQ()}/>
                    <button type="button" className="btn btn-primary" onClick={applyQ}>Ara</button>
                    {(district || q) && (
                        <button type="button" className="btn btn-ghost" onClick={() => {
                            setQText("");
                            apply({district: undefined, q: undefined, id: undefined});
                        }}>Temizle</button>
                    )}
                </div>
            </div>

            {selected !== undefined && (
                <SuggestionReview key={selected} id={selected} categories={categories} brands={brands}
                                  onClose={closeReview}
                                  onDecided={() => list.reload()}/>
            )}

            {list.error ? <div className="alert alert-error" role="alert">{errorMessage(list.error, "Kuyruk alınamadı.")}</div> : null}
            {list.loading && !list.data && <p className="muted" role="status">Yükleniyor…</p>}
            {list.data && list.data.content.length === 0 && (
                <EmptyState icon={<Pin/>} title={status === "PENDING" ? "Bekleyen öneri yok" : "Kayıt yok"}
                            description="Üyelerin gönderdiği dükkan önerileri burada listelenir."/>
            )}
            {list.data && list.data.content.length > 0 && (
                <>
                    <p className="caption muted" role="status">{list.data.totalElements} öneri (en eski önce)</p>
                    <ul className="stack">
                        {list.data.content.map(s => (
                            <li key={s.id} className="card request-item" data-selected={s.id === selected}>
                                <div className="request-head">
                                    <div className="stack-sm request-body">
                                        <span className="card-title">{s.name}</span>
                                        <span className="caption muted">
                                            {s.district} &middot; {s.suggestedBy.email} &middot;{" "}
                                            <time dateTime={s.createdAt}>{formatDateTime(s.createdAt)}</time>
                                        </span>
                                    </div>
                                    <div className="cluster">
                                        {s.duplicateCandidateCount > 0 && (
                                            <span className="chip chip-neg"><Flag size="sm"/> Olası tekrar</span>
                                        )}
                                        <StatusChip status={s.status}/>
                                    </div>
                                </div>
                                <div className="row-actions request-actions">
                                    <button type="button" className="btn btn-outline btn-sm"
                                            aria-current={s.id === selected ? "true" : undefined}
                                            data-review-trigger={s.id}
                                            onClick={() => openReview(s.id)}>
                                        İncele<span className="sr-only">: {s.name}</span>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <Pagination mode="url" page={page} totalPages={list.data.totalPages}/>
                </>
            )}
        </div>
    );
}
