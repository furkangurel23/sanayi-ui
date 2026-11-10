"use client";

/*
 * HESAP DİZİNİ (003 / T098) — üyenin kendi kayıtlarına giriş noktası: Dükkanlarım (sahip
 * olduğu dükkanlar), Önerilerim, Taleplerim + sayılar.
 * Kartlar `card-hover` + "stretched" bağlantı değil düz <Link> kart (tek tıklama hedefi).
 */
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import {useAuthedData} from "@/lib/useAuthedData";
import {myClaims, mySuggestions, ownerProviders} from "@/lib/accountApi";
import {ChevronRight, File as FileIcon, Pin, Shield} from "@/components/icons";

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
                            {ns === undefined ? "Yükleniyor…" : ns === 0 ? "Henüz öneri yok" : `${ns} öneri`}
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
                            {nc === undefined ? "Yükleniyor…" : nc === 0 ? "Sahiplenme talebi yok" : `${nc} talep`}
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
                            {n === undefined ? "Yükleniyor…" : n === 0 ? "Sahibi olduğunuz dükkan yok" : `${n} dükkan`}
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
