"use client";

/*
 * TALEP AYRINTISI + KARAR (003 / T116).
 *
 * - Talep eden, kişisel bilgiler (anonimleştirilmişse "anonimleştirildi"), KVKK sürümü ve onay
 *   anı, belgeler (DocumentDownloadButton — uyarı metniyle), dükkanın mevcut sahibi ve aynı
 *   dükkanın diğer bekleyen talepleri.
 * - Onay: 201 sahiplik. Dükkanın aktif sahibi varsa backend 409 `error.ownership.already-active`
 *   döner — devir İKİ adımdır: önce "Sahipliği geri al" (ReasonDialog, gerekçe zorunlu), sonra onay.
 * - Ret: ReasonDialog (gerekçe üyeye e-postayla gider). `window.prompt` kullanılmaz.
 * - Karar sonrası: liste ve sekme rozetleri tazelenir; Server Action dükkan listesi önbelleklerini
 *   tazeler; odak ayrıntı başlığına taşınır (karar düğmeleri DOM'dan kalktığı için).
 */
import {useEffect, useRef, useState} from "react";
import Link from "next/link";
import {useAuthedData} from "@/lib/useAuthedData";
import {adminClaim, approveClaim, rejectClaim, revokeOwnership} from "@/lib/adminApi";
import {ensureFreshToken} from "@/lib/auth";
import {ApiError, errorMessage} from "@/lib/apiError";
import {notifyQueueCountsChanged} from "@/lib/queueEvents";
import {formatPhoneTR} from "@/lib/phone";
import {revalidateProviderViews} from "@/app/actions/revalidateProvider";
import ReasonDialog from "@/components/ReasonDialog";
import StatusChip from "@/components/StatusChip";
import DocumentDownloadButton from "@/components/DocumentDownloadButton";
import {formatDateTime} from "@/components/ChangeHistory";
import {Alert, Close, File as FileIcon} from "@/components/icons";

async function token(): Promise<string> {
    const t = await ensureFreshToken();
    if (!t) throw new ApiError(401, "error.auth.unauthorized", "Oturumunuzun süresi doldu. Yeniden giriş yapın.");
    return t;
}

type Props = { id: number; onClose: () => void; onDecided: () => void };

export default function ClaimReview({id, onClose, onDecided}: Props) {
    const claim = useAuthedData(`admin-claim:${id}`, t => adminClaim(t, id));
    const [dialog, setDialog] = useState<"reject" | "revoke" | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const headingRef = useRef<HTMLHeadingElement>(null);

    // Karar verilince (PENDING -> başka durum) odak başlığa: karar düğmeleri DOM'dan kalktı.
    const status = claim.data?.status;
    const prevStatus = useRef(status);
    useEffect(() => {
        if (prevStatus.current === "PENDING" && status && status !== "PENDING") headingRef.current?.focus();
        prevStatus.current = status;
    }, [status]);

    function changed(providerId: number, t: string, message: string) {
        setInfo(message);
        claim.reload();
        onDecided();
        notifyQueueCountsChanged();
        void revalidateProviderViews(providerId, t);
    }

    async function approve() {
        setBusy(true);
        setError(null);
        setInfo(null);
        try {
            const t = await token();
            const o = await approveClaim(t, id);
            changed(o.providerId, t, `Talep onaylandı; ${o.userEmail} artık dükkanın sahibi.`);
        } catch (e) {
            setError(e instanceof ApiError && e.code === "error.ownership.already-active"
                ? "Dükkanın onaylı bir sahibi var. Devir için önce mevcut sahipliği geri alın, sonra bu talebi onaylayın."
                : errorMessage(e, "Onaylanamadı."));
        } finally {
            setBusy(false);
        }
    }

    let body;
    if (claim.error) {
        body = <div className="alert alert-error" role="alert">{errorMessage(claim.error, "Talep alınamadı.")}</div>;
    } else if (!claim.data) {
        body = <p className="muted" role="status">Yükleniyor…</p>;
    } else {
        const c = claim.data;
        const pending = c.status === "PENDING";
        body = (
            <div className="stack">
                <div className="request-head">
                    <div className="stack-sm request-body">
                        <h2 id="claim-review-title" ref={headingRef} tabIndex={-1} className="headline">
                            Talep #{c.id}: {c.provider.name}
                        </h2>
                        <span className="caption muted">
                            {c.claimant.email} &middot; <time dateTime={c.createdAt}>{formatDateTime(c.createdAt)}</time>
                        </span>
                    </div>
                    <div className="cluster">
                        {c.kind === "DISPUTE" && <span className="chip chip-neg">İtiraz</span>}
                        <StatusChip status={c.status}/>
                    </div>
                </div>

                <dl className="detail-list">
                    <div><dt>Dükkan</dt><dd>
                        <Link href={`/providers/${c.provider.id}`} className="link-accent">{c.provider.name}</Link>
                        {" "}({c.providerDistrict ?? "ilçe yok"}) &middot;{" "}
                        <Link href={`/admin/providers/${c.provider.id}`} className="link-accent">yönetici düzenleme</Link>
                    </dd></div>
                    {c.anonymized ? (
                        <div><dt>Kişisel bilgiler</dt><dd>Anonimleştirildi (180 gün kuralı).</dd></div>
                    ) : (
                        <>
                            <div><dt>Ad soyad</dt><dd>{c.fullName}</dd></div>
                            <div><dt>Telefon</dt><dd>{c.phone ? formatPhoneTR(c.phone) : "(yok)"}</dd></div>
                            <div><dt>Açıklama</dt><dd>{c.description}</dd></div>
                        </>
                    )}
                    <div><dt>Aydınlatma metni</dt><dd>Sürüm {c.kvkkVersion}, onay: {formatDateTime(c.kvkkAcceptedAt)}</dd></div>
                    {c.decisionReason && <div><dt>Gerekçe</dt><dd>{c.decisionReason}</dd></div>}
                    {c.otherPendingClaims > 0 && (
                        <div><dt>Diğer talepler</dt><dd>Bu dükkan için {c.otherPendingClaims} bekleyen başka talep var.</dd></div>
                    )}
                </dl>

                <section className="stack-sm" aria-labelledby="claim-docs-title">
                    <h3 id="claim-docs-title" className="callout">Belgeler</h3>
                    <p className="alert alert-info"><Alert size="sm"/> Dosyaları yalnız güvendiğiniz cihazda açın.</p>
                    {c.documents.length === 0 ? <p className="muted">Belge yok.</p> : (
                        <ul className="file-list">
                            {c.documents.map(d => (
                                <li key={d.id} className="file-item">
                                    <FileIcon size="sm"/>
                                    <span className="file-name">{d.originalName ?? `Belge ${d.id}`}</span>
                                    <span className="caption muted">{Math.max(1, Math.round(d.sizeBytes / 1024))} KB</span>
                                    <DocumentDownloadButton claimId={c.id} doc={d}/>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="card ownership-card stack-sm" aria-labelledby="claim-owner-title">
                    <h3 id="claim-owner-title" className="callout">Mevcut sahip</h3>
                    {c.currentOwner ? (
                        <>
                            <p>{c.currentOwner.email} &middot; {formatDateTime(c.currentOwner.since)} tarihinden beri</p>
                            <div>
                                <button type="button" className="btn btn-danger btn-sm" onClick={() => setDialog("revoke")}>
                                    Sahipliği geri al
                                </button>
                            </div>
                        </>
                    ) : <p className="muted">Dükkanın onaylı sahibi yok.</p>}
                </section>

                {info && <div className="alert alert-success" role="status">{info}</div>}
                {error && <div className="alert alert-error" role="alert">{error}</div>}

                {pending && (
                    <div className="form-actions">
                        <button type="button" className="btn btn-primary" disabled={busy} onClick={approve}>
                            {busy ? "Onaylanıyor…" : "Onayla"}
                        </button>
                        <button type="button" className="btn btn-danger" disabled={busy} onClick={() => setDialog("reject")}>
                            Reddet
                        </button>
                    </div>
                )}

                <ReasonDialog open={dialog === "reject"} title="Talebi reddet"
                              description={`Talep #${c.id} (${c.provider.name}) neden reddediliyor? Gerekçe üyeye e-postayla iletilir.`}
                              confirmLabel="Reddet" onClose={() => setDialog(null)}
                              onConfirm={async reason => {
                                  const t = await token();
                                  await rejectClaim(t, id, reason);
                                  setDialog(null);
                                  changed(c.provider.id, t, "Talep reddedildi.");
                              }}/>
                {c.currentOwner && (
                    <ReasonDialog open={dialog === "revoke"} title="Sahipliği geri al"
                                  description={`${c.currentOwner.email} kullanıcısının ${c.provider.name} sahipliği geri alınacak; düzenleme yetkisi hemen kalkar. Gerekçe sahibe e-postayla iletilir.`}
                                  confirmLabel="Sahipliği geri al" onClose={() => setDialog(null)}
                                  onConfirm={async reason => {
                                      const t = await token();
                                      await revokeOwnership(t, c.currentOwner!.ownershipId, reason);
                                      setDialog(null);
                                      changed(c.provider.id, t, "Sahiplik geri alındı. Şimdi bu talebi onaylayabilirsiniz.");
                                  }}/>
                )}
            </div>
        );
    }

    return (
        <section className="card review-panel" aria-labelledby={claim.data ? "claim-review-title" : undefined}
                 aria-label={claim.data ? undefined : "Talep ayrıntısı"}>
            <div className="review-close">
                <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
                    <Close size="sm"/> Ayrıntıyı kapat
                </button>
            </div>
            {body}
        </section>
    );
}
