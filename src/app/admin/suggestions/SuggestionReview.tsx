"use client";

/*
 * ÖNERİ AYRINTISI + KARAR (003 / T108).
 *
 * - Ayrıntı her açılışta CANLI çekilir: olası tekrarlar gönderimden sonra eklenen dükkanları da
 *   içerir (backend yeniden hesaplar).
 * - Harita (salt okunur LocationPicker): ayrı görünümlü "Önerilen konum" işaretçisi + tekrar
 *   işaretçileri. Tekrar DTO'su koordinat taşımadığı için işaretçi konumları dükkanların GENEL
 *   detay ucundan (`/api/providers/{id}`) okunur; okunamayan tekrar haritada çizilmez ama METİN
 *   listesinde mesafesiyle her zaman yer alır (harita tek bilgi kaynağı değil).
 * - Kararlar: "Olduğu gibi onayla" (overrides null), "Düzelterek onayla" (ProviderEditForm
 *   öneri-onay modu — tam alan seti `overrides` olarak gider; not alanı yönetici notudur),
 *   "Reddet" (ReasonDialog — gerekçe zorunlu, üyeye e-postayla gider).
 * - Onay sonrası: yeni dükkan bağlantısı; Server Action ile liste önbellekleri tazelenir;
 *   sekme rozetleri güncellenir.
 */
import {useState} from "react";
import Link from "next/link";
import type {IdName} from "@/lib/types";
import {useAuthedData} from "@/lib/useAuthedData";
import {adminSuggestion, approveSuggestion, rejectSuggestion} from "@/lib/adminApi";
import {ensureFreshToken} from "@/lib/auth";
import {ApiError, errorMessage} from "@/lib/apiError";
import {formToFieldsRequest, suggestionToForm} from "@/lib/providerFields";
import {notifyQueueCountsChanged} from "@/lib/queueEvents";
import {formatPhoneTR} from "@/lib/phone";
import {revalidateProviderViews} from "@/app/actions/revalidateProvider";
import LocationPickerClient from "@/components/LocationPickerClient";
import type {PickerMarker} from "@/components/LocationPicker";
import ProviderEditForm from "@/components/ProviderEditForm";
import ReasonDialog from "@/components/ReasonDialog";
import StatusChip from "@/components/StatusChip";
import {distanceText} from "@/components/SimilarShopsNotice";
import {formatDateTime} from "@/components/ChangeHistory";
import {Close} from "@/components/icons";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

type Props = {
    id: number;
    categories: IdName[];
    brands: IdName[];
    onClose: () => void;
    onDecided: () => void;
};

async function token(): Promise<string> {
    const t = await ensureFreshToken();
    if (!t) throw new ApiError(401, "error.auth.unauthorized", "Oturumunuzun süresi doldu. Yeniden giriş yapın.");
    return t;
}

/** Öneri + tekrarların harita işaretçileri (tekrar konumları genel detay ucundan). */
async function loadReview(t: string, id: number) {
    const s = await adminSuggestion(t, id);
    const dupMarkers = await Promise.all(s.possibleDuplicates.map(async d => {
        try {
            const res = await fetch(`${BASE}/providers/${d.id}`, {cache: "no-store"});
            if (!res.ok) return null;
            const detail = await res.json() as { location?: { lat: number; lon: number } | null };
            return detail.location
                ? {lat: detail.location.lat, lon: detail.location.lon, label: `${d.name} (${distanceText(d.distanceMeters)})`,
                    kind: "duplicate" as const}
                : null;
        } catch {
            return null;
        }
    }));
    const markers: PickerMarker[] = [
        {lat: s.lat, lon: s.lon, label: "Önerilen konum", kind: "suggested"},
        ...dupMarkers.filter((m): m is NonNullable<typeof m> => m !== null),
    ];
    return {s, markers};
}

export default function SuggestionReview({id, categories, brands, onClose, onDecided}: Props) {
    const review = useAuthedData(`admin-suggestion:${id}`, t => loadReview(t, id));
    const [editing, setEditing] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [approvedId, setApprovedId] = useState<number | null>(null);

    async function afterApprove(providerId: number | null | undefined, t: string) {
        setApprovedId(providerId ?? null);
        setEditing(false);
        review.reload();
        onDecided();
        notifyQueueCountsChanged();
        if (providerId) void revalidateProviderViews(providerId, t);
    }

    async function approveAsIs() {
        setBusy(true);
        setError(null);
        try {
            const t = await token();
            const res = await approveSuggestion(t, id, null);
            await afterApprove(res.providerId, t);
        } catch (e) {
            setError(errorMessage(e, "Onaylanamadı."));
        } finally {
            setBusy(false);
        }
    }

    let body;
    if (review.error) {
        body = <div className="alert alert-error" role="alert">{errorMessage(review.error, "Öneri alınamadı.")}</div>;
    } else if (!review.data) {
        body = <p className="muted" role="status">Yükleniyor…</p>;
    } else {
        const {s, markers} = review.data;
        const pending = s.status === "PENDING";
        body = (
            <div className="stack">
                <div className="request-head">
                    <div className="stack-sm request-body">
                        <h2 id="review-title" className="headline">{s.name}</h2>
                        <span className="caption muted">
                            #{s.id} &middot; {s.suggestedBy.email} &middot; <time dateTime={s.createdAt}>{formatDateTime(s.createdAt)}</time>
                        </span>
                    </div>
                    <StatusChip status={s.status}/>
                </div>

                <dl className="detail-list">
                    <div><dt>İlçe</dt><dd>{s.district}</dd></div>
                    <div><dt>Adres</dt><dd>{s.address || "(yok)"}</dd></div>
                    <div><dt>Telefon</dt><dd>{s.phone ? formatPhoneTR(s.phone) : "(yok)"}</dd></div>
                    <div><dt>Kategoriler</dt><dd>{s.categories.map(c => c.name).join(", ") || "(yok)"}</dd></div>
                    <div><dt>Markalar</dt><dd>{s.brands.map(b => b.name).join(", ") || "(yok)"}</dd></div>
                    <div><dt>Konum</dt><dd>{s.lat.toFixed(6)}, {s.lon.toFixed(6)}</dd></div>
                    {s.note && <div><dt>Üyenin notu</dt><dd>{s.note}</dd></div>}
                    {s.decisionReason && <div><dt>Gerekçe</dt><dd>{s.decisionReason}</dd></div>}
                </dl>

                <LocationPickerClient readOnly value={null} markers={markers} height={260}
                                      label={`${s.name} için önerilen konum ve olası tekrarlar`}/>
                <p className="caption muted">
                    Mavi büyük daire önerilen konum; kırmızı daireler adı benzeyen mevcut dükkanlar.
                </p>

                <section className="stack-sm" aria-labelledby="dups-title">
                    <h3 id="dups-title" className="callout">Olası tekrarlar (75 m içinde, adı benzeyen)</h3>
                    {s.possibleDuplicates.length === 0
                        ? <p className="muted">Olası tekrar yok.</p>
                        : (
                            <ul className="stack-sm">
                                {s.possibleDuplicates.map(d => (
                                    <li key={d.id}>
                                        <Link href={`/providers/${d.id}`} target="_blank" rel="noopener" className="link-accent">
                                            {d.name}<span className="sr-only"> (yeni sekmede açılır)</span>
                                        </Link>
                                        <span className="caption muted"> &middot; #{d.id}
                                            {d.district ? ` · ${d.district}` : ""} &middot; {distanceText(d.distanceMeters)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                </section>

                {(approvedId || (s.status === "APPROVED" && s.createdProviderId)) && (
                    <div className="alert alert-success" role="status">
                        Öneri onaylandı; dükkan oluşturuldu.{" "}
                        <Link href={`/providers/${approvedId ?? s.createdProviderId}`} className="link-accent">Dükkan sayfası</Link>
                        {" "}&middot;{" "}
                        <Link href={`/admin/providers/${approvedId ?? s.createdProviderId}`} className="link-accent">Yönetici düzenleme</Link>
                    </div>
                )}
                {error && <div className="alert alert-error" role="alert">{error}</div>}

                {pending && !editing && (
                    <div className="form-actions">
                        <button type="button" className="btn btn-primary" disabled={busy} onClick={approveAsIs}>
                            {busy ? "Onaylanıyor…" : "Olduğu gibi onayla"}
                        </button>
                        <button type="button" className="btn btn-outline" disabled={busy} onClick={() => setEditing(true)}>
                            Düzelterek onayla
                        </button>
                        <button type="button" className="btn btn-danger" disabled={busy} onClick={() => setRejecting(true)}>
                            Reddet
                        </button>
                    </div>
                )}

                {pending && editing && (
                    <ProviderEditForm
                        mode="suggestApprove" categories={categories} brands={brands}
                        initial={suggestionToForm(s)}
                        submitLabel="Düzeltmelerle onayla" submittingLabel="Onaylanıyor…"
                        secondaryAction={<button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Vazgeç</button>}
                        onSubmit={async values => {
                            const t = await token();
                            const res = await approveSuggestion(t, id, formToFieldsRequest(values), values.note);
                            await afterApprove(res.providerId, t);
                        }}
                    />
                )}

                <ReasonDialog open={rejecting} title="Öneriyi reddet"
                              description={`"${s.name}" önerisini neden reddediyorsunuz? Gerekçe üyeye e-postayla iletilir.`}
                              confirmLabel="Reddet" onClose={() => setRejecting(false)}
                              onConfirm={async reason => {
                                  await rejectSuggestion(await token(), id, reason);
                                  setRejecting(false);
                                  review.reload();
                                  onDecided();
                                  notifyQueueCountsChanged();
                              }}/>
            </div>
        );
    }

    return (
        <section className="card review-panel" aria-labelledby={review.data ? "review-title" : undefined}
                 aria-label={review.data ? undefined : "Öneri ayrıntısı"}>
            <div className="review-close">
                <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
                    <Close size="sm"/> Ayrıntıyı kapat
                </button>
            </div>
            {body}
        </section>
    );
}
