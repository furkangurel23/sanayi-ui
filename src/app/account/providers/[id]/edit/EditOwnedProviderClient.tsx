"use client";

/*
 * SAHİP DÜZENLEME EKRANI (003 / T098) — form + değişiklik geçmişi.
 *
 * Sürüm (iyimser kilit): formu açarken gelen `version` kullanılır; her başarılı kayıt yanıtı
 * ARTMIŞ sürümü döner ve state'e yazılır -> aynı sekmede art arda iki kayıt 409 almaz.
 * 409'da ProviderEditForm `onConflict` ile güncel görünümü ister; burada yeniden çekilir, sürüm
 * state'i yenilenir ve form değerleri döner. (Ref değil state: render sırasında ref okumak
 * React kuralına aykırı; sürüm değişince yeni `onSubmit` kapanışı zaten yeni değeri görür.)
 *
 * Kayıt sonrası: geçmiş yeniden yüklenir + Server Action ile liste önbellekleri tazelenir
 * (revalidateProviderViews — hata yutulur, kaydı etkilemez).
 */
import {useState} from "react";
import Link from "next/link";
import type {IdName} from "@/lib/types";
import AccountShell from "@/components/AccountShell";
import ProviderEditForm from "@/components/ProviderEditForm";
import ChangeHistory from "@/components/ChangeHistory";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/components/Pagination";
import {useAuthedData} from "@/lib/useAuthedData";
import {getEditView, ownerHistory, updateProvider} from "@/lib/accountApi";
import {ensureFreshToken} from "@/lib/auth";
import {ApiError, errorMessage} from "@/lib/apiError";
import {formToEditRequest, viewToForm} from "@/lib/providerFields";
import {revalidateProviderViews} from "@/app/actions/revalidateProvider";
import {Lock} from "@/components/icons";

type Props = { id: number; categories: IdName[]; brands: IdName[] };

async function token(): Promise<string> {
    const t = await ensureFreshToken();
    if (!t) throw new ApiError(401, "error.auth.unauthorized", "Oturumunuzun süresi doldu. Yeniden giriş yapın.");
    return t;
}

function Editor({id, categories, brands}: Props) {
    const view = useAuthedData(`owner:view:${id}`, t => getEditView(t, id));
    const [historyPage, setHistoryPage] = useState(1);
    const history = useAuthedData(`owner:history:${id}:${historyPage}`, t => ownerHistory(t, id, historyPage, 10));
    const [savedVersion, setSavedVersion] = useState<number | null>(null);

    if (view.error) {
        const e = view.error;
        const forbidden = e instanceof ApiError && (e.status === 403 || e.status === 404);
        return (
            <EmptyState icon={<Lock/>} titleAs="p"
                        title={forbidden ? "Bu dükkanı düzenleyemezsiniz" : "Dükkan yüklenemedi"}
                        description={errorMessage(e)}
                        action={<Link href="/account/providers" className="btn btn-outline">Dükkanlarım</Link>}/>
        );
    }
    if (!view.data) return <p className="muted" role="status">Yükleniyor…</p>;
    const version = savedVersion ?? view.data.version;

    return (
        <div className="stack">
            <p className="muted">
                <Link href={`/providers/${id}`} className="link-accent">{view.data.name}</Link> sayfasında görünen bilgiler.
                Kaydettiğiniz anda yayına girer.
            </p>
            <ProviderEditForm
                mode="owner" categories={categories} brands={brands}
                initial={viewToForm(view.data)}
                submitLabel="Kaydet"
                onSubmit={async values => {
                    const t = await token();
                    const saved = await updateProvider(t, id, formToEditRequest(values, version));
                    setSavedVersion(saved.version);
                    history.reload();
                    void revalidateProviderViews(id, t);
                    return viewToForm(saved);
                }}
                onConflict={async () => {
                    const fresh = await getEditView(await token(), id);
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
                        ? <ChangeHistory items={history.data.content} categories={categories} brands={brands} viewer="owner"/>
                        : <p className="muted" role="status">Yükleniyor…</p>}
                {history.data && (
                    <Pagination mode="callback" page={historyPage} totalPages={history.data.totalPages}
                                onPage={setHistoryPage}/>
                )}
            </section>
        </div>
    );
}

export default function EditOwnedProviderClient(props: Props) {
    return (
        <AccountShell title="Dükkanı düzenle" subtitle="Adres, telefon, markalar, kategoriler ve çalışma saatleri.">
            {() => <Editor {...props}/>}
        </AccountShell>
    );
}
