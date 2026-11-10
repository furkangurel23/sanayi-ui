"use client";

/*
 * ADMIN DÜKKAN DÜZENLEME (003 / T099) — sahip ekranıyla AYNI form (mod "admin") + değişiklik
 * geçmişi (e-postalar görünür) + "Geri al" + sahiplik kartı.
 *
 * - Sürüm/409 akışı EditOwnedProviderClient ile aynı (bkz. oradaki açıklama).
 * - "Geri al" 201 + yeni REVERT kaydı döner; alan sonradan değiştiyse 409 ve backend mesajı
 *   çakışan alan adlarını söyler ("ad, telefon") — ChangeHistory kaydın altında gösterir.
 *   Başarıda form yeni değerleri göstersin diye görünüm de yeniden çekilir (form `key` ile
 *   yeniden kurulur — sürüm değişince yeni başlangıç değeri).
 * - Sahiplik kartı: `GET /api/admin/providers/{id}/ownership` (204 = sahip yok). "Sahipliği geri
 *   al" ReasonDialog ile (gerekçe zorunlu, `window.prompt` yok); eski sahibin düzenleme yetkisi
 *   hemen kalkar. Sonra görünüm + sahiplik yeniden çekilir ve liste önbellekleri tazelenir.
 */
import {useState} from "react";
import Link from "next/link";
import type {IdName} from "@/lib/types";
import ProviderEditForm from "@/components/ProviderEditForm";
import ChangeHistory from "@/components/ChangeHistory";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/components/Pagination";
import {useAuthedData} from "@/lib/useAuthedData";
import {
    adminGetEditView, adminHistory, adminUpdateProvider, providerOwnership, revertChangeSet, revokeOwnership,
} from "@/lib/adminApi";
import ReasonDialog from "@/components/ReasonDialog";
import {formatDateTime} from "@/components/ChangeHistory";
import {ensureFreshToken} from "@/lib/auth";
import {ApiError, errorMessage} from "@/lib/apiError";
import {formToEditRequest, viewToForm} from "@/lib/providerFields";
import {revalidateProviderViews} from "@/app/actions/revalidateProvider";
import {Alert, Shield} from "@/components/icons";

type Props = { id: number; categories: IdName[]; brands: IdName[] };

async function token(): Promise<string> {
    const t = await ensureFreshToken();
    if (!t) throw new ApiError(401, "error.auth.unauthorized", "Oturumunuzun süresi doldu. Yeniden giriş yapın.");
    return t;
}

export default function AdminProviderEditClient({id, categories, brands}: Props) {
    const view = useAuthedData(`admin:view:${id}`, t => adminGetEditView(t, id));
    const [historyPage, setHistoryPage] = useState(1);
    const history = useAuthedData(`admin:history:${id}:${historyPage}`, t => adminHistory(t, id, historyPage, 10));
    const [savedVersion, setSavedVersion] = useState<number | null>(null);
    const ownership = useAuthedData(`admin:ownership:${id}`, t => providerOwnership(t, id));
    const [revoking, setRevoking] = useState(false);
    const [ownerInfo, setOwnerInfo] = useState<string | null>(null);

    if (view.error) {
        return (
            <EmptyState icon={<Alert/>} title="Dükkan yüklenemedi" description={errorMessage(view.error)}
                        action={<Link href="/admin/providers" className="btn btn-outline">Dükkan listesi</Link>}/>
        );
    }
    if (!view.data) return <p className="muted" role="status">Yükleniyor…</p>;
    const v = view.data;
    const version = savedVersion ?? v.version;

    return (
        <div className="stack">
            <div className="row-between">
                <h2 className="headline">
                    <Link href={`/providers/${id}`} className="link-accent">{v.name}</Link>
                    <span className="caption muted"> #{id}</span>
                </h2>
                <div className="cluster">
                    {v.manuallyEdited && <span className="chip chip-accent">Elle düzenlendi</span>}
                </div>
            </div>

            <section className="card ownership-card stack-sm" aria-labelledby="owner-title">
                <h3 id="owner-title" className="callout"><Shield size="sm"/> Sahiplik</h3>
                {ownership.data ? (
                    <>
                        <p>Aktif sahip: <b>{ownership.data.userEmail}</b> (kullanıcı #{ownership.data.userId}) &middot;{" "}
                            {formatDateTime(ownership.data.startedAt)} tarihinden beri</p>
                        <div>
                            <button type="button" className="btn btn-danger btn-sm" onClick={() => setRevoking(true)}>
                                Sahipliği geri al
                            </button>
                        </div>
                    </>
                ) : ownership.loading
                    ? <p className="muted" role="status">Yükleniyor…</p>
                    : <p className="muted">Bu dükkanın onaylı sahibi yok.</p>}
                {ownership.error ? <div className="alert alert-error" role="alert">{errorMessage(ownership.error)}</div> : null}
                {ownerInfo && <div className="alert alert-success" role="status">{ownerInfo}</div>}
                {ownership.data && (
                    <ReasonDialog open={revoking} title="Sahipliği geri al"
                                  description={`${ownership.data.userEmail} kullanıcısının sahipliği geri alınacak; düzenleme yetkisi hemen kalkar. Gerekçe sahibe e-postayla iletilir.`}
                                  confirmLabel="Sahipliği geri al" onClose={() => setRevoking(false)}
                                  onConfirm={async reason => {
                                      const t = await token();
                                      await revokeOwnership(t, ownership.data!.id, reason);
                                      setRevoking(false);
                                      setOwnerInfo("Sahiplik geri alındı.");
                                      ownership.reload();
                                      view.reload();
                                      void revalidateProviderViews(id, t);
                                  }}/>
                )}
            </section>

            <ProviderEditForm
                key={`form-${v.version}`}
                mode="admin" categories={categories} brands={brands}
                initial={viewToForm(v)}
                submitLabel="Kaydet"
                onSubmit={async values => {
                    const t = await token();
                    const saved = await adminUpdateProvider(t, id, formToEditRequest(values, version));
                    setSavedVersion(saved.version);
                    history.reload();
                    void revalidateProviderViews(id, t);
                    return viewToForm(saved);
                }}
                onConflict={async () => {
                    const fresh = await adminGetEditView(await token(), id);
                    setSavedVersion(fresh.version);
                    history.reload();
                    return viewToForm(fresh);
                }}
            />

            <section className="stack" aria-labelledby="history-title">
                <h2 id="history-title" className="headline">Değişiklik geçmişi</h2>
                {history.error
                    ? <div className="alert alert-error" role="alert">{errorMessage(history.error)}</div>
                    : history.data
                        ? <ChangeHistory items={history.data.content} categories={categories} brands={brands}
                                         onRevert={async csId => {
                                             const t = await token();
                                             await revertChangeSet(t, csId);
                                             setSavedVersion(null);
                                             history.reload();
                                             view.reload();
                                             void revalidateProviderViews(id, t);
                                         }}/>
                        : <p className="muted" role="status">Yükleniyor…</p>}
                {history.data && (
                    <Pagination mode="callback" page={historyPage} totalPages={history.data.totalPages}
                                onPage={setHistoryPage}/>
                )}
            </section>
        </div>
    );
}
