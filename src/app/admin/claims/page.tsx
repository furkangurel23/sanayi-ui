/*
 * ADMIN · SAHİPLENME TALEPLERİ (003 / T116) — URL-state (anayasa II): sunucu `status`
 * (PENDING varsayılan | APPROVED | REJECTED | WITHDRAWN | EXPIRED | ALL), `kind` (NORMAL |
 * DISPUTE), `district` (25 ilçe), `q` (≥2), `page` ve seçili talep `id`'sini doğrular;
 * client'a prop indirir; client URL'den türetilen `key` ile kurulur.
 */
import type {Metadata} from "next";
import {parseEnum, parsePage, parsePositiveId, parseQuery} from "@/lib/params";
import {parseDistrict} from "@/lib/districts";
import AdminShell from "@/app/admin/AdminShell";
import AdminClaimsClient from "./AdminClaimsClient";

export const metadata: Metadata = {title: "Talepler · Admin", robots: {index: false}};

const STATUSES = ["PENDING", "APPROVED", "REJECTED", "WITHDRAWN", "EXPIRED", "ALL"] as const;
const KINDS = ["ANY", "NORMAL", "DISPUTE"] as const;

export default async function AdminClaimsPage({searchParams}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const sp = await searchParams;
    const status = parseEnum(sp.status, STATUSES, "PENDING");
    const kind = parseEnum(sp.kind, KINDS, "ANY");
    const district = parseDistrict(sp.district);
    const q = parseQuery(sp.q);
    const page = parsePage(sp.page);
    const selected = parsePositiveId(sp.id);
    return (
        <AdminShell>
            <AdminClaimsClient key={`${status}|${kind}|${district ?? ""}|${q ?? ""}|${page}|${selected ?? ""}`}
                               status={status} kind={kind === "ANY" ? undefined : kind} district={district} q={q}
                               page={page} selected={selected}/>
        </AdminShell>
    );
}
