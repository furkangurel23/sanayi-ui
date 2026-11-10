/*
 * HESABIM (003 / T098) — sunucu kabuğu: yalnız `metadata` (arama motoruna kapalı); içerik
 * kişiye özel olduğu için client bileşende (AccountIndexClient) tarayıcıdan çekilir.
 */
import type {Metadata} from "next";
import AccountIndexClient from "./AccountIndexClient";

export const metadata: Metadata = {title: "Hesabım", robots: {index: false}};

export default function AccountPage() {
    return <AccountIndexClient/>;
}
