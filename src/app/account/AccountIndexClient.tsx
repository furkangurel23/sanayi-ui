"use client";

/*
 * HESAP DİZİNİ (003 / T098) — üyenin kendi kayıtlarına giriş noktası: Dükkanlarım (sahip
 * olduğu dükkanlar) + sayılar. Önerilerim ve Taleplerim bağlantıları ilgili dilimlerde eklenir.
 * Kartlar `card-hover` + "stretched" bağlantı değil düz <Link> kart (tek tıklama hedefi).
 */
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import {useAuthedData} from "@/lib/useAuthedData";
import {ownerProviders} from "@/lib/accountApi";
import {ChevronRight, Shield} from "@/components/icons";

function Counts() {
    const owned = useAuthedData("account:owned", ownerProviders);
    const n = owned.data?.length;
    return (
        <ul className="grid-2 account-links">
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
