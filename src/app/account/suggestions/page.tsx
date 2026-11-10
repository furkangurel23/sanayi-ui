/*
 * ÖNERİLERİM (003 / T107) — URL-state (anayasa II): sunucu `status` (parseEnum; geçersiz -> tümü)
 * ve `page` (parsePage) okur, client'a prop iner; client URL'den türetilen `key` ile kurulur
 * (geri/ileri senkronu). `sent=1`: öneri formundan yeni gelindi -> başarı bildirimi.
 */
import type {Metadata} from "next";
import {parseEnum, parsePage} from "@/lib/params";
import AccountSuggestionsClient from "./AccountSuggestionsClient";

export const metadata: Metadata = {title: "Önerilerim", robots: {index: false}};

const STATUSES = ["ALL", "PENDING", "APPROVED", "REJECTED", "WITHDRAWN"] as const;

export default async function AccountSuggestionsPage({searchParams}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const sp = await searchParams;
    const status = parseEnum(sp.status, STATUSES, "ALL");
    const page = parsePage(sp.page);
    const sent = sp.sent === "1";
    return <AccountSuggestionsClient key={`${status}|${page}`} status={status} page={page} sent={sent}/>;
}
