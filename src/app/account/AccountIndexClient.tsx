"use client";

/*
 * HESAP DİZİNİ (003 / T098) — üyenin kendi kayıtlarına giriş noktası: Dükkanlarım (sahip
 * olduğu dükkanlar), Önerilerim, Taleplerim + sayılar.
 * Kartlar `card-hover` + "stretched" bağlantı değil düz <Link> kart (tek tıklama hedefi).
 */
import Link from "next/link";
import type {ReactNode} from "react";
import AccountShell from "@/components/AccountShell";
import {useAuthedData} from "@/lib/useAuthedData";
import {myClaims, mySuggestions, ownerProviders} from "@/lib/accountApi";
import {ChevronRight, File as FileIcon, Pin, Shield} from "@/components/icons";

/**
 * Kart alt satırı: veri yoksa ve istek SÜRÜYORSA "Yükleniyor…"; istek HATA verdiyse "—"
 * (eskiden hata da sonsuza dek "Yükleniyor…" gösteriyordu). Sayı kartta ikincil bilgi;
 * bağlantı yine çalışır, ayrıntılı hata hedef sayfada gösterilir. Tire görsel; ekran
 * okuyucuya "sayı alınamadı" denir.
 */
function countText(count: number | undefined, failed: boolean, zero: string, many: (n: number) => string): ReactNode {
    if (count === undefined) {
        return failed
            ? <><span aria-hidden>—</span><span className="sr-only">Sayı alınamadı</span></>
            : "Yükleniyor…";
    }
    return count === 0 ? zero : many(count);
}

function Counts() {
    const owned = useAuthedData("account:owned", ownerProviders);
    const suggestions = useAuthedData("account:suggestions", t => mySuggestions(t, 1, 1));
    const n = owned.data?.length;
    const claims = useAuthedData("account:claims", t => myClaims(t, 1, 1));
    const ns = suggestions.data?.totalElements;
    const nc = claims.data?.totalElements;
    return (
        <ul className="grid-2 account-links">
            <li>
                <Link href="/account/suggestions" className="card card-hover account-link">
                    <span className="account-link-icon" aria-hidden><Pin/></span>
                    <span className="account-link-body">
                        <span className="card-title">Önerilerim</span>
                        <span className="card-sub">
                            {countText(ns, Boolean(suggestions.error), "Henüz öneri yok", k => `${k} öneri`)}
                        </span>
                    </span>
                    <ChevronRight className="account-link-arrow"/>
                </Link>
            </li>
            <li>
                <Link href="/account/claims" className="card card-hover account-link">
                    <span className="account-link-icon" aria-hidden><FileIcon/></span>
                    <span className="account-link-body">
                        <span className="card-title">Taleplerim</span>
                        <span className="card-sub">
                            {countText(nc, Boolean(claims.error), "Sahiplenme talebi yok", k => `${k} talep`)}
                        </span>
                    </span>
                    <ChevronRight className="account-link-arrow"/>
                </Link>
            </li>
            <li>
                <Link href="/account/providers" className="card card-hover account-link">
                    <span className="account-link-icon" aria-hidden><Shield/></span>
                    <span className="account-link-body">
                        <span className="card-title">Dükkanlarım</span>
                        <span className="card-sub">
                            {countText(n, Boolean(owned.error), "Sahibi olduğunuz dükkan yok", k => `${k} dükkan`)}
                        </span>
                    </span>
                    <ChevronRight className="account-link-arrow"/>
                </Link>
            </li>
        </ul>
    );
}

export default function AccountIndexClient() {
    return (
        <AccountShell title="Hesabım" eyebrow="Hesap" requireVerified={false}>
            {me => (
                <div className="stack">
                    <p className="muted">{me.displayName ? `${me.displayName} · ` : ""}{me.email}</p>
                    <Counts/>
                </div>
            )}
        </AccountShell>
    );
}
