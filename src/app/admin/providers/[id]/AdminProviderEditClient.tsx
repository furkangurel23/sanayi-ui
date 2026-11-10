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
 * - Sahiplik kartı: görünümdeki `owner` (yalnız yöneticiye dolu). Geri alma bağlantısı
 *   sahiplenme dilimiyle (dilim 8) eklenir; bu dilimde salt okunur.
 */
import {useState} from "react";
import Link from "next/link";
import type {IdName} from "@/lib/types";
import ProviderEditForm from "@/components/ProviderEditForm";
import ChangeHistory from "@/components/ChangeHistory";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/components/Pagination";
import {useAuthedData} from "@/lib/useAuthedData";
import {adminGetEditView, adminHistory, adminUpdateProvider, revertChangeSet} from "@/lib/adminApi";
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
                {v.owner
                    ? <p>Aktif sahip: <b>{v.owner.email}</b> (kullanıcı #{v.owner.userId})</p>
                    : <p className="muted">Bu dükkanın onaylı sahibi yok.</p>}
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
