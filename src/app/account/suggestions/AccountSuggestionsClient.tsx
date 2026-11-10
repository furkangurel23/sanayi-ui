"use client";

/*
 * ÖNERİLERİM — liste (003 / T107).
 *
 * Durum süzgeci: backend `/api/suggestions/mine` durum parametresi ALMAZ (yalnız sayfalı liste).
 * Üye başına öneri sayısı küçüktür (24 saatte en çok 5), bu yüzden süzgeç seçiliyken en yeni
 * 200 öneri tek istekte çekilir, süzme ve sayfalama tarayıcıda yapılır; süzgeç yokken sayfalama
 * backend'dedir. Her iki durumda sayfa numarası URL'dedir (`Pagination mode="url"`).
 *
 * Satır: ad + ilçe, durum rozeti (StatusChip), gönderim tarihi; reddedilende gerekçe;
 * onaylananda oluşan dükkanın bağlantısı; incelemedeyken "Geri çek" (iki aşamalı onay).
 */
import Link from "next/link";
import {useRouter} from "next/navigation";
import AccountShell from "@/components/AccountShell";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/components/Pagination";
import ConfirmButton from "@/components/ConfirmButton";
import StatusChip from "@/components/StatusChip";
import {formatDateTime} from "@/components/ChangeHistory";
import {useAuthedData} from "@/lib/useAuthedData";
import {mySuggestions, withdrawSuggestion} from "@/lib/accountApi";
import {ensureFreshToken} from "@/lib/auth";
import {ApiError, errorMessage} from "@/lib/apiError";
import type {Page, Suggestion} from "@/lib/types";
import {Plus, Pin} from "@/components/icons";
import {useState} from "react";

const PAGE_SIZE = 20;
const FILTERS: Array<{ value: string; label: string }> = [
    {value: "ALL", label: "Tümü"},
    {value: "PENDING", label: "İncelemede"},
    {value: "APPROVED", label: "Onaylandı"},
    {value: "REJECTED", label: "Reddedildi"},
    {value: "WITHDRAWN", label: "Geri çekildi"},
];

type Props = { status: string; page: number; sent: boolean };

/** Taze belirteç; yoksa açık 401 (eskiden `!` ile "Bearer null" gidebiliyordu). */
async function token(): Promise<string> {
    const t = await ensureFreshToken();
    if (!t) throw new ApiError(401, "error.auth.unauthorized", "Oturumunuzun süresi doldu. Yeniden giriş yapın.");
    return t;
}

function List({status, page}: Omit<Props, "sent">) {
    const router = useRouter();
    const [actionError, setActionError] = useState<string | null>(null);
    const filtered = status !== "ALL";
    const data = useAuthedData(`my-suggestions:${status}:${page}`, async (t): Promise<Page<Suggestion>> => {
        if (!filtered) return mySuggestions(t, page, PAGE_SIZE);
        const all = (await mySuggestions(t, 1, 200)).content.filter(s => s.status === status);
        return {
            content: all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
            totalElements: all.length,
            totalPages: Math.max(1, Math.ceil(all.length / PAGE_SIZE)),
            size: PAGE_SIZE,
            number: page - 1,
        };
    });

    function setFilter(value: string) {
        const params = new URLSearchParams(window.location.search);
        if (value === "ALL") params.delete("status"); else params.set("status", value);
        params.delete("page");
        params.delete("sent");
        router.push(`?${params.toString()}`);
    }

    async function withdraw(id: number) {
        setActionError(null);
        try {
            const updated = await withdrawSuggestion(await token(), id);
            data.mutate(p => ({...p, content: p.content.map(s => (s.id === id ? updated : s))}));
        } catch (e) {
            setActionError(errorMessage(e, "Geri çekilemedi."));
        }
    }

    return (
        <div className="stack">
            <div className="chip-cluster" role="group" aria-label="Duruma göre süz">
                {FILTERS.map(f => (
                    <button key={f.value} type="button" className="chip" aria-pressed={status === f.value}
                            onClick={() => setFilter(f.value)}>{f.label}</button>
                ))}
            </div>

            {actionError && <div className="alert alert-error" role="alert">{actionError}</div>}
            {data.error ? <div className="alert alert-error" role="alert">{errorMessage(data.error, "Liste alınamadı.")}</div> : null}
            {data.loading && !data.data && <p className="muted" role="status">Yükleniyor…</p>}
            {data.data && data.data.content.length === 0 && (
                <EmptyState icon={<Pin/>} title={filtered ? "Bu durumda öneri yok" : "Henüz öneri göndermediniz"}
                            description="Listede olmayan bir dükkanı önererek haritayı birlikte büyütebiliriz."
                            action={<Link href="/providers/suggest" className="btn btn-primary"><Plus size="sm"/> Dükkan öner</Link>}/>
            )}
            {data.data && data.data.content.length > 0 && (
                <ul className="stack">
                    {data.data.content.map(s => (
                        <li key={s.id} className="card request-item">
                            <div className="request-head">
                                <div className="stack-sm request-body">
                                    <span className="card-title">{s.name}</span>
                                    <span className="caption muted">
                                        {s.district} &middot; <time dateTime={s.createdAt}>{formatDateTime(s.createdAt)}</time> tarihinde gönderildi
                                    </span>
                                </div>
                                <StatusChip status={s.status}/>
                            </div>
                            {s.status === "REJECTED" && s.decisionReason && (
                                <p className="callout"><b>Gerekçe:</b> {s.decisionReason}</p>
                            )}
                            <div className="row-actions request-actions">
                                {s.status === "APPROVED" && s.createdProviderId && (
                                    <Link href={`/providers/${s.createdProviderId}`} className="btn btn-outline btn-sm">
                                        Dükkan sayfası<span className="sr-only">: {s.name}</span>
                                    </Link>
                                )}
                                {s.status === "PENDING" && (
                                    <ConfirmButton label="Geri çek" confirmLabel="Öneri geri çekilsin mi?"
                                                   className="btn btn-outline btn-sm" srLabel={s.name}
                                                   onConfirm={() => withdraw(s.id)}/>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            {data.data && <Pagination mode="url" page={page} totalPages={data.data.totalPages}/>}
        </div>
    );
}

export default function AccountSuggestionsClient({status, page, sent}: Props) {
    return (
        <AccountShell title="Önerilerim" requireVerified={false}
                      actions={<Link href="/providers/suggest" className="btn btn-primary btn-sm"><Plus size="sm"/> Dükkan öner</Link>}>
            {() => (
                <div className="stack">
                    {sent && <div className="alert alert-success" role="status">Öneriniz incelemeye gönderildi. Karar verilince e-posta alırsınız.</div>}
                    <List status={status} page={page}/>
                </div>
            )}
        </AccountShell>
    );
}
