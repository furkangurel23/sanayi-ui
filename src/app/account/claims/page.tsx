/*
 * TALEPLERİM (003 / T115) — URL-state: sunucu `status` (parseEnum; geçersiz -> tümü) ve `page`
 * okur, client'a prop iner; client URL'den türetilen `key` ile kurulur (geri/ileri senkronu).
 */
import type {Metadata} from "next";
import {parseEnum, parsePage} from "@/lib/params";
import AccountClaimsClient from "./AccountClaimsClient";
import {notFound} from "next/navigation";
import {claimsEnabled} from "@/lib/features";

export const metadata: Metadata = {title: "Taleplerim", robots: {index: false}};

const STATUSES = ["ALL", "PENDING", "APPROVED", "REJECTED", "WITHDRAWN", "EXPIRED"] as const;

export default async function AccountClaimsPage({searchParams}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    // 006: sahiplenme kapalıysa sayfa yok (account segmentinde loading.tsx yok → gerçek 404).
    if (!claimsEnabled()) notFound();
    const sp = await searchParams;
    const status = parseEnum(sp.status, STATUSES, "ALL");
    const page = parsePage(sp.page);
    return <AccountClaimsClient key={`${status}|${page}`} status={status} page={page}/>;
}
