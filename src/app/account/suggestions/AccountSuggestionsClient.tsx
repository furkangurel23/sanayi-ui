"use client";

/*
 * ÖNERİLERİM — liste (003 / T107).
 *
 * Durum süzgeci SUNUCUDA: `GET /api/suggestions/mine?status=&page=&size=` (backend durumu
 * büyük/küçük harf duyarsız okur; "ALL"/yok = hepsi). Süzme ve sayfalama tek istekte backend'de
 * yapılır — eskiden süzgeç seçiliyken en yeni 200 kayıt çekilip tarayıcıda süzülüyordu (201.
 * kayıttan sonrası hiç görünmezdi). Durum ve sayfa URL'dedir (`Pagination mode="url"`); sunucu
 * `page.tsx` ikisini de doğrular, geçersiz durum backend'e hiç gitmez (anayasa III).
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
import type {SuggestionStatus} from "@/lib/types";
import {Plus, Pin} from "@/components/icons";
import {useState} from "react";

const PAGE_SIZE = 20;
/** Süzgeç değeri: bir öneri durumu ya da "ALL" (hepsi; backend'e gönderilmez). */
type Filter = SuggestionStatus | "ALL";
const FILTERS: Array<{ value: Filter; label: string }> = [
    {value: "ALL", label: "Tümü"},
    {value: "PENDING", label: "İncelemede"},
    {value: "APPROVED", label: "Onaylandı"},
    {value: "REJECTED", label: "Reddedildi"},
    {value: "WITHDRAWN", label: "Geri çekildi"},
];

type Props = { status: Filter; page: number; sent: boolean };

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
    // Anahtar durum + sayfa içerir: biri değişince useAuthedData yeniden çeker (sırasız yanıt korumalı).
    const data = useAuthedData(`my-suggestions:${status}:${page}`, t => mySuggestions(t, page, PAGE_SIZE, status));

    function setFilter(value: Filter) {
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
